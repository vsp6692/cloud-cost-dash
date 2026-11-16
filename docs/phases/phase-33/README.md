# Phase 33: HA, Backups, DR and Observability

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.9 (phases 31–37) |
| Depends on | Phase 12 (ingestion health, checkpoints, idempotent replay), Phase 13 (analytics adapters, ClickHouse), Phase 30 (period close, WORM snapshots, report manifests); foundations from 03 (telemetry baseline) and 04 (tenant keys, audit chain) |
| Blocks | Phase 34 (SLO gates run on the HA reference deployment), Phase 38 (AC-07 operations gate), Phase 39 (HA install guide) |
| Primary PRD requirements | FR-OPS-001…004, FR-TEN-004, NFR-AVL-001, NFR-OBS-001, NFR-PRIV-001, UJ-10, AC-07 |
| Primary verification | Automated restore verification passes against RPO/RTO; chaos experiments CH-01…CH-13 meet expected outcomes; tenant purge verified by crypto-shredding checks |

> **Implementation status:** no code, charts, dashboards or drills exist. CloudLedger is source-available; nothing in this phase changes license terms. Operational quotas and limits are operator protections, never license limits (NFR-LIC-004).

## Goal

Make Standard and HA Enterprise deployments survivable and observable: HA Helm values, autoscaling and disruption budgets; PostgreSQL HA with PITR; ClickHouse replication; immutable object storage for close snapshots; automated, **verified** backup and restore that meets the RPO/RTO in [BACKUP_DR.md](../../operations/BACKUP_DR.md); chaos experiments; shipped Grafana dashboards and Prometheus alert rules, each linked to a runbook; and the tenant deletion/crypto-shredding process (FR-TEN-004).

## Scope

1. Helm `values-ha.yaml`: replicas, topology spread across zones, anti-affinity, PodDisruptionBudgets, HPA (api, web) and KEDA (worker pools on queue depth), scheduler leader election, graceful shutdown and preStop drain.
2. PostgreSQL: CloudNativePG cluster manifests (Standard/HA) or managed-PG guidance (RDS/Aurora, Cloud SQL, Azure Flexible Server); continuous WAL archiving (RF-21), PITR, synchronous replica for HA.
3. ClickHouse: replicated tables via ClickHouse Keeper (3 nodes), `ReplicatedReplacingMergeTree`/`ReplicatedAggregatingMergeTree` DDL variants in the ClickHouse adapter migrations, backup via `BACKUP … TO S3` (or clickhouse-backup, MIT).
4. Object storage: versioning everywhere; object lock (compliance mode) for close snapshots and report manifests; cross-region replication guidance for HA.
5. `cloudledger admin backup|restore|verify-restore` (planned commands), backup manifests, `restore-verify` CronJob implementing all checks in BACKUP_DR §6.
6. Zero-downtime upgrades: expand/contract migration checks, N-1 binary compatibility test in CI (FR-OPS-004 part; certification in Phase 38).
7. Chaos experiments CH-01…CH-13 (Chaos Mesh on kind/reference cluster; Toxiproxy in CI).
8. Observability: 15 Grafana dashboards and the alert-rule catalog of [OBSERVABILITY.md §5–6](../../operations/OBSERVABILITY.md), `promtool` rule unit tests, SLO recording rules and burn-rate alerts per [SLOS.md](../../operations/SLOS.md), runbook links (RB-01…RB-12).
9. Tenant lifecycle completion: grace period, purge job, tenant-key destruction, deletion register, `tenant reconcile-deletions` after restore, verification job; tenant export signed archive; single-tenant restore procedure (BACKUP_DR §5.7).
10. Key rotation tooling (`admin keys rewrap`, `admin keys rotate-tenant`) and RB-07.

## Out of scope

- Performance SLO gate measurement and capacity sizing (Phase 34).
- Multi-region active-active; cross-region failover is a documented DR procedure only (RTO 4 h proposed, BACKUP_DR §9).
- Operating a public SaaS (OQ-15). Third-party hosting requires a commercial license and is not a deliverable.
- Bundling AGPL components: Grafana, Loki, Tempo are **operator-installed** (dashboards ship as JSON); no AGPL subcharts are vendored (RF-16).

## Deliverables

| # | Deliverable | Path |
|---|---|---|
| D1 | HA values, PDBs, HPA/KEDA, topology | `deploy/helm/cloudledger/values-ha.yaml`, `templates/{pdb,hpa,scaledobject}-*.yaml` |
| D2 | PG HA + PITR manifests and managed-DB guide | `deploy/helm/cloudledger/templates/cnpg-cluster.yaml`, `docs/operations/BACKUP_DR.md` (updates) |
| D3 | ClickHouse replication migrations | `database/clickhouse/migrations/` |
| D4 | Backup/restore/verify commands and CronJobs | `internal/ops/backup/`, `cmd/cloudledger` (`admin` subcommands) |
| D5 | Chaos experiments | `tests/chaos/` |
| D6 | DR and restore tests | `tests/dr/` |
| D7 | Dashboards and alert rules + rule tests | `deploy/observability/grafana/dashboards/`, `deploy/observability/prometheus/rules/` |
| D8 | Tenant purge, crypto-shredding, verification | `internal/tenants/purge/`, `internal/crypto/keys/` |
| D9 | Runbooks RB-01…RB-12 finalized | `docs/operations/RUNBOOKS.md` |
| D10 | Phase docs, CHANGELOG | this directory, `CHANGELOG.md` |

## Key risks

| Risk | Mitigation |
|---|---|
| Restore that "succeeds" but yields wrong money | BACKUP_DR §6 checks include exact control totals and audit-chain verification |
| Analytics and control plane restored to different points | Data-version reconciliation after restore; analytics rebuild from raw is always possible (BACKUP_DR §1) |
| Deleted tenant data resurrected by restore | Deletion register + `reconcile-deletions` mandatory post-restore step; TC covers it |
| Normalized rows in PG/ClickHouse backups are not DEK-encrypted (RF-22) | Documented; backup retention bounds exposure; DPIA records it |
| Chaos on shared CI is flaky | Run full chaos suite on a dedicated reference cluster nightly; CI runs Toxiproxy subset |

## Links

[BACKUP_DR.md](../../operations/BACKUP_DR.md) · [SLOS.md](../../operations/SLOS.md) · [OBSERVABILITY.md](../../operations/OBSERVABILITY.md) · [RUNBOOKS.md](../../operations/RUNBOOKS.md) · [UPGRADES_AND_MIGRATIONS.md](../../operations/UPGRADES_AND_MIGRATIONS.md) · [DEPLOYMENT_PROFILES.md](../../architecture/DEPLOYMENT_PROFILES.md) · [TENANCY.md](../../architecture/TENANCY.md) · [SECRETS_AND_KEYS.md](../../security/SECRETS_AND_KEYS.md) · [ADR-0005](../../architecture/adr/0005-postgresql-backed-durable-job-queue-and.md) · [ADR-0010](../../architecture/adr/0010-immutable-content-addressed-raw-storage-and.md) · [ADR-0017](../../architecture/adr/0017-opentelemetry-native-observability.md) · [REVIEW_FINDINGS](../../planning/REVIEW_FINDINGS.md) (RF-16, RF-20…22) · [Phase 34](../phase-34/README.md)

## Completion checklist

- [ ] Code: all `P33-T*` merged (charts, commands, purge, dashboards, rules)
- [ ] Tests: every `P33-TC*` executed and recorded in [TEST_RESULTS.md](TEST_RESULTS.md) with real commands, timings and evidence
- [ ] Docs: BACKUP_DR, OBSERVABILITY, RUNBOOKS, CONFIGURATION updated; HA install notes drafted for Phase 39
- [ ] Security review: purge/crypto-shredding, backup encryption and break-glass restore reviewed by `security` owner
- [ ] CHANGELOG `Unreleased` entry added
- [ ] Acceptance sign-off in [ACCEPTANCE.md](ACCEPTANCE.md)
- [ ] Stopped at phase boundary: no Phase 34 work included
