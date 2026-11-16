# Phase 02 — Architecture, ADRs, extension contracts [LIC: ADR-0015, license map]: Test plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Phase 02 has no code, so its tests are **design-review checklists** (signed by named reviewers) and **document lints** (scripted, with exit codes). Checklists are defined in [DESIGN.md §3](DESIGN.md#3-review-checklists-used-as-test-cases).

## Environments
| Env | Description |
|---|---|
| R | Review meeting / PR review with the named checklist; evidence = PR link + signed checklist |
| L | Local workstation: Python 3, Node LTS (`npx`), `lychee`, Docker (for TC11 only) |

No Makefile exists yet (Phase 03), so commands are invoked directly.

## Test cases

| ID | Type | Description | Preconditions / fixtures | Expected result | Requirements |
|---|---|---|---|---|---|
| P02-TC01 | review | DR-ADR checklist applied to each ADR-0001…0014, 0016, 0017 | reviewer assignments (T01) | every ADR has a completed checklist and decision | P02-R01 |
| P02-TC02 | doc-lint | ADR status lint: every ADR file has `Status` ∈ {Accepted, Rejected, Superseded by ADR-NNNN, Proposed (requires legal review)} plus deciders/date; index table matches files; ADR-0018/0019 stubs exist | `docs/architecture/adr/` | exit 0 | P02-R01, P02-R07 |
| P02-TC03 | review [LIC] (negative) | ADR-0015 may be Accepted only if `docs/legal/DECISIONS.md` records counsel review; lint fails on fixture where ADR-0015 is Accepted without a counsel record | fixture copy of ADR dir | lint fails on fixture; real tree consistent | P02-R02 |
| P02-TC04 | review | Architecture docs ratified or listed with blockers; DEPLOYMENT_PROFILES RPO/RTO consistent with NFR-AVL-001 (HA 15 min / 1 h) | architecture docs | status lines updated; no contradictions | P02-R03, P02-R06 |
| P02-TC05 | review | Module dependency rules unambiguous enough to encode as import-lint B1–B6 (Phase 03 DESIGN §7) | SYSTEM_CONTEXT.md | each rule mapped to a lint rule | P02-R04 |
| P02-TC06 | review | OQ-02/05/06/14/15 decisions recorded in OPEN_QUESTIONS decision log and reflected in ADR-0005/0006/0008/0012 | decision log | 5 rows with date and approver | P02-R05 |
| P02-TC07 | review | DR-SEC: STRIDE entries present for each TB-01…TB-12; abuse cases T-55…T-59 have mitigations; residual-risk table signed | THREAT_MODEL.md | complete; security lead signature | P02-R08 |
| P02-TC08 | doc-lint (negative) | Threat table lint: each `T-NN` row has mitigation, verifying phase and residual rating; fixture with a missing phase fails | fixture table | real doc passes; fixture fails | P02-R08 |
| P02-TC09 | review | SEC-* and AZ-* controls each map to a delivering phase; ASVS L2/L3 mapping present; built-in role matrix consistent with FR-IAM-004 roles | SECURITY_ARCHITECTURE.md, AUTHORIZATION_MODEL.md | no unmapped control | P02-R09 |
| P02-TC10 | review | DR-DATA: findings F-01…F-09 each resolved in the doc or assigned with resolution text | DATABASE_SCHEMA.md, review record | 9/9 closed or assigned | P02-R10 |
| P02-TC11 | integration (DDL smoke) | Extract the DDL blocks from DATABASE_SCHEMA.md and apply them to a throwaway PostgreSQL container (planned script `scripts/docs/ddl_smoke.sh`); fails today on F-01 | Docker, PostgreSQL current major | after fixes, all blocks apply; before fixes, F-01 error reproduced (negative evidence) | P02-R10 |
| P02-TC12 | review | DR-CON: API_GUIDELINES conventions consistent with OpenAPI components (Problem, Money, pagination params, Idempotency-Key, ETag headers) | both docs | no mismatches; FREEZE_v0.1 lists levels | P02-R11 |
| P02-TC13 | doc-lint | OpenAPI lint (`npx @redocly/cli lint api/openapi/cloudledger.v1.yaml` or Spectral) | OpenAPI file | 0 errors | P02-R12 |
| P02-TC14 | doc-lint | `x-phase` consistency: every operation has `x-phase`; value exists in the phase index; corrections from DESIGN §5 applied (planned script `scripts/docs/check_xphase.py`) | OpenAPI + `docs/phases/README.md` | exit 0 | P02-R12 |
| P02-TC15 | contract | Example events from EVENTS.md validate against the CloudEvents 1.0 JSON schema with the `tenantid` and `traceparent` extensions; catalog phase column corrected | `schemas/events/` | all examples valid | P02-R13 |
| P02-TC16 | review | PROVIDER_SDK, CAPABILITY_MANIFEST, COMPATIBILITY at `draft-v0`: read-only rule, no DB access, error taxonomy, determinism; no SDK type references `internal/*`; manifest example validates against draft schema | contracts docs, `schemas/manifest/` | checklist complete | P02-R14 |
| P02-TC17 | review [LIC] | LICENSE_MAP designation recorded (Option A/B or default with owner and deadline); each path has an SPDX expression | LICENSE_MAP.md, DECISIONS.md | complete | P02-R15 |
| P02-TC18 | review [LIC] | PLUGIN_LICENSING consistent with CAPABILITY_MANIFEST rule 1 and LICENSE_MAP rule 3; boundary rule accepted for Phase 03 | legal docs | consistent | P02-R16 |
| P02-TC19 | doc-lint [LIC] | Forbidden wording lint over Phase 02 outputs: no positive "open source"/"OSI-approved" description of CloudLedger (`python3 scripts/docs/lint_ids.py --check wording`, planned) | all touched docs | exit 0 | P02-R17 |
| P02-TC20 | review [LIC] | No architecture element introduces license keys, feature gating or usage limits; quotas/rate limits labelled operational | TENANCY §5, API_GUIDELINES §8 | confirmed | P02-R17 |
| P02-TC21 | doc-lint | Markdown lint `npx markdownlint-cli2 "docs/**/*.md"` | — | exit 0 | P02-R18 |
| P02-TC22 | doc-lint | Link check `lychee --offline docs/` (allow-list for links to future phase deliverables) | allow-list file | exit 0 | P02-R18 |
| P02-TC23 | doc-lint | ID uniqueness and traceability `python3 scripts/docs/lint_ids.py --check unique,traceability` (from Phase 01) incl. ADR, T-NN, SEC-*, AZ-*, F-NN IDs | — | exit 0 | P02-R18 |

Cross-tenant, performance and failure-injection tests do not apply to a docs-only phase. The designs they will test are reviewed in TC07, TC09 and TC10; execution starts in Phase 04.

## Planned commands
```bash
npx markdownlint-cli2 "docs/**/*.md"                              # planned: TC21
lychee --offline docs/                                              # planned: TC22
python3 scripts/docs/lint_ids.py --check unique,traceability        # planned: TC23
python3 scripts/docs/lint_ids.py --check wording                    # planned: TC19
python3 scripts/docs/lint_ids.py --check adr-status                 # planned: TC02, TC03
npx @redocly/cli lint api/openapi/cloudledger.v1.yaml               # planned: TC13
python3 scripts/docs/check_xphase.py                                # planned: TC14
scripts/docs/ddl_smoke.sh                                           # planned: TC11
```

## Evidence rules
Review TCs record reviewer name, date and PR/checklist link. Lint TCs record the exact command and exit code. Negative tests (TC03, TC08, TC11) must show the failing run as well as the passing run.
