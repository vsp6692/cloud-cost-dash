# Phase 15 Implementation Plan

Sizes: S ≤ 2 days, M ≤ 5 days, L ≤ 10 days. Tasks are ordered. Tests are written with or before code (rule C).

| ID | Task | Files / dirs | Size | Depends |
|---|---|---|---|---|
| P15-T01 | Re-read ALLOCATION_ENGINE.md, confirm residual algorithm and rule precedence with Finance SME; record any deviation as an ADR amendment | `docs/architecture/ALLOCATION_ENGINE.md` | S | — |
| P15-T02 | Migrations 0015_001…004 (rule-set metadata, rule metadata, `allocation_runs`, `allocation_previews`), RLS, catalog test update; update DATABASE_SCHEMA.md §2.4 | `database/postgres/migrations/0015_*.sql`, `docs/architecture/DATABASE_SCHEMA.md` | M | T01 |
| P15-T03 | `cost_allocated` DDL per engine + adapter `BeginStage` support for the table | `database/{postgres,clickhouse,duckdb}/analytics/`, `internal/analytics/adapters/*` | M | T02 |
| P15-T04 | Rule AST, JSON Schema, validator, canonical JSON checksum | `internal/allocation/rules/`, `schemas/allocation/rule.v1.json` | M | T01 |
| P15-T05 | Row-local evaluator (stages 1–5), inheritance resolver from `cloud_scopes.tags`, hierarchy-version resolver | `internal/allocation/eval/` | L | T04 |
| P15-T06 | Splitter with largest-remainder residuals, currency minor-unit table, negative amounts; property tests | `internal/allocation/split/`, `internal/platform/money/iso4217.go` | M | T04 |
| P15-T07 | Invariant checker and control totals | `internal/allocation/invariant/` | S | T06 |
| P15-T08 | Worker: two-pass run, staging, swap with live-pointer CAS, events, retries; consumes `cost.period.normalized.v1`, `cost.period.restated.v1`, `allocation.published.v1` | `internal/allocation/worker/` | L | T03, T05–T07 |
| P15-T09 | Service: drafts (ETag), publish (tx: supersede + audit + outbox), preview job and diff builder, effective dating | `internal/allocation/service/` | M | T08 |
| P15-T10 | ABAC extension: predicate AST attributes, Cedar schema entities, SQL compilation per engine, equivalence tests | `internal/authz/`, `internal/analytics/compiler/` | L | T03 |
| P15-T11 | Semantic registry: `hierarchy:*`, `dim:*`, `allocation_*` dims, `allocated_*` metrics, chargeback presets | `internal/analytics/semantic/registry/` | M | T03, T10 |
| P15-T12 | REST handlers + OpenAPI paths (`/allocation/*`, `/custom-dimensions`, `/chargeback`) | `internal/allocation/http/`, `api/openapi/cloudledger.v1.yaml` | M | T09, T11 |
| P15-T13 | Web: rule-set list/editor (condition builder, drag ordering), preview diff view, publish dialog, unallocated explorer, chargeback page | `apps/web/app/(app)/allocation/`, `apps/web/components/allocation/` | L | T12 |
| P15-T14 | Golden allocation datasets (multi-provider, multi-currency, credits, JPY and BHD, untagged) with expected outputs computed independently (spreadsheet + review) | `tests/fixtures/allocation/` | M | T06 |
| P15-T15 | Cross-engine parity cases for `cost_allocated` added to the analytics contract suite | `tests/contracts/analytics/allocation_*` | M | T03, T14 |
| P15-T16 | UJ-04 Playwright E2E + axe | `tests/e2e/uj04-allocation.spec.ts` | M | T13 |
| P15-T17 | Performance benchmark (10 M rows, 200 rules) | `tests/performance/allocation/` | S | T08 |
| P15-T18 | Docs: user guide, ALLOCATION_ENGINE.md links, CHANGELOG, phase TEST_RESULTS and ACCEPTANCE | `docs/`, `CHANGELOG.md` | S | all |

## Feature flags
| Flag | Default | Purpose |
|---|---|---|
| `allocation.enabled` | `false` until T16 passes, then `true` | Gates worker consumption and UI routes. Off ⇒ `cost_allocated` not written and allocated metrics return `422 unsupported_query` with code `allocation_disabled`. |
| `allocation.abac_dimensions` | `false` | Enables hierarchy/dim/tag predicates in data scopes. Turned on only after T10 equivalence tests pass. |
| `allocation.preview_max_months` | `3` | Operational cap. |

Flags are operational toggles, not license gating (NFR-LIC-004).

## Rollout
1. Ship migrations (expand-only) and DDL with flags off.
2. Enable `allocation.enabled` in dev and fixture environments, run golden and parity suites.
3. Enable per tenant in staging; backfill allocation for 13 months at low priority.
4. Enable `allocation.abac_dimensions` after the security review.

## Rollback
- Disable `allocation.enabled`: dashboards fall back to unallocated metrics (Phase 14 behavior). No data loss: `cost_focus` untouched.
- Bad rule set: publish the previous version again as a new version (rule sets are immutable; "rollback" is a forward publish), which re-allocates affected periods.
- Migrations are additive; contracting is deferred to a later release.

## Definition of done
- All tasks merged with review; `golangci-lint` including the no-float rule clean; coverage ≥ 85% on `internal/allocation/...`.
- All P15 tests executed with recorded commands in TEST_RESULTS.md; zero failing invariant or parity tests.
- OpenAPI diff reviewed; events validated against schemas.
- Security review notes linked from ACCEPTANCE.md.
