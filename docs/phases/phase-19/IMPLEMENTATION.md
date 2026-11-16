# Phase 19 Implementation Plan

Status: **NOT STARTED**. Dependencies: 06–08, 13. Planned locations: `internal/inventory, providers/aws, providers/gcp, providers/azure`.

1. Review REQUIREMENTS, predecessor acceptance reports and open review findings; freeze schemas and measurable exit criteria.
2. Create deterministic fixtures for: Paged scan interrupted; permission removed; resource recreated; late cost after deletion; duplicate relationship; region unavailable. Write domain and negative authorization tests alongside implementation.
3. Add or extend logical entities (resources, resource_versions, resource_relationships) using forward-compatible migrations. Verify empty-database and prior-version upgrades, indexes and tenant constraints.
4. Implement the domain pipeline specified in DESIGN, using existing authorization, decimal, audit and outbox abstractions. Bound resource use and make retries idempotent.
5. Add typed API/SDK adapters, schema validation, optimistic concurrency and version compatibility checks where applicable. Add UI states for partial data, permission denial and retriable failure where applicable.
6. Run formatting, lint, unit, integration, contracts, security and relevant E2E/performance checks. Record exact command, build SHA, environment, fixture digest and actual outcome in TEST_RESULTS.
7. Update contracts, migrations, runbooks, README and CHANGELOG; obtain engineering, security and product acceptance. Stop before the next phase.

## Rollout and recovery
Enable for a fixture tenant first, then a canary with matching control totals and error/latency budgets. Stop new work and drain leases if invariants fail. Revert compatible binaries/configuration; recover data through documented compensating migrations or verified snapshot restore. Never delete audit or financial evidence to recover a deployment.

## Completion checklist
- [ ] Every requirement links to implementation and executed tests.
- [ ] Retry, isolation, migration and failure cases verified.
- [ ] Monitoring, recovery and compatibility docs reviewed.
- [ ] Acceptance evidence and unresolved limitations recorded.
