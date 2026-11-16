# Phase 11 — Acceptance

Exit requires every criterion below to be met with evidence recorded in [TEST_RESULTS.md](TEST_RESULTS.md) or linked artifacts.

| ID | Criterion (measurable) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P11-AC01 | OQ-02 decision recorded (version, date, approver); every live row in golden runs has non-null `focus_version` and `mapping_version` | OPEN_QUESTIONS decision log entry; query output | P11-R01 | TC01, TC08 |
| P11-AC02 | `cost_focus` schema contains 100% of mandatory columns of the pinned version; per-provider coverage table published for conditional columns | Registry diff report; FOCUS_NORMALIZATION.md tables | P11-R02 | TC01 |
| P11-AC03 | Cost metrics and charge category/class populated correctly in all golden datasets | Golden test logs | P11-R03 | TC02–TC06 |
| P11-AC04 | 0 source fields lost; 100% rows have full lineage | TC07/TC08 output | P11-R04, R13 | TC07, TC08 |
| P11-AC05 | Published mappings cannot be modified by any path (API or SQL as app role) | Test logs | P11-R05 | TC09 |
| P11-AC06 | Re-normalization creates new period versions, retains prior ones, and reports raw-unavailable periods without changing live data | Test logs, operation result sample | P11-R06 | TC10, TC11 |
| P11-AC07 | Tag normalization properties hold over ≥ 10 000 generated cases; collision policy deterministic | Property-test log with seed | P11-R07 | TC12, TC13 |
| P11-AC08 | Scope→hierarchy assignments and custom dimensions work with effective dating; hierarchy changes bump data_version without re-normalization | Test logs | P11-R08 | TC14, TC15, TC31 |
| P11-AC09 | Dedup keys identical across replays and permutations; identical lines preserved; duplicate deliveries add 0 rows | Test logs | P11-R09 | TC16–TC18 |
| P11-AC10 | Validator catches every seeded rule violation; failing partitions never swap; provider testkit uses it | Test logs | P11-R10 | TC19–TC21 |
| P11-AC11 | Golden totals exact (decimal string compare) for AWS, GCP, Azure and generic: **0 differences** | Golden suite report signed off by Finance SME | P11-R11 | TC02–TC05, TC17 |
| P11-AC12 | No float types in billing packages; excess-scale handling as declared | Lint log; TC22 log | P11-R12 | TC22, TC23 |
| P11-AC13 | 0 cross-tenant leaks; RLS forced on all new tables; malicious mappings bounded | Security test logs | P11-R14, R15 | TC24–TC27 |
| P11-AC14 | All mapping/dimension mutations audited; events schema-valid | Audit query; schema test log | P11-R16, R18 | TC28, TC29 |
| P11-AC15 | Normalization throughput regression ≤ 10% vs Phase 06 baseline (PG, Lite reference) | Benchmark report with hardware spec | P11-R17 | TC30 |

## Exit gate
- All **M** requirements met; P11-AC01…AC14 pass. P11-AC15 may be waived with a documented reason (S priority).
- No open billing-accuracy defect; no open critical/high security finding.
- README completion checklist fully ticked, including "stopped at phase boundary".

## Known limitations (planned)
- DuckDB/ClickHouse physical schema changes are specified but implemented and parity-tested in Phase 13.
- Semantic tag aliasing and value maps are Phase 15; this phase only normalizes key syntax.
- Periods whose raw objects exceeded retention (25 months default) cannot be re-normalized.
- Provider FOCUS-native exports may legitimately differ from CUR/Cost-Management-derived mappings on some conditional columns; documented in the known-deltas file.
- Conformance is against the pinned version only; newer FOCUS versions require a new mapping version.

## Sign-off
| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Engineering lead | | | | |
| Finance SME (golden totals) | | | | |
| Security reviewer | | | | |
| Product owner | | | | |

| Criterion | PRD requirement | Evidence | Status |
|---|---|---|---|
| P11-AC95 | FR-NRM-004 | Executed P11-TC95; Re-normalize the same source under mapping v2; assert v1 remains queryable and lineage resolves both versions without double counting. | NOT VERIFIED |
