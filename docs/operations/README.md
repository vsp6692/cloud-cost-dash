# CloudLedger Operations Guide

Status: **DRAFT plan**. No application code, tooling, dashboards or runbooks exist yet. Everything here is a target design for operators (persona PER-08, journey UJ-10). Requirements are delivered mainly in Phase 03 (configuration, baseline telemetry), Phase 12 (ingestion health), Phase 33 (HA, backups, DR, observability) and Phase 34 (SLO gates).

CloudLedger is **source-available**, not open source. Operating it for your own and your affiliates' cloud costs is free. Operating it as a hosted or managed service for third parties needs a commercial license. See [docs/legal](../legal/README.md) and [LICENSE_FAQ.md](../../LICENSE_FAQ.md). Nothing in these operations documents changes license terms.

## Document map

| Document | Contents | Primary requirements | Delivered in |
|---|---|---|---|
| [SLOS.md](SLOS.md) | SLIs and SLOs per deployment profile, error budgets, burn-rate alerting, measurement | NFR-AVL-001, NFR-PERF-001/002, NFR-FRS-001, FR-BUD-006 | 12, 33, 34 |
| [OBSERVABILITY.md](OBSERVABILITY.md) | OpenTelemetry conventions, `cloudledger_*` metric catalog, log schema and redaction, dashboards, alert rules | FR-OPS-002, NFR-OBS-001, ADR-0017 | 03, 12, 33 |
| [BACKUP_DR.md](BACKUP_DR.md) | Backup scope and schedules, RPO/RTO, restore procedures, automated restore verification, DR scenarios, drills, chaos tests | FR-OPS-003, NFR-AVL-001, AC-07 | 33 |
| [CONFIGURATION.md](CONFIGURATION.md) | Planned configuration key catalog (env vars and YAML), defaults, secrets handling | FR-OPS-001, NFR-SEC-003 | 03 (finalized), every phase adds keys |
| [UPGRADES_AND_MIGRATIONS.md](UPGRADES_AND_MIGRATIONS.md) | Expand/contract migrations, rolling upgrades, N-1 compatibility, analytics re-normalization, rollback by restore | FR-OPS-004, [COMPATIBILITY.md](../contracts/COMPATIBILITY.md) | 04, 13, 33, 38 |
| [RUNBOOKS.md](RUNBOOKS.md) | Runbook index and outlines for the planned on-call scenarios | FR-OPS-002/003, NFR-SEC-001 | 12, 33, 34 |

## Related documents

| Topic | Document |
|---|---|
| Deployment profiles (Lite / Standard / HA Enterprise) | [DEPLOYMENT_PROFILES.md](../architecture/DEPLOYMENT_PROFILES.md) |
| Containers and run modes (`api`, `worker`, `scheduler`, `migrate`, `admin`) | [architecture/README.md](../architecture/README.md), [SYSTEM_CONTEXT.md](../architecture/SYSTEM_CONTEXT.md) |
| Tenancy, isolation, tenant lifecycle | [TENANCY.md](../architecture/TENANCY.md) |
| Ingestion stages, error classes, health | [INGESTION_PIPELINE.md](../architecture/INGESTION_PIPELINE.md) |
| Analytics engines and adapter contract | [ANALYTICS_ADAPTERS.md](../architecture/ANALYTICS_ADAPTERS.md) |
| Control-plane schema and retention defaults | [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) |
| Versioning and upgrade promises | [COMPATIBILITY.md](../contracts/COMPATIBILITY.md) |
| Vulnerability reporting | [SECURITY.md](../../SECURITY.md) |
| Contributor setup, standards, tests | [docs/contributors](../contributors/README.md) |

## Operating principles

1. **Correctness over availability for money.** When an invariant fails, the previous live partition stays served and the new data is quarantined. Serving stale but correct numbers with a freshness indicator beats serving wrong numbers.
2. **Tenant isolation is never traded for convenience.** Platform operators have no implicit data access. Break-glass access is time-boxed and audited ([TENANCY.md §1](../architecture/TENANCY.md)).
3. **No phone-home.** Telemetry leaves the deployment only to destinations the operator configures. Anonymous usage metrics are opt-in (OQ-17).
4. **Everything observable has an owner.** Each alert links to a runbook in [RUNBOOKS.md](RUNBOOKS.md). An alert without a runbook does not ship.
5. **Restores are tested, not assumed.** Backups count only once an automated restore verification has passed ([BACKUP_DR.md §6](BACKUP_DR.md)).
6. **Operational limits are not license limits.** Quotas, rate limits and concurrency caps protect the deployment. They are operator-configurable and never gate features (NFR-LIC-004).

## Status and evidence

None of the SLOs, alerts, backups or drills described here have been implemented or measured. Phase `TEST_RESULTS.md` files are the only valid source of measured evidence, and every entry stays `NOT RUN` until actually executed.
