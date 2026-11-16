# Phase 04 — Tenancy schema, migrations, audit foundation: Implementation plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

| ID | Task | Files | Size | Reqs |
|---|---|---|---|---|
| P04-T01 | RLS helper + catalog test (fails if any `tenant_id` table lacks ENABLE/FORCE RLS, composite PK or has an un-allow-listed policy) — written first, so later migrations are checked | `0012_rls_helpers.sql`, `tests/integration/migrations/rls_catalog_test.go` | S | R02 |
| P04-T02 | `tenants`, `tenant_settings`, platform tenant seed | `0010_*.sql`, `0011_*.sql` | S | R01 |
| P04-T03 | `WithTenantTx`, `WithPlatformTx`, `TenantContext`, testauth principal injector | `internal/platform/db/`, `internal/platform/httpserver/testauth/` | M | R03, R13 |
| P04-T04 | Audit chain writer, canonical JSON, verifier, partitions, immutability trigger | `0014_*.sql`, `internal/audit/` | L | R08 |
| P04-T05 | Anchors job + `admin audit verify` CLI | `0015_*.sql`, `internal/audit/anchor.go`, `cmd/cloudledger/admin/audit.go` | M | R09 |
| P04-T06 | Outbox table, publisher, relay, CloudEvents encoder, event JSON schemas | `0016_*.sql`, `internal/platform/outbox/`, `schemas/events/tenant.*.v1.json` | M | R10 |
| P04-T07 | PG job queue + worker loop + reaper + metrics | `0017_*.sql`, `internal/platform/jobs/pg/` | L | R11 |
| P04-T08 | Tenant DEKs and crypto wrapper | `0019_*.sql`, `internal/platform/crypto/` | M | R05 |
| P04-T09 | Tenant lifecycle service + CLI (create/list/suspend/resume/delete/restore) | `internal/tenants/lifecycle.go`, `cmd/cloudledger/admin/tenant.go` | M | R04 |
| P04-T10 | Purge job (batched, resumable, dry-run) | `internal/tenants/purge.go`, `cl.purge_tenant_batch` in `0021_grants.sql` | M | R05 |
| P04-T11 | Tenant export (signed archive) | `internal/tenants/export.go` | M | R06 |
| P04-T12 | Hierarchy versions/nodes service | `0013_*.sql`, `internal/tenants/hierarchy/` | M | R07 |
| P04-T13 | Idempotency store + middleware; break-glass table | `0018_*.sql`, `0020_*.sql`, `internal/platform/idempotency/` | S | R12, R14 |
| P04-T14 | HTTP handlers for `x-phase: "04"` operations, 401 in non-test builds, OpenAPI conformance | `internal/tenants/http/`, `internal/audit/http/` | M | R13 |
| P04-T15 | Isolation suite, migration up/seeded tests, docs (DATABASE_SCHEMA, TENANCY, RUNBOOKS), CHANGELOG | `tests/integration/isolation/`, docs | M | R15, R16 |

## Migrations
`0010`–`0021` as in [DESIGN.md §2](DESIGN.md#2-data-model-and-migrations). `0022`–`0049` reserved. Forward-only; each file has a header comment describing its compensating migration (e.g. `0020` → drop table if empty).

## Feature flags
`features.audit_anchors` (default on; off only for unit-test profiles), `tenancy.deletion_grace` (default `720h`), `audit.anchor_interval` (default `1h`). No flag can disable RLS.

## Rollout / rollback
- Rollout: migrations via `cloudledger migrate up` (one-shot job in Compose). No production data exists yet.
- Rollback: binary rollback is N-1 compatible (no column drops). Schema rollback = compensating forward migration or restore from backup; documented in RUNBOOKS.

## Definition of done
All tasks merged; `make lint test test-integration` (planned) green; RLS catalog test and audit verifier required in CI; TEST_RESULTS filled with real runs; docs updated; no Phase 05 work.
