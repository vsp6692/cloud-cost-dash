# ADR-0003: PostgreSQL control plane with shared-schema multi-tenancy and Row-Level Security

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Tenants must be strictly isolated while supporting up to ~1000 tenants per deployment. Options are database-per-tenant, schema-per-tenant, or a shared schema.

## Decision
Use a shared schema in which every tenant-owned table has `tenant_id UUID NOT NULL`, composite primary and foreign keys that include `tenant_id`, and PostgreSQL RLS policies `USING (tenant_id = current_setting('app.tenant_id')::uuid)`. The application connects as a non-owner role without `BYPASSRLS`. Each transaction does `SET LOCAL app.tenant_id`. Platform-admin operations use a separate role and are audited.

## Alternatives considered
- DB-per-tenant: rejected because of migration fan-out and connection overhead.
- Schema-per-tenant: rejected because of catalog bloat at 1000 tenants and complex migrations.

## Consequences
- Defense in depth: app filters + RLS.
- Composite keys prevent cross-tenant FK references.
- Tests must assert that RLS is enabled on every tenant table (catalog check in CI).
- Tenant-level export and deletion require explicit tooling.
