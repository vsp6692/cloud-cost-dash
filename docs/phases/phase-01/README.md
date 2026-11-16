# Phase 01 — PRD, personas, acceptance criteria, licensing decision [LIC]: Overview

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

| Field | Value |
|---|---|
| Release checkpoint | v0.1 (phases 01–05) |
| Depends on | none (first phase) |
| Primary PRD scope | all FR-*/NFR-* (baseline), AC-01…AC-11, UJ-01…UJ-13, PER-01…PER-10, OQ-01…OQ-24 |
| Primary verification | Requirements review sign-off + documentation lint |
| Code produced | **None.** Phase 01 is a review, validation and decision phase. |

## Goal
Turn the existing **draft** PRD and planning documents into a **ratified, frozen requirements baseline** that every later phase can trace to, and make the licensing decision that gates any publication. At exit, requirement IDs are frozen (stable, never reused), acceptance criteria have a baseline, every blocking open question is closed (decided, or default explicitly accepted), the reference scale and SLOs are confirmed, a privacy DPIA outline exists, and qualified legal counsel has been engaged with a recorded licensing direction.

## Scope
1. **Persona validation**: validate PER-01…PER-10 ([PRD §3](../../product/PRD.md#3-personas)) through interviews or documented proxy validation (practitioner reviews, FinOps Foundation community material, existing support or issue data). Record evidence per persona.
2. **User journey review**: confirm UJ-01…UJ-13, their happy paths and critical failure paths, since each becomes a Playwright E2E scenario (AC-09).
3. **Requirement ID freeze**: every FR-*/NFR-* has a unique ID, priority (M/S/C) and delivering phase. IDs are frozen: they may be deprecated, never renumbered or reused.
4. **Acceptance-criteria baseline**: AC-01…AC-11 ratified, each mapped to FR/NFR/UJ IDs and to a verifying phase.
5. **Open questions**: OQ-01…OQ-24 ([OPEN_QUESTIONS.md](../../product/OPEN_QUESTIONS.md)) each receive a decision row (decision or "default accepted") with date and approver. Blocking items for v0.1 must be closed; items blocking later phases may accept the default with a re-evaluation trigger.
6. **Reference scale and SLOs**: confirm PRD §8 sizing and the targets in NFR-PERF-001…003, NFR-AVL-001, NFR-FRS-001. Fix the reference hardware (OQ-13) **in this phase**, resolving the conflict that NFR-PERF-003 says "reference hardware TBD in Phase 01" while OQ-13 lists Phase 34 as blocking.
7. **Privacy**: a DPIA outline (`docs/product/DPIA.md`) supporting NFR-PRIV-001.
8. **[LIC] Licensing decision**: engage qualified legal counsel; submit LQ-1…LQ-12 ([LICENSING_EVALUATION.md §5](../../legal/LICENSING_EVALUATION.md#5-questions-for-legal-counsel)); decide OQ-21 (custom CL-SAL-1.0 vs. PolyForm Internal Use 1.0.0 + additional permission), obtain counsel's recommendation on OQ-22 (Plugin Interfaces license; formal LICENSE_MAP designation confirmed in Phase 02), OQ-23 (CLA terms), OQ-24 (Licensor entity, contacts, governing law) and OQ-01 (trademark clearance). The repository stays **private and all rights reserved** until the [publication gate](../../legal/LICENSING_EVALUATION.md#6-publication-gate) is satisfied.
9. **Planning artifacts**: create the documents the PRD already links to but which do not exist yet: `docs/planning/TRACEABILITY_MATRIX.md`, `ACCEPTANCE_MATRIX.md`, `RISK_REGISTER.md`, `RELEASE_PLAN.md`, `DEPENDENCY_GRAPH.md`.
10. **Doc lint tooling**: `scripts/docs/lint_ids.py` (ID uniqueness, traceability completeness, forbidden wording), plus markdown and link checks.

## Out of scope
- Any application code, Makefile, CI, Go module or Next.js scaffold (Phase 03).
- ADR ratification, threat-model review and contract freeze (Phase 02). Phase 01 may flag ADR issues but does not change ADR status.
- Final, counsel-approved license publication (Phase 40). Phase 01 records the **direction** and counsel engagement; it does not publish.
- Making the repository public. Forbidden until the publication gate is complete.
- Changing product scope because of licensing. Licensing affects use and distribution only ([PRD A6](../../product/PRD.md#10-assumptions-and-constraints)).
- FOCUS version re-confirmation (OQ-02 is re-evaluated at Phase 11 start; Phase 01 only accepts the default).

## Dependencies
| Type | Dependency |
|---|---|
| Phases | none |
| People | Product owner, architecture lead, security lead, finance SME, privacy reviewer, **qualified legal counsel** (external), Licensor representative |
| External | Trademark search service (OQ-01), interview participants for persona validation, counsel availability |
| Inputs | [README.md](../../../README.md), [PRD.md](../../product/PRD.md), [OPEN_QUESTIONS.md](../../product/OPEN_QUESTIONS.md), [GLOSSARY.md](../../product/GLOSSARY.md), [docs/legal/](../../legal/README.md), root licensing drafts (LICENSE.md, CLA.md, COMMERCIAL_LICENSE.md, LICENSE_FAQ.md, TRADEMARK_POLICY.md) |

## Deliverables
| # | Deliverable | Path |
|---|---|---|
| D1 | Ratified PRD v1.0-baseline (status changed from DRAFT, change log) | `docs/product/PRD.md` |
| D2 | Persona validation record | `docs/product/PERSONA_VALIDATION.md` |
| D3 | Decision log completed for OQ-01…OQ-24 | `docs/product/OPEN_QUESTIONS.md` |
| D4 | DPIA outline | `docs/product/DPIA.md` |
| D5 | Traceability matrix (requirement → phase → AC → test → doc) | `docs/planning/TRACEABILITY_MATRIX.md` |
| D6 | Acceptance matrix (AC-01…AC-11 × UJ × phase) | `docs/planning/ACCEPTANCE_MATRIX.md` |
| D7 | Risk register (seeded from architecture R-01…R-07 + licensing risks) | `docs/planning/RISK_REGISTER.md` |
| D8 | Release plan and dependency graph | `docs/planning/RELEASE_PLAN.md`, `docs/planning/DEPENDENCY_GRAPH.md` |
| D9 | [LIC] Counsel engagement record, LQ answers, licensing decision memo | `docs/legal/DECISIONS.md` (new; summary only, privileged material stays out of the repo) |
| D10 | Doc lint script | `scripts/docs/lint_ids.py` |
| D11 | Phase 01 acceptance report | `docs/phases/phase-01/ACCEPTANCE.md` (sign-off section) |

## Key risks
| Risk | Impact | Mitigation |
|---|---|---|
| Counsel unavailable or slow | Blocks publication gate (not internal phases 02–05) | Engage early; Phases 02–05 proceed privately; track as release-blocking risk |
| Persona validation becomes a research project | Phase stalls | Time-box; accept proxy validation with documented confidence |
| SLOs fixed without hardware evidence | Phase 34 gates meaningless | Fix reference hardware now; mark targets "provisional until Phase 34 benchmark" |
| ID churn after freeze | Broken traceability | Freeze rule: deprecate, never renumber; lint enforces |
| Trademark conflict on "CloudLedger" | Rename across docs, event type prefix (`dev.cloudledger`), docs domain | Clearance search in this phase; rename before Phase 03 scaffolding if needed |

## Phase documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: N/A. Confirm that no application code was added (only `scripts/docs/lint_ids.py`)
- [ ] PRD status changed to ratified baseline; change log entry added
- [ ] Persona validation record complete for PER-01…PER-10
- [ ] Every OQ-01…OQ-24 has a decision-log row (decision or accepted default, date, approver)
- [ ] Reference scale, reference hardware (OQ-13) and SLO targets confirmed
- [ ] DPIA outline reviewed by privacy reviewer
- [ ] [LIC] Counsel engaged; LQ-1…LQ-12 submitted; OQ-21/23/24 decided or explicitly deferred with an owner; OQ-22 recommendation recorded; OQ-01 search commissioned
- [ ] [LIC] Repository confirmed private; "all rights reserved" notice present until the publication gate passes
- [ ] Planning artifacts D5–D8 created
- [ ] Tests: all P01-TC* executed and recorded in TEST_RESULTS.md with real evidence
- [ ] Docs: markdown lint, link check, ID lint all pass
- [ ] Security review: security lead signed off NFR-SEC-* baseline and DPIA outline
- [ ] CHANGELOG.md updated (Unreleased → "Phase 01: requirements baseline")
- [ ] Acceptance sign-off table completed in ACCEPTANCE.md
- [ ] Stopped at phase boundary: Phase 02 not started without explicit approval
