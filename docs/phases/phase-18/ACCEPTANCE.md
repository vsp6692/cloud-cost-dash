# Phase 18: FX, commitments, unit economics, accounting calendars: Acceptance

Status: **NOT STARTED** · Release checkpoint: v0.3 · Spec status: DRAFT (no code exists)

| ID | Criterion (measurable) | Evidence required | Requirements | Test cases |
|---|---|---|---|---|
| P18-AC01 | All FX golden conversions match exactly (string compare) and no float type in finance paths | TC01/02 logs, float-lint report | P18-R01, R04, R17 | TC01, TC02, TC25 |
| P18-AC02 | Rate sets are immutable, versioned and carry provenance + checksum; invalid uploads leave no partial set | integration logs, DB inspection | P18-R02, R06 | TC07, TC09 |
| P18-AC03 | Every converted response states rate set and policy; activation bumps data_version | API captures | P18-R03, R18 | TC03, TC08 |
| P18-AC04 | 100% of missing-rate cases fail closed with `fx_rate_missing` | test logs | P18-R05 | TC04–TC06 |
| P18-AC05 | Commitment inventory passes contract fixtures for all 3 providers incl. permission-denied fallback | contract report | P18-R07 | TC15 |
| P18-AC06 | Utilization and coverage golden values exact per provider; zero denominators → null | golden diff | P18-R08, R09 | TC11–TC13 |
| P18-AC07 | Amortization golden exact; divergence > 0.01 produces a finding | golden diff, finding sample | P18-R10 | TC10, TC14 |
| P18-AC08 | Unit-metric ingestion idempotent and limits enforced; malicious CSV inert | integration + security logs | P18-R11 | TC17, TC18 |
| P18-AC09 | `unit_cost` golden exact, null semantics documented | golden diff | P18-R12 | TC16 |
| P18-AC10 | Calendar golden sets exact; properties hold; closed-period guard enforced | test logs | P18-R13, R15 | TC19–TC21 |
| P18-AC11 | Finance contract group passes on PG, DuckDB, ClickHouse | CI matrix | P18-R14 | TC22 |
| P18-AC12 | Zero cross-tenant leaks; role/ABAC matrix passes | security report | P18-R16 | TC23, TC24 |

## Exit gate
- All M requirements' ACs met; S requirements (unit metrics, calendars) met or explicitly deferred with product-owner sign-off.
- Zero open billing-accuracy defects; zero critical/high security findings.
- TEST_RESULTS.md filled from real runs; FINANCE_RECONCILIATION.md, DATABASE_SCHEMA.md, EVENTS.md, OpenAPI updated; CHANGELOG entry.

## Known limitations
- Provider commitment APIs are entitlement- and agreement-dependent (PRD A1); billing-derived inventory lacks fees for some types.
- No intraday FX; fiscal boundaries are UTC dates (tenant timezone is display-only).
- UJ-07 purchase recommendations deferred to Phase 25.

## Sign-off
| Role | Name | Decision | Date | Evidence link |
|---|---|---|---|---|
| Phase owner | | | | |
| QA lead | | | | |
| Security reviewer | | | | |
| Finance SME | | | | |
| Product owner | | | | |
