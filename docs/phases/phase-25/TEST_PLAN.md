# Phase 25 — Test plan

Environments: unit tests (pure Go), integration tests (Testcontainers PostgreSQL + ClickHouse with golden datasets), contract tests (OpenAPI), and E2E tests (Playwright against fixture-backed connectors). Fixtures live in `tests/fixtures/recommendations/p25/`. Every fixture is deterministic and uses exact decimal strings. Planned commands are in [IMPLEMENTATION.md](IMPLEMENTATION.md).

| ID | Type | Description | Fixtures | Expected | Req |
|---|---|---|---|---|---|
| P25-TC01 | Unit (golden) | Worked example §5.3 (R1 reshape, R2 ARM alternative, R3 schedule) | `golden/i-0abc.json` | net R1 = 140.160000000000, R2 = 0 (alternative), R3 = 90.240000000000; Σ 230.40 ≤ 280.32 | R02–R04 |
| P25-TC02 | Unit | Eliminate wins over reshape and schedule in the same group | idle VM + rightsizing + schedule | eliminate net = C_m; others 0 / alternative | R02 |
| P25-TC03 | Unit | Exclusive-key tie-break: equal scores → rule_id asc → fingerprint asc | two equal-score shape candidates | deterministic winner | R03 |
| P25-TC04 | Property | INV-1 Σ net(r) ≤ S\*(r) over random candidate sets (1–12 per resource, random classes and keys) | rapid generators | holds for ≥ 10 000 cases | R06 |
| P25-TC05 | Property | INV-3 0 ≤ net ≤ gross | same | holds | R06 |
| P25-TC06 | Property | INV-4 permutation invariance of input order | shuffled inputs | identical nets, groups and run hash | R06 |
| P25-TC07 | Property | INV-6 idempotence: resolving the output again changes nothing | — | identical | R06 |
| P25-TC08 | Property | INV-7 monotonicity: adding a candidate never increases the group's Σ net | — | holds | R06 |
| P25-TC09 | Property | INV-2 pool: Σ net ≤ S\*(pool); sizing ≤ p10 of the projected series | random hourly series + resource deltas | holds | R06, R08 |
| P25-TC10 | Unit | Inflexible RI fully covers the target, with no other matching usage → rightsizing net 0 for covered hours; evidence links REC-COM-003 | `ri_covered.json` | net 0.00; evidence flag set | R05 |
| P25-TC11 | Unit | Partially covered resource → only the on-demand share counts | 60% covered | net = 40% of the uncovered computation | R05 |
| P25-TC12 | Integration | Commitment sized on the projected series (post-rightsizing), not the historical one | pool 10 000.00 → 9 769.60 | `c` matches the projected p10; evidence shows both series | R08 |
| P25-TC13 | Unit | Hourly savings formula penalizes under-utilization hours | series with nightly dips below the commitment | savings = Σ_h(min(E_h, c/(1−d)) − c) exact | R08 |
| P25-TC14 | Integration | Pool model per provider type: AWS CSP/ISP/RI size flexibility, GCP resource/spend CUD, Azure reservation ISF group/savings plan | `pools/{aws,gcp,azure}/*.json` | coverage order and eligibility match expected tables | R07 |
| P25-TC15 | Unit | REC-COM-003 < 90% for 14 days; REC-COM-004 expiring ≤ 60 days labeled avoidance and excluded from savings totals | commitments fixtures | emitted; summary excludes avoidance | R09, R14 |
| P25-TC16 | Unit | REC-REG-001 informational (gross 0); suppressed by a residency tag | resource with `data-residency=eu` | no candidate; otherwise gross 0, range in evidence | R10 |
| P25-TC17 | Unit | REC-REG-002 only when an ARM equivalent exists in-region; unknown OS architecture support → confidence ≤ 0.6 | catalog with/without m7g in region | emitted/suppressed; cap applied | R10 |
| P25-TC18 | Unit | REC-LIC-001 without a declaration → `data_gap`, no candidate; with a declaration → net capped by declared cores | license fixtures | as stated | R11 |
| P25-TC19 | Unit | REC-LIC-002 high risk; confidence ≤ 0.5 when feature usage is unobservable | SQL EE 8 cores | risk high | R11 |
| P25-TC20 | Unit | REC-GOV-001/002/003 savings 0, kind governance, affected spend in evidence | allocation/budget fixtures | as stated | R12 |
| P25-TC21 | Unit | Determinism of every new rule: two runs → identical candidates and evidence hash | all P25 fixtures | equal | R13 |
| P25-TC22 | Failure injection | Resolver forced to violate INV-1 (fault hook) → run `failed_validation`, previous nets remain, alert raised | — | no rows changed | R06, R16 |
| P25-TC23 | Integration | `overlap_resolution_runs` reproducibility: re-run from stored input hash → identical output hash | — | equal | R16 |
| P25-TC24 | Static | No `float32/float64` in `internal/recommendations/{overlap,pools,rules}` | lint rule | 0 findings | R17 |
| P25-TC25 | Contract | Summary returns Σ net only; schema has no gross aggregate; `meta.basis = net_after_overlap` | OpenAPI | conforms | R14 |
| P25-TC26 | Security (ABAC) | User scoped to account A: summary and overlap endpoints exclude account B members; pool spanning A+B → 404 | AZ scope fixtures | no B data, no partial sums | R18 |
| P25-TC27 | Security (cross-tenant) | Tenant B requests tenant A's recommendation, pool or declaration IDs | two tenants | 404 for all | R18 |
| P25-TC28 | Contract / negative | Simulator: amount ≤ 0, unknown term → 422; simulator creates no rows (DB row count unchanged) | — | as stated | R15 |
| P25-TC29 | Security | License declaration change requires `license_declarations:manage`, `If-Match`; audited | roles matrix | 403/412 negative cases; audit row | R11 |
| P25-TC30 | E2E (UJ-07) | Coverage/utilization → amortized vs billed → purchase recommendation net of existing commitments; overlap panel shows alternatives | fixture tenant | journey passes; axe-core clean | R19 |

## Explicit coverage: FR-REC-004

| Test ID | PRD requirement | Scenario and expected result |
|---|---|---|
| P25-TC97 | FR-REC-004 | Combine rightsizing, shutdown and commitments on one resource/pool; assert combined net savings cannot exceed eligible baseline and the mutually exclusive alternatives are explained. |
