# Phase 01 — PRD, personas, acceptance criteria, licensing decision [LIC]: Test plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Phase 01 has no code. Its tests are **review checklists** (type `review`) executed by named reviewers, and **documentation lint** checks (type `doc-lint`) executed by tooling. Negative cases inject a defect into a scratch copy of the docs (or into `scripts/docs/testdata/`) and assert that the lint fails.

## Environments
| Env | Description |
|---|---|
| Local workstation | Python ≥ 3.11 (stdlib only for `lint_ids.py`), Node ≥ 20 for `markdownlint-cli2`, `lychee` binary |
| Review session | Recorded review meeting; checklist completed in the PR or in an attached evidence file |
| CI | Not available until Phase 03. The same commands are wired into `make docs-lint` (planned) in Phase 03. |

## Planned commands (planned; none executed yet)
```bash
npx markdownlint-cli2 "docs/**/*.md"                                  # planned
lychee --offline docs/                                                 # planned
python3 scripts/docs/lint_ids.py --check unique,traceability           # planned
python3 scripts/docs/lint_ids.py --check wording,oq-log                # planned
python3 scripts/docs/lint_ids.py --selftest scripts/docs/testdata      # planned: negative fixtures
```

## Test cases

| ID | Type | Description | Preconditions / fixtures | Expected result | Requirements |
|---|---|---|---|---|---|
| P01-TC01 | review | Persona validation checklist: each PER-01…PER-10 has ≥ 1 interview or proxy source, needs confirmed/amended, journeys linked | `PERSONA_VALIDATION.md` draft | 10/10 personas have evidence and reviewer initials | P01-R01 |
| P01-TC02 | review | PER-09 (MSP) entry states commercial-license requirement for third-party operation and that internal multi-affiliate use is free | PRD §3, LICENSE_FAQ | Statement present and consistent with LICENSE_FAQ | P01-R01, P01-R19 |
| P01-TC03 | review | Journey checklist: UJ-01…UJ-13 each have happy path, ≥ 1 failure path, persona link, and an "automatable with fixtures" yes/no | PRD §4 | 13/13 complete; any "no" has a remediation | P01-R02 |
| P01-TC04 | doc-lint | ID uniqueness: every FR/NFR/AC/UJ/PER/OQ ID is defined exactly once | Repo docs | Exit 0, no duplicates | P01-R03 |
| P01-TC05 | doc-lint (negative) | Inject a duplicate `FR-AWS-002` definition into a fixture copy | `testdata/dup_id/` | Lint exits non-zero naming both locations | P01-R03, P01-R13 |
| P01-TC06 | doc-lint (negative) | Inject a dangling reference `FR-AWS-099` in a phase doc | `testdata/dangling_ref/` | Lint fails with "undefined reference" | P01-R03, P01-R13 |
| P01-TC07 | doc-lint | Every FR/NFR has a priority and a delivering phase that exists in the phase index (01–40) | PRD §5–6, `docs/phases/README.md` | Exit 0 | P01-R03, P01-R10 |
| P01-TC08 | doc-lint (negative) | FR row with phase `41` or empty priority | `testdata/bad_phase/` | Lint fails | P01-R03 |
| P01-TC09 | review | Non-goals NG1…NG8 confirmed; NG1 consistent with FR-REC-008 and PRD principle 8 | PRD §2.2 | Checklist signed | P01-R05 |
| P01-TC10 | doc-lint | Every AC-01…AC-11 maps to ≥ 1 FR/NFR or UJ and ≥ 1 verifying phase in ACCEPTANCE_MATRIX | `ACCEPTANCE_MATRIX.md` | Exit 0, no unmapped AC | P01-R04 |
| P01-TC11 | doc-lint | OQ log: every OQ-01…OQ-24 has a decision row with date and approver; v0.1-blocking OQs are not "Deferred" | `OPEN_QUESTIONS.md` | Exit 0 | P01-R06 |
| P01-TC12 | doc-lint (negative) | Remove the decision row for OQ-21; mark OQ-23 "Deferred" | `testdata/oq_missing/` | Lint fails for both | P01-R06 |
| P01-TC13 | review | Reference scale and hardware table complete for Lite/Standard/HA; NFR-PERF-003 and OQ-13 no longer contradict each other | PRD §6, §8; OQ-13 | Consistent text; reviewer sign-off | P01-R07 |
| P01-TC14 | review | SLO table: each of NFR-PERF-001…003, NFR-AVL-001, NFR-FRS-001 has metric, percentile, dataset, engine, hardware, tool, "provisional" tag | PRD §6 | 5/5 complete | P01-R08 |
| P01-TC15 | doc-lint | Planning artifacts exist and contain no broken links: TRACEABILITY_MATRIX, ACCEPTANCE_MATRIX, RISK_REGISTER, RELEASE_PLAN, DEPENDENCY_GRAPH | `docs/planning/` | Files exist; lychee exit 0 | P01-R09 |
| P01-TC16 | doc-lint | Traceability completeness: every FR/NFR appears in TRACEABILITY_MATRIX with phase and AC columns filled | `TRACEABILITY_MATRIX.md` | 100% rows present | P01-R10 |
| P01-TC17 | review | DPIA outline checklist: data inventory, purposes, LLM egress (OQ-16), retention (OQ-09), subject rights (FR-TEN-004), residency, risks/measures | `DPIA.md` | Privacy reviewer sign-off | P01-R11 |
| P01-TC18 | review | Security baseline: NFR-SEC-001…005 and ASVS levels confirmed; cross-tenant attack suite phases (04, 05, 13, 27, 34) listed | PRD §6 | Security lead sign-off | P01-R12 |
| P01-TC19 | doc-lint | Markdown lint and offline link check across `docs/` | All docs | Exit 0 (links to files being written by other phases allowed only if listed in an allow-list file) | P01-R13 |
| P01-TC20 | doc-lint | Forbidden wording: no positive description of CloudLedger as "open source" / "OSI-approved" | All docs, README, root licensing files | Exit 0; negated forms ("not OSI open source") allowed | P01-R13, P01-R19 |
| P01-TC21 | doc-lint (negative) | Inject "CloudLedger is an open-source platform" into a fixture | `testdata/wording/` | Lint fails | P01-R13 |
| P01-TC22 | review [LIC] | Counsel engagement record exists; LQ-1…LQ-12 submitted with dates; no privileged content committed | `docs/legal/DECISIONS.md` | Licensor rep + reviewer confirm | P01-R14 |
| P01-TC23 | review [LIC] | OQ-21 decision memo: option chosen, L-1…L-8 mapping, required LICENSE.md changes, counsel status | `DECISIONS.md` | Memo complete; texts still marked draft | P01-R15 |
| P01-TC24 | review [LIC] | OQ-22 recommendation, OQ-23 CLA decision (incl. corporate CLA + DCO), OQ-24 Licensor entity/governing law recorded | `DECISIONS.md`, `OPEN_QUESTIONS.md` | All three recorded with approver | P01-R16 |
| P01-TC25 | review [LIC] | Trademark search commissioned; keep/rename decision or a dated deadline before Phase 03 | `DECISIONS.md` | Recorded | P01-R17 |
| P01-TC26 | review [LIC] (negative) | Attempt to check repository visibility settings: repo must be private; README/LICENSE carry "draft / all rights reserved until approved" | GitHub repo settings (or equivalent) | Private; wording present; publication gate items unchecked unless evidenced | P01-R18 |
| P01-TC27 | review [LIC] | Scope invariance: licensing decision introduces no feature gating, license keys or usage limits into requirements (NFR-LIC-004, PRD A6) | PRD diff for the phase | No such requirement added | P01-R19 |

## Coverage
Every P01-R01…R19 is covered by ≥ 1 test case above. Cross-tenant, performance and failure-injection test types do not apply to a docs-only phase; their **requirements** are baselined here (P01-R08, P01-R12) and verified in Phases 04, 05, 13, 27 and 34.
