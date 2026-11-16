# Phase 04 — Tenancy schema, migrations, audit foundation: API contracts

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Operations with `x-phase: "04"` in [`cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml), following [API_GUIDELINES](../../contracts/API_GUIDELINES.md) (frozen-v0.1). **Authentication is Phase 05**: until then, every route below returns `401 unauthenticated` in non-test builds; integration tests use the `testauth` injector. Permission names follow [AUTHORIZATION_MODEL.md §3](../../security/AUTHORIZATION_MODEL.md) and are enforced from Phase 05.

## Endpoints
| Method | Path | Request → Response | Errors | Permission |
|---|---|---|---|---|
| GET | `/api/v1/admin/tenants` | `filter[status]`, cursor → `{data:[Tenant], next_cursor}` | 401, 403 | `tenants.manage` (platform) |
| POST | `/api/v1/admin/tenants` | `{slug, display_name, kind, data_region?}` + `Idempotency-Key` → `201 Tenant` (status `active` after provisioning) | 409 `conflict` (slug), 422 | `tenants.manage` |
| GET | `/api/v1/admin/tenants/{id}` | → `Tenant` + ETag | 404 | `tenants.manage` |
| PATCH | `/api/v1/admin/tenants/{id}` | `{display_name?, status: active|suspended}` + `If-Match` → `Tenant` | 409 illegal transition, 412, 422 | `tenants.manage` |
| DELETE | `/api/v1/admin/tenants/{id}` | `If-Match` → `202` (status `pending_deletion`, `purge_after`) | 409, 412 | `tenants.manage` |
| GET / PATCH | `/api/v1/settings` | → `TenantSettings`; PATCH JSON merge + `If-Match` | 412, 422 (currency, timezone, calendar) | `settings.read` / `settings.write` |
| GET / POST | `/api/v1/hierarchy/versions` | list; create draft `{effective_from}` | 422 | `hierarchy.read` / `hierarchy.write` |
| GET / PATCH | `/api/v1/hierarchy/versions/{id}` | get; patch draft only | 409 `conflict` if published | same |
| GET / POST | `/api/v1/hierarchy/nodes` | `filter[version_id]`; create `{version_id, parent_id?, key, name, node_type, attributes}` | 409 duplicate key, 422 cycle | same |
| GET / PATCH / DELETE | `/api/v1/hierarchy/nodes/{id}` | ETag / If-Match | 404, 409 published, 412 | same |
| GET | `/api/v1/audit-events` | `filter[action]`, `filter[from]`, `filter[to]`, cursor → `{data:[AuditEvent], next_cursor}` (hashes included) | 422 range | `audit.read` |

`POST /api/v1/hierarchy/versions/{id}:publish` is `x-phase: "11"` in OpenAPI; Phase 04 publishes via service/CLI only. `POST /api/v1/audit-events:verify` is Phase 30; Phase 04 ships `cloudledger admin audit verify`.

Cross-tenant: any `{id}` belonging to another tenant → `404 not_found`. Suspended tenant → `403 tenant_suspended` (new code; added to the API_GUIDELINES code list via change request).

## CLI (operator contract)
`cloudledger admin tenant create --slug --name --kind`, `list`, `suspend|resume|delete|restore <slug>`, `purge <slug> [--dry-run] --confirm <slug>`, `export <slug> --out <file>`; `cloudledger admin audit verify [--tenant <slug>] [--from-seq]` (exit 0 ok, 3 chain broken, 4 anchor mismatch).

## Events ([EVENTS.md](../../contracts/EVENTS.md))
| Type | Data | Idempotency key |
|---|---|---|
| `dev.cloudledger.tenant.created.v1` | `{tenant_id, slug, kind}` | tenant id |
| `dev.cloudledger.tenant.deleted.v1` | `{tenant_id, purged_at}` | tenant id |
| `dev.cloudledger.audit.anchor.written.v1` | `{tenant_id, seq, head_hash, storage_uri}` | tenant + seq |

## Internal interfaces
`db.WithTenantTx(ctx, TenantContext, func(pgx.Tx) error)`, `audit.Writer.Append(tx, Event)`, `outbox.Publish(tx, CloudEvent)`, `jobs.Queue.Enqueue(ctx, tx, Job)` (transactional enqueue), `tenants.API` (exported module interface).
