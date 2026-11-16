# Finance Documentation

Status: **DRAFT**. CloudLedger is in the planning stage and no code exists. These pages describe intended behavior for finance users (controllers, FinOps practitioners, auditors). Everything here is a design target, not a shipped capability.

CloudLedger is source-available software (free for internal use; see the [README](../../README.md#licensing)).

| Document | For | Contents |
|---|---|---|
| [COST_SEMANTICS.md](COST_SEMANTICS.md) | finance managers, FinOps, auditors | cost types (list, contracted, billed, effective), amortization, credits, refunds, taxes, FX, reconciliation tolerances, period close and adjustments, with worked numeric examples |
| [../architecture/FINANCE_RECONCILIATION.md](../architecture/FINANCE_RECONCILIATION.md) | engineers, auditors | FX policies and provenance, commitments, accounting calendars, invoice matching algorithm, variance categories, period-close state machine, report manifest format, journal export, export safety |
| [../architecture/FOCUS_NORMALIZATION.md](../architecture/FOCUS_NORMALIZATION.md) | engineers, data teams | how provider bills are mapped to FOCUS 1.2 |
| [../architecture/ALLOCATION_ENGINE.md](../architecture/ALLOCATION_ENGINE.md) | FinOps admins | allocation rules, shared-cost splits, rounding residuals |

## Key commitments to finance users

1. **Numbers tie out.** Normalized totals equal provider source totals exactly, per billing period, account, charge category and currency, before FX (NFR-ACC-001).
2. **No floating-point money.** All amounts are fixed-point decimals with 12 decimal places in storage, rounded only for presentation using banker's rounding (half-even), with residuals assigned deterministically so that lines always add up to totals (ADR-0007).
3. **Invoices reconcile.** Every difference against an invoice is categorized (tax, credit, rounding, timing, late correction, FX, marketplace, support, missing data, unexplained). The default tolerance is 0.01 in invoice currency per invoice line group (NFR-ACC-002).
4. **Closed means closed.** Closing a period produces an immutable snapshot with a manifest of SHA-256 hashes. Late changes appear as labeled adjustments in the next open period.
5. **Everything is traceable** from a reported figure back to the provider file, row, mapping version, allocation rule version and FX rate set.
6. **CloudLedger is not a tax engine, ERP or accounts-payable system** (NG4, OQ-10). It reports provider-stated tax and exports journals to your ledger.

## Open questions affecting finance

See [OPEN_QUESTIONS.md](../product/OPEN_QUESTIONS.md): OQ-02 (FOCUS version), OQ-09 (retention), OQ-10 (tax and invoice jurisdictions), OQ-11 (FX sources).
