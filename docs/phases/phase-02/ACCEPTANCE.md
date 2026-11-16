# Phase 02 — Architecture, ADRs, extension contracts [LIC: ADR-0015, license map]: Acceptance

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

No criterion is met today. Acceptance requires recorded evidence in [TEST_RESULTS.md](TEST_RESULTS.md).

## Acceptance criteria

| ID | Criterion | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P02-AC01 | Every ADR-0001…0014, 0016, 0017 has a decided status with deciders and date, each backed by a completed DR-ADR checklist; ADR-0018/0019 stubs exist | ADR files, review record, status lint output | P02-R01, P02-R07 | TC01, TC02 |
| P02-AC02 | [LIC] ADR-0015 is Accepted with a recorded counsel review, **or** remains "Proposed (requires legal review)" with an owner and target date; never Accepted without counsel | DECISIONS.md entry, ADR-0015 status, negative lint run | P02-R02 | TC03 |
| P02-AC03 | Architecture documents are RATIFIED or list blockers with owning phase; module rules are encodable; deployment profiles consistent with NFR-AVL-001 | review record, doc status lines | P02-R03, P02-R04, P02-R06 | TC04, TC05 |
| P02-AC04 | OQ-02, 05, 06, 14, 15 have decision-log rows and matching ADR text | OPEN_QUESTIONS decision log | P02-R05 | TC06 |
| P02-AC05 | Threat model reviewed for TB-01…TB-12 with no unmitigated high residual risk; SEC-*/AZ-* controls mapped to phases; security lead signature | THREAT_MODEL review section, signed residual-risk table | P02-R08, P02-R09 | TC07, TC08, TC09 |
| P02-AC06 | **Given** the DDL in DATABASE_SCHEMA.md, **when** applied to a throwaway PostgreSQL, **then** it applies cleanly, and findings F-01…F-09 are closed or assigned with resolutions | DDL smoke log (failing-before and passing-after), review record | P02-R10 | TC10, TC11 |
| P02-AC07 | API conventions and event envelope frozen at `frozen-v0.1`; OpenAPI lints with 0 errors; every operation's `x-phase` is consistent with the phase plans | FREEZE_v0.1.md, lint outputs | P02-R11, P02-R12, P02-R13 | TC12–TC15 |
| P02-AC08 | Provider SDK, capability manifest and compatibility policy reviewed at `draft-v0` with the read-only, no-DB, classified-error and determinism rules ratified | review checklist | P02-R14 | TC16 |
| P02-AC09 | [LIC] LICENSE_MAP designation recorded (OQ-22 decision or documented default with owner/deadline); plugin licensing and import boundary confirmed for Phase 03 | LICENSE_MAP status, DECISIONS.md | P02-R15, P02-R16 | TC17, TC18 |
| P02-AC10 | Doc lints pass (markdown, links, IDs, ADR status, wording); no license-enforcement element in the architecture | lint outputs, review note | P02-R17, P02-R18 | TC19–TC23 |

## Exit gate
1. P02-AC01…AC10 met with evidence; every P02-TC has a real result.
2. No ADR is left *Proposed* without a recorded reason (only ADR-0015 may remain pending counsel).
3. Schema DDL applies cleanly (F-01 fixed) before Phase 04 begins.
4. Freeze manifest published and referenced by Phase 03–08 API_CONTRACTS.
5. CHANGELOG updated; sign-offs recorded; Phase 03 not started without explicit approval.

## Known limitations
- Counsel's position on ADR-0015 and OQ-22 may still be pending; defaults keep the repository private and all rights reserved and make the later switch a configuration change.
- Provider quota and pricing figures in [docs/providers/](../../providers/README.md) are informative and must be re-verified when each connector is implemented.
- Threat model review is a design review only; controls are verified by tests from Phase 03 onward and by the Phase 34 penetration test.
- The SDK remains `draft-v0`; first-party providers in Phases 06–08 may require additive changes.

## Sign-off
| Role | Name | Date | Decision |
|---|---|---|---|
| Architecture lead | | | |
| Security lead | | | |
| Data / DB reviewer | | | |
| Finance SME | | | |
| QA lead | | | |
| Licensor representative [LIC] | | | |
| Legal counsel (ADR-0015, OQ-22) [LIC] | | | |
| Product owner | | | |
