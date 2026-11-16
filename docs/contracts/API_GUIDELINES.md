# REST API Guidelines and Conventions

Decision: [ADR-0011](../architecture/adr/0011-api-first-rest-openapi-3-1.md). Source of truth: [`api/openapi/cloudledger.v1.yaml`](../../api/openapi/cloudledger.v1.yaml) (OpenAPI 3.1, draft).

## 1. Basics
- Base path `/api/v1`. JSON (`application/json; charset=utf-8`). Field names `snake_case`.
- The tenant is implicit from the principal, plus `X-CloudLedger-Tenant: <tenant_id>` for multi-tenant users. Tenant IDs never appear in public URLs except platform-admin routes (`/api/v1/admin/tenants/{id}`).
- IDs are opaque strings (UUIDv7). Timestamps are RFC 3339 UTC (`2026-11-15T00:00:00Z`). Dates are `YYYY-MM-DD`.
- **Money is a string decimal** plus a currency: `{"amount": "1234.567800000000", "currency": "USD"}`. Clients must not parse money into floats.
- Enums are lower_snake_case strings. Unknown enum values must be tolerated by clients (forward compatibility).

## 2. Authentication
| Client | Mechanism |
|---|---|
| Web UI | BFF session → server-side bearer access token (short-lived JWT, 5–15 min) |
| Automation | `Authorization: Bearer clt_<prefix>_<secret>` API tokens (scoped, expiring) |
| SCIM | `Authorization: Bearer` SCIM token per IdP config |
| Webhooks inbound (Slack/Teams callbacks) | provider signature verification |

## 3. Errors (RFC 9457 Problem Details)
```json
{
  "type": "https://docs.cloudledger.dev/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "time.to must be after time.from",
  "instance": "/api/v1/query",
  "request_id": "01JD…",
  "errors": [{"pointer": "/time/to", "code": "invalid_range", "message": "must be after time.from"}]
}
```
`Content-Type: application/problem+json`. The docs domain is a placeholder until the name is confirmed (OQ-01).

| HTTP | `code` examples | Notes |
|---|---|---|
| 400 | `bad_request`, `malformed_json` | |
| 401 | `unauthenticated`, `token_expired` | |
| 403 | `forbidden` | only when the resource's existence is already known to the caller |
| 404 | `not_found` | also used for cross-tenant access (no existence oracle) |
| 409 | `conflict`, `idempotency_key_reuse`, `period_closed` | |
| 412 | `precondition_failed` | ETag mismatch |
| 413 | `payload_too_large` | |
| 422 | `validation_failed`, `unsupported_query` | |
| 429 | `rate_limited`, `query_budget_exceeded` | includes `Retry-After` |
| 500 | `internal` | no stack traces, only `request_id` |
| 503 | `unavailable`, `analytics_unavailable` | `Retry-After` |

## 4. Pagination
Cursor-based: `?limit=50&cursor=<opaque>`. Default 50, max 500. The response includes `{"data": [...], "next_cursor": "…" | null}`. Cursors are opaque, signed (HMAC) and bound to tenant + query filters. Ordering is stable (sort key + id). No offset pagination.

## 5. Filtering and sorting
`?filter[status]=active&filter[provider]=aws,gcp&sort=-created_at`. Only documented fields are allowed. Unknown filters → 422.

## 6. Idempotency
- All `POST` (and `PATCH` actions with side effects) accept `Idempotency-Key` (1–255 chars). Clients **should** send it, and must send it for financial operations (period close, report run, invoice import).
- The server stores `(tenant, principal, key) → (request hash, response)` for 24 h. Same key + same body → replays the stored response (`Idempotent-Replayed: true`). Same key + different body → `409 idempotency_key_reuse`.

## 7. Concurrency
Mutable resources return `ETag` (`W/"<version>"`). `PATCH`/`PUT`/`DELETE` require `If-Match`. Mismatch → `412`.

## 8. Rate limiting
Token bucket per principal and per tenant, with separate buckets for `query` (analytics), `ai`, `export` and `default`. Response headers follow the IETF RateLimit header draft: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`; on 429 also `Retry-After`. Limits are configurable by operators. They are operational protections, not license limits.

## 9. Long-running operations
Operations that may exceed ~2 s (sync now, backfill, report run, export, period close, re-allocation) return `202 Accepted` with an **Operation** resource:
```json
{"id": "op_…", "kind": "report_run", "status": "running", "progress": 0.4, "result_ref": null, "links": {"self": "/api/v1/operations/op_…"}}
```
Clients poll `GET /api/v1/operations/{id}` or subscribe to webhooks.

## 10. Versioning and deprecation
- URL major version (`/v1`). Additive changes (new fields, endpoints, enum values) are allowed within v1.
- Breaking changes require `/v2`. v1 stays supported for at least 12 months after v2 GA.
- Deprecations: `Deprecation` and `Sunset` headers plus a changelog entry, at least 2 minor releases ahead. See [COMPATIBILITY.md](COMPATIBILITY.md).

## 11. Security headers and CORS
API: `Cache-Control: no-store` on data responses, `X-Content-Type-Options: nosniff`, no CORS by default (the BFF is same-origin). Operators may allow-list origins.

## 12. Freshness metadata
Every analytics response includes:
```json
"meta": {"data_version": 1842, "freshness": [{"provider": "aws", "connector_id": "…", "latest_charge_period_end": "2026-11-14T00:00:00Z", "lag_hours": 21}], "completeness": 0.98, "query_id": "q_…", "currency": "EUR", "fx_rate_set_id": "…"}
```

## 13. Resource catalog (v1 overview)
| Area | Endpoints (abbreviated) | Phase |
|---|---|---|
| Health | `GET /healthz`, `GET /readyz`, `GET /api/v1/version` | 03 |
| Auth/session | `GET /api/v1/me`, `POST /api/v1/auth/logout`, `GET/DELETE /api/v1/sessions` | 05 |
| Tenants (admin) | `GET/POST /api/v1/admin/tenants`, `PATCH/DELETE /api/v1/admin/tenants/{id}` | 04 |
| Tenant settings | `GET/PATCH /api/v1/settings` | 04 |
| Members, roles, scopes, tokens | `/api/v1/members`, `/api/v1/roles`, `/api/v1/data-scopes`, `/api/v1/role-bindings`, `/api/v1/api-tokens` | 05 |
| Hierarchy | `/api/v1/hierarchy/versions`, `/api/v1/hierarchy/nodes` | 04/11 |
| Connectors | `/api/v1/connectors`, `POST /{id}:verify`, `POST /{id}:sync`, `POST /{id}:backfill`, `GET /{id}/health`, `GET /{id}/scopes` | 06–08, 12 |
| Onboarding templates | `GET /api/v1/connectors/templates/{provider}` | 06–08 |
| Imports | `POST /api/v1/imports` (multipart / pre-signed upload), `GET /api/v1/imports/{id}`, `/api/v1/mappings` | 09 |
| Ingestion | `/api/v1/ingestion/runs`, `/api/v1/ingestion/periods/{period}/diff` | 12 |
| Query | `POST /api/v1/query`, `GET /api/v1/semantic/catalog` | 13 |
| Dashboards | `/api/v1/dashboards`, `/api/v1/dashboards/{id}/widgets`, `/api/v1/saved-views`, `/api/v1/dashboard-templates` | 14, 16 |
| Allocation | `/api/v1/allocation/rule-sets`, `POST /{id}:preview`, `POST /{id}:publish`, `/api/v1/custom-dimensions` | 15 |
| Budgets/forecasts/anomalies | `/api/v1/budgets`, `/api/v1/forecasts`, `/api/v1/anomalies` | 17 |
| Alert channels | `/api/v1/alert-channels`, `POST /{id}:test`, `/api/v1/notifications` | 17, 32 |
| Finance | `/api/v1/fx/rate-sets`, `/api/v1/commitments`, `/api/v1/unit-metrics`, `/api/v1/invoices`, `/api/v1/reconciliations`, `/api/v1/periods`, `POST /api/v1/periods/{id}:close` | 10, 18, 29, 30 |
| Reports/exports | `/api/v1/reports`, `/api/v1/report-runs`, `/api/v1/exports` | 29, 30 |
| Inventory/metrics | `/api/v1/resources`, `/api/v1/resources/{id}/metrics` | 19, 20 |
| Recommendations | `/api/v1/recommendations`, `POST /{id}:transition`, `/{id}/evidence`, `/{id}/realized-savings` | 21–26 |
| AI | `/api/v1/ai/conversations`, `POST /{id}/messages` (SSE stream) | 27, 28 |
| Audit | `GET /api/v1/audit-events`, `POST /api/v1/audit-events:verify` | 04, 30 |
| Plugins (admin) | `/api/v1/admin/plugins` | 35 |
| SCIM | `/scim/v2/Users`, `/scim/v2/Groups` | 31 |
| Operations | `GET /api/v1/operations/{id}` | 12 |
