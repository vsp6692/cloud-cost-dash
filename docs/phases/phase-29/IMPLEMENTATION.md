# Phase 29 — Implementation Plan

Sizes: S ≤ 2 days, M ≤ 1 week, L > 1 week. Commands are **planned**; nothing has been run.

## Feature flags
| Flag | Default | Purpose |
|---|---|---|
| `features.finance_reconciliation_v2` | off → on at phase exit | switches matcher/categorizer from Phase 10 v1 to v2 |
| `features.finance_journal_export` | off | GL mappings and journal export |
| `features.finance_exports_streaming` | off | streaming export engine (replaces Phase 16 widget export path for large exports) |

Flags are rollout and kill switches only. They never gate features by license (NFR-LIC-004).

## Tasks
| ID | Task | Files / dirs | Size | Depends |
|---|---|---|---|---|
| P29-T01 | Migrations `p29_001`…`p29_004` with RLS template, catalog test update | `database/postgres/migrations/p29_*.sql`, `tests/integration/db/rls_catalog_test.go` | M | — |
| P29-T02 | Golden fixtures: invoices with tax, credits, marketplace, FX, late correction, rounding; expected variances | `tests/fixtures/finance/invoices/` | M | — |
| P29-T03 | Matcher v2 + line groups, pinned `data_version` | `internal/finance/reconciliation/matcher.go` | M | T01 |
| P29-T04 | Categorizer chain with Σ-invariant assertion | `internal/finance/reconciliation/categorize/*.go` | L | T03 |
| P29-T05 | Acknowledgment service, SoD, staleness on re-run, audit | `internal/finance/reconciliation/ack.go` | M | T04 |
| P29-T06 | Restatement/invoice-import subscribers, unique job keys | `internal/finance/reconciliation/subscriber.go` | S | T04 |
| P29-T07 | GL mapping model, validation, preview diff, publish | `internal/finance/journal/mapping*.go` | M | T01 |
| P29-T08 | Journal builder + balancer (half-even, residual) | `internal/finance/journal/builder.go`, `balance.go` | M | T07 |
| P29-T09 | Neutralizer (shared with Phase 09 helper) + fuzz tests | `internal/finance/exports/neutralize.go` | S | — |
| P29-T10 | Format writers csv/xlsx/ndjson/parquet/pdf (streaming) | `internal/finance/exports/writers/` | L | T09 |
| P29-T11 | Export engine: source cursor, multipart uploader, tenant prefix, lease/retry | `internal/finance/exports/engine.go` | L | T10 |
| P29-T12 | Validator + manifest builder (canonical JSON, SHA-256) | `internal/finance/exports/validate.go`, `manifest.go` | M | T11 |
| P29-T13 | Showback/chargeback export type with unallocated row | `internal/finance/exports/types/chargeback.go` | M | T11 |
| P29-T14 | API handlers + OpenAPI additions, Cedar actions, rate-limit bucket | `apps/api/handlers/finance/`, `api/openapi/cloudledger.v1.yaml`, `internal/authz/policies/finance.cedar` | M | T05, T12 |
| P29-T15 | Events `export.completed.v1`, `variance.acknowledged.v1` + JSON Schemas | `schemas/events/`, `docs/contracts/EVENTS.md` | S | T14 |
| P29-T16 | UI: reconciliation workbench, acknowledge dialog, GL mapping editor, export wizard | `apps/web/app/(finance)/` | L | T14 |
| P29-T17 | E2E UJ-08 and UJ-04 chargeback step; performance test 100 M-row export | `tests/e2e/uj-08-reconciliation.spec.ts`, `tests/performance/exports/` | M | T16 |
| P29-T18 | Docs: FINANCE_RECONCILIATION, operations (export storage, TTL), CHANGELOG | `docs/architecture/`, `docs/operations/` | S | all |

## Planned commands
```bash
go test ./internal/finance/...                                   # (planned) unit + property
go test -tags=integration ./tests/integration/finance/...        # (planned) Testcontainers PG + MinIO + ClickHouse
go test -fuzz=FuzzNeutralize ./internal/finance/exports -fuzztime=5m   # (planned)
pnpm --filter web exec playwright test e2e/uj-08*                # (planned)
k6 run tests/performance/exports/large_export.js                 # (planned)
```

## Rollout
1. Ship migrations (expand only) with all flags off.
2. Enable `finance_reconciliation_v2` in staging; run v1 and v2 side by side on golden invoices; diff results.
3. Enable streaming exports, then journal export for pilot tenants.
4. Default-on at phase acceptance.

## Rollback
- Turn flags off: v1 matcher resumes; journal export endpoints return 404 `feature_disabled`.
- New tables stay (forward-only); no data is lost. Contract migrations (dropping v1-only columns) are deferred to a later phase.
- Exports created during the window remain downloadable until expiry.

## Definition of done
All P29-R* implemented; TC suite passing with actual commands recorded in TEST_RESULTS.md; golden totals exact; OpenAPI diff reviewed; security review of export URLs and neutralizer; CHANGELOG entry; acceptance signed; Phase 30 not started.
