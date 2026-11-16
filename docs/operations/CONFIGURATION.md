# Configuration Reference

Status: **PLANNED**. No configuration loader exists yet. This catalog is a design proposal; it is **finalized in Phase 03** and every later phase adds its keys here in the same PR that introduces them. Key names, defaults and validation may change before v1.0 (pre-1.0 breaking changes are listed in CHANGELOG under **Breaking**, per [COMPATIBILITY.md](../contracts/COMPATIBILITY.md)).

## 1. Sources and precedence

CloudLedger follows 12-factor configuration with an optional YAML file ([DEPLOYMENT_PROFILES.md](../architecture/DEPLOYMENT_PROFILES.md)).

| Priority (high → low) | Source | Example |
|---|---|---|
| 1 | Command-line flags (limited set: `--config`, `--log-level`, run-mode flags) | `cloudledger worker --queues ingest,normalize` |
| 2 | Environment variables | `CLOUDLEDGER_DATABASE_URL` |
| 3 | YAML file (`--config` or `CLOUDLEDGER_CONFIG_FILE`) | `database.url` |
| 4 | Built-in defaults (profile-aware where noted) | |

Rules:

- **Naming.** YAML keys are `snake_case`, nested by subsystem. The environment variable is `CLOUDLEDGER_` plus the upper-cased YAML path with `.` replaced by `_`. Every key declares its env name explicitly in the config registry, so the mapping is never guessed at runtime.
- **Validation.** Startup fails fast on unknown keys in YAML, type errors, out-of-range values and missing required keys. `cloudledger config validate` checks a configuration without starting services.
- **Inspection.** `cloudledger config print --redacted` shows the effective configuration with its source per key. Secret values always print as `[REDACTED]`.
- **Profiles.** `profile` (`lite`, `standard`, `ha`) selects defaults marked *profile-aware*. It never enables or disables features for licensing reasons (NFR-LIC-004).
- **Renames.** A renamed key keeps its old name as an alias for at least 2 minor releases and logs a startup warning ([COMPATIBILITY.md](../contracts/COMPATIBILITY.md)).
- **Reload.** Configuration is read at startup. Only the keys marked **hot** reload on `SIGHUP` or file change.
- **Tenant settings are not configuration.** Per-tenant settings (reporting currency, calendar, retention overrides, AI enablement; [TENANCY.md §4](../architecture/TENANCY.md)) live in the database and are managed through the API.

## 2. Secrets handling rules

| Rule | Detail |
|---|---|
| S-1 Secret keys are marked | Keys marked **secret** below never appear in logs, traces, metrics, error messages, `config print` or crash dumps. In code they are typed `secret.Value` ([CODING_STANDARDS.md](../contributors/CODING_STANDARDS.md)). |
| S-2 Prefer references | A secret key accepts a **secret reference** instead of a literal: `vault://<mount>/<path>#<field>`, `aws-sm://<name>#<field>`, `gcp-sm://projects/<p>/secrets/<s>/versions/<v>`, `azure-kv://<vault>/<secret>`, `k8s://<namespace>/<secret>#<key>`, `file:///<path>`. References are resolved just in time and cached in memory only (ADR-0009). |
| S-3 `_FILE` variants | Every secret env var also accepts `<NAME>_FILE` pointing to a mounted file (Docker/Kubernetes secrets). Setting both is a startup error. |
| S-4 No secrets in YAML | Literal secret values in the YAML file are rejected at startup unless `allow_inline_secrets: true` (Lite development only; startup warning). |
| S-5 No secrets in URLs | Database and object-store URLs must not embed passwords when a separate password key exists; embedded credentials are rejected in Standard/HA. |
| S-6 HA requires external secrets | In `profile: ha`, literal secrets are rejected; only references to an external store or KMS are accepted (DEPLOYMENT_PROFILES.md). |
| S-7 Cloud credentials are not configuration | Tenant cloud connector credentials are stored as secret references or envelope-encrypted values in the database, never in deployment configuration. Federation (role assumption, workload identity) is the default. |
| S-8 Least privilege | Each run mode reads only the secrets it needs (for example `web` never receives the KEK or database credentials). |
| S-9 Rotation | Rotating a referenced secret requires no config change; the reference resolves to the new version on next fetch (`secrets.cache_ttl`). KEK rotation: [RUNBOOKS.md RB-07](RUNBOOKS.md#rb-07-key-rotation). |

## 3. Key catalog (planned)

Legend: **S** = secret, **H** = hot-reloadable, **P** = profile-aware default (Lite / Standard / HA). Phase = the phase that introduces the key.

### 3.1 Core and server

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `profile` | `CLOUDLEDGER_PROFILE` | `lite` | `lite`, `standard`, `ha` | 03 |
| `environment` | `CLOUDLEDGER_ENVIRONMENT` | `production` | free-form label, exported as `deployment.environment.name` | 03 |
| `server.listen_addr` | `CLOUDLEDGER_SERVER_LISTEN_ADDR` | `:8080` | API HTTP listener | 03 |
| `server.admin_listen_addr` | `CLOUDLEDGER_SERVER_ADMIN_LISTEN_ADDR` | `:9090` | `/metrics`, `/healthz`, `/readyz`, pprof (pprof off unless `server.pprof_enabled`) | 03 |
| `server.public_url` | `CLOUDLEDGER_SERVER_PUBLIC_URL` | required (Standard/HA) | external base URL used in links and OIDC redirects | 03 |
| `server.tls.cert_file` / `server.tls.key_file` (S) | `CLOUDLEDGER_SERVER_TLS_CERT_FILE` / `…_KEY_FILE` | unset (TLS at ingress) | in-process TLS 1.2+ (1.3 preferred), NFR-SEC-004 | 03 |
| `server.read_timeout` / `write_timeout` / `idle_timeout` | `CLOUDLEDGER_SERVER_READ_TIMEOUT` … | `15s` / `60s` / `120s` | | 03 |
| `server.max_request_body_bytes` | `CLOUDLEDGER_SERVER_MAX_REQUEST_BODY_BYTES` | `10MiB` | uploads use a separate limit | 03 |
| `server.trusted_proxies` | `CLOUDLEDGER_SERVER_TRUSTED_PROXIES` | empty | CIDRs allowed to set `X-Forwarded-*` | 03 |
| `server.cors_allowed_origins` | `CLOUDLEDGER_SERVER_CORS_ALLOWED_ORIGINS` | empty | the BFF is same-origin; CORS off by default | 03 |
| `server.read_only` (H) | `CLOUDLEDGER_SERVER_READ_ONLY` | `false` | rejects mutations with 503 (maintenance, restore) | 33 |
| `server.shutdown_grace` | `CLOUDLEDGER_SERVER_SHUTDOWN_GRACE` | `30s` | | 03 |

### 3.2 Control-plane database

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `database.url` | `CLOUDLEDGER_DATABASE_URL` | required | `postgres://user@host:5432/cloudledger?sslmode=verify-full` (no password) | 03 |
| `database.password` (S) | `CLOUDLEDGER_DATABASE_PASSWORD` | — | or IAM auth via `database.auth_mode` | 03 |
| `database.auth_mode` | `CLOUDLEDGER_DATABASE_AUTH_MODE` | `password` | `password`, `aws_iam`, `gcp_iam`, `azure_ad` | 33 |
| `database.max_conns` (P) | `CLOUDLEDGER_DATABASE_MAX_CONNS` | 10 / 25 / 50 per process | | 03 |
| `database.statement_timeout` | `CLOUDLEDGER_DATABASE_STATEMENT_TIMEOUT` | `30s` | | 03 |
| `database.migrations_url` | `CLOUDLEDGER_DATABASE_MIGRATIONS_URL` | = `database.url` | owner role used only by `migrate` | 04 |
| `database.migrations_password` (S) | `CLOUDLEDGER_DATABASE_MIGRATIONS_PASSWORD` | — | never given to `api`/`worker` | 04 |
| `database.read_replica_url` | `CLOUDLEDGER_DATABASE_READ_REPLICA_URL` | unset | optional read routing (HA) | 33 |

### 3.3 Analytics store

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `analytics.engine` (P) | `CLOUDLEDGER_ANALYTICS_ENGINE` | `postgres` / `clickhouse` / `clickhouse` | `postgres`, `duckdb`, `clickhouse` (OQ-04) | 13 |
| `analytics.postgres.schema` | `CLOUDLEDGER_ANALYTICS_POSTGRES_SCHEMA` | `analytics` | | 06 |
| `analytics.duckdb.data_dir` | `CLOUDLEDGER_ANALYTICS_DUCKDB_DATA_DIR` | `/var/lib/cloudledger/duckdb` | one file per tenant | 13 |
| `analytics.clickhouse.url` | `CLOUDLEDGER_ANALYTICS_CLICKHOUSE_URL` | required if engine = clickhouse | native protocol with TLS | 13 |
| `analytics.clickhouse.password` (S) | `CLOUDLEDGER_ANALYTICS_CLICKHOUSE_PASSWORD` | — | | 13 |
| `analytics.clickhouse.cluster` | `CLOUDLEDGER_ANALYTICS_CLICKHOUSE_CLUSTER` | unset | set for replicated/sharded HA | 33 |
| `analytics.query.timeout` (H) | `CLOUDLEDGER_ANALYTICS_QUERY_TIMEOUT` | `30s` | AI queries use `ai.query_timeout` | 13 |
| `analytics.query.max_rows` (H) | `CLOUDLEDGER_ANALYTICS_QUERY_MAX_ROWS` | `10000` | semantic layer cap | 13 |
| `analytics.query.max_bytes_read` (H) | `CLOUDLEDGER_ANALYTICS_QUERY_MAX_BYTES_READ` | `10GiB` | ClickHouse `max_bytes_to_read` | 13 |
| `analytics.query.max_concurrency_per_tenant` (H) | `CLOUDLEDGER_ANALYTICS_QUERY_MAX_CONCURRENCY_PER_TENANT` | `8` | noisy-neighbor control, not a license limit | 13 |
| `analytics.cache.enabled` / `ttl` | `CLOUDLEDGER_ANALYTICS_CACHE_ENABLED` / `…_TTL` | `true` / `10m` | keys include tenant and principal scope hash; invalidated on `data_version` bump | 14 |

### 3.4 Object storage

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `objectstore.driver` (P) | `CLOUDLEDGER_OBJECTSTORE_DRIVER` | `s3` (MinIO) | `s3`, `gcs`, `azblob`, `fs` (development only) | 06 |
| `objectstore.bucket` | `CLOUDLEDGER_OBJECTSTORE_BUCKET` | `cloudledger` | | 06 |
| `objectstore.endpoint` | `CLOUDLEDGER_OBJECTSTORE_ENDPOINT` | unset | MinIO or S3-compatible endpoint | 06 |
| `objectstore.region` | `CLOUDLEDGER_OBJECTSTORE_REGION` | unset | | 06 |
| `objectstore.access_key_id` / `secret_access_key` (S) | `CLOUDLEDGER_OBJECTSTORE_ACCESS_KEY_ID` / `…_SECRET_ACCESS_KEY` | unset | prefer workload identity; static keys rejected in HA | 06 |
| `objectstore.presign_ttl` | `CLOUDLEDGER_OBJECTSTORE_PRESIGN_TTL` | `5m` | single-object scoped URLs | 14 |
| `objectstore.worm.enabled` (P) | `CLOUDLEDGER_OBJECTSTORE_WORM_ENABLED` | `false` / `false` / `true` | object lock for close snapshots | 30 |

### 3.5 Jobs, workers and scheduler

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `worker.queues` | `CLOUDLEDGER_WORKER_QUEUES` | all | comma list: `ingest`, `normalize`, `allocate`, `inventory`, `metrics`, `recommend`, `alerts`, `reports`, `ai`, `backfill`, `maintenance` | 03 |
| `worker.concurrency.<queue>` (P) | `CLOUDLEDGER_WORKER_CONCURRENCY_<QUEUE>` | profile table in Phase 03 | | 03 |
| `worker.memory_budget_per_job` | `CLOUDLEDGER_WORKER_MEMORY_BUDGET_PER_JOB` | `1GiB` | | 12 |
| `jobs.lease_duration` | `CLOUDLEDGER_JOBS_LEASE_DURATION` | `5m` | heartbeat extends | 03 |
| `jobs.max_attempts` | `CLOUDLEDGER_JOBS_MAX_ATTEMPTS` | `10` | matches `jobs.max_attempts` column default | 03 |
| `jobs.backoff_base` / `backoff_cap` | `CLOUDLEDGER_JOBS_BACKOFF_BASE` / `…_CAP` | `2s` / `15m` | full jitter | 03 |
| `jobs.retention_completed` | `CLOUDLEDGER_JOBS_RETENTION_COMPLETED` | `7d` | finalized rows pruned | 03 |
| `jobs.retention_discarded` | `CLOUDLEDGER_JOBS_RETENTION_DISCARDED` | `30d` | dead-letter kept for investigation | 03 |
| `jobs.tenant_max_concurrent` (H) | `CLOUDLEDGER_JOBS_TENANT_MAX_CONCURRENT` | `4` | per tenant per queue | 12 |
| `scheduler.embedded` (P) | `CLOUDLEDGER_SCHEDULER_EMBEDDED` | `true` / `false` / `false` | run scheduler inside worker (Lite) | 03 |
| `scheduler.tick_interval` | `CLOUDLEDGER_SCHEDULER_TICK_INTERVAL` | `15s` | | 03 |
| `outbox.relay_interval` / `batch_size` | `CLOUDLEDGER_OUTBOX_RELAY_INTERVAL` / `…_BATCH_SIZE` | `1s` / `500` | | 04 |
| `jobs.backend` | `CLOUDLEDGER_JOBS_BACKEND` | `postgres` | `temporal` optional in HA (ADR-0005) | 33 |

### 3.6 Ingestion and connectors

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `ingestion.poll_interval` | `CLOUDLEDGER_INGESTION_POLL_INTERVAL` | `15m` | must stay well below the 1 h freshness SLO | 12 |
| `ingestion.backfill_horizon_months` | `CLOUDLEDGER_INGESTION_BACKFILL_HORIZON_MONTHS` | `13` | FR-ING-002 | 12 |
| `ingestion.backfill_order` | `CLOUDLEDGER_INGESTION_BACKFILL_ORDER` | `newest_first` | | 12 |
| `ingestion.max_file_bytes` | `CLOUDLEDGER_INGESTION_MAX_FILE_BYTES` | `50GiB` | | 06 |
| `ingestion.max_decompression_ratio` | `CLOUDLEDGER_INGESTION_MAX_DECOMPRESSION_RATIO` | `100` | zip-bomb guard | 09 |
| `ingestion.upload_max_bytes` | `CLOUDLEDGER_INGESTION_UPLOAD_MAX_BYTES` | `2GiB` | generic imports | 09 |
| `ingestion.circuit_breaker.failures` / `cooldown` | `CLOUDLEDGER_INGESTION_CIRCUIT_BREAKER_FAILURES` / `…_COOLDOWN` | `5` / `5m` | INGESTION_PIPELINE.md §3 | 12 |
| `ingestion.gcp_lookback` | `CLOUDLEDGER_INGESTION_GCP_LOOKBACK` | `72h` | late-row overlap | 07 |
| `connectors.aws.sts_session_duration` | `CLOUDLEDGER_CONNECTORS_AWS_STS_SESSION_DURATION` | `1h` | ≤ 1 h | 06 |
| `connectors.aws.base_credentials_source` | `CLOUDLEDGER_CONNECTORS_AWS_BASE_CREDENTIALS_SOURCE` | `default_chain` | identity CloudLedger uses to assume customer roles | 06 |
| `connectors.gcp.wif_config_ref` (S) | `CLOUDLEDGER_CONNECTORS_GCP_WIF_CONFIG_REF` | unset | workload identity federation config | 07 |
| `connectors.azure.federated_client_id` | `CLOUDLEDGER_CONNECTORS_AZURE_FEDERATED_CLIENT_ID` | unset | | 08 |
| `retention.raw_months` | `CLOUDLEDGER_RETENTION_RAW_MONTHS` | `25` | OQ-09; tenant may override within bounds | 04 |
| `retention.cost_months` | `CLOUDLEDGER_RETENTION_COST_MONTHS` | `37` | | 04 |
| `retention.metrics_hourly_days` / `metrics_daily_months` | `…_METRICS_HOURLY_DAYS` / `…_METRICS_DAILY_MONTHS` | `90` / `25` | | 20 |

### 3.7 Identity, sessions and authorization

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `auth.bootstrap_admin.enabled` (P) | `CLOUDLEDGER_AUTH_BOOTSTRAP_ADMIN_ENABLED` | `true` / `false` / `false` | one-time first-admin bootstrap (UJ-01) | 04 |
| `auth.bootstrap_admin.token` (S) | `CLOUDLEDGER_AUTH_BOOTSTRAP_ADMIN_TOKEN` | generated, printed once | invalidated after first use | 04 |
| `auth.oidc.issuer` | `CLOUDLEDGER_AUTH_OIDC_ISSUER` | unset; required in Standard/HA | platform-level IdP; tenants may add their own via API | 05 |
| `auth.oidc.client_id` | `CLOUDLEDGER_AUTH_OIDC_CLIENT_ID` | — | | 05 |
| `auth.oidc.client_secret` (S) | `CLOUDLEDGER_AUTH_OIDC_CLIENT_SECRET` | — | | 05 |
| `auth.saml.sp_key` (S) / `auth.saml.sp_cert` | `CLOUDLEDGER_AUTH_SAML_SP_KEY` / `…_SP_CERT` | unset | | 31 |
| `auth.scim.enabled` | `CLOUDLEDGER_AUTH_SCIM_ENABLED` | `false` | | 31 |
| `auth.session.idle_timeout` / `absolute_timeout` | `CLOUDLEDGER_AUTH_SESSION_IDLE_TIMEOUT` / `…_ABSOLUTE_TIMEOUT` | `30m` / `12h` | | 05 |
| `auth.api_tokens.max_ttl` | `CLOUDLEDGER_AUTH_API_TOKENS_MAX_TTL` | `90d` | | 05 |
| `authz.policy_dir` | `CLOUDLEDGER_AUTHZ_POLICY_DIR` | built-in | extra Cedar policies (platform level) | 05 |
| `authz.break_glass.max_duration` | `CLOUDLEDGER_AUTHZ_BREAK_GLASS_MAX_DURATION` | `4h` | time-boxed, audited | 05 |

### 3.8 Crypto and secrets

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `crypto.kek.provider` (P) | `CLOUDLEDGER_CRYPTO_KEK_PROVIDER` | `file` / `k8s` / `kms` | `file`, `k8s`, `vault_transit`, `aws_kms`, `gcp_kms`, `azure_kv` | 04 |
| `crypto.kek.file` (S) | `CLOUDLEDGER_CRYPTO_KEK_FILE` | `/run/secrets/cloudledger-kek` | Lite; 32-byte key, file mode 0400 | 04 |
| `crypto.kek.key_ref` | `CLOUDLEDGER_CRYPTO_KEK_KEY_REF` | — | KMS key ARN / resource name / Vault transit key | 33 |
| `crypto.kek.previous_key_ref` (S) | `CLOUDLEDGER_CRYPTO_KEK_PREVIOUS_KEY_REF` | unset | set during rotation only (RB-07) | 33 |
| `crypto.dek_cache_ttl` | `CLOUDLEDGER_CRYPTO_DEK_CACHE_TTL` | `5m` | | 04 |
| `secrets.allowed_backends` | `CLOUDLEDGER_SECRETS_ALLOWED_BACKENDS` | all | restricts reference schemes | 04 |
| `secrets.cache_ttl` | `CLOUDLEDGER_SECRETS_CACHE_TTL` | `5m` | in-memory only | 04 |
| `allow_inline_secrets` | `CLOUDLEDGER_ALLOW_INLINE_SECRETS` | `false` | Lite development only (S-4) | 03 |

### 3.9 API limits and tenancy quotas

Operational protections, configurable by the operator. They are not license limits (NFR-LIC-004).

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `ratelimit.<bucket>.rate` / `burst` (H) | `CLOUDLEDGER_RATELIMIT_<BUCKET>_RATE` / `…_BURST` | default `20/s`, `40`; query `5/s`, `10`; export `1/s`, `2`; ai `0.5/s`, `2` | buckets per principal and per tenant ([API_GUIDELINES.md](../contracts/API_GUIDELINES.md)) | 05 |
| `quotas.export_max_bytes` (H) | `CLOUDLEDGER_QUOTAS_EXPORT_MAX_BYTES` | `5GiB` | | 29 |
| `tenants.deletion_grace` | `CLOUDLEDGER_TENANTS_DELETION_GRACE` | `30d` | TENANCY.md §3 | 04 |
| `audit.retention_years` | `CLOUDLEDGER_AUDIT_RETENTION_YEARS` | `7` | | 04 |
| `audit.anchor_interval` | `CLOUDLEDGER_AUDIT_ANCHOR_INTERVAL` | `1h` | anchors to object storage | 04 |
| `audit.siem.endpoint` / `audit.siem.token` (S) | `CLOUDLEDGER_AUDIT_SIEM_ENDPOINT` / `…_TOKEN` | unset | FR-AUD-003 | 31 |

### 3.10 Notifications and egress

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `smtp.host` / `port` / `from` | `CLOUDLEDGER_SMTP_HOST` … | unset / `587` / — | | 17 |
| `smtp.username` / `smtp.password` (S) | `CLOUDLEDGER_SMTP_USERNAME` / `…_PASSWORD` | — | | 17 |
| `notifications.max_attempts` | `CLOUDLEDGER_NOTIFICATIONS_MAX_ATTEMPTS` | `8` | then dead-letter (FR-BUD-006) | 32 |
| `notifications.webhook_signing_key` (S) | `CLOUDLEDGER_NOTIFICATIONS_WEBHOOK_SIGNING_KEY` | derived per channel | HMAC-signed webhooks | 17 |
| `egress.allow_private_networks` | `CLOUDLEDGER_EGRESS_ALLOW_PRIVATE_NETWORKS` | `false` | SSRF guard for webhooks | 17 |
| `egress.allowlist` | `CLOUDLEDGER_EGRESS_ALLOWLIST` | empty | extra hosts/CIDRs allowed despite the guard | 17 |
| `egress.http_proxy` | `CLOUDLEDGER_EGRESS_HTTP_PROXY` | unset | standard `HTTPS_PROXY` also honored | 06 |

### 3.11 AI gateway

AI is disabled by default (FR-AI-001). Provider credentials per tenant are stored as secret references via the API; these keys are platform-level defaults and limits.

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `ai.enabled` | `CLOUDLEDGER_AI_ENABLED` | `false` | platform master switch | 27 |
| `ai.allowed_provider_kinds` | `CLOUDLEDGER_AI_ALLOWED_PROVIDER_KINDS` | `openai_compatible,anthropic,ollama_compatible` | | 27 |
| `ai.endpoint_allowlist` | `CLOUDLEDGER_AI_ENDPOINT_ALLOWLIST` | empty | egress allow-list for LLM endpoints | 27 |
| `ai.max_tokens_per_user_per_day` (H) | `CLOUDLEDGER_AI_MAX_TOKENS_PER_USER_PER_DAY` | `200000` | | 27 |
| `ai.query_max_rows` / `ai.query_timeout` | `CLOUDLEDGER_AI_QUERY_MAX_ROWS` / `…_QUERY_TIMEOUT` | `1000` / `20s` | | 27 |
| `ai.conversation_retention` | `CLOUDLEDGER_AI_CONVERSATION_RETENTION` | `30d` | OQ-09 | 27 |

### 3.12 Observability

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `log.level` (H) | `CLOUDLEDGER_LOG_LEVEL` | `info` | | 03 |
| `log.format` | `CLOUDLEDGER_LOG_FORMAT` | `json` | `text` for local development only | 03 |
| `observability.otlp.endpoint` | `OTEL_EXPORTER_OTLP_ENDPOINT` (standard OTel env) | unset | standard `OTEL_*` variables are honored | 03 |
| `observability.traces.enabled` (P) | `CLOUDLEDGER_OBSERVABILITY_TRACES_ENABLED` | `false` / `true` / `true` | | 03 |
| `observability.traces.sample_ratio` (H) | `CLOUDLEDGER_OBSERVABILITY_TRACES_SAMPLE_RATIO` | `0.1` | parent-based | 03 |
| `observability.metrics.enabled` | `CLOUDLEDGER_OBSERVABILITY_METRICS_ENABLED` | `true` | `/metrics` on admin listener | 03 |
| `observability.metrics.tenant_label_allowlist` | `CLOUDLEDGER_OBSERVABILITY_METRICS_TENANT_LABEL_ALLOWLIST` | empty | max 50 IDs ([OBSERVABILITY.md §2.3](OBSERVABILITY.md#23-tenant-handling)) | 33 |
| `observability.tenant_id_mode` | `CLOUDLEDGER_OBSERVABILITY_TENANT_ID_MODE` | `raw` | `raw`, `hmac` | 33 |
| `observability.tenant_id_hmac_key` (S) | `CLOUDLEDGER_OBSERVABILITY_TENANT_ID_HMAC_KEY` | — | required when mode = `hmac` | 33 |
| `observability.propagate_external` | `CLOUDLEDGER_OBSERVABILITY_PROPAGATE_EXTERNAL` | `false` | | 03 |
| `telemetry.usage_reporting` | `CLOUDLEDGER_TELEMETRY_USAGE_REPORTING` | `false` | opt-in anonymous usage metrics only (OQ-17) | 03 |

### 3.13 Backup

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `backup.target_url` | `CLOUDLEDGER_BACKUP_TARGET_URL` | unset | object-store prefix, separate bucket or account recommended | 33 |
| `backup.credentials_ref` (S) | `CLOUDLEDGER_BACKUP_CREDENTIALS_REF` | unset | write-only principal | 33 |
| `backup.schedule` (P) | `CLOUDLEDGER_BACKUP_SCHEDULE` | `0 2 * * *` | Lite `admin backup`; Standard/HA use the PG operator / ClickHouse schedules | 33 |
| `backup.retention` | `CLOUDLEDGER_BACKUP_RETENTION` | `7d,4w` | | 33 |
| `backup.analytics.include_in_pg` | `CLOUDLEDGER_BACKUP_ANALYTICS_INCLUDE_IN_PG` | `true` | Lite PG analytics | 33 |
| `backup.verify.schedule` (P) | `CLOUDLEDGER_BACKUP_VERIFY_SCHEDULE` | manual / weekly / daily | [BACKUP_DR.md §6](BACKUP_DR.md#6-automated-restore-verification) | 33 |

### 3.14 Plugins

| YAML key | Env var | Default | Notes | Phase |
|---|---|---|---|---|
| `plugins.dir` | `CLOUDLEDGER_PLUGINS_DIR` | `/var/lib/cloudledger/plugins` | out-of-process gRPC plugins (ADR-0012) | 35 |
| `plugins.require_checksum` | `CLOUDLEDGER_PLUGINS_REQUIRE_CHECKSUM` | `true` | | 35 |
| `plugins.require_signature` (P) | `CLOUDLEDGER_PLUGINS_REQUIRE_SIGNATURE` | `false` / `true` / `true` | Cosign verification | 35 |
| `plugins.call_timeout` | `CLOUDLEDGER_PLUGINS_CALL_TIMEOUT` | `60s` | | 35 |

### 3.15 Web BFF (`apps/web`)

| Env var | Default | Notes | Phase |
|---|---|---|---|
| `CLOUDLEDGER_WEB_API_URL` | `http://api:8080` | internal API base URL | 03 |
| `CLOUDLEDGER_WEB_PUBLIC_URL` | required | | 03 |
| `CLOUDLEDGER_WEB_SESSION_SECRET` (S) | required | cookie encryption/signing key; supports `_FILE` | 05 |
| `CLOUDLEDGER_WEB_COOKIE_SECURE` | `true` | `false` only for local HTTP development | 05 |
| `CLOUDLEDGER_WEB_DEFAULT_LOCALE` | `en` | NFR-I18N-001 | 14 |
| `CLOUDLEDGER_WEB_CSP_REPORT_URI` | unset | | 14 |

No `NEXT_PUBLIC_*` variable may contain a secret or an internal URL. A lint rule enforces this (planned).

## 4. Example (illustrative, Lite)

```yaml
# cloudledger.yaml (illustrative; not a working file until Phase 03)
profile: lite
server:
  public_url: http://localhost:3000
database:
  url: postgres://cloudledger@postgres:5432/cloudledger?sslmode=disable
  password: file:///run/secrets/pg-password
analytics:
  engine: postgres
objectstore:
  driver: s3
  endpoint: http://minio:9000
  bucket: cloudledger
  access_key_id: file:///run/secrets/minio-access-key
  secret_access_key: file:///run/secrets/minio-secret-key
crypto:
  kek:
    provider: file
    file: /run/secrets/cloudledger-kek
log:
  level: info
```

## 5. Open items

| Item | Proposed default | Decide in |
|---|---|---|
| Final env naming (single `_` mapping vs. `__` nesting delimiter) | single `_`, explicit registry | Phase 03 |
| Per-profile worker concurrency defaults | sized in Phase 34 against reference hardware | Phase 34 |
| Whether `admin backup` covers ClickHouse in Standard | no; use native ClickHouse backup | Phase 33 |
