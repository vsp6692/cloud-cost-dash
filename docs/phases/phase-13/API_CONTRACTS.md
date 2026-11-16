# Phase 13 API Contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md) (§3 errors, §8 rate limiting, §12 freshness, §13 catalog row "Query"). Machine-readable: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml). Schema: `schemas/semantic/query.v1.json`.

## 1. `POST /api/v1/query`
Permission: `analytics.query` (all built-in roles except none; viewer included). Data is filtered by the principal's ABAC data scope. Rate-limit bucket: `query`. Not idempotency-keyed (read-only); `Idempotency-Key` ignored.

Request (semantic query, see ANALYTICS_ADAPTERS §1):
```json
{
  "metrics": ["effective_cost", "billed_cost"],
  "dimensions": ["provider", "service_name"],
  "filters": {"and": [{"dim": "tag:env", "op": "eq", "value": "prod"}]},
  "time": {"field": "charge_period_start", "from": "2026-10-01", "to": "2026-11-01", "grain": "day"},
  "currency": "billing",
  "include": {"tax": false, "credits": true},
  "order_by": [{"metric": "effective_cost", "dir": "desc"}],
  "limit": 100
}
```
- `currency`: `billing` (group by `billing_currency` implicitly) or `reporting` (Phase 13: only if all rows in scope already in reporting currency, else `422 fx_not_configured`).
- Filter ops: `eq`, `neq`, `in`, `not_in`, `is_null`, `is_not_null`, `prefix`, `descendant_of` (hierarchy). No regex, no free SQL.

Response `200`:
```json
{
  "data": {
    "columns": [{"name":"provider","type":"dimension"},{"name":"service_name","type":"dimension"},{"name":"date","type":"time"},{"name":"effective_cost","type":"money"},{"name":"billed_cost","type":"money"}],
    "rows": [["aws","AmazonEC2","2026-10-01",{"amount":"1234.567800000000","currency":"USD"},{"amount":"1300.000000000000","currency":"USD"}]],
    "truncated": false
  },
  "meta": {"data_version": 1842, "freshness": [{"provider":"aws","connector_id":"0193…","latest_charge_period_end":"2026-11-14T00:00:00Z","lag_hours":21}],
           "completeness": 0.98, "query_id": "q_0193…", "currency": null, "fx_rate_set_id": null,
           "engine": "clickhouse", "cache": "hit", "registry_version": "1"}
}
```
`meta.engine` and `meta.cache` are additive diagnostic fields (proposed addition to §12).

Errors (Problem Details):
| HTTP | code | When |
|---|---|---|
| 400 | `malformed_json` | body not JSON |
| 401 | `unauthenticated` | |
| 403 | `forbidden` | dimension or metric not permitted for principal (e.g. `tag:` key outside scope) |
| 413 | `payload_too_large` | body > 64 KiB |
| 422 | `validation_failed` | schema violation; `errors[].pointer` set |
| 422 | `unsupported_query` | unknown metric/dimension, > 6 dims, time span over grain limit, limit > max, `decimal_overflow`, metric not available yet (`allocated_effective_cost`) |
| 422 | `fx_not_configured` | `currency: reporting` with mixed billing currencies |
| 429 | `rate_limited`, `query_budget_exceeded` | bucket or bytes/time budget exceeded; `Retry-After` |
| 503 | `analytics_unavailable` | engine down or circuit open; `Retry-After` |
| 504 | `query_timeout` | engine timeout (proposed new code; add to API_GUIDELINES §3 table) |

## 2. `GET /api/v1/semantic/catalog`
Permission: `analytics.query`. Returns registries filtered to the principal.
```json
{"registry_version":"1",
 "metrics":[{"key":"effective_cost","label":"Effective cost","kind":"money","aggregation":"sum","scale":12}],
 "dimensions":[{"key":"service_name","label":"Service","source":"focus"},{"key":"tag:cost_center","label":"cost_center","source":"tag"}],
 "limits":{"max_dimensions":6,"max_rows":10000,"grain_max_span_days":{"day":400,"week":1096,"month":3660}}}
```
`ETag` returned; `If-None-Match` → `304`.

## 3. Internal Go interfaces (not public; SDK unaffected)
- `analytics.Adapter`, `analytics.Stage` as in ANALYTICS_ADAPTERS §2, plus:
```go
type SecurityContext struct { Tenant TenantID; ScopeAST authz.Predicate; ScopeHash [32]byte; Profile LimitProfile } // required by Compile
type QueryService interface { Run(ctx context.Context, p authn.Principal, q semantic.Query) (Result, Meta, error) }
type DataVersionStore interface { Get(ctx, TenantID) (int64, error); BumpTx(ctx, pgx.Tx, TenantID) (int64, error) }
```

## 4. Events
No new event types. Consumes `cost.period.normalized.v1` and `cost.period.restated.v1` ([EVENTS.md](../../contracts/EVENTS.md)) to trigger `RebuildAggregates` for affected months; idempotent by `(tenant, connector, period, data_version)`.

## 5. CLI
`cloudledger migrate analytics --engine=<postgres|duckdb|clickhouse> [--dry-run]` and `cloudledger analytics verify --compare <engine>` (planned).
