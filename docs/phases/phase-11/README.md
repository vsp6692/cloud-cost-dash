# Phase 11 — FOCUS Normalization and Allocation Dimensions

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.2 (phases 06–14) |
| Depends on | Phases 06, 07, 08, 09 (and transitively 04, 05) |
| Primary PRD requirements | FR-NRM-001…006, FR-TEN-003 |
| Primary verification | Golden totals per provider, FOCUS conformance validator, mapping-version replay |
| Key ADRs | [ADR-0006](../../architecture/adr/0006-focus-1-2-as-normalization-baseline.md), [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md), [ADR-0010](../../architecture/adr/0010-immutable-content-addressed-raw-storage-and.md), [ADR-0004](../../architecture/adr/0004-pluggable-analytics-engines-behind-a-semantic.md) |

> No code exists yet. Everything below is a plan, not a shipped capability.

## Goal
Turn the "minimal FOCUS core mapping" delivered with the connectors in Phases 06–09 into **full, versioned, conformance-checked FOCUS normalization** for AWS, GCP, Azure and generic imports, and add the allocation dimensions (normalized tag keys, custom dimension definitions, cloud-scope → business-hierarchy assignment) that Phase 15 (allocation) and Phase 13 (semantic layer) build on.

## Scope
1. **FOCUS version pin (OQ-02).** Re-evaluate the latest ratified FOCUS release at phase start. Default pin: FOCUS 1.2. Record the decision in OPEN_QUESTIONS and ADR-0006 (amend, or supersede if a newer version is chosen).
2. **Complete column coverage** for the pinned version: all mandatory and conditional columns, value domains (ChargeCategory, ChargeClass, ChargeFrequency, PricingCategory, CommitmentDiscountStatus, …), and the four cost metrics BilledCost, EffectiveCost, ListCost, ContractedCost (FR-NRM-003).
3. **Mapping versioning** (`mapping_definitions`): immutable published versions, `draft → published → retired` lifecycle, provider-bundled mappings (`aws-cur2-focus`, `gcp-bq-detailed-focus`, `azure-cm-actual-amortized-focus`, `azure-focus-export`) and tenant-defined generic-import mappings from Phase 09.
4. **Re-normalization** of history when a new mapping version is activated, producing new `billing_period_versions` via the staging + atomic swap path, keeping prior versions.
5. **Extensions**: `x_`-prefixed provider columns (documented per provider) plus `x_raw` JSON for unmapped source fields.
6. **Tag normalization keys**: deterministic syntactic normalization of raw tag/label keys (`CostCenter`, `cost-center`, `cost_center ` → `cost_center`), stored alongside raw tags. Semantic aliasing rules (`cc` → `cost_center`) remain Phase 15.
7. **Allocation dimensions**: `custom_dimensions` definitions; cloud-scope → hierarchy-node assignments (effective-dated, per hierarchy version) materialized into an analytics-side dimension table.
8. **Deterministic deduplication** (FR-NRM-006) by provider line ID or composite natural key plus content hash, with a documented occurrence-ordinal rule for genuinely identical lines.
9. **FOCUS conformance validator** usable in CI (fixtures), in the provider compatibility suite, and at runtime as a data-quality gate.
10. **Golden datasets and golden totals** for each provider and for generic imports.

## Out of scope
- Rule-based allocation, shared-cost splits, tag inheritance and value mapping (Phase 15).
- FX conversion and commitment amortization analytics beyond what providers report in EffectiveCost (Phase 18).
- DuckDB/ClickHouse adapters and the parity suite (Phase 13). This phase writes through the PG baseline adapter from Phase 06; schema changes are specified engine-neutrally for Phase 13 to implement.
- Backfill planning, restatement diff API, retries/DLQ and health (Phase 12).
- Invoice matching (Phase 10). This phase guarantees `InvoiceId` and `BillingCurrency` are populated where the source provides them.

## Dependencies
| Kind | Item |
|---|---|
| Phases | 06 (ingestion framework, raw storage, PG analytics baseline, `Stage.Commit`), 07, 08 (provider fixtures and minimal mappings), 09 (generic-import mapping templates), 04 (hierarchy tables) |
| External | Ratified FOCUS specification text and its official column/value lists; provider documentation of CUR 2.0 / Data Exports FOCUS, GCP billing export schema, Azure Cost Management export schemas (see [../../providers/](../../providers/README.md)) |
| Docs (may be in progress) | [FOCUS_NORMALIZATION.md](../../architecture/FOCUS_NORMALIZATION.md), [INGESTION_PIPELINE.md](../../architecture/INGESTION_PIPELINE.md), [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md) |

## Deliverables
- `internal/billing/focus/` (schema registry, mapper engine, conformance validator), `internal/billing/dedup/`, `internal/billing/tags/`.
- Versioned mappings under `schemas/focus/mappings/` and FOCUS column schema `schemas/focus/focus-1.2.columns.json`.
- Control-plane migrations (custom dimensions, scope-hierarchy assignments, mapping lifecycle, renormalize trigger).
- Analytics schema migration for `cost_focus` (full column set, normalized tags, scope key) and `dim_scope_hierarchy`.
- API: mappings, renormalization operation, conformance reports, custom dimensions, scope assignments.
- Golden datasets under `tests/fixtures/golden/focus/{aws,gcp,azure,generic}/`.
- Updated docs: FOCUS_NORMALIZATION.md column-mapping tables per provider, CHANGELOG.

## Key risks
| Risk | Mitigation |
|---|---|
| A newer FOCUS release changes column semantics mid-phase | Pin at phase start; new version = new mapping version, never edit in place |
| Provider FOCUS-native exports (AWS FOCUS export, Azure FOCUS export) disagree with our CUR-based mapping | Treat each source as a separate mapping key; golden tests compare totals, document known deltas |
| Dedup collapses legitimate identical lines | Occurrence-ordinal rule plus row-count invariant (P11-R09) |
| Re-normalization of 37 months overloads workers | Runs as low-priority per-period jobs reusing Phase 12 backfill scheduling |
| Tag key collisions after normalization (`Env` and `env` with different values) | Deterministic collision policy plus DQ warning (P11-R07) |

## Documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: all tasks P11-T01…P11-T16 merged
- [ ] Tests: all P11-TC* executed and recorded in TEST_RESULTS.md with real commands and evidence
- [ ] Docs: FOCUS_NORMALIZATION.md, DATABASE_SCHEMA.md, OpenAPI, EVENTS.md updated
- [ ] OQ-02 decision recorded with date and approver
- [ ] Security review completed (tag/raw untrusted data handling, mapping expression sandbox, RLS on new tables)
- [ ] CHANGELOG updated (including any **Breaking** analytics schema change)
- [ ] Acceptance sign-off (ACCEPTANCE.md) completed
- [ ] Stopped at phase boundary: no Phase 12+ work started
