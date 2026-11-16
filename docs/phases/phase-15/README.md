# Phase 15: Tag allocation and shared-cost distribution

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.3 (phases 15–18) |
| Depends on | [Phase 11](../phase-11/README.md) (FOCUS normalization, tag normalization keys, hierarchy and allocation dimensions), [Phase 13](../phase-13/README.md) (semantic layer, adapters, partition swap, cache keyed by `data_version`) and [Phase 05](../phase-05/README.md) (RBAC/ABAC foundations, data scopes, Cedar) |
| Primary PRD requirements | FR-ALC-001…007, FR-IAM-006, FR-NRM-005, NFR-ACC-003, NFR-SEC-001 |
| Primary journey | UJ-04 (allocation and chargeback) |
| Primary verification | Allocation invariant (property-based), golden allocation datasets, UJ-04 Playwright E2E |

## Goal
Turn normalized cost (`cost_focus`) into **allocated cost** (`cost_allocated`) using tenant-configured, versioned, previewable rule sets. Allocation covers tag key normalization, value mapping, inheritance, business mapping to hierarchy nodes and custom dimensions, and shared-cost splits. Guarantee that, for every period and currency, the allocated total plus the unallocated total equals the source total exactly, to the smallest currency unit. Complete data-level ABAC by hierarchy node and tag (FR-IAM-006) so that the allocated dimensions can restrict visibility. Ship showback and chargeback report views per hierarchy node.

## Scope
- Rule kinds, exactly the `allocation_rules.kind` enum: `tag_key_normalize`, `tag_value_map`, `inheritance`, `dimension_assign`, `hierarchy_assign`, `shared_split`.
- Shared-split methods: `even`, `fixed_percentage`, `proportional_cost`, `proportional_metric` (custom metric from `unit_metric_values`, or usage quantity).
- Deterministic decimal allocation with largest-remainder residual handling (see [DESIGN.md](DESIGN.md) §4).
- Rule-set lifecycle: draft → preview (diff) → publish (effective-dated) → superseded. Re-run history per period.
- Allocation worker that consumes `cost.period.normalized.v1` and `allocation.published.v1` and writes `cost_allocated` through the adapter's staged partition swap.
- Allocation invariant checks after every run (fail-closed: prior allocation stays live).
- ABAC predicates on `hierarchy_node` (descendant-of), `dim:<key>` and `tag:<normalized_key>`, compiled by the Phase 13 semantic compiler.
- Custom dimensions CRUD.
- Showback/chargeback views: per hierarchy node, with direct, shared-in and unallocated columns.
- UI: rule-set editor, preview diff, publish dialog, unallocated explorer, chargeback report page.

## Out of scope
- Finance-grade chargeback **exports** with GL mapping and journal files (Phase 29, FR-ALC-007 export half).
- Period close and locking of allocation versions (Phase 30).
- FX conversion policy (Phase 18). Allocation runs in billing currency. Reporting-currency conversion is applied at query time once Phase 18 lands.
- Kubernetes namespace or pod-level splitting (Phase 20/22, OQ-18).
- Budgets on hierarchy nodes (Phase 17).
- Policy-as-code tag compliance recommendations (Phase 25, governance category).

## Dependencies
| Kind | Item |
|---|---|
| Phases | 05, 11, 13 (hard); 14 (UI shell, reused components) |
| External | None (no cloud APIs). Uses `cockroachdb/apd/v3` or `shopspring/decimal` (Phase 03 decision, ADR-0007), a Go property-based testing library (`pgregory.net/rapid`, proposed), `fast-check` for TS. |
| Docs | [ALLOCATION_ENGINE.md](../../architecture/ALLOCATION_ENGINE.md), [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md) §2.4, [ANALYTICS_ADAPTERS.md](../../architecture/ANALYTICS_ADAPTERS.md), [TENANCY.md](../../architecture/TENANCY.md), [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md), [ADR-0008](../../architecture/adr/0008-authorization-rbac-abac-via-cedar-policies.md), [ADR-0010](../../architecture/adr/0010-immutable-content-addressed-raw-storage-and.md) |

## Deliverables
1. Migrations for allocation tables (extensions to §2.4 listed in [DESIGN.md](DESIGN.md) §3) and `cost_allocated` DDL for PG, DuckDB and ClickHouse.
2. `internal/allocation` module: rule AST, validator, evaluator, splitter, invariant checker, publisher, worker.
3. REST endpoints under `/api/v1/allocation/*` and `/api/v1/custom-dimensions`, chargeback query presets.
4. ABAC predicate extensions in `internal/authz` and semantic dimensions `hierarchy:*`, `dim:*`, `allocation_status`.
5. Web pages for rules, preview, publish, unallocated cost and chargeback.
6. Golden allocation datasets in `tests/fixtures/allocation/` and property-based invariant suite.
7. Documentation updates: ALLOCATION_ENGINE.md cross-links, user guide for rules, CHANGELOG.

## Key risks
| Risk | Mitigation |
|---|---|
| Residual cents lost or duplicated in splits | Largest-remainder with deterministic tie-break, invariant check per run, property tests |
| Rule overlap gives ambiguous results | Ordered `position` precedence, first-match-wins per target attribute, overlap warnings in preview |
| Re-allocation of 13 months is slow at Standard scale | Per-period work units, staged swap, only periods on or after `effective_from` re-run |
| ABAC on allocated dimensions leaks shared cost of other nodes | Shared-in amounts are attributed to the receiving node; source node detail hidden unless in scope (DESIGN §6) |
| Cedar policy and SQL predicate disagree | Equivalence tests (ADR-0008) extended to the new attributes |

## Files in this phase
[REQUIREMENTS.md](REQUIREMENTS.md) · [DESIGN.md](DESIGN.md) · [IMPLEMENTATION.md](IMPLEMENTATION.md) · [API_CONTRACTS.md](API_CONTRACTS.md) · [TEST_PLAN.md](TEST_PLAN.md) · [TEST_RESULTS.md](TEST_RESULTS.md) · [ACCEPTANCE.md](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: all `P15-T*` tasks merged; no float types in `internal/allocation` (lint enforced)
- [ ] Tests: every `P15-TC*` executed and recorded in [TEST_RESULTS.md](TEST_RESULTS.md) with real commands and commits
- [ ] Docs: ALLOCATION_ENGINE.md, DATABASE_SCHEMA.md §2.4, OpenAPI and user guide updated
- [ ] Security review: ABAC extension, rule AST injection surface, cross-tenant tests reviewed by a security owner
- [ ] CHANGELOG updated under Unreleased (v0.3)
- [ ] Acceptance sign-off recorded in [ACCEPTANCE.md](ACCEPTANCE.md)
- [ ] Stopped at phase boundary (no Phase 16+ work merged under this phase)
