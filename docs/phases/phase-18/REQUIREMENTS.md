# Phase 18: FX, commitments, unit economics, accounting calendars: Requirements

Status: **NOT STARTED** · Release checkpoint: v0.3 · Spec status: DRAFT (no code exists)

| ID | Requirement | PRD trace | Priority (M/S/C) | Verified by |
|---|---|---|---|---|
| P18-R01 | Every cost row keeps its original `BillingCurrency` and amounts. Conversion to the reporting currency happens only in the semantic layer at query/export time; source amounts are never overwritten. | FR-FIN-001, FR-NRM-002, NFR-ACC-001 | M | P18-AC01 |
| P18-R02 | FX rate sets are immutable and versioned, with provenance: `source` (ecb, provider, upload, manual), `retrieved_at`, source URI or upload object, SHA-256 checksum of canonical rate rows, creator. A refresh creates a new version; activation is explicit and audited. | FR-FIN-001, FR-AUD-001 | M | P18-AC02 |
| P18-R03 | Tenant FX policy (`charge_date`, `month_end`, `month_average`, `provider`) and source priority are configurable per tenant, recorded with every converted result (`meta.fx_rate_set_id`, `meta.fx_policy`). | FR-FIN-001, FR-TEN-007, OQ-11 | M | P18-AC03 |
| P18-R04 | Conversion supports direct, inverse and triangulated (via the rate set's base currency) pairs with a single rounding step (scale 12, half-even). | FR-FIN-001, NFR-ACC-003 | M | P18-AC01 |
| P18-R05 | Missing rates fail closed: if no rate exists within the documented carry-forward window (default 5 calendar days, max 10), the query returns `422 fx_rate_missing` listing missing (date, pair); no silent fallback to another source or date. | FR-FIN-001, AC-01 | M | P18-AC04 |
| P18-R06 | Bundled ECB daily reference fetcher (opt-in, no phone-home by default) and tenant CSV/JSON upload with validation (ISO 4217, positive rates, no duplicate (date, base, quote)). | FR-FIN-001, OQ-11, OQ-17 | M | P18-AC02 |
| P18-R07 | Commitment inventory per provider (AWS RI, Compute/EC2 Instance/SageMaker SP; GCP resource-based and spend-based CUD; Azure reservation and savings plan) with term, payment option, scope, fees, status, first/last seen, lineage to source. | FR-FIN-002, FR-AWS-006 | M | P18-AC05 |
| P18-R08 | Daily commitment utilization (`used / committed`, unused amount) per commitment, using the canonical definitions in DESIGN §4, for all three providers. | FR-FIN-002, UJ-07 | M | P18-AC06 |
| P18-R09 | Commitment coverage (`covered on-demand-equivalent / eligible on-demand-equivalent`) by provider, service category, region and sub-account, exposed as semantic metric `commitment_coverage`. | FR-FIN-002, UJ-07 | M | P18-AC06 |
| P18-R10 | Amortization schedule per commitment (upfront spread over actual term hours + recurring fee). Provider-reported `EffectiveCost` stays the cost source of truth; divergence beyond 0.01 per commitment-month raises a data-quality finding. | FR-FIN-002, FR-NRM-003 | M | P18-AC07 |
| P18-R11 | Unit metrics: definitions (key, unit, aggregation, optional dimension binding) and values via API batch (≤ 10 000 points) and CSV upload (≤ 50 MiB), idempotent per (metric, date, dimension_key). | FR-FIN-003 | S | P18-AC08 |
| P18-R12 | Semantic metric `unit_cost:<key>` = Σ cost metric ÷ Σ unit value at the query grain; zero or missing denominator yields `null` with a reason, never 0 or ∞. | FR-FIN-003, FR-ANL-002 | S | P18-AC09 |
| P18-R13 | Accounting calendars: gregorian with fiscal-year start month 1–12, 4-4-5, 4-5-4, 5-4-4, and custom week-based calendars with `last_weekday` or `nearest_weekday` year-end rules, including 53-week years with explicit extra-week placement. | FR-FIN-008, FR-TEN-007 | S | P18-AC10 |
| P18-R14 | Fiscal grains (`fiscal_period`, `fiscal_quarter`, `fiscal_year`) and dimensions available in the semantic layer with identical results on PostgreSQL, DuckDB and ClickHouse. | FR-ANL-003, FR-FIN-008, AC-04 | M | P18-AC11 |
| P18-R15 | A calendar version cannot be changed for date ranges containing a closed accounting period; activation regenerates open periods only. | FR-FIN-005 (forward), FR-FIN-008 | M | P18-AC10 |
| P18-R16 | All new tables are tenant-scoped with forced RLS (shared ECB rate sets readable by all tenants, writable only by the platform role); all endpoints enforce permissions and ABAC; cross-tenant access returns 404. | NFR-SEC-001, FR-IAM-006, AC-02, AC-03 | M | P18-AC12 |
| P18-R17 | No binary floating point in FX, commitment, unit-cost or calendar code paths (lint + tests). | NFR-ACC-003 | M | P18-AC01 |
| P18-R18 | Rate-set activation and calendar activation bump the tenant `data_version` so cached results are invalidated. | FR-ANL-002, NFR-ACC-001 | M | P18-AC03 |

## Traceability notes
- FR-FIN-001/002/003/008 are delivered fully here. FR-TEN-007 (accounting calendar and FX policy settings) is completed here; the settings fields were created in Phase 04.
- UJ-07 (commitment analysis) is partially satisfied: coverage, utilization, amortized vs. billed views. The "purchase recommendation net of existing commitments" step is Phase 25.
- AC-01 accuracy extends to converted totals: golden FX datasets must match exactly.

## Assumptions
- Provider data reports commitment fees and covered usage in FOCUS columns plus provider extensions (AWS CUR 2.0 `reservation_*`/`savings_plan_*`, GCP `credits` of type `COMMITTED_USAGE_DISCOUNT*`, Azure amortized export `benefitId`/`benefitName`). Availability varies by agreement (PRD A1); missing inputs surface as `unknown`, not zero.
- ECB publishes on TARGET business days only; weekend/holiday dates use the carry-forward window, which is documented and shown in provenance.
