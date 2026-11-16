# Phase 18: FX, commitments, unit economics, accounting calendars: Implementation

Status: **NOT STARTED** · Release checkpoint: v0.3 · Spec status: DRAFT (no code exists)

| ID | Task | Files / dirs | Size | Depends on |
|---|---|---|---|---|
| P18-T01 | Control-plane migrations: FX columns, `tenant_fx_bindings`, commitments columns, unit-metric columns + `unit_metric_batches`, `accounting_calendars`, `accounting_calendar_periods`; RLS (incl. shared-set read policy and `fx_rates` parent policy) | `database/postgres/migrations/<seq>_p18_finance_core.{up,down}.sql` | M | — |
| P18-T02 | Analytics migrations on 3 engines: densified `fx_applied`, extended `commitment_utilization`, `commitment_coverage_daily`, `fiscal_calendar_days` | `database/{postgres,duckdb,clickhouse}/analytics/<seq>_p18_finance.sql` | M | T01 |
| P18-T03 | Pure `Converter` (direct/inverse/triangulated, single rounding, carry-forward) + policy resolution; float lint on package | `internal/finance/fx/convert.go`, `policy.go` | M | — |
| P18-T04 | Rate-set repository, canonical checksum, activation (audit + `data_version++`), CSV/JSON upload parser | `internal/finance/fx/{repo,upload,activate}.go` | M | T01, T03 |
| P18-T05 | ECB fetcher job (opt-in flag, URL allow-list, raw XML to object storage, new version only on checksum change) | `internal/finance/fx/ecb/` | S | T04 |
| P18-T06 | Provider FX capture from `cost_focus` extension columns into `provider`-source rate sets | `internal/finance/fx/provider_rates.go` | S | T04 |
| P18-T07 | Semantic-layer currency stage: join `fx_applied`, `meta.fx_rate_set_id`/`fx_policy`/`fx_sources`, `fx_rate_missing` error | `internal/analytics/semantic/currency.go` | M | T02, T03 |
| P18-T08 | `CommitmentSource` for AWS, GCP, Azure + billing-row discovery and `unknown` placeholders | `providers/{aws,gcp,azure}/commitments/`, `internal/finance/commitments/sync.go` | L | T01 |
| P18-T09 | Utilization, coverage and amortization jobs (triggered by `cost.period.allocated.v1`), divergence findings | `internal/finance/commitments/{utilization,coverage,amortize}.go` | L | T02, T08 |
| P18-T10 | Unit metrics: definitions, batch API, CSV upload, replication to analytics, `unit_cost:<key>` metric | `internal/finance/unitmetrics/`, `internal/analytics/semantic/unitcost.go` | M | T01, T02 |
| P18-T11 | Calendar generator (pure), activation with closed-period guard, `accounting_periods` upsert, fiscal grains | `internal/finance/calendar/`, `internal/analytics/semantic/grains.go` | M | T01, T02 |
| P18-T12 | API handlers, Cedar actions, OpenAPI, event schemas | `internal/finance/api/`, `api/openapi/cloudledger.v1.yaml`, `schemas/events/` | M | T04–T11 |
| P18-T13 | UI: rate sets, commitments overview, unit metrics, calendar settings | `apps/web/app/(finance)/` | M | T12 |
| P18-T14 | Golden datasets + contract-suite groups (FX, commitments, unit cost, calendars) on 3 engines | `tests/fixtures/golden/{fx_conversion,commitments_aws,commitments_gcp,commitments_azure,unit_cost,calendars}/`, `tests/contracts/analytics/finance_test.go` | L | T03–T11 |
| P18-T15 | Docs: FINANCE_RECONCILIATION.md §2–5, DATABASE_SCHEMA.md deltas, EVENTS.md, runbook "FX rate missing" | `docs/` | S | T12 |

## Migrations
Expand-only: new columns are added nullable, backfilled (`commitments.source='billing'`, `status='unknown'` for pre-existing rows), then constrained `NOT NULL` in a second migration in the same release. `tenant_settings.accounting_calendar` jsonb is retained (read alias) for two minor releases. Down migrations drop only new objects; data loss on down is documented.

## Feature flags
| Flag | Default | Effect |
|---|---|---|
| `cl.finance.fx_conversion` | off | Enables reporting-currency conversion; off = billing currency only, mixed currencies rejected with `422 currency_mixed` |
| `cl.finance.fx_ecb_fetch` | off | Operator opt-in for outbound ECB fetch (OQ-17: no phone-home by default) |
| `cl.finance.commitments` | off | Commitment sync, jobs, endpoints |
| `cl.finance.unit_metrics` | off | Unit-metric endpoints and `unit_cost:*` metrics |
| `cl.finance.fiscal_calendars` | off | Non-gregorian calendars and fiscal grains |

## Rollout
1. Ship migrations and pure libraries (flags off). 2. Enable FX on a staging tenant with golden data; compare totals to golden. 3. Enable commitments per provider (AWS → Azure → GCP) after fixture parity. 4. Enable calendars and unit metrics. 5. Default flags on after acceptance.

## Rollback
Disable the flag (no data mutation). Rate-set or calendar activation is reverted by activating the previous version (audited, `data_version++`). Commitment analytics tables are derived and can be dropped and recomputed. Unit-metric values are never deleted by rollback.

## Definition of done
All P18-T tasks merged; P18-TC suite executed with results in TEST_RESULTS.md; golden datasets exact on PostgreSQL, DuckDB and ClickHouse; float lint clean on `internal/finance/**`; OpenAPI diff reviewed; security review of upload paths and ECB egress; ACCEPTANCE.md signed.
