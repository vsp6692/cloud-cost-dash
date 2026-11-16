# Phase 18: FX, commitments, unit economics, accounting calendars: Test Plan

Status: **NOT STARTED** · Release checkpoint: v0.3 · Spec status: DRAFT (no code exists)

## Environments and fixtures
- Unit/property: pure Go, no I/O. Integration: Testcontainers PostgreSQL + ClickHouse, in-process DuckDB. Contract: `tests/contracts/analytics` finance groups on all 3 engines.
- Golden datasets (expected values as decimal strings, compared as strings): `tests/fixtures/golden/fx_conversion/` (FX-1…FX-6 from DESIGN §3), `golden/commitments_{aws,gcp,azure}/` (CM-1…CM-8 plus provider-specific CUR 2.0 / GCP CUD credit / Azure amortized export rows), `golden/unit_cost/` (UC-1…UC-3), `golden/calendars/` (CAL-1 NRF 4-4-5 FY2023 53-week, gregorian April start, 4-5-4, 5-4-4; CAL-1 uses `fiscal_year_label = 'start'`).
- Recorded ECB XML (`tests/fixtures/fx/ecb/eurofxref-hist-2026-10.xml`) incl. a TARGET holiday; malformed variants.
- Two tenants (`tenant_a`, `tenant_b`) with overlapping commitment native IDs for isolation tests.

| ID | Type | Description | Fixtures | Expected | Covers |
|---|---|---|---|---|---|
| P18-TC01 | golden | Conversions FX-1…FX-6 | golden/fx_conversion | exact strings, e.g. FX-1 `1143.111111111111` EUR, FX-2 `780.000000000000` GBP | P18-R04, R01 |
| P18-TC02 | property | Inverse round trip: convert A→B→A differs from input by ≤ 1e-12 × magnitude; conversion is order-independent over row sets | generated | property holds 10 000 cases | P18-R04 |
| P18-TC03 | unit | Policy selection charge_date / month_end / month_average (`1.085000000000000000`) / provider | golden/fx_conversion | correct rate per policy; `meta.fx_policy` set | P18-R03 |
| P18-TC04 | unit (negative) | Missing rate beyond carry-forward; carry_forward_days=0 on Saturday | FX-5 | `422 fx_rate_missing` listing (date, pair); no partial totals | P18-R05 |
| P18-TC05 | unit (edge) | Carry-forward over TARGET holiday + weekend = 3 days with window 5 | ECB fixture | `carried_from` = last business day | P18-R05 |
| P18-TC06 | unit (negative) | Priority set lacks a date but lower set has it | two sets | fail closed; lower set not used for that pair | P18-R05 |
| P18-TC07 | integration | Upload CSV: valid; duplicate (date,pair); rate ≤ 0; bad ISO code; 60 MiB | fixtures/fx/upload_* | valid → draft set with checksum; others rejected whole (`validation_failed`/413) | P18-R02, R06 |
| P18-TC08 | integration | Activation is audited, bumps `data_version`, invalidates cached query | staging tenant | audit event `fx.rate_set.activated`; next query new `meta.fx_rate_set_id` | P18-R02, R18 |
| P18-TC09 | failure-injection | ECB endpoint 503, truncated XML, TLS failure | recorded responses | retries; no new version; active set unchanged; staleness alert after 3 days | P18-R06 |
| P18-TC10 | golden | Amortization CM-1…CM-4 incl. leap-year term | golden/commitments_* | hourly `0.100000000000`; October 3y = `744.000000000000` | P18-R10 |
| P18-TC11 | golden | Utilization/unused CM-5, CM-6, CM-8 per provider | golden/commitments_{aws,gcp,azure} | `0.750000000000`, unused `0.600000000000` / `2.500000000000` / `1.800000000000` | P18-R08 |
| P18-TC12 | golden | Coverage CM-7 by provider × region × sub-account | golden/commitments_aws | `0.800000000000` | P18-R09 |
| P18-TC13 | unit (edge) | committed = 0 → utilization null; eligible = 0 → coverage null | synthetic | `null` with reason, not 0 | P18-R08, R09 |
| P18-TC14 | integration | Divergence: derived fee differs from provider EffectiveCost by 0.02 in a month | golden variant | `commitment_amortization_divergence` finding; provider value used | P18-R10 |
| P18-TC15 | contract | Commitment inventory per provider from recorded API responses; permission denied → `source=billing` fallback; unknown ID → placeholder | providers/*/testdata/commitments | manifests satisfied; no mutating calls in recordings | P18-R07 |
| P18-TC16 | golden | Unit cost UC-1…UC-3, dimension-bound metric joined on `hierarchy:product` | golden/unit_cost | `0.250000000000`, `33.333333333333`, `null (zero_denominator)` | P18-R12 |
| P18-TC17 | integration | Unit values: 10 001 points rejected (413/422); replay same Idempotency-Key; partial CSV | fixtures/unit_metrics | idempotent upsert per (metric,date,dim); rejected sample file | P18-R11 |
| P18-TC18 | security | CSV with `=HYPERLINK(…)`, zip bomb, UTF-8 BOM, RTL text | fixtures/unit_metrics/malicious | stored as data; export escaped; bomb rejected | P18-R11 |
| P18-TC19 | golden | Calendar generation CAL-1 + gregorian/4-5-4/5-4-4 FY sets | golden/calendars | FY2023 371 days; P3 2024-03-31..2024-05-04 | P18-R13 |
| P18-TC20 | property | For any definition and 20 FYs: periods contiguous, non-overlapping, 52/53 weeks, quarter = 13/14 weeks | generated | holds | P18-R13 |
| P18-TC21 | integration (negative) | Activate calendar overlapping a closed period | closed period fixture | `409 period_closed`; no change | P18-R15 |
| P18-TC22 | contract | Fiscal grains + FX conversion + unit cost parity across PG/DuckDB/ClickHouse (40 queries) | golden sets loaded per engine | identical decimal strings | P18-R14 |
| P18-TC23 | cross-tenant | Tenant B reads A's rate set, commitment, unit metric, calendar by ID; crafted filters | two tenants | 404; no rows; shared ECB visible read-only; B cannot write shared set | P18-R16 |
| P18-TC24 | security | Role matrix: developer cannot `fx:manage`; ABAC limits commitments to scoped accounts | role fixtures | 403/filtered | P18-R16 |
| P18-TC25 | unit (static) | Float lint over `internal/finance/**`, semantic currency stage | source tree | zero findings | P18-R17 |
| P18-TC26 | e2e | UJ-07 partial: commitments page shows coverage/utilization and amortized vs billed toggle | Playwright, fixture connectors | values equal golden | P18-R08, R09 |

## Planned commands (planned)
`go test ./internal/finance/... ./providers/.../commitments/...` · `make test-contracts ENGINE=all GROUP=finance` · `make lint-floats` · `pnpm --filter web test:e2e -- commitments`
