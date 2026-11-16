# Phase 11 — Implementation Plan

Execution rules A–H from [the phase index](../README.md) apply. Tests are written with or before each task. Sizes: S ≤ 1 day, M ≤ 3 days, L ≤ 5 days.

| ID | Task | Files / dirs | Size | Depends |
|---|---|---|---|---|
| P11-T01 | Re-evaluate FOCUS version (OQ-02); record decision; amend ADR-0006 if needed | `docs/product/OPEN_QUESTIONS.md`, `docs/architecture/adr/0006-*.md` | S | — |
| P11-T02 | FOCUS column registry JSON + Go generator | `schemas/focus/focus-1.2.columns.json`, `internal/billing/focus/schema/`, `scripts/gen/focus_schema.go` | M | T01 |
| P11-T03 | Analytics migration: full `cost_focus` columns, `x_tags_normalized`, `x_cloud_scope_key`, `period_version`, `dim_scope_hierarchy` (PG adapter) | `database/postgres/analytics/migrations/0011_*.sql` | M | T02 |
| P11-T04 | Control-plane migrations 0011_001…004 + RLS + immutability trigger | `database/postgres/migrations/0011_*.sql` | M | — |
| P11-T05 | Mapping model, loader, lifecycle, checksum | `internal/billing/focus/mapping/` | M | T04 |
| P11-T06 | Closed expression language: parser, type checker, evaluator with step limits | `internal/billing/focus/mapping/expr/` | L | T05 |
| P11-T07 | Tag normalizer `tagnorm/v1` + collision policy | `internal/billing/tags/` | S | — |
| P11-T08 | Dedup key derivation + occurrence ordinal + spillable uniqueness checker | `internal/billing/dedup/` | M | — |
| P11-T09 | Normalizer rewrite on top of registry + mappings; lineage columns | `internal/billing/focus/normalize/` | L | T02, T05–T08 |
| P11-T10 | Conformance validator (row + partition), exported to testkit | `internal/billing/focus/conformance/`, `sdk/provider/testkit/focus.go` | M | T02 |
| P11-T11 | Full provider mappings + extension catalogs: AWS CUR 2.0, AWS FOCUS export, GCP detailed export, Azure actual/amortized, Azure FOCUS export; generic templates upgraded | `providers/{aws,gcp,azure}/mapping/*.yaml`, `internal/imports/templates/` | L | T09 |
| P11-T12 | Golden datasets + expected totals per provider, generator scripts | `tests/fixtures/golden/focus/{aws,gcp,azure,generic}/` | L | T11 |
| P11-T13 | Custom dimensions + scope-hierarchy assignments service, replication to `dim_scope_hierarchy`, data_version bump | `internal/tenants/dimensions/` | M | T03, T04 |
| P11-T14 | Re-normalization orchestration (operation + per-period jobs) | `internal/billing/renormalize/` | M | T09 |
| P11-T15 | API handlers + OpenAPI fragments + event schema update | `internal/api/handlers/{mappings,dimensions,normalization}.go`, `api/openapi/cloudledger.v1.yaml`, `schemas/events/cost.period.normalized.v1.json` | M | T05, T13, T14 |
| P11-T16 | Float lint rule for `internal/billing/...`; docs (FOCUS_NORMALIZATION per-provider tables), CHANGELOG | `.golangci.yml`, `docs/architecture/FOCUS_NORMALIZATION.md`, `CHANGELOG.md` | S | all |

## Migrations
- Control plane: `0011_001_mapping_lifecycle`, `0011_002_custom_dimensions`, `0011_003_scope_hierarchy_assignments`, `0011_004_ingestion_trigger_renormalize`. Expand-only; no data rewrite.
- Analytics (PG): `0011_101_cost_focus_full_columns` (add nullable columns), `0011_102_dim_scope_hierarchy`. Existing Phase 06–09 partitions keep NULL in new columns until re-normalized; the period list is surfaced via `GET /api/v1/normalization/status`.

## Feature flags
| Flag | Default | Purpose |
|---|---|---|
| `normalization.full_focus` | off → on at phase exit | Routes new runs through the Phase 11 normalizer; off = Phase 06 minimal mapper |
| `normalization.renormalize_api` | off | Enables the activation-with-renormalize endpoint |
| `normalization.strict_conformance` | on | Partition-level conformance failure blocks swap (turning off is for incident triage only; audited) |

## Rollout
1. Ship migrations (expand) and code with `full_focus` off.
2. Shadow mode: run the new normalizer into a scratch staging table on each run, compare control totals with the live mapper, emit a diff metric. No swap.
3. Enable `full_focus` per tenant (Lite fixture tenant first), then globally.
4. Offer re-normalization of history via the API; recommend newest-first.

## Rollback
- Flip `normalization.full_focus` off: new runs use the old mapper. Already swapped periods stay valid (new columns are additive); to revert data, re-normalize the period with the previous mapping version (prior `billing_period_versions` rows are retained, so a pointer flip back is also possible through the Phase 12 tooling).
- Schema: added columns are left in place (contract step deferred to a later release).

## Definition of done
- All tasks merged with tests; P11-TC* executed and logged in TEST_RESULTS.md with real commands.
- Golden totals exact for all four dataset families; conformance validator clean on all golden fixtures.
- No float types in billing packages (lint green). RLS catalog test green for new tables.
- Docs, OpenAPI and event schema updated; CHANGELOG entry; acceptance signed; work stopped at the phase boundary.
