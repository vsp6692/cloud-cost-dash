# Phase 13 Acceptance

| ID | Criterion (measurable) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P13-AC01 | All three adapters selectable by config; migrations apply cleanly and idempotently on each engine; Phase 06 PG data preserved with identical control totals. | CI logs per engine; migration output; totals diff = empty | R01, R15 | TC30 |
| P13-AC02 | No analytics SQL outside `internal/analytics/adapter/*` (arch-lint green); registries contain required metrics. | lint report; registry listing | R02, R03 | TC01, TC04 |
| P13-AC03 | Parity suite: 100% of ≥ 200 queries return byte-identical decimal strings vs. the reference evaluator on PG, DuckDB and ClickHouse, on amd64 and arm64; rounding and overflow fixtures agree. | parity report artifact with query count and engine matrix | R04, R05, R12 | TC05–TC10 |
| P13-AC04 | Zero cross-tenant or out-of-scope rows across the isolation and injection suites on all engines; RLS/row-policy catalog checks pass. | security test report; reviewer sign-off | R06, R07, R13 | TC15–TC21 |
| P13-AC05 | Swap atomicity: no mixed reads in 10 000 concurrent observations; failure injection leaves prior version live; data version increments exactly once per commit. | test logs | R08 | TC11–TC14 |
| P13-AC06 | Each limit violation yields its documented typed error; engine outage yields 503 with Retry-After and no fallback. | test logs | R09, R18 | TC25, TC26 |
| P13-AC07 | Cache never serves stale data after swap and never shares entries across tenants or scopes (property test 1M samples). | test logs | R10 | TC22–TC24 |
| P13-AC08 | `/query` and `/semantic/catalog` conform to OpenAPI; `meta` complete; catalog scope-filtered. | contract test report; oasdiff | R11, R14 | TC27–TC29 |
| P13-AC09 | Spans/metrics present; no tenant label on metrics; no cost values in INFO logs. | trace screenshot/export; log test | R16 | TC31 |
| P13-AC10 | Baseline benchmark recorded for all engines; PG Lite p95 ≤ 5 s or a documented gap with an owner (non-gating). | benchmark report | R17 | TC32 |

## Exit gate
Phase 13 is ACCEPTED when AC01–AC09 are met with recorded evidence in [TEST_RESULTS.md](TEST_RESULTS.md), AC10 is recorded, the security reviewer signs off, there are no open critical/high defects or billing-accuracy defects in `internal/analytics`, and the [completion checklist](README.md#completion-checklist) is complete.

## Known limitations (planned)
- `currency: reporting` limited to single-currency scopes until Phase 18 (FX).
- `allocated_effective_cost` returns `unsupported_query` until Phase 15.
- Gregorian grains only; accounting calendars in Phase 18.
- Single-node ClickHouse only; clustering in Phase 33. Reference-scale SLO gating in Phase 34.
- Switching engines requires re-normalization of history; no live dual-write.
- In-process cache is per API replica (hit rate drops with more replicas); shared backend optional.

## Sign-off
| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Phase owner | | | | |
| Architecture | | | | |
| Security | | | | |
| QA lead | | | | |
| Finance SME (decimal/rounding) | | | | |

| Criterion | PRD requirement | Evidence | Status |
|---|---|---|---|
| P13-AC96 | FR-ANL-001 | Executed P13-TC96; Load the same golden dataset into PostgreSQL, DuckDB and ClickHouse; compare decimals, ordering, nulls, currency partitions and tenant predicates. | NOT VERIFIED |
