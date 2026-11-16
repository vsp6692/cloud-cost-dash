# Cost Semantics for Finance Users

Status: **DRAFT**. This describes intended CloudLedger behavior; nothing is implemented yet. Technical detail: [FINANCE_RECONCILIATION.md](../architecture/FINANCE_RECONCILIATION.md), [FOCUS_NORMALIZATION.md](../architecture/FOCUS_NORMALIZATION.md).

All examples use exact decimals. CloudLedger stores 12 decimal places and rounds to cents only when displaying, using banker's rounding (round half to even).

## 1. The four cost types

CloudLedger follows the FinOps FOCUS specification (version 1.2, subject to re-confirmation in Phase 11).

| Cost type | Plain-language meaning | Use it for |
|---|---|---|
| **List cost** | What you would pay at public prices with no discounts | Measuring total discount value |
| **Contracted cost** | What you would pay at your negotiated prices (e.g. enterprise discount), before commitments | Measuring negotiated discounts |
| **Billed cost** | What the provider invoices for that charge, in the month it is invoiced | Invoice reconciliation, cash view |
| **Effective cost** | Billed cost with upfront and recurring commitment fees spread over the usage they cover (amortized) | Showback, chargeback, budgets, trends (default) |

### Example: one server for one month (720 hours)

- Public price 0.192/h. Negotiated 5% discount → 0.1824/h.
- A reservation covers 500 hours; its amortized rate is 0.12/h (fee paid upfront earlier).
- The other 220 hours run at the negotiated on-demand rate.

| | List | Contracted | Billed | Effective |
|---|---|---|---|---|
| 500 h covered by reservation | 96.00 | 91.20 | 0.00 | 60.00 |
| 220 h on-demand | 42.24 | 40.128 | 40.128 | 40.128 |
| **Month total** | **138.24** | **131.328** | **40.128** | **100.128** |

Billed cost is low this month because the reservation was paid upfront in an earlier month. Effective cost shows the true economic cost of running the server this month. Displayed at cents: billed 40.13, effective 100.13.

## 2. Amortization

Upfront commitment payments (AWS Reserved Instances and Savings Plans, Google committed-use discounts, Azure reservations and savings plans) are **billed** when purchased and **amortized** into effective cost over the term.

Example: a 1-year all-upfront reservation for 8 760.00 USD.

| Month | Billed cost | Effective cost (if fully used) |
|---|---|---|
| Purchase month (31 days) | 8 760.00 (the purchase line) | 744.00 (31 × 24.00) |
| Each following 30-day month | 0.00 | 720.00 |
| Whole term (365 days) | 8 760.00 | 8 760.00 |

Over the full term, total billed = total effective. Only the timing differs. If the reservation is not fully used, the unused portion still appears in effective cost as **unused commitment** cost, so it is never lost from view.

Partial upfront: 4 380.00 upfront + 0.50/h recurring → amortized 0.50/h + recurring 0.50/h = 1.00/h effective.

CloudLedger uses the provider's own amortization where provided. Where it computes amortization itself, it puts any rounding residual on the last day of the term so totals match exactly.

## 3. Credits, refunds and adjustments

| Item | How it appears | Effect |
|---|---|---|
| Promotional / free-tier credits | separate **Credit** lines with negative amounts | reduce billed and effective cost |
| Refunds | **Credit** lines marked as corrections | reduce cost; matched to the period they correct |
| Provider corrections to earlier months | lines marked **Correction** | if the earlier period is closed, they become adjustments (§7) |
| Rounding adjustments | **Adjustment** lines | usually tiny; categorized in reconciliation |

Dashboards let you include or exclude credits and taxes (FR-DSH-002). The setting is shown on every chart.

Allocation of credits: a credit is allocated using the same rules as the cost it relates to. Shared credits are split like any shared cost, keeping the negative sign (e.g. −10.00 split evenly across three teams → −3.34, −3.33, −3.33).

## 4. Taxes

CloudLedger does **not** calculate tax. It reports tax exactly as the provider states it, as **Tax** lines (effective cost = billed cost for tax).

Example invoice (VAT 20% stated by provider):

| Line | Amount |
|---|---|
| Usage | 1 000.00 |
| Credit | −100.00 |
| Subtotal | 900.00 |
| VAT (provider-stated) | 180.00 |
| **Invoice total** | **1 080.00** |

A dashboard "excluding tax" shows 900.00. "Including tax" shows 1 080.00. Reconciliation always compares the full invoice, including tax.

## 5. Currency conversion (FX)

- Every cost keeps its original **billing currency**. Conversion to your **reporting currency** uses a versioned rate set (provider rates, ECB reference rates, or your own uploaded table).
- Your tenant chooses a policy: rate on the charge date (default), month-end rate, monthly average, or the provider's rate.
- Each converted figure records the rate set, version, date and rate used.
- When no direct rate exists, CloudLedger computes a cross rate through a pivot currency (EUR for ECB), rounded to 18 decimal places.

Examples:
- 1 234.56 EUR × 1.0834 (EUR→USD) = 1 337.522304 USD → displayed 1 337.52 USD.
- Cross rate USD→JPY with EUR→USD 1.0834 and EUR→JPY 162.45: 162.45 / 1.0834 = 149.944618792689680635 JPY per USD.
- Reconciliation always happens in the invoice currency, before any conversion, so FX never creates false reconciliation differences.

## 6. Reconciliation and tolerances

CloudLedger compares each invoice with the billed cost it holds for the same account, period and currency, line group by line group.

- **Default tolerance:** 0.01 in invoice currency per invoice line group (configurable).
- **Expected rounding:** providers round each invoice line to cents. CloudLedger keeps 12 decimal places, so differences of up to half a cent per invoice line are normal and categorized as **rounding**.
- Every difference gets a category: tax, credit, rounding, timing, late correction, FX, marketplace, support, missing data, or unexplained. Differences that are "missing data" or "unexplained" always need acknowledgement, whatever their size.

Example (October invoice, USD):

| Line group | Invoice | CloudLedger | Difference | Category |
|---|---|---|---|---|
| Compute | 8 412.37 | 8 412.368712345678 | 0.001287654322 | rounding |
| Storage | 1 203.55 | 1 203.551200000000 | −0.001200000000 | rounding |
| Credits | −150.00 | −150.00 | 0.00 | — |
| Data transfer | 412.90 | 400.50 | 12.40 | late correction |
| Tax | 1 756.06 | 1 756.06 | 0.00 | — |
| **Total** | **11 634.88** | **11 622.479912345678** | **12.400087654322** | |

The two rounding differences are within tolerance. The 12.40 late correction exceeds tolerance: the provider issued a correction after the export was delivered. A finance manager must acknowledge it before the period can be closed.

## 7. Period close and adjustments

1. Close is allowed when data is complete, all reconciliations are matched, within tolerance, or acknowledged, allocation is current, and FX rates are complete.
2. Closing creates an **immutable snapshot** and a **report manifest** listing every input version and a SHA-256 hash of each output file. Auditors can verify the files independently.
3. A closed period is never changed. If the provider later corrects that period, the difference is recorded as a **prior-period adjustment** in the next open period, labeled with the period it relates to, and included in the journal export.
4. Reopening a closed period is possible only with dual approval. It produces a new snapshot version; the original is kept.

Example: September is closed with Team A effective cost 25 000.00. In October the provider issues a 120.00 refund for September usage of Team A. September stays 25 000.00. October shows Team A's normal October costs plus a separate line "Prior-period adjustment (September): −120.00".

## 8. Shared costs and rounding in chargeback

Shared costs (e.g. support fees) are split by your rules: evenly, by fixed percentages, by each team's cost, or by a business metric. Splits are exact. Any leftover fraction of a cent goes to the parties with the largest remainders (ties broken alphabetically by key), so lines always sum exactly to the total.

Example: 1 234.57 split 40% / 35% / 25% → 493.83 / 432.10 / 308.64 (sum 1 234.57).

Cost that matches no allocation rule is shown as **Unallocated**. It is never hidden.

## 9. Unit economics

Cost per business unit (e.g. per order) = allocated effective cost ÷ business volume.
Example: 42 000.00 USD ÷ 1 250 000 orders = 0.0336 USD per order. If volume is zero or missing, CloudLedger shows "no volume" rather than a misleading number.
