# Phase 18: FX, commitments, unit economics, accounting calendars: API Contracts

Status: **NOT STARTED** · Release checkpoint: v0.3 · Spec status: DRAFT (no code exists)

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md) (money as decimal strings, RFC 9457 problems, cursor pagination, `Idempotency-Key` on POST, `If-Match` on PATCH/DELETE, 404 across tenants). Source of truth: [cloudledger.v1.yaml](../../../api/openapi/cloudledger.v1.yaml) (paths `/api/v1/fx/*`, `/commitments*`, `/unit-metrics*` already drafted; `/calendars*` is NEW).

## Endpoints
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/api/v1/fx/rate-sets` | `fx:read` | filters `source`, `status` | page of rate sets (incl. shared ECB) | 422 |
| POST | `/api/v1/fx/rate-sets` | `fx:manage` | multipart CSV/JSON or `{"source":"manual","rates":[…]}` | 201 rate set (`draft`) | 413, 422 `validation_failed`, 409 `idempotency_key_reuse` |
| GET | `/api/v1/fx/rate-sets/{id}` | `fx:read` | — | rate set + provenance + checksum | 404 |
| GET | `/api/v1/fx/rate-sets/{id}/rates` | `fx:read` | `filter[pair]`, `from`, `to` | page of rates (`rate` string, scale 18) | 404, 422 |
| POST | `/api/v1/fx/rate-sets/{id}:activate` (NEW) | `fx:manage` | `{"priority":1,"effective_from":"2026-01-01"}` | 200 binding; `data_version` bumped | 409 `period_closed`, 404 |
| GET/PATCH | `/api/v1/settings` (existing) | `settings:write` for PATCH | `fx_policy`, `fx_carry_forward_days`, `reporting_currency` | settings | 412, 422 |
| GET | `/api/v1/commitments` | `commitments:read` | `filter[provider]`, `filter[type]`, `filter[status]` | page of commitments | 422 |
| GET | `/api/v1/commitments/{id}` | `commitments:read` | — | commitment + amortization schedule summary + findings | 404 |
| GET | `/api/v1/commitments/{id}/utilization` | `commitments:read` | `from`, `to`, `grain=day\|month\|fiscal_period` | series: committed, used, unused, utilization | 404, 422 |
| GET/POST | `/api/v1/unit-metrics` | `unit_metrics:read` / `unit_metrics:write` | `{"key","name","unit","aggregation","dimension"}` | metric definition | 409 `conflict` (key), 422 |
| PATCH/DELETE | `/api/v1/unit-metrics/{id}` | `unit_metrics:write` | If-Match | metric | 412, 409 (values exist → delete refused) |
| GET/POST | `/api/v1/unit-metrics/{id}/values` | read / write | batch ≤ 10 000 points or multipart CSV ≤ 50 MiB | batch summary (`accepted`, `rejected`, `rejected_sample_uri`) | 413, 422 |
| GET/POST | `/api/v1/calendars` (NEW) | `calendars:read` / `calendars:manage` | calendar definition (DESIGN §2) | calendar (`draft`) + generated preview periods | 422 |
| GET | `/api/v1/calendars/{id}/periods` (NEW) | `calendars:read` | `fiscal_year` | periods | 404 |
| POST | `/api/v1/calendars/{id}:activate` (NEW) | `calendars:manage` | — | 200; `data_version` bumped | 409 `period_closed` |
| POST | `/api/v1/query` (existing) | `cost:read` | new metrics `commitment_utilization`, `commitment_coverage`, `commitment_unused_cost`, `unit_cost:<key>`; grains `fiscal_period`, `fiscal_quarter`, `fiscal_year` | `meta.fx_rate_set_id`, `meta.fx_policy`, `meta.fx_sources`, `meta.calendar_id` | 422 `fx_rate_missing`, `currency_mixed` |

New error codes: `fx_rate_missing` (422), `currency_mixed` (422), `calendar_invalid` (422). Built-in role grants: finance manager and FinOps admin get `fx:manage`, `calendars:manage`, `unit_metrics:write`; engineering manager/developer get `*:read` within ABAC scope; auditor read-only.

## Examples
```json
POST /api/v1/query  → 422
{"type":"https://docs.cloudledger.dev/errors/fx_rate_missing","title":"FX rate missing","status":422,"code":"fx_rate_missing",
 "detail":"No USD/EUR rate within 0 carry-forward days","errors":[{"pointer":"/currency","code":"fx_rate_missing","message":"2026-10-17 USD/EUR"}]}
```
```json
GET /api/v1/commitments/{id}/utilization?from=2026-10-01&to=2026-10-02&grain=day
{"data":[{"date":"2026-10-01","committed":{"amount":"2.400000000000","currency":"USD"},"used":{"amount":"1.800000000000","currency":"USD"},
 "unused":{"amount":"0.600000000000","currency":"USD"},"utilization":"0.750000000000"}],"next_cursor":null,
 "meta":{"data_version":1842,"fx_rate_set_id":null}}
```
```json
POST /api/v1/unit-metrics/{id}/values   Idempotency-Key: 7f…
{"points":[{"date":"2026-10-01","dimension_key":"","value":"50000"}]}
→ 201 {"batch_id":"…","accepted":1,"rejected":0}
```

## Events (CloudEvents, outbox)
| Type | Idempotency key | Notes |
|---|---|---|
| `dev.cloudledger.fx.rate_set.activated.v1` | rate set id + binding id | NEW: add to EVENTS.md. Consumers: cache invalidation, Phase 17 budgets re-evaluation |
| `dev.cloudledger.calendar.activated.v1` | calendar id + version | NEW: add to EVENTS.md. Consumers: budgets, period generation |
| `dev.cloudledger.commitment.utilization.computed.v1` | tenant + period + data_version | NEW: add to EVENTS.md. Consumers: Phase 25 commitment rules |

## SDK changes
`sdk/provider` `CommitmentSource.ListCommitments` returns `Commitment{NativeID, Type, Scope, TermMonths, PaymentOption, StartAt, EndAt, UpfrontFee, RecurringHourlyFee, CommittedQuantity, CommitmentUnit, Currency, Status, Attributes}` (money as `Decimal`). Additive to the draft interface.
