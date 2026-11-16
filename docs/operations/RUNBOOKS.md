# Runbooks

Status: **DRAFT plan**. These are runbook **outlines**. Full runbooks with exact commands are written as the underlying capabilities ship (Phase 12 for ingestion, Phase 33 for HA/DR, Phase 34 for security). Commands shown (`cloudledger admin …`) are planned and do not exist yet. Every alert in [OBSERVABILITY.md §6](OBSERVABILITY.md#6-alert-rules) links to one of these runbooks.

## Conventions

- **Severity:** Sev-1 (data exposure, wrong financial numbers served, total outage), Sev-2 (SLO burn paging, major subsystem down), Sev-3 (degraded, ticket).
- **Access:** platform operators have no implicit tenant data access. Any step that needs tenant data uses an audited, time-boxed break-glass grant (`cloudledger admin break-glass request`).
- **Communication:** tenant-facing impact (stale data, delayed alerts) is announced through the operator's status channel; the UI freshness indicators show staleness automatically.
- **After every Sev-1/Sev-2:** blameless post-incident review within 5 business days; follow-ups tracked as issues; this document updated.
- **Do not** edit data directly in PostgreSQL or ClickHouse. Use the planned `admin` commands, which audit every action.

## Index

| ID | Runbook | Triggering alerts | Default severity |
|---|---|---|---|
| [RB-01](#rb-01-ingestion-stalled) | Ingestion stalled / freshness breach | `CloudLedgerIngestionStalled`, `CloudLedgerIngestionFreshnessBurn`, `CloudLedgerProviderCircuitOpen` | Sev-3 (Sev-2 if > 6 h or many tenants) |
| [RB-02](#rb-02-connector-authentication-failure) | Connector authentication failure | `CloudLedgerConnectorAuthFailures` | Sev-3 |
| [RB-03](#rb-03-invariant-failure-and-quarantine) | Invariant failure / quarantine | `CloudLedgerInvariantFailure`, `CloudLedgerQuarantineGrowing` | Sev-3 (Sev-1 if wrong data went live) |
| [RB-04](#rb-04-queue-backlog) | Queue backlog, dead letters, outbox or scheduler stall | `CloudLedgerQueueBacklog`, `CloudLedgerDeadLetterGrowing`, `CloudLedgerJobLeaseExpiries`, `CloudLedgerOutboxStalled`, `CloudLedgerNoSchedulerLeader`, `CloudLedgerNotificationDeadLetter` | Sev-2 / Sev-3 |
| [RB-05](#rb-05-clickhouse-disk-pressure) | ClickHouse disk pressure | `CloudLedgerClickHouseDiskPressure` (adapt for `CloudLedgerPostgresDiskPressure`) | Sev-3 → Sev-2 |
| [RB-06](#rb-06-restore-from-backup) | Restore from backup; backup or verification failure | `CloudLedgerBackupMissing`, `CloudLedgerRestoreVerificationFailed`, `CloudLedgerWALArchiveFailing`, `CloudLedgerPostgresReplicationLag` | Sev-2 |
| [RB-07](#rb-07-key-rotation) | Key rotation (scheduled and emergency) | `CloudLedgerKEKRotationOverdue`, `CloudLedgerSecretResolutionFailures` | planned / Sev-1 if compromised |
| [RB-08](#rb-08-tenant-deletion) | Tenant deletion and purge | `CloudLedgerTenantPurgeStuck` | planned / Sev-3 |
| [RB-09](#rb-09-suspected-cross-tenant-leak-or-security-incident) | Suspected cross-tenant leak / security incident | `CloudLedgerTenantGuardViolation`, `CloudLedgerAuditChainBroken`, `CloudLedgerAIGuardrailSpike`, external report | **Sev-1** |
| [RB-10](#rb-10-failed-migration-or-upgrade) | Failed migration or upgrade | `CloudLedgerMigrationPending`, SLO burn after deploy | Sev-2 |
| [RB-11](#rb-11-slow-analytics-queries) | Slow analytics queries | query latency SLO burn | Sev-3 |
| [RB-12](#rb-12-api-unavailable) | API unavailable | `CloudLedgerAPIDown`, availability burn | Sev-2 (Sev-1 in HA) |

---

## RB-01 Ingestion stalled

**Symptoms:** `cloudledger_ingestion_freshness_seconds` above threshold for one or more `(provider, capability)`; dashboards show growing lag.

**Diagnose**
1. Ingestion dashboard: is the lag limited to one provider or capability, or global? Global → check RB-04 (queue) and dependencies (PG, object storage, analytics).
2. `cloudledger admin ingestion health --provider <p> --stale` lists affected connectors with `error_class`, `last_success_at`, `next_run_at`.
3. By error class: `not_ready` → provider export not delivered (check provider status; not a CloudLedger fault until the expected SLA is exceeded). `transient` / circuit open → throttling or provider outage. `auth` → RB-02. `data` → RB-03. `bug` → dead-lettered jobs, RB-04.
4. Check `cloudledger_provider_api_requests_total{outcome="throttled"}` and circuit state.

**Mitigate**
- Provider outage or throttling: let backoff and the circuit breaker work; do not force retries in a loop. Reduce `jobs.tenant_max_concurrent` if one tenant's backfill is consuming the rate limit.
- Worker capacity: scale the `ingest`/`normalize` pools.
- After the cause is fixed: `cloudledger admin ingestion trigger --connector <id>` (idempotent).

**Verify:** freshness under threshold; artifact-delay histogram back within SLO.

## RB-02 Connector authentication failure

**Symptoms:** connector status `error` with `error_class=auth`; tenant owners notified automatically.

**Diagnose**
1. Identify affected connectors and auth method (AWS role + ExternalId, GCP WIF, Azure federated credential, static secret reference).
2. One connector → customer-side change (role deleted, trust policy edited, ExternalId mismatch, permission removed). Many connectors on the same provider → platform-side issue: CloudLedger's base identity (`connectors.aws.base_credentials_source`, WIF pool, federated app), expired platform credential, clock skew, or provider STS outage.
3. For secret-reference connectors: check `cloudledger_secret_resolutions_total{outcome="error"}` (secret store reachable? reference rotated or deleted?).

**Mitigate**
- Customer-side: the tenant owner re-runs the onboarding template and "Verify connection" in the UI (UJ-01 alternate paths). Operators do not edit tenant credentials.
- Platform-side: fix base identity or trust; never fall back to static keys.
- Never disable ExternalId checks or broaden permissions to work around a failure.

**Verify:** `connector.verified.v1` emitted; capability checks pass; ingestion resumes (RB-01 verify).

## RB-03 Invariant failure and quarantine

**Background:** a failed invariant (control totals, row count parity, duplicate keys, currency consistency, period bounds) leaves the previous partition live and marks the run `failed_validation` or `quarantined` ([INGESTION_PIPELINE.md](../architecture/INGESTION_PIPELINE.md)). This is correct behavior; the goal is to restore freshness without serving wrong numbers.

**Diagnose**
1. `cloudledger admin ingestion runs --status quarantined,failed_validation` → invariant name, provider, schema fingerprint, `mapping_version`.
2. Unknown schema fingerprint → provider changed export schema (risk R-02). Many tenants on one provider at once is the typical signature.
3. Control-total mismatch on a known schema → mapper bug or a provider data anomaly. Review the data-quality report and rejected-row sample (object storage, tenant-scoped; break-glass needed for content).
4. **Check that nothing wrong went live:** confirm the live `billing_period_versions` row is the previous version. If wrong data is live, escalate to Sev-1 and involve a `finance-correctness` owner.

**Mitigate**
- Schema change: ship a mapping update (new `mapping_version`) via a patch release; then `cloudledger admin ingestion requeue --quarantined --provider <p>`.
- Provider data anomaly confirmed by the provider: document it; never relax an invariant to force data through. A per-run override requires two maintainers and is audited (planned design, Phase 12).
- Inform affected tenants that the period is stale and why.

**Verify:** runs succeed; control totals equal source; reconciliation re-run for affected periods.

## RB-04 Queue backlog

**Symptoms:** oldest available job age grows; pickup latency SLO burn; dead letters growing; outbox not draining; no scheduler leader.

**Diagnose**
1. Jobs dashboard: which queue? Is pool utilization at 100% (capacity) or low (workers stuck or not leasing)?
2. Lease expiries rising → workers crashing (OOM, panics): check pod restarts, `job.discarded` logs with `error.class=bug`.
3. One tenant dominating (large backfill)? Per-tenant concurrency caps should prevent starvation; verify settings.
4. PG health: slow `SKIP LOCKED` fetches, bloat on `jobs`, long-running transactions holding locks, connection pool waits.
5. Outbox stalled → relay not running (leader issue) or a poison event: check `cloudledger_event_handler_failures_total`.
6. No scheduler leader → check scheduler pods and the PG advisory lock holder.

**Mitigate**
- Capacity: scale the affected pool; raise `worker.concurrency.<queue>` within PG connection limits.
- Crashing jobs: identify job kind; if a bad release, roll back (RB-10). Dead-lettered jobs are retried with `cloudledger admin jobs retry --queue <q> --kind <k>` after the fix.
- PG bloat: run vacuum on `jobs`; confirm finalized-job pruning (`jobs.retention_completed`) runs.
- Notification dead letters: check channel configuration (4xx = tenant misconfiguration; owner notified) vs. provider outage (5xx; retry after recovery).

**Verify:** oldest age back under threshold; DLQ stable; exactly one scheduler leader.

## RB-05 ClickHouse disk pressure

**Diagnose**
1. ClickHouse dashboard: which disk and which tables are growing? Typical causes: retention not applied, old partition versions not dropped after restatements or re-normalization, a large backfill, stuck merges (many parts), detached parts, local backups left on the data disk.
2. Check `DropPartitionVersions` maintenance job success and retention settings (`retention.cost_months`).

**Mitigate (least risky first)**
1. Pause low-priority work: backfill and re-normalization queues.
2. Remove local backup leftovers and `detached/` parts after confirming they are not needed.
3. Run `cloudledger admin analytics prune-versions --older-than <d>` (drops superseded partition versions beyond the diff window).
4. Expand the volume (Kubernetes PVC expansion or cloud disk resize). HA: add a shard per capacity plan.
5. **Never** drop live partitions manually. Live partition pointers are owned by the control plane.

**Behavior at full disk:** inserts fail with typed errors, the swap aborts and old data is served (chaos test CH-12). Data is not corrupted, but freshness degrades.

**Verify:** free disk > 20%; paused queues resumed; backlog drains.

## RB-06 Restore from backup

Use for data loss, corruption, failed contract migration (RB-10) or DR. Procedures and post-restore steps are in [BACKUP_DR.md §5](BACKUP_DR.md#5-restore-procedures-outlines).

**Outline**
1. Declare incident; assign incident commander and a second operator (required in HA).
2. Freeze writes (`server.read_only=true`; workers and scheduler to zero).
3. Preserve the damaged environment for forensics (snapshot, do not delete).
4. Choose the recovery point; record the reason in the incident log.
5. Restore into a new cluster; run post-restore steps (tenant deletion register, audit chain verification, job recovery, analytics reconcile, cache flush, key verification).
6. Switch over; unfreeze in order scheduler → workers → api.
7. Monitor ingestion catch-up; communicate the recovery point to tenants.

**Backup or verification failure (no restore needed):** fix the failing backup (credentials, storage capacity, WAL archive command); take an on-demand backup; run restore verification manually; do not close the alert until a verified backup exists.

## RB-07 Key rotation

**Scheduled KEK rotation (at least yearly; planned design)**
1. Create the new KEK in the key provider (file, Kubernetes secret, Vault transit, cloud KMS).
2. Configure `crypto.kek.key_ref` = new, `crypto.kek.previous_key_ref` = old; rolling restart.
3. `cloudledger admin keys rewrap` re-wraps every DEK with the new KEK (resumable, audited). Data is not re-encrypted; only DEKs are re-wrapped.
4. Verify `cloudledger admin secrets verify`; back up the new KEK separately (BACKUP_DR.md §2).
5. Remove `previous_key_ref`; after the backup retention window ends, schedule destruction of the old KEK (older backups need it).

**Other keys:** web session secret (rolling, dual-key acceptance window), webhook signing keys (per channel, with overlap), observability HMAC key (changes pseudonyms; note in telemetry), database and object-store credentials (secret store rotation, no config change with references), API tokens (tenant-side).

**Emergency rotation (suspected compromise):** follow RB-09 first. Rotate KEK and re-wrap immediately; rotate all platform credentials; invalidate sessions; notify tenants with static secrets to rotate their cloud credentials. Federated connectors hold no long-lived secrets (ADR-0009).

## RB-08 Tenant deletion

**Normal flow ([TENANCY.md §3](../architecture/TENANCY.md)):** delete request by tenant owner or platform admin (audited) → `pending_deletion` with grace period (`tenants.deletion_grace`, default 30 days) → optional export (`cloudledger admin tenant export`) → purge job deletes rows (control plane and analytics), objects under the tenant prefix, and destroys tenant DEKs (crypto-shredding) → tenant recorded in the deletion register → `tenant.deleted.v1`.

**Operator checks**
1. Confirm the request's authenticity and authority (tenant owner, or contractual instruction for SaaS operators).
2. Closed-period snapshots under WORM retention cannot be deleted before lock expiry. Document this in the deletion confirmation; they remain encrypted with destroyed DEKs where applicable.
3. Backups keep tenant rows until backup retention expires (BACKUP_DR.md §5.6); state this in the confirmation.

**Purge stuck:** check the purge job's dead letters and errors (object storage permissions, ClickHouse partition drop failures). Purge is idempotent; re-run with `cloudledger admin tenant purge --tenant <id> --resume`.

**Restore during grace period:** `cloudledger admin tenant restore --tenant <id>` returns it to `active`. After purge, recovery is impossible by design.

## RB-09 Suspected cross-tenant leak or security incident

**Treat as Sev-1 until disproven.** Triggers: `cloudledger_tenant_guard_violations_total > 0`, audit chain failure, a user reporting another tenant's data, an AI guardrail spike, a vulnerability report via [SECURITY.md](../../SECURITY.md), or leaked credentials.

**Contain (first 30 minutes)**
1. Open a private incident channel; assign incident commander and security owner. Do not discuss in public issues.
2. Preserve evidence: logs, traces (tail sampling keeps errors), audit events, affected request IDs. Snapshot databases if tampering is suspected.
3. Contain by the narrowest effective control: disable the affected endpoint or feature (for example AI assistant, exports, a dashboard sharing path) via config; set `server.read_only=true`; or take the API offline if the leak path is unknown.
4. Revoke and rotate exposed credentials (RB-07 emergency).

**Investigate**
1. Identify the layer from the guard metric label (`api`, `repository`, `analytics`, `objectstore`, `cache`, `job`) and correlate with `trace_id`.
2. Determine affected tenants, data categories and time window from audit events and access logs.
3. Verify audit chain integrity against anchors in object storage.
4. Reproduce in an isolated environment; add the case to the cross-tenant attack suite.

**Recover and notify**
1. Ship the fix (security release process); re-run the full isolation suite and authorization matrix.
2. Notify affected tenants and, where applicable, follow regulatory breach-notification timelines (operator's legal obligation; for the project, SECURITY.md coordinated disclosure).
3. Post-incident review with root cause and new regression tests.

## RB-10 Failed migration or upgrade

1. Stop the rollout (Helm rollback of not-yet-upgraded pods is not needed; pause the release).
2. Determine what ran: `cloudledger migrate status` (applied version, any partially applied non-transactional migration).
3. Only expand migrations applied → roll binaries back to N-1 ([UPGRADES_AND_MIGRATIONS.md §6](UPGRADES_AND_MIGRATIONS.md#6-rollback)).
4. A non-transactional step failed (for example an invalid concurrent index) → drop the invalid object as documented in that migration's release note, then re-run `migrate up`.
5. Contract migration applied or data damaged → RB-06 restore.
6. File an issue with logs; migrations are never edited after release — a fix ships as a new migration.

## RB-11 Slow analytics queries

1. Analytics dashboard: one engine, one source (`dashboard`, `ai`, `report`), or one tenant (via exemplars and traces)?
2. Check rollup freshness (`RebuildAggregates` after `data_version` bumps); queries falling back to `cost_focus` instead of `cost_daily_agg` are a common cause.
3. ClickHouse: parts count, merges, memory limits, concurrent queries; PostgreSQL: missing partitions pruning, stale statistics (`ANALYZE`).
4. Heavy tenant: confirm `analytics.query.max_concurrency_per_tenant` and bytes limits; these are operational protections.
5. Escalate to a performance issue with the `query.shape_hash` (no filter values) and engine plan.

## RB-12 API unavailable

1. Check pods, readiness reasons (`cloudledger_ready{component}`), ingress and certificates.
2. Dependency down? PostgreSQL → RB-06 / failover; KMS → readiness fails closed by design; analytics down → API should stay up with typed errors on query routes (if not, file a bug).
3. Recent deploy? → RB-10 rollback.
4. Resource exhaustion: DB pool waits, memory, rate-limit misconfiguration returning 5xx instead of 429.
5. Restore service, then confirm error budget impact on the SLO dashboard.
