# Phase 25 — Commitments, regions, architecture optimization + overlap resolution

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.5 (phases 19–26) |
| Depends on | [Phase 18](../phase-18/README.md) (FX, commitments inventory, utilization, coverage), [Phase 22](../phase-22/README.md) (compute/K8s/serverless rules), [Phase 23](../phase-23/README.md) (storage/backup/DB rules), [Phase 24](../phase-24/README.md) (network rules) |
| PRD requirements | FR-REC-003 (commitments, regions/ARM, licensing, tagging/governance), FR-REC-004, FR-REC-002, FR-FIN-002, NFR-ACC-003 |
| User journeys | UJ-07 (commitment analysis), UJ-05 (quick wins, net totals) |
| Product acceptance | AC-05 (overlap: Σ net ≤ achievable per resource and pool) |
| Primary verification | Non-overlap savings tests (property-based + golden fixtures) |

> No application code exists yet. This is a specification, not a description of shipped behavior.

## Goal
Complete the recommendation catalog with commitment, region/ARM, software-licensing and governance rules, and ship the **overlap resolver** that turns gross per-rule candidates into **net** savings that are never double-counted across actions on the same resource or across commitment pools. After this phase every savings total CloudLedger displays is Σ net, provably ≤ achievable savings.

## Scope
1. **Overlap resolver** `internal/recommendations/overlap`: connected components over overlap keys, mutually exclusive action groups, action-class precedence (`eliminate > reshape > schedule > purchase_option > pricing > informational`), sequential application on post-action projected cost, commitment-coverage interaction, invariant assertions (INV-1…INV-7) per [RECOMMENDATION_ENGINE.md §5](../../architecture/RECOMMENDATION_ENGINE.md).
2. **Commitment pools and rules**: pool model per provider (AWS Compute SP, EC2 Instance SP, RIs with size flexibility; GCP spend-based and resource-based CUDs; Azure reservations with instance-size-flexibility groups and Azure savings plans). Rules REC-COM-001 (spend commitment purchase), REC-COM-002 (resource commitment purchase), REC-COM-003 (underutilized commitment), REC-COM-004 (expiring commitment, labeled *cost avoidance*). Sizing on the **projected post-action** hourly series.
3. **Region and architecture rules**: REC-REG-001 cheaper region (informational, residency-aware), REC-REG-002 ARM VM migration (with architecture compatibility evidence).
4. **Software licensing rules** (BYOL, Windows Server, SQL Server; not CloudLedger's own license): REC-LIC-001 hybrid benefit / BYOL unused, REC-LIC-002 SQL edition downgrade, driven by tenant **license declarations**.
5. **Governance/tagging rules**: REC-GOV-001 untagged spend, REC-GOV-002 unallocated cost, REC-GOV-003 high-spend scope without budget (savings = 0, `savings_kind = governance`).
6. Net-savings summary API and UI (category totals = Σ net; gross shown only per recommendation, labeled), overlap-group drill-down, commitment pool simulator (read-only what-if).
7. UJ-07 Playwright E2E on fixture data.

## Out of scope
- Purchasing commitments or changing anything in customer clouds (PRD NG1, NG2). Output is guidance only.
- Lifecycle, approvals, realized savings ([Phase 26](../phase-26/README.md)).
- Ticket and chat integrations ([Phase 32](../phase-32/README.md)).
- Commitment exchange/resale execution (AWS RI Marketplace, Azure exchange); REC-COM-003 only describes options.
- Legal advice on software license entitlement. CloudLedger uses tenant declarations and states that eligibility must be confirmed by the tenant.

## Dependencies
| Dependency | Needed for |
|---|---|
| Phase 18 | `commitments`, `commitment_utilization`, amortization, coverage metrics, FX |
| Phase 21 | rule SDK, manifests (`overlap_keys`, `action_class`), evidence, fingerprints, confidence model |
| Phases 22–24 | resource-level candidates that the resolver combines |
| Phase 19/20 | inventory (architecture, OS, license meters), metrics coverage |
| Phase 15/17 | allocation output and budgets for REC-GOV-002/003; required-tag policy for REC-GOV-001 |
| Phase 13 | semantic queries for hourly eligible spend series |

## Deliverables
- Packages `internal/recommendations/{overlap,pools,rules/commitments,rules/regions,rules/licensing,rules/governance}`.
- Migrations `p25_*` (recommendation overlap columns, `commitment_pools`, `overlap_resolution_runs`, `license_declarations`, `tag_policies` if not delivered by Phase 15).
- Rule manifests and deterministic fixtures for every new rule under `tests/fixtures/recommendations/p25/`.
- Property-based test suite `internal/recommendations/overlap/overlap_prop_test.go`.
- OpenAPI additions (see [API_CONTRACTS.md](API_CONTRACTS.md)); UI: savings summary, overlap group panel, commitment pool view and simulator, license declarations page.
- Docs: updates to [RECOMMENDATION_ENGINE.md](../../architecture/RECOMMENDATION_ENGINE.md) §5 (final algorithm text), user guide "How CloudLedger avoids double-counting savings".

## Key risks
| Risk | Mitigation |
|---|---|
| Double counting across rules or pools (R-03) | Resolver is the only writer of `net_monthly_savings`; invariants asserted at runtime (fail-closed) and in property tests |
| Commitment over-sizing when other actions reduce usage | Size on projected post-action series at p10; INV-2 checked |
| Provider commitment semantics differ (flexibility, scope) | Pool model per provider type with documented flexibility rules and fixtures per type |
| Licensing eligibility cannot be observed from billing data | Rules require explicit tenant declarations; evidence states the assumption; default risk high for edition downgrade |
| Region moves are architecture changes | REC-REG-001 is informational (`gross = 0`), residency tags block emission |
| Non-determinism from map iteration or float math | Sorted inputs, decimal arithmetic (ADR-0007), permutation property test |

## Links
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md) · [PRD §5.16](../../product/PRD.md) · [RECOMMENDATION_ENGINE.md](../../architecture/RECOMMENDATION_ENGINE.md) · [FINANCE_RECONCILIATION.md](../../architecture/FINANCE_RECONCILIATION.md) · [DATABASE_SCHEMA.md §2.7](../../architecture/DATABASE_SCHEMA.md) · [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md) · [AUTHORIZATION_MODEL.md](../../security/AUTHORIZATION_MODEL.md)

## Completion checklist
- [ ] Code merged
- [ ] Tests written and passing (results recorded in TEST_RESULTS.md)
- [ ] Docs updated (API, architecture, user guide)
- [ ] Security review completed
- [ ] CHANGELOG updated
- [ ] Acceptance sign-off (ACCEPTANCE.md)
- [ ] Stopped at phase boundary — Phase 26 not started
