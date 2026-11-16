# Phase 09: Acceptance

An AC passes only with linked evidence from executed tests ([TEST_RESULTS.md](TEST_RESULTS.md)). A missing or `NOT RUN` entry is a fail.

| ID | Criterion (measurable) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P09-AC01 | All 8 valid format variants import via UI and API with identical row sets and totals. Chunked upload verifies part and file hashes. Unsupported formats are rejected. | CI run, golden diff output | R01, R02 | TC01–05, TC17, TC34 |
| P09-AC02 | Object-store polling on MinIO, GCS emulator and Azurite honours settle time, markers and globs. Zero write or delete calls are recorded. The generic provider passes the compatibility suite. | Recorded-request log, testkit report | R03 | TC20–23 |
| P09-AC03 | Templates are versioned and immutable once published. Built-ins are read-only (API and RLS). Preview writes nothing. Expression sandbox tests are green. | Test logs, DB row-count diff | R04–R06 | TC06–08, TC29 |
| P09-AC04 | Every rejection reason code is produced as specified. DQ reports equal the golden JSON. The control-total identity holds exactly across 10 000 property cases. The reject-ratio gate keeps the previous version live. | Golden diffs, property-test seed log | R07, R08 | TC09–11, TC25 |
| P09-AC05 | Golden totals are exactly equal (decimal string). Re-import of the same bytes is idempotent. Lineage fields are populated. No float is used in import code (lint). | Golden totals report, lint output | R09, R10, R17 | TC05, TC12–14, TC26 |
| P09-AC06 | Every attack file is rejected within limits, with RSS ≤ budget, no egress and no file-system write outside raw storage. Nightly fuzzing ran 10 min per target with zero open crashers. | Fuzz logs, egress monitor log, RSS metrics | R11, R12, R14 | TC15–18, TC32, TC35 |
| P09-AC07 | Formula-injection neutralization is applied to every written CSV/XLSX cell class while stored data stays byte-exact. | Sample files and assertions | R13 | TC19 |
| P09-AC08 | Schema drift quarantines and alerts. Restatement swaps atomically. Partial multi-period failure is reported correctly. Deleted objects never delete data. | Test logs, event capture | R15, R16 | TC10, TC21, TC22, TC24, TC25 |
| P09-AC09 | Zero cross-tenant leaks. The RBAC/ABAC matrix passes in both positive and negative directions. Audit chain verifies. No untrusted strings or amounts appear at INFO. | Security suite report | R18, R19 | TC27–30 |
| P09-AC10 | Failure injection leaves no partial live data. The perf benchmark is recorded; it is non-gating, and a miss is listed as a limitation. | Chaos log, benchmark output and hardware | R07, R20 | TC31, TC33 |

## Exit gate
All M-priority ACs (AC01–AC09) pass. Security review is signed off. Zero open critical or high findings in parsers. License CI is green for new dependencies. Docs and CHANGELOG are updated. Work stopped at the phase boundary.

## Known limitations (planned)
- No PDF, XLS or ODS support. No content-based period guessing beyond the template rules.
- Re-normalizing earlier imports after a template change arrives in Phase 11. The health API and retries/DLQ hardening arrive in Phase 12.
- The ClamAV hook is off by default.
- The built-in template RLS policy deviates from the standard template (documented in DESIGN §3).

## Sign-off
| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Engineering lead | | | | |
| Security reviewer | | | | |
| QA lead | | | | |
| Product owner | | | | |

| Criterion | PRD requirement | Evidence | Status |
|---|---|---|---|
| P09-AC92 | FR-IMP-001 | Executed P09-TC92; Import equivalent CSV, NDJSON, XLSX and Parquet through UI/API and object polling; assert identical normalized decimal totals and provenance. | NOT VERIFIED |

| Criterion | PRD requirement | Evidence | Status |
|---|---|---|---|
| P09-AC93 | FR-IMP-002 | Executed P09-TC93; Preview and publish mapping v2, then replay a v1 import; verify the pinned mapping and original result remain reproducible. | NOT VERIFIED |

| Criterion | PRD requirement | Evidence | Status |
|---|---|---|---|
| P09-AC94 | FR-IMP-003 | Executed P09-TC94; Import a fixture with valid, rejected and duplicate rows; assert counts reconcile exactly and every rejected row has a reason without secret leakage. | NOT VERIFIED |
