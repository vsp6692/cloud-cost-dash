# Phase 29 — Finance exports and reconciliation

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.7 |
| Depends on | [Phase 10](../phase-10/README.md) (invoice import, reconciliation foundation), [Phase 15](../phase-15/README.md) (allocation, shared costs), [Phase 18](../phase-18/README.md) (FX, commitments, accounting calendars) |
| PRD requirements | FR-FIN-004, FR-FIN-006, FR-ALC-007, FR-IMP-004 (export side), NFR-ACC-002, NFR-ACC-003, NFR-SEC-001 |
| User journeys | UJ-04 (chargeback report), UJ-08 (invoice reconciliation) |
| Primary verification | Export-to-ledger validation |

> No application code exists yet. This document is a specification, not a description of shipped behavior.

## Goal
Turn the Phase 10 reconciliation foundation into a complete, auditable finance workflow, and give finance teams ledger-ready output: invoice-to-cost reconciliation with categorized and acknowledged variances, showback/chargeback exports per hierarchy node, and a balanced journal (GL) export driven by a versioned, tenant-configurable GL mapping. Every export is provably equal to its source data (export-to-ledger validation) and safe to open in spreadsheet tools.

## Scope
1. **Reconciliation workflow**: run → match (invoice line groups ↔ normalized `BilledCost`) → categorize variances (`tax`, `credit`, `rounding`, `timing`, `late_correction`, `fx`, `marketplace`, `support`, `missing_data`, `unexplained`) → review → acknowledge with mandatory reason. Optional separation of duties (acknowledger ≠ run initiator) per tenant setting. Re-run on `cost.period.restated.v1`.
2. **Showback and chargeback exports** per hierarchy node and custom dimension, from `cost_allocated`, honoring the allocation invariant (allocated + unallocated = source total).
3. **Journal / GL export**: versioned GL mapping (hierarchy node / dimension / charge category → GL account, cost center, legal entity, tax code), balanced debit/credit lines, configurable offset (clearing) account, and deterministic rounding residual handling.
4. **Formats**: CSV, XLSX, JSON (NDJSON for large), Parquet, PDF (summary-level only).
5. **Formula-injection neutralization** for CSV/XLSX (leading `=`, `+`, `-`, `@`, TAB, CR).
6. **Export-to-ledger validation**: Σ export lines == Σ source semantic query per (currency, period, cost metric) exactly; journal debits == credits; manifest with row counts and SHA-256 per file.
7. **Large export streaming** to object storage under the tenant prefix, ABAC-filtered, downloaded via short-TTL pre-signed URLs.

## Out of scope
- Period close, immutable snapshots, WORM, scheduled delivery and report archive (Phase 30).
- Direct ERP API integration (NetSuite, SAP, Oracle push). CloudLedger produces files only (PRD NG4).
- Tax computation (OQ-10). Taxes are provider-reported lines.
- Invoice parsing of new providers or formats (Phase 10).
- Customer end-user billing beyond showback/chargeback (NG5).

## Dependencies
| Dependency | What is needed |
|---|---|
| Phase 10 | `invoices`, `invoice_lines`, `reconciliation_results`, `reconciliation_variances`, base matcher |
| Phase 13 | semantic query layer, ABAC predicate injection, `meta.data_version` |
| Phase 15 | `cost_allocated`, rule-set versions, allocation invariant checks |
| Phase 18 | FX rate sets, accounting calendars, commitment amortization |
| Phase 05 | Cedar authorizer, custom role permissions |
| Phase 09 | streaming writers and formula-neutralization helper (export side of FR-IMP-004) |

## Deliverables
- `internal/finance/reconciliation` (workflow, matcher v2, categorizer, acknowledgment).
- `internal/finance/exports` (export engine, format writers, neutralizer, manifest, validator).
- `internal/finance/journal` (GL mapping model, journal builder, balancing).
- Migrations `p29_*` (see [DESIGN.md](DESIGN.md#data-model-and-migrations)).
- OpenAPI additions (see [API_CONTRACTS.md](API_CONTRACTS.md)); events `export.completed.v1`, `variance.acknowledged.v1`.
- UI: reconciliation workbench, variance acknowledgment dialog, GL mapping editor with preview, export wizard.
- Golden fixtures: `tests/fixtures/finance/{invoices,gl_mappings,exports}/`.
- Docs: [FINANCE_RECONCILIATION.md](../../architecture/FINANCE_RECONCILIATION.md) updates, operator guide for export storage and URL TTLs.

## Key risks
| Risk | Mitigation |
|---|---|
| Export totals drift from dashboard totals (rounding, FX timing) | Validator compares exact decimals against the same semantic query and `data_version`; rounding only at the journal line step with residual line |
| Spreadsheet formula injection via tag values or resource names | Neutralizer applied in every CSV/XLSX writer; fuzz tests |
| Cross-tenant or out-of-scope leakage through exports or URLs | ABAC predicate in source query, tenant prefix, per-object pre-signed URL with ≤ 15 min TTL, 404 on cross-tenant |
| Unbalanced journals rejected by ERP | Balancing invariant enforced before upload; export fails closed |
| Memory blow-up on 100 M-row exports | Streaming cursor → writer → multipart upload; bounded buffers |
| Restatement during an export | Export pinned to `data_version`; mismatch at completion fails the run |

## Links
[PRD §5.14](../../product/PRD.md) · [DATA_FLOW §4](../../architecture/DATA_FLOW.md) · [DATABASE_SCHEMA §2.6](../../architecture/DATABASE_SCHEMA.md) · [FINANCE_RECONCILIATION](../../architecture/FINANCE_RECONCILIATION.md) · [ALLOCATION_ENGINE](../../architecture/ALLOCATION_ENGINE.md) · [API_GUIDELINES](../../contracts/API_GUIDELINES.md) · [EVENTS](../../contracts/EVENTS.md) · [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md) · [ADR-0008](../../architecture/adr/0008-authorization-rbac-abac-via-cedar-policies.md) · [ADR-0014](../../architecture/adr/0014-hash-chained-append-only-audit-log.md) · [Phase 30](../phase-30/README.md)

## Completion checklist
- [ ] Code merged
- [ ] Tests written and passing (results recorded in [TEST_RESULTS.md](TEST_RESULTS.md))
- [ ] Docs updated (API, architecture, operations)
- [ ] Security review completed
- [ ] CHANGELOG updated
- [ ] Acceptance sign-off ([ACCEPTANCE.md](ACCEPTANCE.md))
- [ ] Stopped at phase boundary — Phase 30 not started
