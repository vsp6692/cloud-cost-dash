# Phase 10: Invoice Import and Reconciliation (Foundation)

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.2 (phases 06–14) |
| Depends on | 06, 07, 08 (provider billing data, `InvoiceId` where present, `provider_final`), 09 (`fileparse`, upload sessions, safe writer); transitively 04, 05 |
| Primary PRD requirements | FR-FIN-004, FR-AWS-005, FR-GCP-004, FR-AZR-004, NFR-ACC-002, UJ-08 (foundation), AC-01 (zero uncategorized variances) |
| Primary verification | Golden invoice fixtures per provider with expected variances and categories |
| Key ADRs | [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md), [ADR-0010](../../architecture/adr/0010-immutable-content-addressed-raw-storage-and.md), [ADR-0014](../../architecture/adr/0014-hash-chained-append-only-audit-log.md), [ADR-0016](../../architecture/adr/0016-uuidv7-identifiers-and-utc-timestamps.md) |
| Architecture | [FINANCE_RECONCILIATION.md](../../architecture/FINANCE_RECONCILIATION.md) §6–7 (authoritative matching and categorization rules) |

> No code exists yet. Everything below is a plan.

## Goal
Bring provider invoices into CloudLedger, from provider APIs where the account is entitled and otherwise by upload, and reconcile each invoice against normalized **BilledCost**. Matching uses `InvoiceId` when present and otherwise billing account × billing period × currency × issuer. Variances are computed in exact decimal per line group and categorized with the ordered rule set. A configurable tolerance applies (default 0.01 in invoice currency per line group). Users can acknowledge variances with a reason.

## Scope
1. Invoice model: `invoices`, `invoice_lines`, invoice line groups, raw invoice file as a content-addressed source object.
2. Sources per provider, all capability-detected and never assumed:
   - **AWS**: Invoicing API `ListInvoiceSummaries` (headers only, entitlement dependent). Line-level detail comes from CUR `bill_invoice_id` rows. PDF only by upload.
   - **Azure**: MCA/MPA `billingAccounts/{id}/invoices` (list, get, PDF download URL). MOSP per subscription. EA marked `unknown` until verified.
   - **GCP**: no public invoice API for direct customers, so `upload_only`. Totals are cross-checked against the export grouped by `invoice.month` and `cost_type`.
   - **Generic**: upload of a structured CSV/XLSX/JSON invoice (Phase 09 parsers) plus PDF header metadata entered or confirmed by a user. No OCR of line amounts.
3. Reconciler: candidate selection, line-group classification, exact variances, header check, ordered categorization (`tax` … `unexplained`), status `matched | within_tolerance | variance | acknowledged`.
4. Tolerance settings per tenant and provider, variance acknowledgement, and re-reconciliation on `cost.period.restated.v1`.
5. A minimal reconciliation UI: invoice list, invoice detail, variance table with categories and evidence, acknowledge dialog.
6. Golden invoice fixtures for AWS, Azure MCA, GCP (upload) and generic, covering every variance category.

## Out of scope
- Finance exports, journal/GL export, and the reconciliation report pack (Phase 29).
- Period close and blocking a close on variances (Phase 30). This phase exposes status that Phase 30 consumes.
- FX conversion (Phase 18). A cross-currency invoice is categorized `fx`, with the invoice-stated rate as evidence when one is available.
- Tax computation (OQ-10: CloudLedger is not a tax engine), PDF OCR and AP/ERP functionality (NG4).

## Dependencies
| Kind | Item |
|---|---|
| Phases | 06–08 (connectors and verify reports, `InvoiceId`, `InvoiceIssuerName`, `provider_final`), 09 (upload, parsers, safe writer), 05 (permissions), 04 (audit, outbox) |
| External | AWS Invoicing API (verify member-account behaviour and entities), Azure Billing invoices API (MCA/MPA; EA and MOSP to verify), no GCP API. See [AWS.md §6](../../providers/AWS.md), [AZURE.md §6](../../providers/AZURE.md), [GCP.md §10](../../providers/GCP.md) |
| Docs | [FINANCE_RECONCILIATION.md](../../architecture/FINANCE_RECONCILIATION.md), [DATABASE_SCHEMA.md §2.6](../../architecture/DATABASE_SCHEMA.md), [EVENTS.md](../../contracts/EVENTS.md) |

## Deliverables
`internal/finance/invoices`, `internal/finance/reconciliation`, provider `InvoiceSource` implementations, migrations, the `/api/v1/invoices` and `/api/v1/reconciliations` APIs, the reconciliation UI pages, golden fixtures under `tests/fixtures/golden/invoices/`, docs and CHANGELOG.

## Key risks
| Risk | Mitigation |
|---|---|
| Invoice API availability varies by agreement and entitlement | Capability probe reports `pass/fail/unknown/not_applicable`. Upload is always available. No assumption of universal access. |
| `InvoiceId` empty until the invoice is issued (AWS) or never present (GCP) | Fallback matching key. Candidate rule recorded in the result. |
| Group-key mapping wrong per provider leads to false variances | Group-key mapping is versioned per provider and covered by golden fixtures. Header check catches leakage between groups. |
| Restatements silently invalidate earlier results | Results pin `data_version`. Restatement events trigger re-reconciliation. Superseded results are kept. |
| Rounding tolerance hides real defects | `unexplained` and `missing_data` always need acknowledgement regardless of amount (FINANCE_RECONCILIATION §7) |

## Documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: P10-T01…T13 merged
- [ ] Tests: all P10-TC* executed with real evidence. Provider API tests without credentials are recorded as skipped, never as passed.
- [ ] Docs: FINANCE_RECONCILIATION.md, DATABASE_SCHEMA.md, provider docs (verified invoice capabilities), OpenAPI, EVENTS.md
- [ ] Security review: invoice PDF handling, pre-signed URLs, acknowledgement authorization, audit
- [ ] Finance SME review of golden fixtures and categorization
- [ ] CHANGELOG entry (v0.2)
- [ ] Acceptance sign-off
- [ ] Stopped at phase boundary: no Phase 11+ or Phase 29/30 work started
