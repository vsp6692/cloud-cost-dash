# Service Level Indicators and Objectives

Status: **DRAFT plan**. Nothing here is implemented or measured. Phase 12 adds ingestion-health SLIs, Phase 33 adds SLO recording and alerting rules, and Phase 34 runs the SLO gates on reference hardware (OQ-13). Targets come from PRD §6 where they exist. Targets marked **proposed** are new in this document and need confirmation in Phase 01/34 (see [Open items](#8-open-items)).

## 1. Scope and ownership

CloudLedger is mostly self-hosted, so the SLOs here serve two purposes:

| Purpose | Who owns it | How it is used |
|---|---|---|
| **Product targets** | CloudLedger maintainers | Release gate (Phase 34 and 38): reference deployments of each profile must meet these SLOs under the k6 load profiles on reference hardware. |
| **Operator SLOs** | Each operator | Shipped as Prometheus recording and alerting rules (`deploy/observability/prometheus/rules/`, planned). Operators may tune thresholds and windows in Helm values or Compose overrides. |

A self-hosted deployment that is under-provisioned for its data volume (PRD §8 reference scale) is outside the product SLO.

## 2. SLI definitions

All SLIs are computed from `cloudledger_*` metrics in [OBSERVABILITY.md §3](OBSERVABILITY.md#3-metric-catalog). The SLO window is **30 days, rolling**, unless stated otherwise.

| SLI | Good event | Valid event (denominator) | Exclusions | Source metric |
|---|---|---|---|---|
| **API availability** | response status is not 5xx and not a gateway timeout | all requests to `/api/v1/**` and the web BFF routes | `/healthz`, `/readyz`, `/metrics`; 429 responses (client over quota); requests rejected by authentication before routing (401) | `cloudledger_http_requests_total` |
| **API latency (metadata)** | server duration ≤ threshold | successful requests with `route_class="metadata"` | `query`, `export`, `ai` and `auth` route classes have their own SLIs or none | `cloudledger_http_request_duration_seconds` |
| **Query latency (dashboard)** | semantic query execution ≤ threshold | successful semantic queries with `source="dashboard"` | queries rejected by validation or quota; AI and report queries (separate budget) | `cloudledger_query_duration_seconds` |
| **Ingestion freshness** | artifact live (atomic swap committed) within 1 h of becoming available in the provider export | every provider artifact discovered (CUR manifest, BigQuery export partition, Azure export run, uploaded file) | `not_ready` artifacts, provider-side latency before availability, `data`-class quarantines (tracked by the data-quality SLI), connectors in `error` state for `auth` reasons (tracked per tenant, not platform SLO) | `cloudledger_ingestion_artifact_delay_seconds` |
| **Alert delivery latency** | first successful delivery to the channel within threshold of the triggering event's outbox `created_at` | all notifications for `budget.threshold.crossed.v1`, `anomaly.detected.v1`, `ingestion.run.failed.v1` and approval requests | deliveries to channels that return 4xx auth/config errors (owner misconfiguration), digest-mode notifications (measured against digest schedule) | `cloudledger_notification_delivery_latency_seconds` |
| **Job success rate** | job finalized as `completed` | jobs finalized as `completed` or `discarded` (dead-lettered) | `cancelled` jobs; jobs that ended in quarantine for `data` reasons (correct behavior) | `cloudledger_jobs_finalized_total` |
| **Job pickup latency** (supporting) | job leased within threshold of `scheduled_at` | jobs in `available` state | low-priority backfill queue | `cloudledger_job_wait_seconds` |
| **Data quality** (supporting) | ingestion run reaches `succeeded` | runs that reach a terminal state | `cancelled` | `cloudledger_ingestion_runs_total` |

Freshness timing: `available_at` is the provider timestamp of the artifact (for example the S3 object `LastModified` of a CUR manifest, BigQuery `export_time`, Azure export run completion). `live_at` is the commit time of the atomic partition swap. Discovery polling (`ingestion.poll_interval`, default 15 min) must be well below the 1 h target.

## 3. SLO targets per profile

Lite runs as a single node and accepts single-node downtime ([DEPLOYMENT_PROFILES.md](../architecture/DEPLOYMENT_PROFILES.md)), so its availability is best effort. Latency and freshness targets still apply.

| SLO | Lite | Standard | HA Enterprise | Origin |
|---|---|---|---|---|
| API availability (30 d) | best effort (no SLO) | 99.5% **proposed** | **99.9%** | NFR-AVL-001 (HA) |
| API metadata latency | 95% ≤ 300 ms, 99% ≤ 1 s | **95% ≤ 300 ms**, 99% ≤ 1 s | **95% ≤ 300 ms**, 99% ≤ 800 ms | NFR-PERF-002; p99 proposed |
| Dashboard query latency (13 months of data, reference scale) | **95% ≤ 5 s** (PostgreSQL) | **95% ≤ 2 s** (ClickHouse) · 95% ≤ 5 s (PostgreSQL small) | 95% ≤ 2 s **proposed** (ClickHouse cluster) | NFR-PERF-001 |
| Ingestion freshness | 95% ≤ 1 h **proposed** | **99% ≤ 1 h** | **99% ≤ 1 h** | NFR-FRS-001; percentiles proposed |
| Alert delivery latency | 95% ≤ 15 min **proposed** | 95% ≤ 5 min, 99% ≤ 15 min **proposed** | 95% ≤ 2 min, 99% ≤ 10 min **proposed** | FR-BUD-006 (no numeric target in PRD) |
| Job success rate (per queue, 30 d) | ≥ 99% **proposed** | ≥ 99.5% **proposed** | ≥ 99.9% **proposed** | ADR-0005 |
| Job pickup latency (non-backfill queues) | 95% ≤ 5 min | 95% ≤ 60 s | 95% ≤ 30 s | proposed |
| Data quality (runs succeeded) | tracked, no SLO | tracked, no SLO | tracked, no SLO | quarantines are a correctness feature, not a failure |
| Control-plane RPO / RTO | 24 h / best effort | 1 h / 4 h | 15 min / 1 h | NFR-AVL-001, [BACKUP_DR.md](BACKUP_DR.md) |

Correctness is not an SLO with an error budget. Normalized totals must equal source totals exactly (NFR-ACC-001). Any invariant failure that reaches the live partition is a Sev-1 incident, not budget consumption.

## 4. Error budgets

| SLO | Budget per 30 days |
|---|---|
| 99.9% availability | 43.2 min of full outage equivalent (0.1% of requests) |
| 99.5% availability | 3 h 36 min (0.5% of requests) |
| 95% latency target | 5% of valid requests may exceed the threshold |
| 99% freshness | 1% of artifacts may exceed 1 h |
| 99.5% job success | 0.5% of finalized jobs may be dead-lettered |

### Error budget policy (project reference deployments and release gating)

| Budget remaining | Action |
|---|---|
| > 50% | Normal feature work. |
| 25–50% | Reliability items from incident reviews take priority in the next phase's backlog. |
| < 25% | Changes to the affected subsystem need an area-owner approval with a reliability note. |
| Exhausted | Feature merges to the affected subsystem pause until a fix lands and the SLI recovers for 7 days. A release cannot be certified (Phase 38) while a product SLO is failing on the reference deployment. |

Operators adopt or adapt this policy for their own deployments. The policy never blocks security fixes or billing-accuracy fixes.

## 5. Alerting on SLOs

Multi-window, multi-burn-rate alerts (per the Google SRE workbook), generated per SLO by the planned rule generator in `deploy/observability/`.

| Severity | Burn rate | Long window | Short window | Budget consumed at trigger | Action |
|---|---|---|---|---|---|
| `page` | 14.4× | 1 h | 5 min | 2% | page on-call |
| `page` | 6× | 6 h | 30 min | 5% | page on-call |
| `ticket` | 3× | 1 d | 2 h | 10% | ticket, next business day |
| `ticket` | 1× | 3 d | 6 h | 10% | ticket, review in weekly ops |

Lite ships the same rules with every `page` downgraded to `ticket` (no on-call is assumed). Each alert carries `runbook_url`, `slo`, `profile` and `severity` labels. Runbooks are listed in [RUNBOOKS.md](RUNBOOKS.md).

Freshness has an additional non-burn-rate alert because a single stuck connector matters even when the aggregate is healthy: `cloudledger_ingestion_freshness_seconds > 2 × expected export cadence + 1 h` for 30 min → `ticket` (see [OBSERVABILITY.md §6](OBSERVABILITY.md#6-alert-rules)).

## 6. How SLIs are measured

| Concern | Approach |
|---|---|
| Recording rules | `cloudledger:sli_<name>:ratio_rate<window>` for each window used above (5m, 30m, 1h, 2h, 6h, 1d, 3d, 30d). |
| Measurement point | API availability and latency are measured at the API server and the web BFF. Operators with an ingress or load balancer should also record ingress-side metrics, which catch failures where the pod never responds. Ingress metrics take precedence when both exist. |
| Synthetic probes | A blackbox probe (planned, Standard and HA) calls `GET /readyz` and an authenticated read-only metadata endpoint with a dedicated probe principal every 30 s. Probes catch outages during zero traffic. Probe results feed a separate SLI and are not mixed into user traffic. |
| Histogram buckets | Latency histograms include bucket boundaries at each SLO threshold (0.3 s, 0.8 s, 1 s, 2 s, 5 s, 120 s, 300 s, 900 s, 3600 s) so ratios are exact rather than interpolated. |
| Freshness | Computed per artifact at swap commit (`live_at − available_at`), observed into a histogram without tenant labels. Per-tenant freshness is exposed through `GET /api/v1/ingestion/health` and the UI (FR-CON-005, FR-DSH-003). |
| Alert delivery | Measured from outbox `created_at` to the first 2xx channel response, observed when the delivery is marked delivered. |
| Load profiles | k6 scenarios in `tests/performance/` (planned) reproduce the PRD §8 reference scale per profile. SLO gates in Phase 34 run these scenarios for at least 1 h of steady state plus a backfill-under-load scenario. |
| Evidence | SLO gate results are recorded in the relevant phase `TEST_RESULTS.md` with commands, environment and raw numbers. Results are never estimated or copied from other runs. |

### Example recording rule (illustrative; finalized in Phase 33)

```yaml
groups:
  - name: cloudledger-sli-api
    rules:
      - record: cloudledger:sli_api_availability:ratio_rate5m
        expr: |
          1 - (
            sum(rate(cloudledger_http_requests_total{status_class="5xx", route_class!="health"}[5m]))
            /
            sum(rate(cloudledger_http_requests_total{route_class!="health", status!="429"}[5m]))
          )
      - record: cloudledger:sli_api_metadata_latency:ratio_rate5m
        expr: |
          sum(rate(cloudledger_http_request_duration_seconds_bucket{route_class="metadata", le="0.3"}[5m]))
          /
          sum(rate(cloudledger_http_request_duration_seconds_count{route_class="metadata"}[5m]))
```

## 7. Review cadence

| Cadence | Activity |
|---|---|
| Weekly (operators) | Budget burn review; open `ticket` alerts. |
| Per phase (maintainers) | Re-run relevant k6 scenarios when a phase touches a hot path (query compiler, ingestion, job queue). |
| Quarterly | SLO target review against measured data; adjust targets through a PR to this document and, if a PRD target changes, to the PRD. |

## 8. Open items

| Item | Proposed default | Decide in |
|---|---|---|
| Standard availability target (PRD has only HA) | 99.5% | Phase 01 |
| Alert delivery latency target (not in PRD) | Table in §3 | Phase 01 / 32 |
| Job success-rate target (not in PRD) | Table in §3 | Phase 12 |
| HA query latency at ≥ 3 B rows/month | Same as Standard (2 s p95) | Phase 34 |
| DuckDB (Lite) query latency target (PRD states PostgreSQL only) | 5 s p95, same as PostgreSQL | Phase 13 |
| Reference hardware | OQ-13 proposal | Phase 34 |
