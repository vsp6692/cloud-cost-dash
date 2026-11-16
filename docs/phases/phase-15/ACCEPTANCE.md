# Phase 15 Acceptance

Phase acceptance requires every **M** criterion below to be met with evidence recorded in [TEST_RESULTS.md](TEST_RESULTS.md). Status: **NOT STARTED**, no criterion has been evaluated.

## Criteria

| ID | Criterion (measurable) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P15-AC01 | Tag key normalization and value mapping produce the expected normalized tags for 100 % of golden-01 rows | Test log, fixture diff = empty | P15-R01 | P15-TC01, TC02 |
| P15-AC02 | Inheritance fills missing tags per precedence and never overwrites explicit resource tags | Test log | P15-R02 | P15-TC03 |
| P15-AC03 | Hierarchy and dimension assignment match expected targets per period, including a mid-year hierarchy version change; out-of-list dimension values rejected | Test log | P15-R03, R13 | P15-TC04 |
| P15-AC04 | All four split methods produce exact expected shares on golden-02; invalid percentages rejected; zero basis never errors | Test log | P15-R04, R05 | P15-TC05, TC08 |
| P15-AC05 | Allocation invariant holds: property suites ≥ 10 000 cases each with zero failures; golden-01 totals equal expected exactly; `cost_allocated` identical on PG, DuckDB and ClickHouse | Property seeds and counts, golden diff, parity report | P15-R05, R17 | P15-TC06, TC07, TC10, TC11, TC16 |
| P15-AC06 | Rule-set lifecycle: published versions immutable, ETag conflicts rejected, preview diff correct and does not change `data_version` | Integration logs, audit excerpt | P15-R06, R07 | P15-TC12, TC13 |
| P15-AC07 | Effective-dated re-allocation and event-driven re-runs are idempotent and recorded in run history; failures leave previous allocation live | Run-history query output, event log | P15-R08, R09 | P15-TC14, TC15, TC17 |
| P15-AC08 | ABAC by hierarchy, dimension and tag returns zero out-of-scope rows across `/chargeback`, `/query` and previews; Cedar/SQL equivalence 100 %; zero cross-tenant leaks | Security test report | P15-R10 | P15-TC18, TC19, TC20 |
| P15-AC09 | Chargeback rows sum exactly to totals in each currency's minor unit; UJ-04 passes in Playwright with UI totals equal to API totals; axe zero serious/critical | Playwright trace and report, axe report | P15-R11, R18 | P15-TC09, TC23, TC25 |
| P15-AC10 | Unallocated cost visible with reason codes; golden-01 unallocated total equals expected | Screenshot + API output | P15-R12 | P15-TC10, TC24 |
| P15-AC11 | Authorization matrix fully positive/negative tested; rule ASTs reject SQL/regex abuse; injection payloads treated as data; all publishes audited | Matrix report, audit chain verify output | P15-R14, R15 | P15-TC21, TC22, TC12 |
| P15-AC12 (S) | Performance targets met on reference hardware, or deviation documented with a plan | Benchmark report with hardware spec | P15-R16 | P15-TC26 |

## Exit gate
- All M criteria met; zero open billing-accuracy defects in allocation; zero open critical/high security findings for this phase.
- Phase 13 parity suite still green with allocation cases added.
- DATABASE_SCHEMA.md, EVENTS.md (new `allocation.run.failed.v1`) and OpenAPI updated.
- Completion checklist in [README.md](README.md) fully ticked. Work stops at the phase boundary.

## Known limitations (planned)
- Allocation runs in billing currency; reporting-currency chargeback depends on Phase 18 FX.
- No GL/journal export (Phase 29). No period locking (Phase 30): until then, publishes may re-allocate any past period.
- Kubernetes-level splits are out of scope (Phase 20/22).
- Principals with hierarchy/dimension-restricted scopes cannot query raw `cost_focus` dimensions that exist only pre-allocation.

## Sign-off
| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Product owner | | | | |
| Architecture | | | | |
| Finance SME | | | | |
| Security | | | | |
| QA lead | | | | |
