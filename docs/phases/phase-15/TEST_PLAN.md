# Phase 15 Test Plan

## Environments
| Env | Description |
|---|---|
| `unit` | `go test` and Vitest, no external services |
| `it-pg` | Testcontainers PostgreSQL 16 (control plane + PG analytics) |
| `it-ch` | Testcontainers ClickHouse (version pinned in Phase 13) |
| `it-duck` | In-process DuckDB |
| `e2e` | Docker Compose Lite + fixture connectors, Playwright (Chromium, Firefox) |
| `perf` | Standard reference hardware (OQ-13) |

## Fixtures
- `tests/fixtures/allocation/golden-01/`: 3 providers, 2 periods, USD/EUR/JPY/BHD, credits and refunds, 12 % untagged rows, tag variants (`CostCenter`, `cost-center`, `COST_CENTER`), 3 shared pools. Expected `cost_allocated` totals in `expected.csv` computed independently and reviewed by the Finance SME.
- `golden-02/`: pathological splits (1 cent over 3 receivers, 1e-12 over 7, negative pool, zero basis).
- `hierarchy-v1.json`, `hierarchy-v2.json`: hierarchy change mid-year.
- `tenants-ab/`: two tenants with overlapping node keys and tag values.

## Test cases
| ID | Type | Description | Fixtures | Expected result | Covers |
|---|---|---|---|---|---|
| P15-TC01 | unit | Tag key normalization: case, `-`/`_`/space variants and aliases collapse to one key; conflicting values on two raw keys resolved by rule order | inline | Deterministic normalized key/value | P15-R01 |
| P15-TC02 | unit | Value mapping: exact, `in`, case-insensitive, RE2 regex; regex > 512 chars and backtracking pattern rejected by validator | inline | Correct mapping; validation errors with pointers | P15-R01, R15 |
| P15-TC03 | unit | Inheritance precedence; explicit resource tag never overwritten; missing parent scope | `cloud_scopes` fixture | Inherited value from nearest ancestor | P15-R02 |
| P15-TC04 | unit | Hierarchy/dimension assignment first-match-wins, disabled rules ignored, hierarchy version chosen by period | hierarchy-v1/v2 | Expected node per row per period | P15-R03, R13 |
| P15-TC05 | unit | Split methods even/fixed/proportional_cost/proportional_metric on golden-02 | golden-02 | Exact expected shares including residual placement | P15-R04, R05 |
| P15-TC06 | unit (property) | For random pools (−1e9…1e9, scale 12), 1–500 receivers, random weights: Σ shares == pool; each share within 1e-12 of exact rational; result independent of receiver input order | rapid generators | Property holds for ≥ 10 000 cases per CI run, seed logged | P15-R05 |
| P15-TC07 | unit (property) | Whole-pipeline invariant: random cost rows + random valid rule sets ⇒ Σ allocated + Σ unallocated == Σ source per (currency, metric); Σ allocation_share per row == 1 | rapid generators | Property holds; shrunk counterexample reported on failure | P15-R05 |
| P15-TC08 | unit | `fixed_percentage` summing to 99.99 or 100.01 rejected; zero basis uses fallback; division by zero impossible | inline | 422 / fallback applied | P15-R04 |
| P15-TC09 | unit | Minor-unit report rounding (USD 2, JPY 0, BHD 3): chargeback rows sum exactly to totals | golden-01 | Equal sums | P15-R11 |
| P15-TC10 | integration | Golden dataset end-to-end on PG: normalize fixture → publish rule set → `cost_allocated` totals equal `expected.csv` exactly | golden-01 | Exact equality | P15-R05, R09 |
| P15-TC11 | contract | Cross-engine parity of `cost_allocated` rows and 40 chargeback/semantic queries on PG, DuckDB, ClickHouse | golden-01 | Decimal string equality on all engines | P15-R17 |
| P15-TC12 | integration | Publish lifecycle: draft ETag conflict (412), publish supersedes previous, published rule set immutable (409), checksum stable for same canonical JSON | it-pg | As described; audit events written | P15-R06, R14 |
| P15-TC13 | integration | Preview diff: moved rows, deltas, `rule_never_matched`/`rule_shadowed`/overlap warnings; live data and `data_version` unchanged after preview | golden-01 | Diff matches expected; data_version unchanged | P15-R07 |
| P15-TC14 | integration | Effective dating: publish with `effective_from=2026-02-01` re-runs Feb+ only; Jan untouched; run history rows created | golden-01 | Only expected periods have new runs | P15-R08 |
| P15-TC15 | integration | Idempotency: replay `cost.period.normalized.v1` twice and duplicate `allocation.published.v1` ⇒ one succeeded run per key, identical output hash | it-pg | Single live run; identical rows | P15-R09 |
| P15-TC16 | failure-injection | Invariant failure injected (corrupt one share) ⇒ swap aborted, previous allocation live, `allocation.run.failed.v1` emitted, no `cost.period.allocated.v1` | it-pg | Fail-closed behavior | P15-R05 |
| P15-TC17 | failure-injection | Worker killed between Append and Commit; restatement arrives mid-run (live-pointer CAS fails) | it-ch | Retry yields correct output; stale run discarded | P15-R09 |
| P15-TC18 | security | ABAC: user scoped to `descendant_of bu-retail` sees only retail nodes in `/chargeback`, `/query` and preview; `out_of_scope_delta` aggregate only; crafted filters (`hierarchy:… or 1=1`, other node keys) return no extra rows | golden-01 | Zero out-of-scope rows | P15-R10, R07 |
| P15-TC19 | security | Cedar decision vs compiled SQL predicate equivalence for 500 generated (scope, row) pairs on each engine | generators | 100 % agreement | P15-R10 |
| P15-TC20 | security | Cross-tenant: tenant A rule set cannot reference tenant B nodes/dimensions; IDs from B → 404; allocation worker for A never reads B partitions | tenants-ab | 404s; zero B rows | P15-R10, NFR-SEC-001 |
| P15-TC21 | security | Authorization matrix: each built-in role × each endpoint (positive and negative) | it-pg | Matches API_CONTRACTS §1 | P15-R14 |
| P15-TC22 | security | Injection payloads in tag values and rule names (`'; DROP`, `{{`, `</script>`, RTL, emoji) treated as data in evaluation, API and UI | inline | No execution; rendered escaped | P15-R15 |
| P15-TC23 | E2E | UJ-04: define tag normalization → shared-cost rule (split platform by cost) → preview → publish → chargeback per cost center; totals equal API and golden expected | Lite + golden-01 | Journey passes; UI totals == API totals | P15-R01, R04, R07, R11 |
| P15-TC24 | E2E | UJ-04 failure paths: overlapping rules warning, untagged cost visible in unallocated explorer with reasons, publish conflict on stale draft | Lite | Warnings and errors shown | P15-R12, R07 |
| P15-TC25 | E2E (a11y) | axe on allocation pages: zero serious/critical | Lite | 0 violations | P15-R18 |
| P15-TC26 | perf | 10 M rows/month, 200 rules, 5 splits on ClickHouse; preview 1 month | perf | ≤ 15 min run; ≤ 60 s preview | P15-R16 |
| P15-TC27 | unit | Static check: no `float32/float64` in `internal/allocation/...` | lint | Clean | NFR-ACC-003 |

## Planned commands (not yet runnable; no code exists)
```bash
go test ./internal/allocation/... -race -count=1                       # planned
go test ./internal/allocation/split/... -run Property -rapid.checks=10000   # planned
go test ./tests/integration/allocation/... -tags=integration             # planned
go test ./tests/contracts/analytics/... -run Allocation -engines=postgres,duckdb,clickhouse   # planned
pnpm --filter web exec playwright test tests/e2e/uj04-allocation.spec.ts # planned
k6 run tests/performance/allocation/preview.js                          # planned
golangci-lint run ./internal/allocation/...                              # planned
```
