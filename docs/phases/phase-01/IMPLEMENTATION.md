# Phase 01 — PRD, personas, acceptance criteria, licensing decision [LIC]: Implementation plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

No application code. Tasks are review, decision and documentation work. Sizes: S ≤ 1 day, M ≤ 3 days, L > 3 days (elapsed effort, not calendar time for external parties).

## Ordered tasks

| ID | Task | Files / dirs | Size | Requirements |
|---|---|---|---|---|
| P01-T01 | Write `scripts/docs/lint_ids.py` first (tests-first for docs): ID grammar, uniqueness of defining rows, dangling references, traceability completeness (every FR/NFR has a phase present in the phase index, every PNN-R has a TC and AC), forbidden wording (`open source`, `open-source`, `OSI-approved` unless negated, e.g. "not OSI open source"), every OQ has a decision row. Add fixture docs under `scripts/docs/testdata/` for negative cases. | `scripts/docs/lint_ids.py`, `scripts/docs/testdata/` | M | P01-R13, R03, R06, R10 |
| P01-T02 | Engage legal counsel [LIC]: engagement letter, scope (LQ-1…LQ-12), privilege handling, target dates. Record non-privileged summary. | `docs/legal/DECISIONS.md` | S (internal) / L (elapsed) | P01-R14 |
| P01-T03 | Commission trademark clearance search for the working name [LIC] (OQ-01, LQ-11), covering relevant classes and jurisdictions plus domain and GitHub org availability. | `docs/legal/DECISIONS.md` | S / L elapsed | P01-R17 |
| P01-T04 | Persona validation: interview plan (≥ 1 interview or proxy per persona), anonymized notes, findings per PER-01…PER-10. | `docs/product/PERSONA_VALIDATION.md` | L | P01-R01 |
| P01-T05 | Journey review: walk UJ-01…UJ-13 with personas; confirm failure paths; confirm each is fixture-automatable (AC-09). | `docs/product/PRD.md` §4 | M | P01-R02 |
| P01-T06 | PRD requirement walk-through with architecture, security and finance leads; fix priorities and phase columns; confirm NG1…NG8. | `docs/product/PRD.md` §2, §5, §6 | L | P01-R03, R05 |
| P01-T07 | Resolve OQ-01…OQ-24 (see worklist below); write decision-log rows; flag ADRs to update in Phase 02. | `docs/product/OPEN_QUESTIONS.md` | M | P01-R06 |
| P01-T08 | Reference scale + hardware + SLO table; update NFR-PERF-003 text ("reference hardware per Phase 01 decision") and OQ-13 blocking column. | `docs/product/PRD.md` §6, §8; `OPEN_QUESTIONS.md` | M | P01-R07, R08 |
| P01-T09 | Ratify AC-01…AC-11 and build the acceptance matrix (AC × UJ × FR/NFR × phase). | `docs/planning/ACCEPTANCE_MATRIX.md` | M | P01-R04 |
| P01-T10 | Build traceability matrix skeleton (FR/NFR → phase → AC; columns for code, test, doc filled by later phases). | `docs/planning/TRACEABILITY_MATRIX.md` | M | P01-R09, R10 |
| P01-T11 | Create risk register (R-01…R-07 from architecture + licensing, trademark, counsel-delay, persona risks), release plan (v0.1…v1.0 checkpoints, no calendar promises), dependency graph (Mermaid of phase deps from the phase index). | `docs/planning/{RISK_REGISTER,RELEASE_PLAN,DEPENDENCY_GRAPH}.md` | M | P01-R09 |
| P01-T12 | DPIA outline; privacy review. | `docs/product/DPIA.md` | M | P01-R11 |
| P01-T13 | Security NFR baseline confirmation (NFR-SEC-001…005, ASVS levels). | `docs/product/PRD.md` §6 | S | P01-R12 |
| P01-T14 | [LIC] Licensing decisions from counsel input: OQ-21 decision memo; OQ-22 recommendation; OQ-23 CLA model + corporate CLA; OQ-24 Licensor entity/governing law; annotate draft texts with required changes (do **not** mark them final). | `docs/legal/DECISIONS.md`, root licensing drafts (banners only) | M / L elapsed | P01-R15, R16, R19 |
| P01-T15 | [LIC] Confirm repo is private; verify README and LICENSE.md carry "draft, all rights reserved until approved" wording; record publication-gate state. | `README.md` (wording check only), ACCEPTANCE.md | S | P01-R18 |
| P01-T16 | Run doc checks (planned commands below), fix findings, freeze IDs, change PRD status to ratified baseline, CHANGELOG entry. | all Phase 01 docs, `CHANGELOG.md` | S | P01-R13, R03 |
| P01-T17 | Acceptance report and sign-off meeting; stop at phase boundary. | `docs/phases/phase-01/ACCEPTANCE.md`, `TEST_RESULTS.md` | S | all |

## OQ worklist
| OQ | Topic | Blocking for | Phase 01 disposition target | Decision record |
|---|---|---|---|---|
| OQ-01 | Name / trademark | v0.1 public release | Search commissioned; decide keep/rename before Phase 03 | DECISIONS.md + OQ log |
| OQ-02 | FOCUS version | Phase 11 | Default accepted (1.2), re-evaluate at Phase 11 start | OQ log → ADR-0006 |
| OQ-03 | Deployment targets | Phase 03 | Decide (default: Lite first) | OQ log |
| OQ-04 | Analytics engine per profile | Phase 13 | Default accepted | OQ log → ADR-0004 |
| OQ-05 | Job orchestration | Phase 03/12 | Decide (default: PG queue) | OQ log → ADR-0005 |
| OQ-06 | Authz engine | Phase 05 | Default accepted (Cedar) | OQ log → ADR-0008 |
| OQ-07 | SAML implementation | Phase 31 | Deferred with trigger (Phase 31) | OQ log |
| OQ-08 | Ingestion latency SLO | Phase 12 | Decide with SLO table (P01-T08) | OQ log |
| OQ-09 | Retention defaults | Phase 04 | Decide (needed for DPIA) | OQ log |
| OQ-10 | Invoice jurisdictions/tax | Phase 10 | Default accepted | OQ log |
| OQ-11 | FX sources | Phase 18 | Default accepted | OQ log |
| OQ-12 | Release thresholds | Phase 38 | Default accepted | OQ log |
| OQ-13 | Reference hardware | Phase 01 (moved) / 34 | **Decide in Phase 01** | OQ log + PRD §8 |
| OQ-14 | Plugin execution model | Phase 35 | Default accepted | OQ log → ADR-0012 |
| OQ-15 | SaaS in scope for v1.0 | Phase 02 | Default accepted; formal decision in Phase 02 | OQ log |
| OQ-16 | LLM default / egress | Phase 27 | Default accepted (needed for DPIA) | OQ log |
| OQ-17 | Telemetry / phone-home | Phase 03 | Decide (default: none, opt-in only) | OQ log |
| OQ-18 | K8s allocation | Phase 20/22 | Default accepted | OQ log |
| OQ-19 | Azure agreement types | Phase 08 | Default accepted | OQ log |
| OQ-20 | Governance model | Phase 37 | Default accepted | OQ log |
| OQ-21 | License model [LIC] | before public repo / release | **Decide** on counsel advice | DECISIONS.md → ADR-0015 |
| OQ-22 | Plugin interface license [LIC] | Phase 35 (proposal in 02) | Counsel recommendation recorded | DECISIONS.md → LICENSE_MAP (Phase 02) |
| OQ-23 | CLA terms [LIC] | Phase 03 | **Decide** | DECISIONS.md → CLA.md |
| OQ-24 | Licensor entity [LIC] | before publication | **Decide** (owner supplies) | DECISIONS.md |

## Feature flags
None (no code).

## Planned verification commands (planned; not yet run)
```bash
npx markdownlint-cli2 "docs/**/*.md"                        # planned
lychee --offline docs/                                       # planned: internal link check
python3 scripts/docs/lint_ids.py --check unique,traceability # planned: created in P01-T01
python3 scripts/docs/lint_ids.py --check wording,oq-log      # planned
```

## Rollout and rollback
- Rollout: one PR per deliverable group (product, planning, legal summary, lint script), reviewed by the owners listed in the sign-off table. PRD status flips to "ratified baseline" only in the final PR.
- Rollback: documentation changes revert via git. A frozen ID can never be "rolled back" by renumbering; use the deprecation rule.
- Licensing: no change is published; rollback of a licensing direction is a new decision-log row superseding the old one.

## Definition of done
All P01-T* complete; lint clean; every OQ has a decision row; publication-gate state recorded; P01-AC01…AC11 evidence attached; sign-off table complete; CHANGELOG updated; Phase 02 not started.
