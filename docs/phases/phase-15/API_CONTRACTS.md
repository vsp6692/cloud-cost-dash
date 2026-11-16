# Phase 15 API Contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md) (Problem Details errors, cursor pagination, `Idempotency-Key`, `ETag`/`If-Match`, LRO `Operation`, money as string decimals). Machine-readable source: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml) (paths added in P15-T12). §13 catalog row "Allocation" is implemented here; the chargeback endpoint is an addition to the catalog.

## 1. Permissions
| Permission | Built-in roles |
|---|---|
| `allocation:read` | tenant owner, FinOps admin, finance manager, auditor |
| `allocation:edit` | tenant owner, FinOps admin |
| `allocation:publish` | tenant owner, FinOps admin |
| `custom_dimension:manage` | tenant owner, FinOps admin |
| `chargeback:read` | all roles except viewer-without-scope; results always ABAC-filtered |

## 2. Endpoints

| Method | Path | Request | Response | Errors | Permission |
|---|---|---|---|---|---|
| GET | `/api/v1/allocation/rule-sets` | `filter[status]`, cursor | `{data:[RuleSetSummary], next_cursor}` | 401, 422 | `allocation:read` |
| POST | `/api/v1/allocation/rule-sets` | `{name, based_on_version?}` creates a draft | `201 RuleSet` + ETag | 409 `draft_exists`, 422 | `allocation:edit` |
| GET | `/api/v1/allocation/rule-sets/{id}` | — | `RuleSet` with `rules[]` + ETag | 404 | `allocation:read` |
| PUT | `/api/v1/allocation/rule-sets/{id}/rules` | `If-Match`; `{rules:[Rule]}` full ordered replacement | `200 RuleSet` | 409 `not_draft`, 412, 422 `validation_failed` with JSON pointers | `allocation:edit` |
| POST | `/api/v1/allocation/rule-sets/{id}:validate` | — | `{valid, errors[], warnings[]}` | 404 | `allocation:edit` |
| POST | `/api/v1/allocation/rule-sets/{id}:preview` | `Idempotency-Key`; `{period_from, period_to}` (≤ `allocation.preview_max_months`) | `202 Operation` → result `AllocationPreview` | 422, 429 | `allocation:edit` |
| GET | `/api/v1/allocation/previews/{id}` | — | `AllocationPreview` (ABAC-filtered) | 404, 410 `preview_expired` | `allocation:edit` |
| POST | `/api/v1/allocation/rule-sets/{id}:publish` | `If-Match`, `Idempotency-Key` (required); `{effective_from, comment}` | `202 Operation` (re-allocation) + published `RuleSet` | 409 `not_draft`, `effective_from_in_closed_period`; 412; 422 | `allocation:publish` |
| GET | `/api/v1/allocation/runs` | `filter[billing_period]`, `filter[status]`, cursor | `{data:[AllocationRun]}` | 422 | `allocation:read` |
| POST | `/api/v1/allocation/runs:rerun` | `Idempotency-Key`; `{billing_periods:[...]}` | `202 Operation` | 409 `period_closed`, 422 | `allocation:publish` |
| GET/POST | `/api/v1/custom-dimensions` | `{key, name, allowed_values?}` | `CustomDimension` | 409 `key_exists`, 422 | read: `allocation:read`; write: `custom_dimension:manage` |
| PATCH/DELETE | `/api/v1/custom-dimensions/{id}` | `If-Match` | `CustomDimension` / 204 | 409 `in_use`, 412 | `custom_dimension:manage` |
| GET | `/api/v1/chargeback` | `period_from`, `period_to`, `node_type`, `cost_metric` (`billed_cost`/`effective_cost`/…), `include[tax]`, `include[credits]` | `ChargebackReport` + `meta` (freshness, data_version, rule_set_version) | 422 | `chargeback:read` |

Cross-tenant or unknown IDs return `404 not_found`. Showback/chargeback detail drill-down uses `POST /api/v1/query` with `allocated_*` metrics and `hierarchy:*` dimensions (Phase 13 endpoint).

## 3. Schemas (abridged)

```yaml
Rule:
  id: string            # server-assigned on PUT if absent
  name: string
  kind: tag_key_normalize | tag_value_map | inheritance | dimension_assign | hierarchy_assign | shared_split
  enabled: boolean
  condition: FilterAST  # same AST as semantic filters; empty = always
  action: oneOf:
    TagKeyNormalize:  {target_key: "cost_center", source_keys: ["CostCenter","cost-center"], case_insensitive: true}
    TagValueMap:      {key: "env", mappings: [{match: {op: eq|iregex|in, value(s)}, to: "prod"}]}
    Inheritance:      {key: "cost_center", precedence: [resource, resource_group, subscription, project, account, organization]}
    DimensionAssign:  {dimension: "product", value: "checkout" | from_tag: "app"}
    HierarchyAssign:  {node_key: "cc-1042" | from_tag: "cost_center", node_type: "cost_center"}
    SharedSplit:      {method: even|fixed_percentage|proportional_cost|proportional_metric,
                       receivers: {node_keys: [...]} | {node_type: "team"},
                       weights?: {"cc-1": "50", "cc-2": "50"},  # string decimals, sum == "100"
                       basis_metric?: "effective_cost" | "unit:<metric_key>",
                       fallback: even|unallocated}
AllocationPreview:
  id, rule_set_id, period_from, period_to, status
  totals: [{billing_currency, cost_metric, source: Money, allocated: Money, unallocated: Money}]
  by_target: [{target, live: Money, draft: Money, delta: Money}]
  moved_rows_sample: [{cost_row_ref, from_target, to_target, amount: Money}]   # ≤ 100, in-scope only
  warnings: [{code: rule_never_matched|rule_shadowed|overlap|zero_basis|missing_node, rule_id, detail}]
  out_of_scope_delta: Money   # aggregate for targets outside caller's ABAC scope
ChargebackReport:
  rows: [{node_key, node_name, node_path, period, direct: Money, shared_in: Money, unallocated_attributed: Money, total: Money}]
  unallocated: [{reason, amount: Money}]
  totals: {source: Money, allocated: Money, unallocated: Money}
```

Money uses `{amount: "<decimal string>", currency}`. Chargeback rows are rounded to minor units with the largest-remainder rule so rows sum exactly to `totals`.

## 4. Data-scope predicate additions (Phase 05 `/api/v1/data-scopes`)
```json
{"and":[{"attr":"hierarchy_node","op":"descendant_of","value":"bu-retail"},
        {"attr":"tag:env","op":"in","values":["prod","staging"]},
        {"attr":"dim:product","op":"eq","value":"checkout"}]}
```
Unknown attributes → `422 validation_failed`. Additive to the v1 schema.

## 5. Events ([EVENTS.md](../../contracts/EVENTS.md))
| Type | Producer | Data | Idempotency key |
|---|---|---|---|
| `dev.cloudledger.allocation.published.v1` | allocation | `{rule_set_id, version, effective_from, checksum, published_by}` | rule_set version |
| `dev.cloudledger.cost.period.allocated.v1` | allocation | `{billing_period, data_version, rule_set_version, totals:[{currency, metric, source, allocated, unallocated}]}` | tenant + period + data_version |
| `dev.cloudledger.allocation.run.failed.v1` (**new**, propose adding to EVENTS.md) | allocation | `{run_id, billing_period, reason: invariant|error, details}` | run id |

Consumed: `cost.period.normalized.v1`, `cost.period.restated.v1`. JSON Schemas under `schemas/events/`.

## 6. Interface changes
- `internal/allocation/api.go`: `Chargeback(ctx, TenantContext, ChargebackRequest) (ChargebackReport, error)`, `LiveRuleSetVersion(ctx, tenant, period) (int, error)` for Phase 17/29/30.
- `internal/analytics` Adapter: no signature change; `PartitionKey.Table` gains value `cost_allocated`.
- `internal/authz`: `ScopePredicate` attribute enum extended.
