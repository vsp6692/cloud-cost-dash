# Phase 01 — PRD, personas, acceptance criteria, licensing decision [LIC]: Acceptance

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

## Acceptance criteria

| ID | Criterion (Given / When / Then) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P01-AC01 | **Given** PER-01…PER-10, **when** validation completes, **then** each persona has ≥ 1 interview or documented proxy source and confirmed needs and journeys, and PER-09 states the commercial-license condition. | `PERSONA_VALIDATION.md` with anonymized evidence | P01-R01 | P01-TC01, TC02 |
| P01-AC02 | **Given** UJ-01…UJ-13, **when** reviewed, **then** each has a happy path, ≥ 1 critical failure path, a persona link and is confirmed automatable with fixtures. | Reviewed PRD §4; checklist | P01-R02 | P01-TC03 |
| P01-AC03 | **Given** the PRD, **when** `lint_ids.py --check unique,traceability` runs, **then** it exits 0; every FR/NFR has a unique frozen ID, priority and existing delivering phase; NG1…NG8 are confirmed; negative fixtures make the lint fail. | Lint output (command + exit code); non-goals checklist | P01-R03, R05 | P01-TC04…TC09 |
| P01-AC04 | **Given** AC-01…AC-11, **when** the acceptance matrix is built, **then** every AC maps to FR/NFR/UJ IDs and to the phase(s) producing evidence, with no unmapped AC. | `ACCEPTANCE_MATRIX.md`; lint output | P01-R04 | P01-TC10 |
| P01-AC05 | **Given** OQ-01…OQ-24, **when** the decision log is completed, **then** 24/24 have a row (decision, default accepted or deferred-with-trigger), with date and approver, and no v0.1-blocking OQ is deferred. | `OPEN_QUESTIONS.md` decision log; lint output | P01-R06 | P01-TC11, TC12 |
| P01-AC06 | Reference scale per profile and reference hardware (OQ-13) are fixed; NFR-PERF-001…003, NFR-AVL-001 and NFR-FRS-001 each have a complete, provisional SLO definition; NFR-PERF-003 and OQ-13 are consistent. | PRD §6/§8 diff; reviewer sign-off | P01-R07, R08 | P01-TC13, TC14 |
| P01-AC07 | The five planning artifacts exist and the traceability matrix contains 100% of FR/NFR IDs with phase and AC columns filled. | Files in `docs/planning/`; lint output | P01-R09, R10 | P01-TC15, TC16 |
| P01-AC08 | The DPIA outline and security NFR baseline are signed off by the privacy reviewer and security lead respectively. | `DPIA.md`; sign-off rows below | P01-R11, R12 | P01-TC17, TC18 |
| P01-AC09 | Markdown lint, offline link check and forbidden-wording lint exit 0 on the phase's final commit; the negative wording fixture fails as expected. | Command outputs with commit SHA | P01-R13 | P01-TC19…TC21 |
| P01-AC10 | [LIC] Counsel is engaged; LQ-1…LQ-12 submitted; OQ-21, OQ-23 and OQ-24 decided (or "direction decided, counsel approval pending" with owner and date); OQ-22 recommendation recorded; NFR-LIC-004 ratified and no scope change introduced. | `docs/legal/DECISIONS.md`; PRD diff | P01-R14, R15, R16, R19 | P01-TC22…TC24, TC27 |
| P01-AC11 | [LIC] Trademark search commissioned with a keep/rename decision or a dated deadline before Phase 03; repository confirmed private and "all rights reserved until approved"; publication-gate state recorded below. | Search order record; repo visibility screenshot or admin attestation | P01-R17, R18 | P01-TC25, TC26 |

## Publication gate state [LIC]
Reproduced from [LICENSING_EVALUATION.md §6](../../legal/LICENSING_EVALUATION.md#6-publication-gate). Phase 01 **does not** require the gate to pass; it requires its state to be recorded. The repository must not be made public and no release may be published until every item is checked.

- [ ] Counsel has approved LICENSE.md, CLA.md, Corporate CLA, COMMERCIAL_LICENSE.md, TRADEMARK_POLICY.md and LICENSE_FAQ.md
- [ ] Licensor legal name, contacts and governing law are completed (OQ-24)
- [ ] The LICENSE_MAP designation (OQ-22) is decided (formal designation in Phase 02)
- [ ] The CLA tooling is configured (Phase 03)
- [ ] License compliance CI is green (Phase 03; see [LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md))

## Exit gate
Phase 01 is **ACCEPTED** only when all of the following hold:
1. P01-AC01…P01-AC11 are met with the evidence listed, and every P01-TC in [TEST_RESULTS.md](TEST_RESULTS.md) has a real recorded result (no NOT RUN for an exit-required test).
2. PRD status is changed to "ratified baseline" and IDs are frozen.
3. Every required signatory below has recorded a decision.
4. CHANGELOG has a Phase 01 entry.
5. Work stopped at the phase boundary; Phase 02 has not begun without explicit approval.

Counsel's **final approval** of the license texts is **not** a Phase 01 exit criterion (it is a publication-gate item tracked to Phases 38–40), but counsel engagement and the OQ-21 direction are.

## Known limitations
- Persona validation may rely on proxy sources with limited statistical weight.
- SLO targets remain provisional until benchmarked on the reference hardware in Phase 34.
- License texts remain drafts; nothing is published.
- Links to documents being written by other workstreams (e.g. `docs/security/`, `docs/architecture/TRUST_BOUNDARIES.md`) may be temporarily unresolved and are listed in the link-check allow-list.

## Sign-off
| Role | Name | Date | Decision (accept / reject / accept with conditions) |
|---|---|---|---|
| Product owner | | | |
| Architecture lead | | | |
| Security lead | | | |
| Privacy reviewer | | | |
| Finance SME | | | |
| QA lead | | | |
| Licensor representative [LIC] | | | |
| Legal counsel (engagement confirmed) [LIC] | | | |
