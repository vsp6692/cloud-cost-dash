# Phase 13 Implementation Plan

Rules: tests first or alongside; small PRs; each task ends with fmt, lint (incl. no-float lint in `internal/analytics`), unit tests green. Sizes: S ≤ 1 day, M ≤ 3 days, L ≤ 1.5 weeks.

| ID | Task | Files / dirs | Size | Depends |
|---|---|---|---|---|
| P13-T01 | Semantic query JSON Schema and Go types; canonicalization and `QueryHash` | `schemas/semantic/query.v1.json`, `internal/analytics/semantic/` | M | — |
| P13-T02 | Metric and dimension registries with visibility hooks and `registry_version` | `internal/analytics/semantic/registry/` | M | T01 |
| P13-T03 | Logical planner with mandatory security predicate injection (no constructor without `SecurityContext`) | `internal/analytics/plan/` | M | T02 |
| P13-T04 | Adapter interface, typed errors, `Limits`, `Capabilities`; import-lint rule restricting analytics drivers | `internal/analytics/adapter/`, `.golangci.yml`, `tools/archlint/` | S | T03 |
| P13-T05 | Golden dataset loader and parity harness skeleton (engine-agnostic) | `tests/contracts/analytics/harness/`, `tests/fixtures/analytics/golden/` | M | T04 |
| P13-T06 | PostgreSQL adapter: migrations, RLS, `cl_round_half_even`, stage/attach swap, emitter | `internal/analytics/adapter/postgres/`, `database/postgres/analytics/` | L | T04, T05 |
| P13-T07 | DuckDB adapter: per-tenant file manager, table-per-period + view swap, emitter (build tag `duckdb`) | `internal/analytics/adapter/duckdb/`, `database/duckdb/` | L | T04, T05 |
| P13-T08 | ClickHouse adapter: DDL, row policies, query user settings, staging + `REPLACE PARTITION`, server-side params | `internal/analytics/adapter/clickhouse/`, `database/clickhouse/` | L | T04, T05 |
| P13-T09 | `tenant_data_versions` migration + `dataversion` package + swap/PG reconciler job | `database/postgres/migrations/NNNN_tenant_data_versions.sql`, `internal/analytics/dataversion/` | M | T06 |
| P13-T10 | Cache: LRU with byte budget, key builder (tenant, scope hash, query hash, data version, engine), metrics | `internal/analytics/cache/` | M | T03, T09 |
| P13-T11 | `QueryService` + `POST /api/v1/query` + `GET /api/v1/semantic/catalog`; meta assembly (freshness from Phase 12 health tables) | `internal/analytics/service/`, `apps/api/handlers/query.go`, `api/openapi/cloudledger.v1.yaml` | M | T10 |
| P13-T12 | Limits enforcement per engine and rate-limit bucket `query` | adapters, `internal/platform/ratelimit/` | M | T06–T08 |
| P13-T13 | Parity suite: 200+ queries, exact string compare, ordered-result compare | `tests/contracts/analytics/parity/` | L | T06–T08 |
| P13-T14 | Isolation suite (two-tenant fixture, crafted filters, row policy catalog test, DuckDB path tests) | `tests/contracts/analytics/isolation/`, `tests/security/analytics/` | M | T13 |
| P13-T15 | Failure injection (engine kill during commit, PG tx failure after swap, timeouts) | `tests/integration/analytics/failure/` | M | T09 |
| P13-T16 | Observability spans and metrics; log redaction test | adapters, `internal/platform/observability/` | S | T11 |
| P13-T17 | Engine selection config, Compose/Helm values (`analytics.engine`), operator docs | `deploy/docker/`, `deploy/helm/`, `docs/operations/` | S | T11 |
| P13-T18 | Baseline benchmarks (Lite fixture, 5 M rows) | `tests/performance/analytics/` | M | T13 |
| P13-T19 | Docs: ANALYTICS_ADAPTERS.md (partition key note), DATABASE_SCHEMA.md (data version table), CHANGELOG | docs | S | all |

## Migrations
- Control plane: `NNNN_tenant_data_versions.sql` (expand-only; backfill rows with `data_version = 0` for existing tenants).
- Analytics: per-engine `0001_cost_focus`, `0002_cost_daily_agg`, `0003_cost_allocated_ddl`, `0004_fx_applied_ddl`, PG `0005_cl_round_half_even`, CH `0005_row_policies`.
- Migration of existing Phase 06 PG analytics data: in-place compatible (same column set); verified by row and control-total comparison before/after.

## Feature flags / config
| Key | Default | Purpose |
|---|---|---|
| `analytics.engine` | profile default | engine selection; change requires re-load of history via re-normalization (Phase 11 job) |
| `analytics.cache.enabled` | `true` | kill switch |
| `analytics.cache.max_bytes` | 256 MiB | per replica |
| `analytics.limits.*` | per R09 | operator-tunable (operational, not license limits; NFR-LIC-004) |

## Rollout and rollback
1. Ship adapters behind `analytics.engine`; existing Lite installs remain on postgres.
2. ClickHouse opt-in for Standard: provision, run `cloudledger migrate analytics --engine=clickhouse`, trigger full re-normalization into the new engine, run `cloudledger analytics verify --compare postgres` (control totals per period), then switch config.
3. Rollback: switch `analytics.engine` back; the previous engine's data is untouched (dual-write is not performed; re-normalization needed for data ingested after the switch, documented).
4. Cache: disable with flag if any isolation concern arises.

## Definition of done
- All P13-TC executed with real results recorded; parity suite green on all three engines in CI on amd64 and arm64.
- No float types in `internal/analytics/**` (lint).
- Security review sign-off on predicate injection, row policies and cache keying.
- Docs and OpenAPI updated; `oasdiff` shows additive changes only.
