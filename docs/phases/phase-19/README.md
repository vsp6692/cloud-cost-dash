# Phase 19: Resource inventory for AWS, GCP and Azure: Overview

Status: **NOT STARTED** · Release checkpoint: v0.5 · Spec status: DRAFT (no code exists)

## Goal
Give every tenant a unified, historical, provider-neutral inventory of its cloud resources across AWS, GCP and Azure, joined to normalized cost with a measured match rate. The inventory is the foundation for telemetry (Phase 20) and every recommendation rule (Phases 21–25).

## Release checkpoint
v0.5 (Phases 19–26). Phase 19 is the first v0.5 phase. It can start once v0.2 connectors (06–08) and the analytics adapters (13) are accepted.

## Scope
- `InventorySource` implementations for the three first-party providers:
  - AWS: AWS Config aggregator (`SelectAggregateResourceConfig`) as the primary source, with Resource Explorer (`ListResources`/`Search`) as a fallback when Config is not recorded or not aggregated.
  - GCP: Cloud Asset Inventory (`searchAllResources` for discovery, `listAssets`/`exportAssets` with `contentType=RESOURCE` for attributes) at organization, folder or project scope.
  - Azure: Resource Graph (`resources` and `resourcecontainers` tables) at management-group or subscription scope.
- A unified resource model with the canonical type taxonomy v1 (DESIGN §4.5: `compute.vm` … `backup.recovery_point`), canonical IDs and `resource_key`.
- SCD2 history for resources and relationships (`valid_from`/`valid_to`, `content_hash` change detection) and the lifecycle `active → stopped → missing → deleted` plus `unknown` from RESOURCE_INVENTORY.md §2.2.
- Relationship graph: `attached_to`, `snapshot_of`, `member_of`, `contained_in`, `routes_to`, `uses_ip`, `runs_on` (names from [RESOURCE_INVENTORY.md §2.3](../../architecture/RESOURCE_INVENTORY.md)), plus `backs_up` (recovery point → protected resource, added by this phase).
- An `inventory_snapshots` control-plane table, scheduled and manual inventory syncs, health per connector × scope.
- An inventory-to-cost join with count-based and cost-weighted **match-rate** metrics per provider, service and billing period.
- Inventory capability verification (permission probes) and least-privilege template updates (read-only).
- Provider inventory contract tests in `sdk/provider/testkit`.
- REST endpoints under `/api/v1/resources` and `/api/v1/inventory/*`. Event `inventory.snapshot.completed.v1`.

## Out of scope
- Utilization metrics and telemetry (Phase 20).
- Recommendations of any kind, including "orphaned" detection logic (Phases 21–24). Phase 19 only exposes facts such as `attached_to` being absent.
- Kubernetes object inventory inside clusters (workloads, pods). Phase 19 inventories clusters and node pools only. In-cluster objects arrive through OpenCost/Prometheus input in Phase 20 (OQ-18).
- Real-time change streams (EventBridge, Pub/Sub feeds, Event Grid). Polling only in v0.5.
- Any write or mutation against customer clouds (FR-CON-004).
- Third-party inventory plugins (Phase 35 delivers the external SDK; the contract suite written here is reused).

## Dependencies
| Phase | Consumed |
|---|---|
| [06](../phase-06/README.md) | AWS connector, AssumeRole federation, Organizations scope discovery, ingestion framework, job queue |
| [07](../phase-07/README.md) | GCP connector, WIF/SA impersonation, org/folder/project discovery |
| [08](../phase-08/README.md) | Azure connector, workload identity federation, management-group/subscription discovery |
| [12](../phase-12/README.md) | Retry, throttling, circuit breaker, health model, checkpoints (soft dependency through 06–08) |
| [13](../phase-13/README.md) | Analytics adapter write path (`BeginStage`/`Commit`), semantic layer registries, contract suite |
| [15](../phase-15/README.md) | Tag-key normalization rules (reused to normalize inventory tags; soft dependency) |

## Deliverables
1. `providers/{aws,gcp,azure}/inventory` packages implementing `InventorySource`.
2. `internal/inventory` module: sync orchestration, canonicalization, taxonomy mapping, SCD2 merge, relationship builder, match-rate job.
3. Control-plane migration `pNN_inventory_snapshots`; analytics migrations for `resources`, `resource_relationships`, `inventory_match_stats` on all three engines.
4. Semantic-layer additions: dimensions `resource_type`, `resource_lifecycle_state`, `resource_name`; metric `resource_match_rate`.
5. API endpoints, OpenAPI updates, event schema `schemas/events/inventory.snapshot.completed.v1.json`.
6. Updated read-only IaC templates and permission documentation per provider.
7. Contract suite group `Inventory` in `sdk/provider/testkit` and recorded fixtures for each provider.
8. Architecture doc updates in [RESOURCE_INVENTORY.md](../../architecture/RESOURCE_INVENTORY.md) and [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md).

## Key risks
| ID | Risk | Mitigation |
|---|---|---|
| P19-RK01 | Provider IDs in billing differ from inventory IDs (bare `i-…` in CUR vs ARN, short vs full GCP names, Azure casing) → low match rate | Documented canonicalization rules per provider and service; match rate measured and published per service; golden join fixtures |
| P19-RK02 | Partial enumeration (throttling, a denied scope) wrongly tombstones live resources | Only scopes with a **complete** snapshot can move resources to `missing`; `deleted` only after 3 consecutive complete snapshots or a provider deletion signal; denied scopes go to `unknown` |
| P19-RK03 | Resource attributes contain secrets (Lambda environment variables, GCE metadata startup scripts, Azure app settings) | Per-type attribute allow-list; redaction test corpus; never store raw provider payloads for denylisted types |
| P19-RK04 | AWS Config not enabled or not aggregated in many orgs | Resource Explorer fallback with reduced attributes; capability report states which source is used |
| P19-RK05 | SCD2 table growth at HA scale (≥ 20 M resources) | Change detection on a curated attribute hash (volatile fields excluded); compaction of unchanged versions; partitioning reviewed in Phase 34 |
| P19-RK06 | Provider API throttling (Resource Graph quota, CAI QPS) | Token buckets per credential and API family, `Retry-After` honored, page-level checkpoints |

## Documents
- [REQUIREMENTS.md](REQUIREMENTS.md)
- [DESIGN.md](DESIGN.md)
- [IMPLEMENTATION.md](IMPLEMENTATION.md)
- [API_CONTRACTS.md](API_CONTRACTS.md)
- [TEST_PLAN.md](TEST_PLAN.md)
- [TEST_RESULTS.md](TEST_RESULTS.md)
- [ACCEPTANCE.md](ACCEPTANCE.md)

Related: [RESOURCE_INVENTORY.md](../../architecture/RESOURCE_INVENTORY.md) · [PROVIDER_SDK.md](../../contracts/PROVIDER_SDK.md) · [CAPABILITY_MANIFEST.md](../../contracts/CAPABILITY_MANIFEST.md) · [Providers](../../providers/README.md) · [PRD](../../product/PRD.md)

## Completion checklist
- [ ] Code merged (all P19-T tasks complete)
- [ ] Tests written and executed; results recorded in TEST_RESULTS.md
- [ ] Documentation updated (architecture docs, OpenAPI, runbooks)
- [ ] Security review completed
- [ ] CHANGELOG entry added
- [ ] Acceptance sign-off recorded in ACCEPTANCE.md
- [ ] Stopped at phase boundary (Phase 20 not started)
