# Phase 04 — Tenancy schema, migrations, audit foundation: Overview

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

| Field | Value |
|---|---|
| Release checkpoint | v0.1 (phases 01–05) |
| Depends on | [Phase 03](../phase-03/README.md) (repo, CI, migration tool ADR-0018, decimal ADR-0019, `0001_bootstrap` roles); [Phase 02](../phase-02/DESIGN.md#4-design-review-findings-to-resolve-before-phase-04) schema findings F-01, F-03, F-04, F-06 |
| Primary PRD requirements | FR-TEN-001…004, FR-TEN-007, FR-AUD-001, NFR-SEC-001, NFR-OBS-001, NFR-PRIV-001 (export/delete) |
| Primary verification | Isolation and migration tests (RLS catalog test, cross-tenant SQL/API suite, audit chain verifier) |

## Goal
Lay the multi-tenant foundation every later phase builds on: tenant and settings tables, forced Row-Level Security with composite keys, a tenant-scoped transaction API, tenant lifecycle (create, suspend, delete with grace period, purge with crypto-shredding), a hash-chained append-only audit log, the transactional outbox and the PostgreSQL job queue.

## Scope
- Migrations `0010`–`0049`: `tenants`, `tenant_settings`, RLS helper, `hierarchy_versions`/`hierarchy_nodes`, `audit_events` (+ anchors), `outbox_events`, `jobs`, `idempotency_keys`, `tenant_keys`, `break_glass_grants`, grants.
- `internal/platform/db.WithTenantTx` (`SET LOCAL app.tenant_id`), `internal/platform/jobs` PG queue, `internal/platform/outbox` relay, `internal/platform/idempotency`.
- `internal/tenants` (lifecycle, settings, hierarchy CRUD), `internal/audit` (chain writer, verifier, anchors).
- CLI: `cloudledger admin tenant create|list|suspend|resume|delete|restore|export|purge`, `cloudledger admin audit verify`.
- HTTP handlers for operations with `x-phase: "04"` in the OpenAPI document (admin tenants, settings, hierarchy, audit-events list). **Authentication arrives in Phase 05**: in non-test builds these routes return `401`; integration tests use a test-only principal injector (build tag `testauth`).
- Isolation test suite (SQL, repository, API, job, object-storage path) and RLS catalog test.

## Out of scope
- Users, identities, sessions, roles, data scopes, tokens (Phase 05). Platform-admin identity is the CLI operator in this phase.
- MSP parent/child delegation behaviour (Phase 31); `parent_tenant_id` exists in schema only. Operating CloudLedger for external customers requires a commercial license.
- Audit search/export UI and `POST /audit-events:verify` (Phase 30); SIEM streaming (Phase 31).
- Crypto-shredding verification across backups (Phase 33); normalized-data export (once data exists, Phase 12/29).
- Retention enforcement jobs (settings stored now; enforcement with the data they govern).

## Dependencies
| Type | Dependency |
|---|---|
| Phases | 03 accepted; 02 findings F-01/F-03/F-04/F-06 resolved in DATABASE_SCHEMA.md |
| External | PostgreSQL ≥ 15 (Testcontainers), MinIO (anchor storage in Lite), KEK source per profile ([SECRETS_AND_KEYS.md](../../security/SECRETS_AND_KEYS.md)) |

## Deliverables
Migrations 0010–0021; packages `internal/tenants`, `internal/audit`, `internal/platform/{db,jobs,outbox,idempotency,crypto}`; admin CLI; HTTP handlers; `tests/integration/isolation/`; `tests/integration/migrations/`; docs updates to DATABASE_SCHEMA.md, TENANCY.md, `docs/operations/RUNBOOKS.md` (tenant lifecycle, audit verify).

## Key risks
| Risk | Mitigation |
|---|---|
| A table ships without RLS | Catalog test fails CI if any table with `tenant_id` lacks ENABLE+FORCE RLS or composite PK |
| Audit chain contention | Per-tenant advisory lock; volume is low; benchmark in TC |
| Platform role becomes a backdoor | Platform role touches only `tenants`, lifecycle and purge paths; every use audited; no SELECT on tenant data tables |
| Purge deletes the wrong tenant | Two-step (pending_deletion → purge after grace), tenant slug confirmation, dry-run mode, audit before delete |

## Phase documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: P04-T01…T15 merged; migrations 0010–0021 applied on empty and seeded DBs
- [ ] Tests: all P04-TC executed with real evidence in TEST_RESULTS.md; isolation suite green
- [ ] RLS catalog test and audit chain verifier required in CI
- [ ] Docs: DATABASE_SCHEMA.md, TENANCY.md, RUNBOOKS.md, OpenAPI updated
- [ ] Security review: RLS, DB roles, platform role usage, purge path, audit immutability
- [ ] CHANGELOG.md updated
- [ ] Acceptance sign-off recorded in ACCEPTANCE.md
- [ ] Stopped at the phase boundary: no identity/authz (Phase 05) work started
