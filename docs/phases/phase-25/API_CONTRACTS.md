# Phase 25 — API contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md). Money is a string decimal plus currency. RFC 9457 errors. Cursor pagination. Rate-limit bucket `default` (`query` for the simulator). §13 lists `/api/v1/recommendations` and `/api/v1/commitments`. Every endpoint below except the list filters is **new** and must be added to §13 and the OpenAPI document with `x-phase: "25"`.

| Method & path | Permission | Notes |
|---|---|---|
| `GET /api/v1/recommendations` (extended) | `recommendations:read` (S) | New filters `filter[overlap_group]`, `filter[overlap_role]`, `filter[savings_kind]`, `filter[action_class]`. New fields: `net_monthly_savings`, `gross_monthly_savings` (labeled), `overlap_group`, `overlap_role`, `overlap_sequence`, `savings_kind`. |
| `GET /api/v1/recommendations/summary` | `recommendations:read` (S) | `?group_by=category\|provider\|hierarchy:<type>&filter[state]=…`. Returns Σ net per group. It never returns a gross sum. Totals for `avoidance` and `governance` are separate. |
| `GET /api/v1/recommendations/{id}/overlap` | `recommendations:read` (S) | Group members (only those in the caller's scope), roles, sequence, step costs, invariant check results, `resolution_run_id`. |
| `GET /api/v1/commitments/pools` | `commitments:read` (S) | Pools whose scope is contained in the caller's scope: eligible and covered spend, utilization, open REC-COM recommendations. |
| `GET /api/v1/commitments/pools/{id}` | `commitments:read` (S) | Hourly percentile table (p10/p50/p90) for historical and projected series. Returns 404 if the pool scope is not contained. |
| `POST /api/v1/commitments/pools/{id}:simulate` | `commitments:read` (S) | Read-only what-if. Body `{"hourly_commitment": {"amount":"12.500000000000","currency":"USD"}, "term_months": 12, "payment_option": "no_upfront"}`. Returns projected coverage, utilization, monthly savings and breakeven. Creates nothing. `Idempotency-Key` is not required. |
| `GET/POST /api/v1/license-declarations` | `license_declarations:read` / `:manage` | Create needs `Idempotency-Key`. Fields: product, program, cores, scope, valid_from/to, note. |
| `PATCH/DELETE /api/v1/license-declarations/{id}` | `license_declarations:manage` | `If-Match` required. Delete is soft (sets `valid_to`) to keep evidence references valid. |

### Summary response example
```json
{"data": [{"category": "commitments", "currency": "USD", "net_monthly_savings": {"amount": "1840.220000000000", "currency": "USD"}, "count": 4},
          {"category": "rightsizing", "currency": "USD", "net_monthly_savings": {"amount": "230.400000000000", "currency": "USD"}, "count": 3}],
 "avoidance": [{"currency": "USD", "amount": "410.000000000000"}],
 "meta": {"data_version": 4812, "resolution": {"runs": 12, "failed_validation": 0}, "basis": "net_after_overlap"}}
```

### Errors
| HTTP | `code` | When |
|---|---|---|
| 404 | `not_found` | Pool or recommendation outside tenant or scope |
| 409 | `resolution_in_progress` | Simulator was called while the pool is being rebuilt for a new `data_version` (retry) |
| 422 | `validation_failed` | Simulator commitment ≤ 0, unsupported term or payment option for the pool type |

## Events
- `dev.cloudledger.recommendation.created.v1` and `.state_changed.v1` (existing). `state_changed` fires when a recommendation becomes `superseded` or `expired` after re-resolution.
- **New** (to be added to the EVENTS.md catalog): `dev.cloudledger.recommendation.evaluation.completed.v1`. Producer: recommendations. Consumers: UI cache, alerts (savings digest). Idempotency key: tenant + partition + data_version. Payload: run id, status, counts, Σ net delta. It contains no resource identifiers outside the partition.

## SDK changes (`sdk/recommendation`, additive)
- `Manifest.ActionClass`, `Manifest.OverlapKeys []string` (templates such as `resource_shape:{target}`), `Manifest.ProjectedCost` (`ratio` | `delta` | `fixed`).
- `Candidate.ProjectedCost(base decimal.Decimal) decimal.Decimal` is required for every class except `informational`.
- `Candidate.SavingsKind`. The default is `saving`.
These are additive within SDK v1 ([COMPATIBILITY.md](../../contracts/COMPATIBILITY.md)). Third-party rules without `overlap_keys` get `resource:{target}` by default.
