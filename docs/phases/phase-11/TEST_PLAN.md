# Phase 11 — Test Plan

## Environments
| Env | Description |
|---|---|
| `unit` | Go unit tests, no external services |
| `int-pg` | Testcontainers PostgreSQL 16 (control plane + PG analytics schema) + MinIO |
| `ci-contract` | Provider compatibility testkit against bundled fixtures |
| `perf-lite` | Lite reference box (OQ-13, TBD), PG analytics |

## Fixtures and golden datasets
- `tests/fixtures/golden/focus/aws/` — CUR 2.0 Parquet for 2 billing periods × 3 linked accounts: usage, RI and Savings Plan amortization (EffectiveCost ≠ BilledCost), refunds, credits, tax, marketplace, a correction for a prior period, EUR and USD payer.
- `…/gcp/` — detailed export rows incl. credits array (sustained use, committed use, promotions), tax, label keys with mixed case, late rows by `export_time`.
- `…/azure/` — actual and amortized exports (EA and MCA shapes), reservation purchase and amortization, FOCUS export for the same period.
- `…/generic/` — CSV/XLSX/Parquet with mapping template, rows without line IDs including two byte-identical lines.
- Each folder has `expected_totals.json` (decimal strings) produced from the source with an independent script (`scripts/fixtures/sum_source.py`, not the normalizer), reviewed by the Finance SME.
- `tests/fixtures/focus/conformance/` — one bad file per rule.

## Test cases

| ID | Type | Description | Fixtures | Expected result | Covers |
|---|---|---|---|---|---|
| P11-TC01 | unit | Column registry matches pinned FOCUS spec column list, types, required flags | registry JSON vs spec extract | Exact set equality; generator output stable | P11-R01, R02 |
| P11-TC02 | integration | Golden totals AWS: Σ BilledCost/EffectiveCost/ListCost/ContractedCost per (period, account, sub-account, currency, charge category, charge class) | golden/aws | Exact decimal string equality to expected_totals | R03, R11 |
| P11-TC03 | integration | Golden totals GCP incl. credits as Credit lines | golden/gcp | Exact equality | R03, R11 |
| P11-TC04 | integration | Golden totals Azure actual vs amortized; FOCUS export path matches within documented known deltas list (empty expected for totals) | golden/azure | Exact equality; deltas file explains any per-column difference | R03, R11 |
| P11-TC05 | integration | Golden totals generic import | golden/generic | Exact equality | R11 |
| P11-TC06 | unit | ChargeClass=Correction set only for prior-period corrections | aws correction rows | Correction rows flagged; others NULL | R03 |
| P11-TC07 | unit | Every unmapped source column appears in `x_raw`; every `x_` column name valid | each provider fixture | No source field lost; names match `^x_[A-Za-z0-9]+` | R04 |
| P11-TC08 | integration | Lineage columns populated and resolvable to `source_objects` row | golden/* | 100% rows have run, object, row, mapping_version | R13 |
| P11-TC09 | unit | Published mapping is immutable (DB trigger + service) | mapping row | UPDATE rejected; API 409 `mapping_not_draft` | R05 |
| P11-TC10 | integration | Activate v+1 with renormalize for 2 periods → new period_version, old version retained and queryable by version | golden/aws, mapping v3→v4 | 2 new versions; v_old rows intact; event carries mapping_version=4 | R06, R18 |
| P11-TC11 | failure-injection | Renormalize when raw objects expired | delete raw objects | Period reported `raw_unavailable`; live version unchanged | R06 |
| P11-TC12 | unit (property) | Tag normalization: idempotent (`n(n(k)) = n(k)`), deterministic, `CostCenter`/`cost-center`/` cost_center ` → `cost_center` | generated keys incl. Unicode, emoji, RTL | Properties hold over 10 000 cases | R07 |
| P11-TC13 | unit | Tag collision policy picks smallest raw key; DQ counter incremented | row with `Env` and `env` | Deterministic winner; `x_tag_collisions` set | R07 |
| P11-TC14 | integration | Scope→hierarchy assignment overlap rejected; effective-dated lookup returns correct node per day | hierarchy fixture | 409 on overlap; correct node across boundary date | R08 |
| P11-TC15 | integration | Custom dimension CRUD; delete in-use dimension | dimension fixture | CRUD ok; `409 dimension_in_use` (stubbed reference) | R08 |
| P11-TC16 | unit (property) | Dedup keys stable across replays and row order permutations | golden/* shuffled | Identical key multiset | R09 |
| P11-TC17 | unit | Two byte-identical lines without line ID both kept with ordinals 0,1 | generic dupes | 2 rows, distinct keys; totals match | R09, R11 |
| P11-TC18 | integration | Same file delivered twice → single source object, no duplicate rows | generic file ×2 | Row count unchanged | R09 |
| P11-TC19 | unit | Conformance validator: each bad fixture fails exactly its rule | conformance/* | One failure per file, correct rule id | R10 |
| P11-TC20 | integration | Partition validation failure blocks swap; previous version stays live | aws with tampered totals | Run `failed_validation`; live pointer unchanged; health alert queued | R10 |
| P11-TC21 | contract | Provider testkit Billing group uses validator on AWS/GCP/Azure fixtures | testkit | All pass | R10 |
| P11-TC22 | unit | Source value with 14 fractional digits → reject (default) or half-even with DQ count when mapping declares | crafted rows | Behavior per mapping; counts in DQ | R12 |
| P11-TC23 | static | Lint forbids `float32/float64` in `internal/billing/...` | seeded violation in test branch | Lint fails on violation, passes on main | R12 |
| P11-TC24 | security | Cross-tenant: tenant B reads/activates tenant A mapping, assignment, conformance report | two tenants | 404 everywhere; audit `authz.denied` | R14 |
| P11-TC25 | security | RLS catalog test covers new tables | migrations | RLS enabled+forced on all | R14 |
| P11-TC26 | security | Malicious mapping: deep nesting, huge literals, catastrophic regex, field ref outside row | crafted drafts | 422 at validate or bounded runtime error; no hang (> 1 s per row fails test) | R15 |
| P11-TC27 | security | Injection payloads in tag keys/values (`'; DROP`, `{{`, `</script>`) stored verbatim and normalized key sanitized | crafted rows | Stored as data; no SQL error; key `drop` etc. | R15 |
| P11-TC28 | integration | Audit events for publish/activate/renormalize/assignment changes | API calls | Events present with actor and targets; hash chain valid | R16 |
| P11-TC29 | contract | `cost.period.normalized.v1` and new events validate against JSON Schemas | producer tests | Valid | R18 |
| P11-TC30 | perf | Normalization throughput vs Phase 06 baseline on PG | 5 M-row synthetic CUR | ≤ 10% regression | R17 |
| P11-TC31 | unit | Hierarchy change bumps data_version without re-normalization | assignment change | data_version+1; cost_focus untouched | R08 |

## Planned commands (not yet run)
```bash
make test-unit PKG=./internal/billing/... ./internal/tenants/dimensions/...      # planned
make test-integration TAGS=pg PKG=./internal/billing/...                         # planned
go test ./sdk/provider/testkit/... -run TestProviderCompatibility -provider=./providers/aws  # planned (repeat gcp, azure)
make test-golden SUITE=focus                                                     # planned
make lint                                                                        # planned (includes float rule)
make test-security SUITE=isolation,mapping-sandbox                               # planned
make bench SUITE=normalize PROFILE=lite                                          # planned
```

## Explicit coverage: FR-NRM-004

| Test ID | PRD requirement | Scenario and expected result |
|---|---|---|
| P11-TC95 | FR-NRM-004 | Re-normalize the same source under mapping v2; assert v1 remains queryable and lineage resolves both versions without double counting. |
