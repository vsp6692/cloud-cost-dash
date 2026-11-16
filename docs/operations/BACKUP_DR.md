# Backup, Restore and Disaster Recovery

Status: **DRAFT plan**. No backup tooling, restore automation or drills exist yet. Requirements: FR-OPS-003, NFR-AVL-001, FR-TEN-004, AC-07. Delivered in Phase 33 (Lite `admin backup` may arrive earlier with Phase 04 migrations). Verified by restore and chaos tests in Phase 33 and SLO gates in Phase 34.

## 1. Principles

1. **A backup exists only after a restore from it has been verified.** Every profile except Lite runs automated restore verification (§6).
2. **Keys are backed up separately from data.** A KEK must never be stored in the same location, account or credentials scope as the data it protects.
3. **Analytics is derivable.** The analytics store can be rebuilt from immutable raw objects plus control-plane state (mapping versions, rule-set versions, FX rate sets). Analytics backups exist to shorten RTO, not because the data is irreplaceable.
4. **Closed periods are immutable.** Period-close snapshots and report manifests live in object storage with WORM retention (HA) and are never overwritten by a restore.
5. **Deletion is honored after restore.** Restoring an older backup must not resurrect tenants that were purged since (§5.6).
6. **Restores are tenant-wide by default.** Single-tenant restore is a separate, audited procedure because the control plane uses a shared schema (ADR-0003).

## 2. Backup scope

| Asset | Contents | Criticality | Backup method (planned) | Not backed up |
|---|---|---|---|---|
| **PostgreSQL control plane** | tenants, identity, roles and policies, connectors and secret references, envelope-encrypted secrets (wrapped DEKs), checkpoints, job queue, outbox, rules, dashboards, recommendation state, budgets, invoices, reconciliation, period metadata, audit log, report manifests | critical | physical base backups + continuous WAL archiving (pgBackRest, CloudNativePG Barman, or managed PITR). Lite: `cloudledger admin backup` (logical `pg_dump` custom format + manifest) | unlogged staging tables |
| **Analytics: PostgreSQL schema** (Lite default) | `cost_focus`, `cost_allocated`, aggregates, inventory, metrics rollups | high (derivable) | included in the control-plane backup in Lite; excluded via flag `backup.analytics.include_in_pg` when rebuild is preferred | materialized views (rebuilt) |
| **Analytics: DuckDB** (Lite option) | one database file per tenant | high (derivable) | `CHECKPOINT` then file copy to object storage by `cloudledger admin backup` | WAL files mid-write |
| **Analytics: ClickHouse** (Standard/HA) | same logical tables, partitioned by `(tenant_id, month)` | high (derivable) | native `BACKUP … TO S3(…)` (full weekly, incremental daily) or `clickhouse-backup`. HA relies on replication for node loss and backups for logical loss | `system.*` tables, staging tables, rollups (rebuildable) |
| **Object storage: raw** | content-addressed raw provider files `raw/{tenant}/…` | critical (source of truth for re-derivation) | bucket versioning + lifecycle; HA: cross-region replication; Lite: `mc mirror` of the MinIO volume to a second location | — |
| **Object storage: close snapshots and report artifacts** | period snapshots, manifests, exports, scheduled report outputs | critical (audit evidence) | versioning + object lock (compliance mode, retention per tenant policy, default 7 years) in HA; versioning in Standard | expired exports past retention |
| **Object storage: staged Parquet** | intermediate staging | low | not backed up (regenerated) | all |
| **KEKs** | key-encryption keys for envelope encryption | critical (loss = unrecoverable secrets and per-tenant DEK-protected artifacts) | Lite: KEK file copied by the operator to an offline or password-manager location at install and every rotation. Standard: external secret store (ESO) backup per that store. HA: cloud KMS or Vault; keys are non-exportable, protected by deletion windows, multi-region keys and Vault snapshots | never in the PG backup |
| **Externally referenced secrets** | Vault / AWS SM / GCP SM / Azure KV entries | high | the secret store's own backup and versioning | not copied by CloudLedger |
| **Configuration** | Helm values, Compose files, YAML config (no secrets) | medium | GitOps repository | secrets |
| **Audit anchors** | periodic hash-chain anchors (`audit.anchor.written.v1`) | high | written to object storage (WORM in HA) to verify chain integrity after restore | — |
| **Tenant deletion register** | IDs and purge timestamps of purged tenants | high | appended to object storage (WORM in HA) at purge time, outside the PG backup scope | — |
| **Telemetry** | metrics, traces, logs | low | operator choice | — |

Encryption: all backups are encrypted at rest (storage-provider encryption plus pgBackRest/ClickHouse repository encryption where supported) and in transit (TLS). Backup credentials are write-only from the application side where the storage supports it, and deletion of backups requires a separate principal.

## 3. Schedules per profile

| Asset | Lite | Standard | HA Enterprise |
|---|---|---|---|
| PG full / base backup | daily logical dump 02:00 local | weekly full, daily differential | weekly full, daily incremental (or managed automated backups) |
| PG WAL archiving | none | continuous, `archive_timeout` 300 s | continuous, `archive_timeout` 60 s, synchronous standby in a second AZ |
| PG point-in-time window | — | 7 days | 35 days |
| Analytics backup | with PG dump (PG analytics) or DuckDB file copy daily | ClickHouse full weekly, incremental daily | ClickHouse full weekly, incremental every 6 h; replicas ≥ 2 per shard |
| Object storage | MinIO mirror daily | versioning; noncurrent versions retained 30 days | versioning, cross-region replication (continuous), object lock for close snapshots |
| KEK copy check | at install and rotation (manual) | monthly automated check that the KEK backup reference resolves | monthly automated check, KMS key deletion protection alarm |
| Backup retention | 7 daily + 4 weekly | 14 daily + 8 weekly + 12 monthly | 35 days PITR + 12 monthly + 7 yearly (finance) |
| Restore verification | manual monthly (documented command) | weekly, automated | daily (latest backup) + weekly full PITR to random point |
| Cross-region copy | — | optional | required (secondary region) |

Backup retention must also respect tenant deletion: see §5.6 and [Open items](#9-open-items).

## 4. RPO and RTO

Targets from [DEPLOYMENT_PROFILES.md](../architecture/DEPLOYMENT_PROFILES.md) and NFR-AVL-001. Analytics and object-storage targets are **proposed**.

| Asset | Lite RPO / RTO | Standard RPO / RTO | HA RPO / RTO |
|---|---|---|---|
| Control plane (PostgreSQL) | 24 h / best effort (target 4 h with documented procedure) | 1 h / 4 h | **15 min / 1 h** |
| Analytics store, restore from backup | 24 h / best effort | 24 h / 8 h (proposed) | 6 h / 4 h (proposed) |
| Analytics store, rebuild from raw | n/a (data recoverable, duration scales with volume) | measured in Phase 34 | measured in Phase 34 |
| Analytics store, replica loss | n/a | n/a (single node) | 0 / minutes (replica failover) |
| Raw objects | 24 h / best effort | 0 (versioning) / 4 h | ≤ 15 min (replication) / 1 h |
| Close snapshots and manifests | 24 h | 0 (versioning) | 0 (WORM + replication) |

After the control plane is restored, ingestion catches up automatically: checkpoints roll back with the database, discovery re-lists artifacts since the checkpoint, and content addressing plus deterministic artifact IDs make re-fetch idempotent ([INGESTION_PIPELINE.md §1](../architecture/INGESTION_PIPELINE.md)). Billing data lost from the window between backup and failure is therefore re-ingested, not lost, as long as the provider export still holds it.

The Standard 1 h RPO requires continuous WAL archiving. Scheduled base backups alone give a 24 h RPO.

## 5. Restore procedures (outlines)

Full step-by-step runbooks are in [RUNBOOKS.md RB-06](RUNBOOKS.md#rb-06-restore-from-backup). All restores are recorded in the audit log under the platform tenant and require two operators in HA.

### 5.1 Control plane, point-in-time (Standard/HA)
1. Declare the incident and freeze writes: scale `api` to read-only mode (`server.read_only=true`) or zero; scale `worker` and `scheduler` to zero.
2. Choose the recovery target (timestamp or LSN) just before the fault.
3. Restore into a **new** cluster (never overwrite the damaged one; keep it for forensics).
4. Run `cloudledger migrate status` to confirm the schema version matches the binary (or use the matching binary version, see [UPGRADES_AND_MIGRATIONS.md §6](UPGRADES_AND_MIGRATIONS.md)).
5. Run post-restore steps (§5.5).
6. Point the deployment at the new cluster, scale `scheduler` → `worker` → `api` back up, and watch the ingestion catch-up on the Ingestion dashboard.

### 5.2 Lite full restore
1. `cloudledger admin backup list` and pick a backup.
2. Stop the Compose stack. Restore the KEK file from its separate location.
3. `cloudledger admin restore --backup <id>` restores PG (and DuckDB files if used) into fresh volumes.
4. Run post-restore steps (§5.5) and start the stack.

### 5.3 Analytics store
- **ClickHouse replica loss (HA):** replace the node; the replica re-syncs from peers. No restore needed.
- **Logical loss or corruption:** restore the latest ClickHouse backup into new tables, then run `cloudledger admin analytics reconcile`, which compares `billing_period_versions` (control plane) with the partitions present and enqueues re-normalization for any missing or newer versions.
- **No usable backup:** `cloudledger admin analytics rebuild --tenant all --from raw` re-runs normalization from raw objects for every live period version with its recorded `mapping_version`, then rebuilds allocation and aggregates. Results must match the recorded control totals exactly.

### 5.4 Object storage
- Accidental deletion or overwrite: restore the noncurrent version (versioning) or copy from the replica bucket.
- Ransomware or credential compromise: object lock protects close snapshots; restore other prefixes from the replica or versioning after rotating all storage credentials (RB-09).
- After any object restore, run `cloudledger admin objects verify --prefix raw/` to re-hash a sample (or all) objects against their content addresses.

### 5.5 Post-restore steps (all profiles)
| Step | Command (planned) | Purpose |
|---|---|---|
| Re-apply tenant deletion register | `cloudledger admin tenant reconcile-deletions` | re-purge tenants deleted after the backup point (§5.6) |
| Verify audit chain | `cloudledger admin audit verify --all-tenants` | hash chain intact; compare with latest anchors in object storage. A gap between the restore point and the latest anchor is expected and recorded as a platform audit event. |
| Reset in-flight jobs | `cloudledger admin jobs recover` | `running` jobs with expired leases → `retryable`; staging partitions dropped |
| Reconcile analytics | `cloudledger admin analytics reconcile` | live period versions match analytics partitions |
| Invalidate caches | `cloudledger admin cache flush` | bump `data_version` per tenant so no stale cached results are served |
| Verify KEK and secrets | `cloudledger admin secrets verify` | canary DEK unwrap and a sample of secret references resolve |
| Re-run reconciliation | automatic on `cost.period.restated.v1` | finance variances recomputed for affected periods |
| Communicate | — | tenants informed of the recovery point; the UI freshness indicator shows catch-up |

### 5.6 Deleted tenants and restores
Purged tenants are recorded in the deletion register in object storage at purge time. After any restore, `tenant reconcile-deletions` purges any resurrected tenant data again (rows, objects, DEKs). Per-tenant DEK destruction (crypto-shredding, [TENANCY.md §3](../architecture/TENANCY.md)) makes DEK-protected artifacts in older backups unreadable. Normalized cost rows in PG and ClickHouse backups are not DEK-encrypted and remain in backups until backup retention expires.

### 5.7 Single-tenant restore (exceptional)
Used when one tenant's data is damaged (for example by an operator error) and a platform-wide rollback is not acceptable. Restore the backup into an isolated side environment, `cloudledger admin tenant export --tenant <id>` from it, then `cloudledger admin tenant import --replace` into production. Requires two operators, the tenant owner's written approval and a security-owner review, because it moves tenant data between environments. Planned for Phase 33; not available before.

## 6. Automated restore verification

A scheduled `restore-verify` job (planned; Kubernetes CronJob in Standard/HA, a documented manual command in Lite) restores the latest backup into an ephemeral, network-isolated environment and runs these checks:

| Check | Pass condition |
|---|---|
| Restore completes | within the profile RTO; duration recorded |
| Schema version | equals the version recorded in the backup manifest |
| Row counts | per table within 0.1% of the counts captured at backup time (exact for financial and audit tables) |
| RLS catalog | every table with `tenant_id` has RLS enabled and forced |
| Audit chain | hash chain verifies for every tenant up to the backup point and matches the anchor nearest the backup point |
| Financial control totals | for a sample of (tenant, connector, billing period), analytics sums equal control totals recorded on `billing_period_versions` exactly |
| Raw object integrity | sample of N objects (default 1 000) re-hash to their content address |
| Close snapshot integrity | manifests for all closed periods match their `manifest_sha256` |
| Keys | canary DEK unwraps with the configured KEK; secret references resolve (read-only) |
| Application smoke | `api` starts against the restored DB; a synthetic read-only query returns expected results for the synthetic verification tenant |

Results go to `cloudledger_restore_verification_*` metrics and to a JSON report in object storage. A failed check raises `CloudLedgerRestoreVerificationFailed`. The ephemeral environment is destroyed after the run; it never has egress to cloud providers or notification channels.

## 7. Disaster scenarios

| # | Scenario | Detection | Expected behavior / response | Data loss | Target recovery |
|---|---|---|---|---|---|
| DR-01 | Single pod or node loss | readiness, `up` | Kubernetes reschedules; stateless API and workers; jobs with expired leases are retried | none | minutes |
| DR-02 | Availability-zone loss (HA) | probes, PG failover | PG synchronous standby promoted; ClickHouse replicas in other AZs serve reads; PDBs keep quorum | none | ≤ 5 min |
| DR-03 | PG primary failure (Standard) | probes, operator | operator promotes replica or restores (§5.1) | ≤ RPO | ≤ RTO |
| DR-04 | Bad migration or logical corruption | alerts, user reports, failed invariants | stop writers; PITR to before the change (§5.1); roll back the binary (UPGRADES_AND_MIGRATIONS.md §6) | writes since the target point (re-ingested where possible) | ≤ RTO |
| DR-05 | Accidental tenant deletion | audit event, user report | within grace period: restore tenant to `active` (no backup needed). After purge: unrecoverable by design | none / total for that tenant | minutes / n/a |
| DR-06 | ClickHouse total loss | alerts | restore backup (§5.3) or rebuild from raw; dashboards show stale freshness meanwhile | none (derivable) | per §4 |
| DR-07 | Object storage bucket deleted or encrypted by an attacker | object-store errors, integrity check | versioning, replica bucket, object lock; rotate credentials; RB-09 | none for locked/replicated data | ≤ 4 h |
| DR-08 | KEK lost | secret verification fails | restore from the separate KEK backup. If no copy exists, envelope-encrypted secrets and DEK-protected artifacts are unrecoverable: re-enter static credentials; federated connectors are unaffected (ADR-0009) | secrets only | depends on re-onboarding |
| DR-09 | KEK or credentials compromised | security alert | RB-07 emergency rotation and RB-09 | none | hours |
| DR-10 | Region loss (HA) | external probes | restore PG from cross-region backups into the secondary region, re-point object storage to the replica bucket, restore or rebuild ClickHouse | ≤ 15 min control plane | ≤ 4 h (proposed; NFR-AVL-001 covers in-region only) |
| DR-11 | Faulty release deployed | SLO burn, errors | roll back the binary if no contract migration has run; otherwise restore (UPGRADES_AND_MIGRATIONS.md §6) | none / ≤ RPO | ≤ 1 h |
| DR-12 | Provider restatement of many periods at once | restatement metric spike | normal restatement path; capacity scales workers; not a DR event | none | — |

## 8. Drills and chaos testing

### 8.1 Quarterly drills (operators of Standard/HA; maintainers on reference deployments)

| Quarter | Drill | Success criteria |
|---|---|---|
| Q1 | Full control-plane PITR into a new cluster | RPO/RTO met; all §6 checks green; catch-up ingestion completes |
| Q2 | Analytics rebuild from raw for a sample tenant set, plus ClickHouse backup restore | exact control-total match; rebuild duration recorded against Phase 34 baseline |
| Q3 | Region failover (HA) or full environment rebuild from GitOps + backups (Standard) | RTO met; no cross-tenant exposure; secrets resolve |
| Q4 | Key rotation and KEK-loss tabletop, plus tenant purge followed by restore of an older backup | rotation without downtime; resurrected tenant is re-purged |

Each drill produces a short report (date, operators, backup used, timings, deviations, follow-ups). For maintainers, drill evidence on reference deployments is recorded in the Phase 33 `TEST_RESULTS.md` (and later release certification) and is never fabricated.

### 8.2 Chaos and failure-injection tests (Phase 33)

Run against Standard and HA reference deployments with Chaos Mesh (Kubernetes) and in CI with Toxiproxy and Testcontainers where possible.

| Test | Injection | Expected outcome |
|---|---|---|
| CH-01 Worker kill mid-swap | kill worker during `billing.swap` | old partition stays live or the new one is fully live; never mixed; job retried idempotently |
| CH-02 Worker kill mid-fetch | kill during multi-GB download | resumes or restarts; no duplicate raw object |
| CH-03 PG failover | kill PG primary | API errors bounded to failover window; no lost committed jobs; outbox resumes |
| CH-04 PG network latency | +200 ms, 5% loss | latency SLO degrades gracefully; no job double-processing |
| CH-05 ClickHouse replica loss | delete one replica pod | queries continue; replication heals |
| CH-06 ClickHouse unavailable | stop all ClickHouse | dashboards return typed errors with freshness; ingestion jobs back off and retry; control-plane API stays up |
| CH-07 Object storage outage | block egress to storage | fetch and swap pause; jobs retry; no partial raw objects |
| CH-08 Provider throttling storm | Toxiproxy returns 429/`Retry-After` | circuit breaker opens; other providers unaffected; no tight retry loop |
| CH-09 Scheduler split-brain | network partition between scheduler replicas | single leader via advisory lock; no duplicate cron jobs (unique job keys) |
| CH-10 Clock skew | ±5 min on one worker | leases and schedules remain correct (DB time is authoritative) |
| CH-11 KMS unavailable | block KMS | cached DEKs within TTL work; new secret resolution fails closed with clear errors; no plaintext fallback |
| CH-12 Disk full on ClickHouse | fill disk to 95% | inserts rejected with typed errors; swap aborted; old data served; alert fires |
| CH-13 Backup during load | run backup at peak ingestion | SLOs met; backup completes within window |

Chaos results are release-relevant for Phase 34 SLO gates.

## 9. Open items

| Item | Proposed default | Decide in |
|---|---|---|
| Analytics RPO/RTO (not in PRD) | Table in §4 | Phase 33 |
| HA cross-region RTO (NFR-AVL-001 is in-region) | 4 h | Phase 33 |
| Backup retention vs. tenant deletion (GDPR erasure): backups may hold purged tenant rows until expiry | Document maximum backup retention in the DPIA; offer per-tenant DEK encryption of analytics exports | Phase 01 (DPIA), Phase 33 |
| `cloudledger admin backup` / `restore` in Lite: architecture lists `admin` for break-glass, export/delete and key rotation only | Add backup/restore to `admin` | Phase 03 / 33 |
| Single-tenant restore | Planned as exceptional procedure §5.7 | Phase 33 |
