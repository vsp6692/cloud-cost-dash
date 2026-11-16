# Phase 13: PostgreSQL/DuckDB/ClickHouse Analytics Adapters and Semantic Layer

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.2 |
| Depends on | Phase 11 (FOCUS normalization, `cost_focus` schema, allocation dimensions); transitively 04 (RLS, tenancy), 05 (ABAC predicate AST), 06 (PG adapter baseline) |
| Primary PRD requirements | FR-ANL-001, FR-ANL-002, FR-ANL-003, FR-ANL-004, NFR-SEC-001, NFR-ACC-003, NFR-PERF-001 |
| Primary verification | Cross-engine contract (parity) suite with exact decimal equality; isolation suite |
| ADRs | [ADR-0004](../../architecture/adr/0004-pluggable-analytics-engines-behind-a-semantic.md), [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md), [ADR-0008](../../architecture/adr/0008-authorization-rbac-abac-via-cedar-policies.md), [ADR-0010](../../architecture/adr/0010-immutable-content-addressed-raw-storage-and.md), [ADR-0016](../../architecture/adr/0016-uuidv7-identifiers-and-utc-timestamps.md) |

## Goal
Generalize the Phase 06 PostgreSQL analytics baseline into a pluggable analytics layer: a single engine-neutral **semantic query model** (metrics and dimensions registries, filters, grain, cost type, currency) compiled by per-engine adapters for **PostgreSQL, DuckDB and ClickHouse**, with atomic partition swap on every engine, mandatory tenant and ABAC predicate injection, query limits, a result cache keyed by `data_version` and principal scope hash, and a release-blocking parity suite proving identical decimal results on all three engines.

## Scope
- `internal/analytics/semantic`: query JSON Schema (`schemas/semantic/query.v1.json`), validator, metric registry, dimension registry, logical plan.
- `internal/analytics/adapter/{postgres,duckdb,clickhouse}`: `Adapter` implementation per [ANALYTICS_ADAPTERS.md §2](../../architecture/ANALYTICS_ADAPTERS.md): `Migrate`, `BeginStage/Commit/Abort` (atomic swap), `Compile`, `Execute`, `RebuildAggregates`, `DropPartitionVersions`, `DataVersion`.
- Engine DDL under `database/{postgres,duckdb,clickhouse}/analytics/` for `cost_focus`, `cost_allocated` (schema only; populated in Phase 15), `cost_daily_agg`, `fx_applied`.
- Tenant isolation per engine: PG RLS on the analytics schema; ClickHouse row policy using a per-query custom setting; DuckDB one database file per tenant; plus compiler predicate on all engines.
- Query limits (rows, time span, dimensions, timeout, bytes scanned) with typed errors.
- Result cache (`internal/analytics/cache`) keyed by tenant + scope hash + query hash + data version.
- Engine selection per deployment profile (OQ-04 default) and configuration.
- `POST /api/v1/query`, `GET /api/v1/semantic/catalog`.
- Parity suite `tests/contracts/analytics/` with the shared golden dataset and 200+ semantic queries.
- A deterministic half-even rounding function for PostgreSQL (`cl_round_half_even`) because PG `round(numeric, n)` rounds half away from zero.

## Out of scope
- Dashboard UI (Phase 14), dashboard builder (Phase 16).
- Allocation computation (Phase 15). `allocated_effective_cost` is registered but returns `unsupported_query` until Phase 15 publishes data.
- FX conversion policy and rate sets (Phase 18). In this phase `currency: "reporting"` is accepted only when billing currency equals reporting currency for all rows in scope; otherwise `422 fx_not_configured`.
- Accounting-calendar grains 4-4-5 etc. (Phase 18); only `day`, `week` (ISO), `month`, `quarter`, `year` on the Gregorian calendar.
- ClickHouse cluster topology/sharding and HA (Phase 33); single-node ClickHouse only.
- Performance SLO certification at reference scale (Phase 34). This phase records baseline benchmarks only.
- AI query limits (Phase 27) beyond reserving the `ai` limit profile.

## Dependencies
| Kind | Dependency |
|---|---|
| Phase | 11: FOCUS 1.2 `cost_focus` columns, tag normalization keys, hierarchy dimension columns, conformance validator |
| Phase | 05: `authz.Authorizer`, data-scope predicate AST (`data_scopes.predicate`) |
| Phase | 04: RLS session helper `SET LOCAL app.tenant_id` |
| Phase | 12: restatement swap orchestration calls `Stage.Commit()` (contract defined here; Phase 12 may land first using the PG adapter) |
| External | ClickHouse server ≥ 24.x (LTS), DuckDB ≥ 1.1 (`DECIMAL(38,12)`), PostgreSQL ≥ 16; Testcontainers for CI |
| External | Go drivers: `pgx/v5`, `clickhouse-go/v2`, `duckdb-go` (CGO); license check required (NFR-LIC-001) |

## Deliverables
1. Semantic layer package, JSON Schema and registries with documentation in [ANALYTICS_ADAPTERS.md](../../architecture/ANALYTICS_ADAPTERS.md).
2. Three adapters passing the contract suite.
3. Engine migrations and `cloudledger migrate analytics --engine=<e>`.
4. Query API and catalog endpoints in [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml).
5. Cache with data-version invalidation and metrics.
6. Parity, isolation, limits and failure-injection test suites; CI job `analytics-parity` (release-blocking from Phase 38).
7. Baseline benchmark report (non-gating) for each engine on the Lite fixture.

## Key risks
| Risk | Mitigation |
|---|---|
| R-01 semantic drift (rounding, NULLs, time zones) between engines | single compiler front end, engine-specific emitters only for syntax; exact string comparison of decimals; UTC-only |
| PG `round()` is half-away-from-zero, not half-even | `cl_round_half_even(numeric,int)` SQL function, parity tests at `.5` boundaries |
| ClickHouse `Decimal(38,12)` overflow on `sum()` widens to Decimal128 limits silently differently | explicit `toDecimal128(...,12)` casts, overflow fixture, `decimal_check_overflow=1` |
| DuckDB CGO build complexity and arm64 | CI matrix amd64/arm64 (NFR-PORT-001); DuckDB optional build tag |
| Cache leaks across principals | key includes scope hash; property test that different scopes never collide |
| Row policy misconfiguration on ClickHouse | catalog test asserting policy exists on every tenant table; query user lacks `SELECT` without policy |

## Documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: semantic layer, three adapters, cache, query API merged
- [ ] Tests: P13-TC01…TC32 implemented and executed; results recorded in TEST_RESULTS.md with real commands
- [ ] Docs: ANALYTICS_ADAPTERS.md, DATABASE_SCHEMA.md (data-version table), OpenAPI, operator engine-selection guide updated
- [ ] Security review: isolation, row policies, SQL injection via dimension/tag values, cache keying
- [ ] CHANGELOG entry under Unreleased
- [ ] Acceptance sign-off (ACCEPTANCE.md)
- [ ] Stopped at phase boundary (no Phase 14 UI work started)
