# Phase 04 — Tenancy schema, migrations, audit foundation: Requirements

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Priority: M = must, S = should. Security IDs from [docs/security](../../security/README.md).

| ID | Requirement | Traces to | Pri | AC |
|---|---|---|---|---|
| P04-R01 | `tenants` (kind individual/organization, status, slug, optional `parent_tenant_id`, `data_region`) and `tenant_settings` (reporting currency, FX policy, accounting calendar incl. fiscal year start, timezone, retention, AI settings, `default_cost_metric`, `data_egress_policy`) exist per DATABASE_SCHEMA with F-06 fixed. Defaults: USD, `charge_date`, gregorian, UTC, AI disabled. | FR-TEN-001, 002, 007, OQ-09, OQ-16 | M | P04-AC01 |
| P04-R02 | Every tenant-owned table has `tenant_id NOT NULL`, PK leading with `tenant_id`, composite FKs `(tenant_id, x_id)`, and RLS ENABLED **and** FORCED with the standard `tenant_isolation` policy. Exceptions (`tenants`, global catalogs) are listed in an allow-list with reason. | FR-TEN-001, NFR-SEC-001, ADR-0003, SEC-ISO-* | M | P04-AC02 |
| P04-R03 | The application connects as `cloudledger_app` (no BYPASSRLS, not owner). `WithTenantTx(ctx, tenantID, fn)` runs `SET LOCAL app.tenant_id` in every transaction; repositories cannot be called without a `TenantContext` (compile-time); a transaction without `app.tenant_id` sees zero tenant rows and cannot insert. | NFR-SEC-001, TENANCY §2 | M | P04-AC02 |
| P04-R04 | Tenant lifecycle per TENANCY §3: provisioning → active ↔ suspended → pending_deletion (grace default 30 d) → deleted; restore during grace; illegal transitions rejected. Suspended tenants: API returns `403 tenant_suspended`, jobs are not leased. | FR-TEN-004 | M | P04-AC03 |
| P04-R05 | Purge job deletes all tenant rows and object-storage prefixes, then destroys the tenant DEK (crypto-shredding); runs only after grace expiry, is idempotent and resumable, records `tenant.deleted.v1` and a platform audit event. | FR-TEN-004, NFR-PRIV-001, KEY-* | M | P04-AC03 |
| P04-R06 | `cloudledger admin tenant export` produces a signed archive (tenant, settings, hierarchy, audit chain) with a manifest of SHA-256 hashes. | FR-TEN-004, NFR-PRIV-001 | S | P04-AC04 |
| P04-R07 | Hierarchy versions and nodes (ltree paths): create draft, edit nodes, publish (immutable thereafter), effective dating; unique key per version; cycles rejected. | FR-TEN-003 (Phase 04 part) | M | P04-AC05 |
| P04-R08 | Audit log per ADR-0014: insert-only (grants + trigger rejecting UPDATE/DELETE), per-tenant monotonic `seq`, `hash = SHA-256(canonical_json(event) ‖ prev_hash)`, written in the same transaction as the audited change; PK fixed per F-01; platform events use the reserved platform tenant UUID. | FR-AUD-001, SEC-AUD-*, ADR-0014 | M | P04-AC06 |
| P04-R09 | Chain-head anchors are written periodically to object storage (WORM/object lock where available; MinIO/local FS in Lite) and emit `audit.anchor.written.v1`; `cloudledger admin audit verify [--tenant]` detects modification, deletion, reordering and anchor mismatch. | FR-AUD-001, ADR-0014 | M | P04-AC06 |
| P04-R10 | Transactional outbox: events written in the domain transaction, relayed at-least-once to in-process subscribers and job enqueues, CloudEvents 1.0 envelope with `tenantid` and `traceparent`; `tenant.created.v1`, `tenant.deleted.v1` produced. | ADR-0005, EVENTS.md | M | P04-AC07 |
| P04-R11 | PG job queue implements `jobs.Queue`: `SKIP LOCKED` leasing, lease expiry and re-delivery, exponential backoff with jitter, unique active keys, `discarded` as DLQ, priority, cancellation; worker sets tenant context from the payload before any DB access and rejects payload/tenant mismatch. | OQ-05, ADR-0005, FR-ING-004 (foundation) | M | P04-AC07 |
| P04-R12 | Idempotency store `(tenant, principal, key) → (request hash, response)` for 24 h with replay header and `409 idempotency_key_reuse`. | API_GUIDELINES §6 | S | P04-AC08 |
| P04-R13 | HTTP handlers for Phase 04 operations follow API_GUIDELINES (Problem Details, ETag/If-Match, cursor pagination); path or header tenant mismatch → `404`; in non-test builds all non-health routes return `401` until Phase 05. | API_GUIDELINES, TENANCY §2 | M | P04-AC08 |
| P04-R14 | Platform admins have no implicit data access: the `cloudledger_platform` role is limited to `tenants`, lifecycle, purge and anchor paths; `break_glass_grants` table (time-boxed, justified) is designed and audited; usage is enforced in Phase 05. | SP-04, TENANCY §1 | M | P04-AC09 |
| P04-R15 | Migrations are forward-only, apply on an empty DB and on a DB seeded with previous-phase data, pass `migrate lint`, and each has a documented compensating path. | DATABASE_SCHEMA conventions, FR-OPS-004 (foundation) | M | P04-AC10 |
| P04-R16 | Logs and spans carry `tenant_id` and `trace_id`; `tenant_id` never appears as a metric label; no settings values or secrets logged at INFO. | NFR-OBS-001, ADR-0017 | S | P04-AC10 |

## Additional explicit PRD coverage

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P04-R90 | Support individual and organizational tenants with common isolation and lifecycle guarantees. | FR-TEN-002 | M | P04-AC90 |
