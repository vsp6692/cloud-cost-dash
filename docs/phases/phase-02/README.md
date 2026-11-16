# Phase 02 — Architecture, ADRs, extension contracts [LIC: ADR-0015, license map]: Overview

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

| Field | Value |
|---|---|
| Release checkpoint | v0.1 (phases 01–05) |
| Depends on | [Phase 01](../phase-01/README.md) accepted (frozen requirement IDs, OQ decisions, counsel engaged) |
| Primary PRD scope | NFR-* (all), ADR-0001…ADR-0017, OQ-02/05/06/14/15/22 (architecture-related), AC-02/03/04/08 (design inputs) |
| Primary verification | Design review sign-off (architecture, security, data, licensing) |
| Code produced | **None.** Docs, ADR status changes and review records only |
| Licensing marker | **[LIC]** ADR-0015 legal review, LICENSE_MAP designation (OQ-22), PLUGIN_LICENSING review |

## Goal
Ratify the draft architecture so that implementation (Phase 03 onward) starts from accepted decisions and frozen v0.1 contracts. At exit: every ADR has a decided status, the threat model has been reviewed per trust boundary, the v0.1 contract set (API conventions, event envelope, OpenAPI skeleton, provider SDK draft v0, capability manifest draft, compatibility policy) is frozen at a declared level, the schema defects found in review are fixed or scheduled, and the Plugin Interfaces license designation is confirmed.

## Scope
1. **ADR ratification**: ADR-0001…0017 move from *Proposed* to *Accepted*, *Rejected* or *Superseded*, each with deciders and date. ADR-0015 cannot be accepted without recorded counsel review.
2. **Architecture document ratification**: [architecture/](../../architecture/README.md) documents move from DRAFT to RATIFIED (or stay DRAFT with listed blockers).
3. **Threat model review**: [THREAT_MODEL.md](../../security/THREAT_MODEL.md) STRIDE per trust boundary TB-01…TB-12 ([TRUST_BOUNDARIES.md](../../architecture/TRUST_BOUNDARIES.md)), abuse cases, residual risk acceptance; review of [SECURITY_ARCHITECTURE.md](../../security/SECURITY_ARCHITECTURE.md) and [AUTHORIZATION_MODEL.md](../../security/AUTHORIZATION_MODEL.md).
4. **Data design review**: [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md) defects (see [DESIGN.md §4](DESIGN.md#4-design-review-findings-to-resolve-before-phase-04)) fixed in the document before Phase 04 writes migrations.
5. **Contract freeze for v0.1**: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md), [EVENTS.md](../../contracts/EVENTS.md) envelope, [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml) skeleton (incl. `x-phase` corrections), [PROVIDER_SDK.md](../../contracts/PROVIDER_SDK.md) draft v0, [CAPABILITY_MANIFEST.md](../../contracts/CAPABILITY_MANIFEST.md) draft, [COMPATIBILITY.md](../../contracts/COMPATIBILITY.md).
6. **Architecture-related open questions**: confirm OQ-05 (queue), OQ-06 (Cedar), OQ-14 (plugin model), OQ-15 (SaaS in scope), reaffirm OQ-02 default, and record them in the relevant ADRs.
7. **[LIC]** Confirm [LICENSE_MAP.md](../../legal/LICENSE_MAP.md) designations (OQ-22: Option A Apache-2.0 vs. Option B CL-SAL + Plugin Interface exception) on counsel's recommendation from Phase 01; review [PLUGIN_LICENSING.md](../../legal/PLUGIN_LICENSING.md); confirm the import boundary rule that Phase 03 enforces.
8. Reserve ADR numbers for Phase 03 decisions (ADR-0018 migration tool, ADR-0019 decimal library).

## Out of scope
- Any code, Makefile or CI (Phase 03).
- Freezing `sdk/provider` as v1 (Phase 35). Phase 02 freezes it only as **draft v0**, which first-party providers (Phases 06–08) may extend additively.
- Final counsel approval of license texts and publication (publication gate; Phases 38–40).
- Penetration testing and ASVS assessment (Phase 34).
- Detailed per-phase designs (each phase's own DESIGN.md).

## Dependencies
| Type | Dependency |
|---|---|
| Phase | 01 accepted: requirement IDs frozen; OQ decisions recorded; counsel engaged |
| People | Architecture lead, security lead, data/DB reviewer, finance SME (for money/FOCUS ADRs), QA lead, Licensor representative, **legal counsel** for ADR-0015 and OQ-22 |
| Inputs | Architecture docs, ADRs, contracts, security docs, legal docs, OpenAPI draft, [providers/](../../providers/README.md) docs |
| External | OpenAPI linter (Spectral or Redocly), markdownlint, lychee (run locally; no CI yet) |

## Deliverables
| # | Deliverable | Path |
|---|---|---|
| D1 | ADR status updates with decision notes | `docs/architecture/adr/*.md`, `adr/README.md` |
| D2 | Design review record (checklists, findings, decisions) | `docs/architecture/reviews/2026-phase-02-design-review.md` |
| D3 | Threat model review record and residual-risk acceptance | `docs/security/THREAT_MODEL.md` (review section) |
| D4 | Corrected DATABASE_SCHEMA.md (findings F-01…F-09) | `docs/architecture/DATABASE_SCHEMA.md` |
| D5 | Contract freeze manifest (contract, version, freeze level, owner) | `docs/contracts/FREEZE_v0.1.md` |
| D6 | OpenAPI `x-phase` corrections and lint report | `api/openapi/cloudledger.v1.yaml` |
| D7 | [LIC] LICENSE_MAP designation decision and PLUGIN_LICENSING review notes | `docs/legal/LICENSE_MAP.md`, `docs/legal/DECISIONS.md` |
| D8 | Reserved ADR stubs 0018, 0019 (Proposed) | `docs/architecture/adr/` |

## Key risks
| Risk | Mitigation |
|---|---|
| Counsel not available for ADR-0015/OQ-22 | ADR-0015 stays *Proposed (requires legal review)*; Phase 03 defaults SPDX to `LicenseRef-CloudLedger-SAL-1.0` everywhere with a single-switch REUSE.toml; repo stays private |
| Review bikeshedding stalls the phase | Time-boxed review per ADR; decisions by maintainer council lazy consensus (OQ-20 default) |
| Schema defects found late (Phase 04) | F-01…F-09 fixed in this phase; Phase 04 DESIGN re-checks |
| OpenAPI `x-phase` values contradict phase plans | Resolve in contract freeze (DESIGN §5) |
| Contracts frozen too early | Freeze levels: `frozen-v0.1` (conventions) vs. `draft` (SDK, manifest) |

## Phase documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: N/A. Confirm no application code was added
- [ ] Every ADR-0001…0017 has a decided status, deciders and date (ADR-0015 only with counsel review)
- [ ] Architecture documents ratified or blockers listed
- [ ] Threat model reviewed for TB-01…TB-12; residual risks accepted by the security lead
- [ ] DATABASE_SCHEMA findings F-01…F-09 resolved in the document
- [ ] Contract freeze manifest published; OpenAPI lint clean; `x-phase` conflicts resolved
- [ ] [LIC] LICENSE_MAP designation (OQ-22) confirmed or default recorded with owner; PLUGIN_LICENSING reviewed
- [ ] Tests: every P02-TC executed and recorded in TEST_RESULTS.md with real evidence
- [ ] Docs: markdown lint, link check, ADR status lint, ID lint, wording lint pass
- [ ] Security review: security lead sign-off on threat model and security architecture
- [ ] CHANGELOG.md updated (Unreleased → "Phase 02: architecture ratified")
- [ ] Acceptance sign-off table completed in ACCEPTANCE.md
- [ ] Stopped at the phase boundary: Phase 03 not started without explicit approval
