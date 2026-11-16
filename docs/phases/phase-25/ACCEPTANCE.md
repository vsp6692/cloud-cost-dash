# Phase 25 — Acceptance

| ID | Criterion (measurable) | Evidence required | Requirements | PRD AC |
|---|---|---|---|---|
| P25-AC01 | Resolver golden cases (TC01–03) pass exactly, and property tests INV-1, 3, 4, 6, 7 pass with ≥ 10 000 cases each and zero counterexamples | Test logs with seed and case count | R01–R03, R06 | AC-05 |
| P25-AC02 | Sequential application and commitment-coverage interaction produce the expected nets (TC01, TC10, TC11) | Test logs | R04, R05 | AC-05 |
| P25-AC03 | Invariant failure is fail-closed (TC22). Runs are reproducible (TC23). No floats in money code paths (TC24) | Logs, lint report | R06, R16, R17 | AC-05 |
| P25-AC04 | Commitment sizing on the projected series matches fixtures for every provider pool type. INV-2 holds. The simulator is read-only | TC09, TC12–14, TC28 logs | R07, R08, R15 | AC-05 |
| P25-AC05 | REC-COM-003/004 and REC-REG-001/002 behave as specified, including residency suppression and the avoidance label | TC15–17 | R09, R10 | AC-05 |
| P25-AC06 | Licensing rules require declarations. Governance rules have zero savings | TC18–20, TC29 | R11, R12 | — |
| P25-AC07 | Every new rule has deterministic fixtures and a manifest | TC21, manifest validation output | R13 | AC-05 |
| P25-AC08 | Totals are Σ net. ABAC and cross-tenant tests show zero leakage | TC25–27 | R14, R18 | AC-02, AC-03 |
| P25-AC09 | UJ-07 E2E passes | Playwright report + trace | R19 | AC-09 |

## Exit gate
All P25-AC criteria are met with evidence in TEST_RESULTS.md, there are no open critical or high findings, and the security review is complete. Shadow-mode comparison report (net vs. previous gross totals) has been reviewed by the product owner.

## Known limitations
- Software-license eligibility relies on tenant attestation. CloudLedger cannot verify entitlements.
- Region recommendations are informational. Migration cost and latency are not modeled.
- Commitment discounts come from the public catalog adjusted by observed ratios. Private pricing for commitments not yet held is estimated (`f_price` < 1).
- Spend-based commitments across currencies are evaluated per billing currency only.

## Sign-off
| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Product owner | | | | |
| Tech lead | | | | |
| Security reviewer | | | | |
| QA lead | | | | |
| FinOps SME | | | | |

| Criterion | PRD requirement | Evidence | Status |
|---|---|---|---|
| P25-AC97 | FR-REC-004 | Executed P25-TC97; Combine rightsizing, shutdown and commitments on one resource/pool; assert combined net savings cannot exceed eligible baseline and the mutually exclusive alternatives are explained. | NOT VERIFIED |
