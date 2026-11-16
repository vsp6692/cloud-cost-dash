# Phase 29 — Acceptance

## Criteria
| ID | Criterion (measurable) | Evidence required | Requirements | PRD AC |
|---|---|---|---|---|
| P29-AC01 | All three provider golden invoices reconcile with variances exactly equal to expected per category; Σ variances = diff in 100% of property cases; zero `unexplained` on golden data | TC02, TC03, TC05 results | P29-R01, R02 | AC-01 |
| P29-AC02 | Status classification correct at tolerance boundaries; tolerance recorded on every result | TC04 | P29-R02, R03 | AC-01 |
| P29-AC03 | Acknowledgment requires reason, is audited and immutable; SoD violations denied and audited | TC06–TC08, audit query output | P29-R04, R05 | AC-03 |
| P29-AC04 | Restatement re-runs reconciliation exactly once per data_version and marks changed acks stale | TC09, TC10 | P29-R06 | AC-01 |
| P29-AC05 | Chargeback/showback export totals (incl. unallocated) equal source totals exactly for every golden period and currency | TC11, TC30 | P29-R07 | AC-01 |
| P29-AC06 | GL mapping precedence, default account and publish-after-preview enforced; journals balanced in 100% of property cases incl. JPY/KWD | TC12–TC15 | P29-R08, R09 | AC-01 |
| P29-AC07 | Validator rejects every injected tampering and version-drift case; no download URL is issued for failed exports | TC19, TC20 | P29-R09, R12 | AC-01 |
| P29-AC08 | All five formats round-trip golden values without loss | TC16 | P29-R10 | — |
| P29-AC09 | 100% of the formula-injection corpus neutralized in CSV and XLSX; 5-minute fuzz run clean | TC17, TC18 | P29-R11 | AC-02 (data safety) |
| P29-AC10 | Manifest hash reproducible and matches stored file hashes; recorded in audit log | TC21 | P29-R13 | — |
| P29-AC11 | 100 M-row export completes within the documented memory bound; idempotency and rate limiting conform to API guidelines; recovery from storage failure | TC22, TC27, TC28, measured duration and RSS | P29-R14, R16 | — |
| P29-AC12 | Zero cross-tenant or out-of-scope rows/URLs in the export attack tests; URL TTL ≤ 15 min | TC23–TC26 | P29-R15 | AC-02 |
| P29-AC13 | UJ-08 and UJ-04 chargeback step pass in Playwright with axe-core clean | TC29, TC30 | P29-R17 | AC-09 |

## Exit gate
- Every P29-AC above met with evidence linked in [TEST_RESULTS.md](TEST_RESULTS.md) (actual commands, commit, CI links).
- No open critical/high security findings for exports, URLs or acknowledgments; no open billing-accuracy defects.
- OpenAPI diff and new events reviewed; EVENTS.md catalog updated.
- Finance SME has reviewed journal format against at least one target ledger import spec.
- Phase 30 not started before sign-off.

## Known limitations (planned)
- Journal export is file-based; no direct ERP push (NG4).
- Categorizers cover documented categories; provider-specific invoice quirks may surface as `unexplained` until a categorizer is added.
- PDF is summary-only; detail data must use CSV/XLSX/Parquet.
- XLSX is limited to 1 048 576 rows per sheet; larger exports must use CSV/NDJSON/Parquet (422 otherwise).
- Invoice availability depends on provider entitlements (FR-AWS-005, FR-GCP-004, FR-AZR-004).

## Sign-off
| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Product owner | | | | |
| Tech lead | | | | |
| Security reviewer | | | | |
| QA lead | | | | |
| Finance SME | | | | |
