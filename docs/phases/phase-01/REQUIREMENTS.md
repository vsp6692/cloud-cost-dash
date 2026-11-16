# Phase 01 — PRD, personas, acceptance criteria, licensing decision [LIC]: Requirements

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Priority: **M** = must (phase exit blocker), **S** = should, **C** = could. Each requirement is verified by the listed acceptance criterion in [ACCEPTANCE.md](ACCEPTANCE.md) and by tests in [TEST_PLAN.md](TEST_PLAN.md).

## Functional / process requirements

| ID | Requirement | Traces to (PRD) | Pri | Verified by |
|---|---|---|---|---|
| P01-R01 | Each persona PER-01…PER-10 is validated by at least one interview **or** a documented proxy source, with needs and key journeys confirmed or amended. PER-09 (MSP) is validated with the note that operating for third parties requires a commercial license. | PRD §3, UJ-01…UJ-13 | M | P01-AC01 |
| P01-R02 | Each user journey UJ-01…UJ-13 is reviewed for happy path, critical failure paths and its mapping to personas, and is confirmed to be automatable as a Playwright E2E against fixture-backed connectors. | UJ-01…UJ-13, AC-09 | M | P01-AC02 |
| P01-R03 | Every functional and non-functional requirement has a unique, frozen ID, a priority (M/S/C) and at least one delivering phase that exists in the phase index. Freeze rule: IDs are never renumbered or reused; withdrawn IDs are marked `Deprecated` in place. | FR-* (all), NFR-* (all) | M | P01-AC03 |
| P01-R04 | Product-level acceptance criteria AC-01…AC-11 are ratified, each mapped to the FR/NFR/UJ IDs it verifies and to the phase(s) that produce its evidence. | AC-01…AC-11 | M | P01-AC04 |
| P01-R05 | Non-goals NG1…NG8 are confirmed, including NG1 (no automated remediation) and NG7 (no sub-hourly cost). | PRD §2.2, FR-REC-008 | M | P01-AC03 |
| P01-R06 | Every open question OQ-01…OQ-24 has a decision-log row: either a decision or "default accepted", with date, approver and (when architectural) the ADR to update. Questions blocking v0.1 (OQ-01 for public release planning, OQ-03, OQ-05, OQ-17, OQ-21, OQ-23, OQ-24) are closed, not deferred. | OQ-01…OQ-24, PRD §12 | M | P01-AC05 |
| P01-R07 | The reference scale (PRD §8) is confirmed per profile, and the **reference hardware (OQ-13) is fixed in Phase 01**, resolving the conflict between NFR-PERF-003 ("TBD in Phase 01") and OQ-13 ("blocking for Phase 34"). | PRD §8, NFR-PERF-003, NFR-SCL-001, OQ-13 | M | P01-AC06 |
| P01-R08 | SLO targets are confirmed or amended with rationale: NFR-PERF-001 (dashboard p95), NFR-PERF-002 (API p95), NFR-PERF-003 (ingest rows/h), NFR-AVL-001 (99.9%, RPO/RTO), NFR-FRS-001 (1 h freshness, OQ-08). Each is tagged "provisional until benchmarked in Phase 34". | NFR-PERF-001…003, NFR-AVL-001, NFR-FRS-001, OQ-08, OQ-12 | M | P01-AC06 |
| P01-R09 | Planning artifacts referenced from the PRD exist: traceability matrix, acceptance matrix, risk register, release plan, dependency graph. | PRD header, §4, §9 | M | P01-AC07 |
| P01-R10 | The traceability matrix lists, for every FR/NFR, the delivering phase(s), the AC ID(s), and placeholders for code path, test ID and doc link to be filled by each phase. | All FR/NFR, AC-01…AC-11 | M | P01-AC07 |

## Non-functional, privacy and security requirements

| ID | Requirement | Traces to (PRD) | Pri | Verified by |
|---|---|---|---|---|
| P01-R11 | A DPIA outline exists covering: personal data inventory (user email, display name, IP, user agent, IdP subject; AI conversation content), purposes, lawful bases (to be filled by deployers), data flows to LLM providers (OQ-16), retention (OQ-09), data-subject rights (export/delete, FR-TEN-004), residency (self-hosting / region pinning), and risks with mitigations. | NFR-PRIV-001, FR-AI-008, FR-TEN-004, OQ-09, OQ-16, OQ-17 | M | P01-AC08 |
| P01-R12 | The security NFR baseline (NFR-SEC-001…005, ASVS 4.0 L2 with L3 for authn/session/audit) is confirmed by the security lead as the target the threat model in Phase 02 reviews against. | NFR-SEC-001…005, AC-02, AC-03, AC-10 | M | P01-AC08 |
| P01-R13 | Documentation quality gate: all Phase 01 deliverables pass markdown lint, internal link check, requirement-ID uniqueness, traceability completeness and forbidden-wording lint (no description of CloudLedger as "open source" or "OSI-approved"). | NFR-MNT-001 (docs), ADR-0015 consequences | M | P01-AC09 |

## Licensing requirements [LIC]

| ID | Requirement | Traces to (PRD) | Pri | Verified by |
|---|---|---|---|---|
| P01-R14 | Qualified legal counsel is engaged (engagement recorded, not the privileged content), and LQ-1…LQ-12 from LICENSING_EVALUATION §5 are formally submitted with a target response date. | OQ-21…OQ-24, AC-11 | M | P01-AC10 |
| P01-R15 | OQ-21 is decided: custom **CL-SAL-1.0** (primary) vs. **PolyForm Internal Use 1.0.0 + additional permission** (fallback), on counsel's recommendation (LQ-1). The decision memo states why, and lists the drafting changes required in LICENSE.md. | OQ-21, NFR-LIC-001…004, AC-11 | M | P01-AC10 |
| P01-R16 | Counsel's recommendations are recorded for OQ-22 (Plugin Interfaces license: Option A Apache-2.0 vs. Option B CL-SAL + exception; formal LICENSE_MAP designation confirmed in Phase 02), OQ-23 (CLA with relicensing right + DCO vs. assignment; corporate CLA) and OQ-24 (Licensor legal entity, contacts, governing law and venue). OQ-23 and OQ-24 are decided in Phase 01 because Phase 03 configures CLA tooling and SPDX copyright lines. | OQ-22, OQ-23, OQ-24, NFR-LIC-002, NFR-LIC-003 | M | P01-AC10 |
| P01-R17 | A trademark clearance search for the working name is commissioned (OQ-01, LQ-11). If the name is not cleared, a rename decision is taken before Phase 03 creates module paths, the event type prefix (`dev.cloudledger`) and the docs domain placeholder. | OQ-01, LQ-11 | M | P01-AC11 |
| P01-R18 | The repository remains **private, all rights reserved** until every item of the [publication gate](../../legal/LICENSING_EVALUATION.md#6-publication-gate) is checked. The gate is reproduced in ACCEPTANCE.md and its current state recorded. | AC-11, LICENSING_EVALUATION §6 | M | P01-AC11 |
| P01-R19 | The principle "internal use stays free and unrestricted: no license keys, feature gating or usage limits" (NFR-LIC-004) is ratified, and the licensing decision is confirmed not to change product scope (PRD A6). | NFR-LIC-004, PRD A6 | M | P01-AC10 |

## Out-of-phase traces
Requirements that Phase 01 **does not** deliver but whose acceptance thresholds it fixes: OQ-12 release thresholds (Phase 38), NFR-MNT-001 coverage gate (Phase 03 CI), NFR-A11Y-001 (Phase 14 onward).
