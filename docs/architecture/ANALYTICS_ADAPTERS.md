# Analytics Engines, Semantic Layer and Adapter Contract

Decision: [ADR-0004](adr/0004-pluggable-analytics-engines-behind-a-semantic.md). Delivered in Phase 13. Contract suite location: `tests/contracts/analytics/`.

## 1. Semantic query model

Business modules, dashboards, the API and the AI assistant express analytics **only** as semantic queries:

```json
{
  "metrics": ["effective_cost", "billed_cost"],
  "dimensions": ["provider", "service_name", "hierarchy:cost_center"],
  "filters": {
    "and": [
      {"dim": "provider", "op": "in", "values": ["aws", "gcp"]},
      {"dim": "tag:env", "op": "eq", "value": "prod"}
    ]
  },
  "time": {"field": "charge_period_start", "from": "2026-01-01", "to": "2026-04-01", "grain": "month"},
  "currency": "reporting",
  "include": {"tax": false, "credits": true},
  "order_by": [{"metric": "effective_cost", "dir": "desc"}],
  "limit": 100
}
```

- **Metrics registry**: `billed_cost`, `effective_cost`, `list_cost`, `contracted_cost`, `consumed_quantity`, `savings_vs_list` (= list − effective), `commitment_coverage`, `unit_cost:<metric_key>`, `allocated_effective_cost`, … Each metric has an engine-neutral definition, an aggregation, a decimal scale and a currency behavior.
- **Dimensions registry**: FOCUS dimensions, `tag:<normalized_key>`, `hierarchy:<node_type>`, `dim:<custom_dimension>`, `resource_type`, `commitment_id`, …
- **Validation**: JSON Schema, plus registry checks, plus limits (max dimensions 6, max time span per grain, max limit 10 000 rows, or 1 000 for AI).
- **Security**: the compiler **always** prepends `tenant_id = :tenant` and the principal's ABAC predicate AST (ADR-0008). A query that references a dimension the principal can't see is rejected.

## 2. Adapter interface (Go)

```go
// package analytics (internal/analytics/adapter.go)
type Adapter interface {
    Name() string                                   // "postgres" | "duckdb" | "clickhouse"
    Capabilities() Capabilities                     // e.g. ApproxDistinct, Materializations, MaxConcurrency
    Migrate(ctx context.Context, target SchemaVersion) error

    // Write path
    BeginStage(ctx context.Context, p PartitionKey) (Stage, error)    // tenant, connector, billing_period, table
    // Stage.Append(rows iter) ; Stage.ControlTotals() ; Stage.Commit() = atomic swap ; Stage.Abort()

    // Read path
    Compile(q semantic.Query, sec semantic.SecurityContext) (CompiledQuery, error)  // pure, testable
    Execute(ctx context.Context, cq CompiledQuery, lim Limits) (ResultSet, error)

    // Maintenance
    RebuildAggregates(ctx context.Context, tenant TenantID, months []Month) error
    DropPartitionVersions(ctx context.Context, olderThan time.Time) error
    DataVersion(ctx context.Context, tenant TenantID) (int64, error)
}
```

## 3. Engine mapping

| Concern | PostgreSQL (Lite/Standard-small) | DuckDB (embedded) | ClickHouse (Standard/HA) |
|---|---|---|---|
| Decimal | `numeric(38,12)` | `DECIMAL(38,12)` (max width 38) | `Decimal(38,12)` (Decimal128) |
| Partitioning | declarative LIST(tenant) → RANGE(billing_period), staging table + `ATTACH PARTITION` in a tx | one DB file per tenant (Lite) and table-per-period with view swap | `PARTITION BY (tenant_id, toYYYYMM(billing_period))` + `REPLACE PARTITION` from staging table |
| Tenant isolation | RLS + compiler predicate | file per tenant + compiler predicate | compiler predicate + row policy on `tenant_id` |
| Tags | `jsonb` + GIN, normalized tags in a side table | `MAP(VARCHAR,VARCHAR)` | `Map(LowCardinality(String), String)` + materialized hot keys |
| Aggregates | materialized views refreshed per data version | on-the-fly (fast enough at Lite scale) | `AggregatingMergeTree` rollups |
| Time | `timestamptz` UTC | `TIMESTAMPTZ` with session TZ = UTC | `DateTime64(3,'UTC')` |
| Rounding | `round()` half-even via function | `round_even()` | `roundBankers()` |

## 4. Contract suite (FR-ANL-003)

Located in `tests/contracts/analytics`. It runs against every engine with Testcontainers (PG, ClickHouse) and in-process (DuckDB).

| Group | Examples |
|---|---|
| Totals parity | the golden dataset loaded into each engine; 200+ semantic queries; results must be **exactly equal** (decimal string compare) |
| NULL semantics | missing tags → `(untagged)` bucket; `NULL` vs empty string normalized at ingest |
| Time | month boundaries, DST irrelevance (UTC), accounting calendars 4-4-5 |
| Restatement | swap a partition and verify old data invisible, data version bumped, cache invalidated |
| Isolation | queries from tenant A never return tenant B rows even with crafted filters; ABAC predicates enforced |
| Limits | timeout, row limit, bytes limit return typed errors |
| Rounding | half-even at presentation; allocation residuals deterministic |
| Unicode | tag keys and values with emoji, RTL text, and injection payloads (`'; DROP`, `{{`, `</script>`) are treated as data |

The parity suite is a **release-blocking** CI job (Phase 38).
