# Phase 18: FX, commitments, unit economics, accounting calendars: Overview

Status: **NOT STARTED** · Release checkpoint: v0.3 · Spec status: DRAFT (no code exists)

## Goal
Make CloudLedger numbers finance-grade across currencies, commitments and fiscal calendars:
1. Convert billing currency to the tenant reporting currency using **versioned, provenance-tracked FX rate sets** and an explicit per-tenant policy (OQ-11), failing closed when a rate is missing.
2. Track **commitments** (AWS RIs and Savings Plans, GCP resource-based and spend-based CUDs, Azure reservations and savings plans): inventory, utilization, coverage and amortization, with exact definitions shared by all three providers.
3. Support **unit economics**: tenant-defined business metrics (orders, MAU, GB served …) pushed by API or uploaded as CSV, exposed as `unit_cost:<key>` in the semantic layer.
4. Support **accounting calendars**: gregorian with custom fiscal-year start, 4-4-5, 4-5-4, 5-4-4 and custom week-based calendars including 53-week years, usable as time grains in every query.

## Scope
- `internal/finance/fx`: rate-set model, ECB fetcher, tenant upload (CSV/JSON), provider-supplied rate capture, conversion engine (direct, inverse, triangulated), policies `charge_date`, `month_end`, `month_average`, `provider`.
- `internal/finance/commitments`: commitment inventory from `CommitmentSource` (Provider SDK) and from billing rows, daily utilization, coverage and amortization schedules written to the analytics store.
- `internal/finance/unitmetrics`: definitions, value ingestion (API batch + CSV upload), validation, replication to the analytics store.
- `internal/finance/calendar`: calendar definitions, period generation, fiscal time grains in the semantic compiler.
- Semantic-layer registry additions (metrics, dimensions, grains) and contract-suite cases on all three engines.
- REST endpoints, events, minimal UI pages (rate sets, commitments overview, unit metrics, calendar settings).

## Out of scope
- Commitment **purchase** recommendations and net-of-commitment overlap (Phase 25). Purchasing commitments on a customer's behalf (NG2).
- Invoice reconciliation changes, FX variance categorization in reconciliation (Phase 10/29), period close and snapshot pinning of rate sets (Phase 30).
- Trading-grade or intraday FX (PRD A5). Tax computation (OQ-10).
- Realized-savings measurement (Phase 26). Budget amounts in fiscal periods are consumed by Phase 17, not redefined here.

## Dependencies
| Phase | Consumed |
|---|---|
| [11](../phase-11/README.md) | FOCUS 1.2 rows incl. `BillingCurrency`, `CommitmentDiscountId`, `CommitmentDiscountType`, `CommitmentDiscountStatus`, `x_` provider FX columns, `EffectiveCost`/`ListCost`/`ContractedCost` |
| [13](../phase-13/README.md) | Semantic layer, adapter interface, `fx_applied` table, contract suite (accounting-calendar and rounding groups) |
| [04](../phase-04/README.md) | `tenant_settings` (`reporting_currency`, `fx_policy`, `accounting_calendar`), RLS, audit |
| [05](../phase-05/README.md) | Permissions and ABAC predicates |
| [06](../phase-06/README.md)–[08](../phase-08/README.md) | Connectors and the `commitments` capability declared in manifests |

Downstream: Phase 17 (budgets on fiscal periods), 25 (commitment recommendations), 29 (finance exports), 30 (period close pins rate set and calendar).

## Deliverables
- Migrations for FX, commitments, unit metrics and calendars (control plane + analytics, three engines).
- Go packages listed above with ≥ 85% unit coverage on calculation code (NFR-MNT-001).
- Golden datasets `tests/fixtures/golden/fx_conversion/`, `golden/commitments_{aws,gcp,azure}/`, `golden/unit_cost/`, `golden/calendars/`.
- OpenAPI additions in [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml) and event schemas in `schemas/events/`.
- Documentation update to [FINANCE_RECONCILIATION.md](../../architecture/FINANCE_RECONCILIATION.md) (FX and calendar sections).

## Key risks
| ID | Risk | Mitigation |
|---|---|---|
| P18-RK01 | Silent FX fallback produces plausible but wrong reporting totals | Fail closed (`fx_rate_missing`), documented carry-forward window only, provenance in every response `meta` |
| P18-RK02 | Our amortization diverges from provider-reported `EffectiveCost` | Provider amortization is source of truth for cost; derived schedule is a check, divergence > tolerance raises a data-quality finding |
| P18-RK03 | Commitment semantics differ per provider (hours vs. spend vs. normalized units) | Single canonical model in commitment-amount terms; per-provider mapping tables with golden fixtures |
| P18-RK04 | 53-week years and calendar changes break YoY comparisons | Calendar versions are immutable once a period is closed; 53rd week placement explicit and labelled |
| P18-RK05 | Engine drift in decimal division (unit cost, triangulation) | Single rounding point (scale 12, half-even), contract-suite exact string compare |
| P18-RK06 | Unit-metric uploads used for injection or DoS | Size caps, streaming CSV parse, formula characters stored as data, per-tenant rate limits |

## Documents
[REQUIREMENTS.md](REQUIREMENTS.md) · [DESIGN.md](DESIGN.md) · [IMPLEMENTATION.md](IMPLEMENTATION.md) · [API_CONTRACTS.md](API_CONTRACTS.md) · [TEST_PLAN.md](TEST_PLAN.md) · [TEST_RESULTS.md](TEST_RESULTS.md) · [ACCEPTANCE.md](ACCEPTANCE.md)

Related: [PRD](../../product/PRD.md) §5.14 · [OPEN_QUESTIONS.md](../../product/OPEN_QUESTIONS.md) (OQ-11) · [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md) §2.6, §3 · [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md)

## Completion checklist
- [ ] Code merged (all P18-T tasks complete)
- [ ] Tests written and executed; results recorded in TEST_RESULTS.md
- [ ] Documentation updated (architecture docs, OpenAPI, runbooks)
- [ ] Security review completed
- [ ] CHANGELOG entry added
- [ ] Acceptance sign-off recorded in ACCEPTANCE.md
- [ ] Stopped at phase boundary (Phase 19 not started)
