# Phase 25 — Implementation plan

Planned commands are marked (planned). Nothing has been executed.

| ID | Task | Files / dirs | Size |
|---|---|---|---|
| P25-T01 | Migrations `p25_001`…`p25_005` (expand only), RLS catalog test update | `database/postgres/migrations/p25_*.sql` | S |
| P25-T02 | Manifest schema additions: `action_class`, `overlap_keys`, `projected_cost` kind (ratio/delta/fixed); SDK validation | `sdk/recommendation/manifest.go`, `schemas/manifest/` | S |
| P25-T03 | Resolver core (pure), union-find, exclusive keys, sequential application, invariant checker | `internal/recommendations/overlap/` | L |
| P25-T04 | Property-based tests (`pgregory.net/rapid`) for INV-1…INV-7 and the golden worked example (§5.3) | `internal/recommendations/overlap/*_test.go` | M |
| P25-T05 | Commitment pool builder per provider type and coverage order; hourly eligible series query | `internal/recommendations/pools/` | L |
| P25-T06 | REC-COM-001…004 with alternatives by term and payment option | `internal/recommendations/rules/commitments/` | L |
| P25-T07 | REC-REG-001/002 (residency suppression, ARM compatibility evidence) | `rules/regions/` | M |
| P25-T08 | License declarations CRUD + REC-LIC-001/002 | `internal/recommendations/licensing/`, `rules/licensing/` | M |
| P25-T09 | REC-GOV-001/002/003 | `rules/governance/` | S |
| P25-T10 | Wire two-pass resolution into `recs.evaluate`; `overlap_resolution_runs`; fail-closed path | `internal/recommendations/evaluate/` | M |
| P25-T11 | API: summary, overlap group, pools, simulator, license declarations; OpenAPI + `x-cloudledger-permission` | `internal/recommendations/api/`, `api/openapi/cloudledger.v1.yaml` | M |
| P25-T12 | UI: savings summary (net), overlap panel, pool view + simulator, license page | `apps/web/app/(app)/recommendations/`, `apps/web/app/(app)/commitments/` | M |
| P25-T13 | Fixtures for each rule and provider pool type; UJ-07 E2E | `tests/fixtures/recommendations/p25/`, `apps/web/e2e/uj-07-commitments.spec.ts` | M |
| P25-T14 | Docs: engine §5 final text, user guide, CHANGELOG | `docs/architecture/`, `docs/user/` | S |

## Feature flags
- `features.recommendations_overlap_v2` (default **on** in new installs). When off, the evaluator falls back to the Phase 21 behavior (net = gross) and the UI hides totals with a "savings not de-duplicated" banner. This is for rollback only.
- `features.recommendations_commitments` (default on), `features.recommendations_licensing` (default off until declarations exist).
These are rollout and kill switches only, never license gating (NFR-LIC-004).

## Rollout and rollback
1. Deploy migrations (expand). The old code ignores the new columns.
2. Shadow mode: the resolver runs and writes `overlap_resolution_runs`. Nets are stored in `achievable_monthly_savings` only, for a comparison report. The flag stays off for one evaluation cycle.
3. Turn the flag on. Summaries switch to Σ net.
4. Rollback: turn the flag off. Columns remain (no contract step in this phase). Data is recomputed on the next evaluation.

## Definition of done
- All P25-R* are implemented. P25-TC01…TC30 pass with recorded results. Property tests run ≥ 10 000 cases per invariant in CI (planned: `go test ./internal/recommendations/overlap/... -rapid.checks=10000`).
- Coverage ≥ 85% for `overlap` and `pools` (planned: `go test -cover ./internal/recommendations/...`).
- Lint is clean, including the no-float rule in recommendation packages (planned: `make lint`).
- Contract tests for the new endpoints pass (planned: `go test -tags=contract ./tests/contracts/api/...`). UJ-07 E2E passes (planned: `pnpm --filter web exec playwright test e2e/uj-07-commitments.spec.ts`).
- Docs and CHANGELOG are updated, ACCEPTANCE is signed, and work stopped at the phase boundary.
