# Phase 11 — API Contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md) (Problem Details errors, cursor pagination, `Idempotency-Key`, `ETag`/`If-Match`, `202` Operations). Machine-readable source: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml). Permission names are proposals; the final catalog is owned by Phase 05.

## 1. Mappings (extends `/api/v1/mappings` from Phase 09)

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/v1/mappings?filter[key]=&filter[status]=&filter[scope]=bundled,tenant` | List mapping versions (bundled + tenant) | `mappings.read` |
| GET | `/api/v1/mappings/{key}/versions/{version}` | Full definition, checksum, focus_version | `mappings.read` |
| POST | `/api/v1/mappings/{key}/versions` | Create draft (tenant mappings only) | `mappings.manage` |
| PATCH | `/api/v1/mappings/{key}/versions/{version}` | Edit draft (`If-Match` required) | `mappings.manage` |
| POST | `/api/v1/mappings/{key}/versions/{version}:validate` | Validate against sample raw object; returns conformance report | `mappings.manage` |
| POST | `/api/v1/mappings/{key}/versions/{version}:publish` | Freeze draft | `mappings.manage` |
| POST | `/api/v1/mappings/{key}/versions/{version}:activate` | Select for connectors; optional re-normalization (202) | `mappings.manage` + `ingestion.operate` |

`:activate` request:
```json
{"connector_ids": ["0193…"], "renormalize": {"from_period": "2025-10-01", "to_period": "2026-10-01", "order": "newest_first"}}
```
Response `202` Operation (`kind: "renormalize"`), with `result_ref` → per-period outcome list `{connector_id, billing_period, status: succeeded|failed_validation|raw_unavailable|skipped_unchanged, period_version}`.

Errors: `404 not_found` (unknown or other tenant), `409 conflict` (`mapping_not_draft`, `mapping_retired`), `412 precondition_failed`, `422 validation_failed` (expression type errors with JSON pointers into the definition), `422 unsupported_focus_version`. `Idempotency-Key` required on `:publish` and `:activate`.

## 2. Normalization status and conformance

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/api/v1/normalization/status?filter[connector_id]=` | Per (connector, period): live `period_version`, `mapping_key@version`, `focus_version`, `stale_mapping` flag | `ingestion.read` |
| GET | `/api/v1/ingestion/runs/{run_id}/conformance` | Conformance + DQ report (row rejects by rule, tag collisions, rounding counts, control totals) | `ingestion.read` |

Conformance report shape:
```json
{"run_id":"…","focus_version":"1.2","mapping":"aws-cur2-focus@4","passed":false,
 "row_rules":[{"rule":"charge_category_domain","rejected":12,"sample_uri":"…"}],
 "partition_rules":[{"rule":"control_totals","passed":false,"diffs":[{"billing_account_id":"1111","currency":"USD","charge_category":"Usage","metric":"BilledCost","source":"1234.500000000000","staged":"1234.490000000000"}]}],
 "tag_collisions":3}
```
`sample_uri` is a short-TTL pre-signed URL scoped to the tenant prefix.

## 3. Custom dimensions

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/api/v1/custom-dimensions` | `dimensions.read` / `dimensions.manage` |
| GET/PATCH/DELETE | `/api/v1/custom-dimensions/{id}` | `dimensions.read` / `dimensions.manage` |

Body: `{"key":"product_line","name":"Product line","allowed_values":["core","edge"]}`. `DELETE` → `409 dimension_in_use` while referenced by a published allocation rule set (Phase 15). Note: the API_GUIDELINES §13 catalog lists `/custom-dimensions` under Phase 15; this phase delivers definitions CRUD, Phase 15 adds rule-driven value assignment.

## 4. Scope → hierarchy assignments

| Method | Path | Permission |
|---|---|---|
| GET | `/api/v1/hierarchy/scope-assignments?filter[hierarchy_version_id]=&filter[cloud_scope_id]=` | `hierarchy.read` |
| POST | `/api/v1/hierarchy/scope-assignments` | `hierarchy.manage` |
| POST | `/api/v1/hierarchy/scope-assignments:bulk` (≤ 5 000 items, all-or-nothing) | `hierarchy.manage` |
| PATCH/DELETE | `/api/v1/hierarchy/scope-assignments/{id}` | `hierarchy.manage` |

Errors: `409 assignment_overlap` (effective ranges overlap), `422 hierarchy_version_not_published`, `404` for scopes or nodes of other tenants.

## 5. Semantic catalog additions (consumed by Phase 13)
`GET /api/v1/semantic/catalog` lists `tag:<normalized_key>` dimensions (top keys by row count, bounded), `dim:<custom_key>`, and `hierarchy:<node_type>`.

## 6. Events

| Type | Change | Payload additions |
|---|---|---|
| `dev.cloudledger.cost.period.normalized.v1` | Formalized (schema in `schemas/events/`) | `connector_id`, `billing_period`, `period_version`, `data_version`, `mapping_key`, `mapping_version`, `focus_version`, `trigger`, `row_count`, `control_totals_ref` |
| `dev.cloudledger.mapping.published.v1` | **New (proposed for EVENTS.md catalog)** | `mapping_key`, `version`, `focus_version`, `checksum` — consumers: audit, UI notifications |
| `dev.cloudledger.dimensions.changed.v1` | **New (proposed)** | `data_version`, `kind: custom_dimension|scope_assignment` — consumers: analytics cache invalidation |

## 7. SDK / interface changes
- `sdk/provider`: `BillingSource.Mapping()` returns `MappingRef{Key, Version, FocusVersion}` (adds `FocusVersion`).
- `sdk/provider/testkit`: new `focus.Conform(rows) Report` used by the Billing compatibility group.
- Internal: `analytics.Stage` gains `PeriodVersion()`; `Stage.ControlTotals()` keyed by (billing account, sub-account, currency, charge category, charge class).
