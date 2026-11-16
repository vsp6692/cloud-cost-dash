# CloudLedger Architecture

Status: **DRAFT**, to be ratified in Phase 02. No code exists yet. This describes the target architecture.

## Document map

| Topic | Document |
|---|---|
| System context, containers, components | [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) |
| Data flows (ingestion → normalization → allocation → analytics → UI/AI) | [DATA_FLOW.md](DATA_FLOW.md) |
| Deployment profiles (Lite / Standard / HA Enterprise) | [DEPLOYMENT_PROFILES.md](DEPLOYMENT_PROFILES.md) |
| Trust boundaries | [TRUST_BOUNDARIES.md](TRUST_BOUNDARIES.md) |
| Tenancy model and isolation | [TENANCY.md](TENANCY.md) |
| Control-plane database schema and ERD | [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) |
| Analytics store schema and adapter contract | [ANALYTICS_ADAPTERS.md](ANALYTICS_ADAPTERS.md) |
| Ingestion pipeline | [INGESTION_PIPELINE.md](INGESTION_PIPELINE.md) |
| FOCUS normalization | [FOCUS_NORMALIZATION.md](FOCUS_NORMALIZATION.md) |
| Allocation engine | [ALLOCATION_ENGINE.md](ALLOCATION_ENGINE.md) |
| Finance reconciliation, FX, period close | [FINANCE_RECONCILIATION.md](FINANCE_RECONCILIATION.md) |
| Resource inventory and telemetry | [RESOURCE_INVENTORY.md](RESOURCE_INVENTORY.md) |
| Recommendation engine | [RECOMMENDATION_ENGINE.md](RECOMMENDATION_ENGINE.md) |
| Budgets, forecasting, anomalies, alerts | [FORECASTING_ANOMALIES.md](FORECASTING_ANOMALIES.md) |
| LLM gateway and AI security | [LLM_SECURITY.md](LLM_SECURITY.md) |
| Architecture Decision Records | [adr/](adr/README.md) |
| API, SDK, event and compatibility contracts | [../contracts/](../contracts/README.md) |
| Security architecture and threat model | [../security/](../security/README.md) |
| Provider integrations | [../providers/](../providers/README.md) |

## Architectural summary

CloudLedger is a **Go modular monolith** (one binary, multiple run modes) with a **Next.js** web front end:

```
cloudledger api       # REST/OpenAPI server (stateless, horizontally scalable)
cloudledger worker    # job runner: ingestion, normalization, allocation, recs, alerts, reports
cloudledger scheduler # leader-elected cron producer (can run inside worker in Lite)
cloudledger migrate   # schema migrations (control plane + analytics)
cloudledger admin     # operations: backup/restore/verify, tenant export/delete, key rotation, audit verify
```

Boundaries between modules (`internal/<module>`) are enforced with Go package visibility and an import-lint rule. Modules talk through Go interfaces in-process and through the **outbox → event bus** for asynchronous work. A module can be extracted into a separate service later without changing its contracts (ADR-0001).

### Storage responsibilities

| Store | Holds | Never holds |
|---|---|---|
| **PostgreSQL (control plane)** | tenants, users, roles, policies, connectors, secret *references*, checkpoints, job queue, rule definitions, dashboards, recommendations (state), budgets, audit log, report manifests | bulk cost rows (except in Lite profile, where the PG analytics adapter uses a separate schema) |
| **Analytics store** (PostgreSQL / DuckDB / ClickHouse) | normalized cost (FOCUS), allocated cost, inventory snapshots, metrics rollups, aggregates | credentials, user data beyond IDs |
| **Object storage** (S3/GCS/Blob/MinIO) | raw source files (immutable, content-addressed), staged Parquet, exports, report artifacts, backups | unencrypted secrets |
| **Secret backends** | cloud credentials where static ones are unavoidable, KEKs | |

### Key quality attributes and the tactics that address them

| Attribute | Tactics |
|---|---|
| Correctness of money | fixed-point decimals end-to-end (`NUMERIC(38,12)` / `Decimal(38,12)` / DuckDB `DECIMAL(38,12)`), golden datasets, invariant checks after every pipeline stage, reconciliation |
| Tenant isolation | `tenant_id` on every row, PostgreSQL RLS, mandatory predicate injection in the semantic compiler, ClickHouse row policies, per-tenant object prefixes and keys, isolation test suite |
| Auditability | immutable raw files, lineage IDs on every row, versioned mappings and rules, hash-chained audit log, period-close manifests |
| Extensibility | provider, recommendation, pricing and dashboard SDKs with capability manifests and compatibility suites |
| Scalability | stateless API, partitioned work units (connector × scope × period), columnar analytics, pre-aggregations |
| Operability | single binary, three deployment profiles, OpenTelemetry, health and readiness endpoints, runbooks |

## Top architectural risks

The full list is in the [risk register](../planning/RISK_REGISTER.md).

| ID | Risk | Mitigation |
|---|---|---|
| R-01 | Semantic drift between three analytics engines (decimal rounding, NULL handling, time zones) | single semantic compiler, contract-parity suite, UTC-only storage, explicit rounding |
| R-02 | Provider schema changes (CUR column additions, Azure export versions) | schema-version detection, quarantine, mapping versioning, contract fixtures per version |
| R-03 | Double counting savings across overlapping recommendations | overlap-resolution algorithm with invariants and property-based tests |
| R-04 | Cross-tenant leakage through caches, exports or AI | tenant-keyed caches, RLS, attack suite, AI tools via the authorized API only |
| R-05 | Scale of backfills (billions of rows) overwhelming workers | chunked work units, back-pressure, partitioned writes, staging tables |
| R-06 | Inaccessible provider data (entitlements, agreement types) | capability discovery and explicit "unavailable" states, no assumptions |
| R-07 | Scope creep across 40 phases | strict phase gates, release checkpoints, definition of done |
