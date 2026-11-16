# Phase 02 — Architecture, ADRs, extension contracts [LIC: ADR-0015, license map]: Implementation plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Docs-only phase. Each task is one reviewable PR. Sizes: **S** ≤ 1 day, **M** 2–4 days, **L** ≥ 1 week (mostly review latency).

## Tasks

| ID | Task | Files | Size | Requirements |
|---|---|---|---|---|
| P02-T01 | Create the design review record skeleton, reviewer assignments and checklists DR-ADR/SEC/DATA/CON/LIC | `docs/architecture/reviews/2026-phase-02-design-review.md` | S | P02-R01, R03 |
| P02-T02 | Review ADR-0001, 0002, 0016, 0017 (runtime, web, ids, observability); record decisions | `docs/architecture/adr/0001…, 0002…, 0016…, 0017…` | M | P02-R01 |
| P02-T03 | Review ADR-0003, 0005, 0010, 0014 (tenancy, queue, raw storage, audit) together with DR-DATA findings F-01, F-03, F-05, F-08 | ADRs, DATABASE_SCHEMA.md, DATA_FLOW.md | M | P02-R01, P02-R10 |
| P02-T04 | Review ADR-0004, 0006, 0007 (analytics, FOCUS, money) with the finance SME; reaffirm OQ-02 default | ADRs, ANALYTICS_ADAPTERS.md, FOCUS_NORMALIZATION.md | M | P02-R01, P02-R05 |
| P02-T05 | Review ADR-0008, 0009, 0011, 0012, 0013 (authz, federation, API, plugins, LLM) with the security lead; confirm OQ-06, OQ-14 | ADRs, AUTHORIZATION_MODEL.md, LLM_SECURITY.md | M | P02-R01, P02-R05, P02-R09 |
| P02-T06 | Decide OQ-15 (SaaS in scope) and OQ-05 confirmation; record in OPEN_QUESTIONS decision log and ADR-0005 | `docs/product/OPEN_QUESTIONS.md`, ADR-0005 | S | P02-R05 |
| P02-T07 | Threat model review per TB-01…TB-12 and abuse cases; residual-risk table signed by security lead | `docs/security/THREAT_MODEL.md` (review section) | L | P02-R08 |
| P02-T08 | SECURITY_ARCHITECTURE and AUTHORIZATION_MODEL review; ASVS mapping check; control→phase mapping | `docs/security/*.md` | M | P02-R09 |
| P02-T09 | Fix DATABASE_SCHEMA findings F-01…F-09 or record assignments with resolutions | `docs/architecture/DATABASE_SCHEMA.md`, TENANCY.md | M | P02-R10 |
| P02-T10 | Ratify remaining architecture docs (SYSTEM_CONTEXT, DEPLOYMENT_PROFILES with OQ-03, INGESTION_PIPELINE, ALLOCATION_ENGINE, FINANCE_RECONCILIATION, FORECASTING_ANOMALIES, RECOMMENDATION_ENGINE, RESOURCE_INVENTORY, TRUST_BOUNDARIES); module rules confirmed | `docs/architecture/*.md` | M | P02-R03, R04, R06 |
| P02-T11 | Contract freeze: write `FREEZE_v0.1.md`; freeze API conventions and event envelope; correct EVENTS.md and API_GUIDELINES §13 phase columns (F-07) | `docs/contracts/` | M | P02-R11, P02-R13 |
| P02-T12 | OpenAPI review: lint with Spectral/Redocly; apply `x-phase` corrections from DESIGN §5; check every operation lists errors and permission | `api/openapi/cloudledger.v1.yaml` | M | P02-R12 |
| P02-T13 | Provider SDK, capability manifest and compatibility policy reviewed at `draft-v0`; confirm no SDK type references `internal/*` | `docs/contracts/PROVIDER_SDK.md`, `CAPABILITY_MANIFEST.md`, `COMPATIBILITY.md` | S | P02-R14 |
| P02-T14 | [LIC] OQ-22 decision with counsel input; update LICENSE_MAP status; PLUGIN_LICENSING review; ADR-0015 counsel review record | `docs/legal/LICENSE_MAP.md`, `PLUGIN_LICENSING.md`, `DECISIONS.md`, ADR-0015 | M | P02-R02, R15, R16 |
| P02-T15 | Reserve ADR-0018 (migration tool) and ADR-0019 (decimal library) stubs; update ADR index | `docs/architecture/adr/` | S | P02-R07 |
| P02-T16 | Run doc lints (markdown, links, ADR status, ID uniqueness, forbidden wording) and fix findings | all touched docs | S | P02-R17, P02-R18 |
| P02-T17 | Acceptance report, CHANGELOG entry, sign-offs | `docs/phases/phase-02/ACCEPTANCE.md`, `CHANGELOG.md` | S | all |

## Migrations
None. DATABASE_SCHEMA.md corrections are design-level only; the first tenant migrations are written in Phase 04 (sequence 0010+).

## Feature flags
None.

## Rollout and rollback
- Rollout: each decision lands as a PR with reviewers from the relevant checklist; the freeze manifest is the last PR before sign-off.
- Rollback: a ratified ADR is never edited to reverse a decision; it is superseded by a new ADR. Contract changes after the freeze go through a change request recorded in `FREEZE_v0.1.md`.

## Definition of done
1. All ADRs have a decided status (ADR-0015 with counsel record or documented pending state).
2. Findings F-01…F-09 resolved or assigned with resolution text.
3. `FREEZE_v0.1.md` published; OpenAPI lint clean; `x-phase` conflicts resolved.
4. Threat model residual risks accepted in writing.
5. [LIC] LICENSE_MAP designation recorded.
6. All P02-TC executed with evidence; sign-offs recorded; CHANGELOG updated; Phase 03 not started.
