# Phase 19: Resource inventory for AWS, GCP and Azure: Requirements

Status: **NOT STARTED** · Release checkpoint: v0.5 · Spec status: DRAFT (no code exists)

Priority: **M** = must for phase acceptance, **S** = should, **C** = could.

| ID | Requirement | PRD trace | Priority (M/S/C) | Verified by |
|---|---|---|---|---|
| P19-R01 | The AWS provider implements `InventorySource` using an AWS Config aggregator as the primary source and Resource Explorer as the fallback, selectable per connector and reported in the verification result. | FR-AWS-006, FR-CON-001 | M | P19-AC01 |
| P19-R02 | The GCP provider implements `InventorySource` using Cloud Asset Inventory at organization, folder or project scope. | FR-GCP-005, FR-CON-001 | M | P19-AC01 |
| P19-R03 | The Azure provider implements `InventorySource` using Resource Graph at management-group or subscription scope, including `resourcecontainers`. | FR-AZR-005, FR-CON-001 | M | P19-AC01 |
| P19-R04 | Every inventoried resource is stored in a unified model: provider, connector, canonical native ID, `resource_key`, normalized `resource_type` (taxonomy), `native_type`, region, zone, sub-account, name, raw and normalized tags, allow-listed attributes, lifecycle state, `first_seen_at`, `last_seen_at`. | FR-RES-001 | M | P19-AC02 |
| P19-R05 | Every canonical resource type in taxonomy v1 (DESIGN §4.5) is mapped from at least one native type per provider where the provider offers an equivalent. Unmapped native types are kept with `resource_type = other.<provider>` and counted. | FR-RES-001 | M | P19-AC02 |
| P19-R06 | Resource history is kept as SCD2: a new version is written only when the curated `content_hash` changes. Volatile fields (e.g. `last_seen_at`, provider ETags, timestamps of last state check) are excluded from the hash. | FR-RES-003 | S | P19-AC03 |
| P19-R07 | Lifecycle follows RESOURCE_INVENTORY.md §2.2: a resource absent from one **complete** snapshot of its scope becomes `missing`; it becomes `deleted` after **3 consecutive complete** snapshots (configurable) or a provider deletion signal. Partial snapshots never change absence state; a scope that becomes unreadable moves its resources to `unknown`, never `missing`/`deleted`. | FR-RES-003, FR-ING-003 | M | P19-AC04 |
| P19-R08 | Relationships between resources (`attached_to`, `snapshot_of`, `member_of`, `contained_in`, `routes_to`, `uses_ip`, `runs_on` (names from [RESOURCE_INVENTORY.md §2.3](../../architecture/RESOURCE_INVENTORY.md)), plus `backs_up` (recovery point → protected resource, added by this phase)) are captured with SCD2 validity. Dangling targets (target not inventoried) are stored with `target_resolved = false`. | FR-RES-001 | M | P19-AC05 |
| P19-R09 | Inventory joins to cost by canonical resource ID, time-aware (resource version valid during the charge period), across all three analytics engines with identical results. | FR-RES-002, FR-ANL-003, AC-04 | M | P19-AC06 |
| P19-R10 | A match-rate metric is computed per tenant × provider × service × billing period, in two forms: count-based (distinct resource IDs) and cost-weighted (usage `EffectiveCost`). It is exposed via API and the semantic layer, with documented exclusions. | FR-RES-002 | M | P19-AC07 |
| P19-R11 | ID canonicalization rules are documented and versioned per provider and service (e.g. CUR bare `i-…` → EC2 ARN; GCP short name → full resource name; Azure ID lowercased). | FR-RES-002, FR-NRM-006 | M | P19-AC07 |
| P19-R12 | Inventory capability verification probes the minimum read-only permissions per source and reports `pass`/`fail`/`unknown` with remediation text. Templates grant no mutating permission. | FR-CON-002, FR-CON-004, FR-CON-006 | M | P19-AC08 |
| P19-R13 | Partial permissions (one account, project or subscription denied) mark that scope `fail` and continue the others; the snapshot is recorded as `partial`, and health is `degraded`. | FR-CON-002, FR-ING-004 | M | P19-AC04 |
| P19-R14 | Throttling is handled with provider-aware rate limits, `Retry-After` support and page-level resumption, without duplicating or losing resources. | FR-ING-004 | M | P19-AC09 |
| P19-R15 | Attributes are stored through a per-type allow-list. Secret-bearing fields (function environment variables, instance metadata/user data, app settings, connection strings) are never persisted. | NFR-SEC-003, NFR-PRIV-001 | M | P19-AC10 |
| P19-R16 | Inventory data is tenant-isolated (RLS, compiler predicate, ClickHouse row policy) and ABAC-filtered by provider, sub-account, region, tag and hierarchy node. | FR-TEN-001, FR-IAM-006, NFR-SEC-001, AC-02 | M | P19-AC11 |
| P19-R17 | Each first-party provider passes the `Inventory` group of the provider compatibility suite (manifest, determinism, read-only allow-list, throttling, cancellation, stable IDs). | FR-CON-001, FR-SDK-001, AC-08 | M | P19-AC01 |
| P19-R18 | A completed snapshot emits `dev.cloudledger.inventory.snapshot.completed.v1` through the outbox with counts and completeness. | FR-RES-001 | M | P19-AC12 |
| P19-R19 | Inventory syncs are idempotent: replaying a snapshot from the same recorded provider responses yields an identical resource set and no new SCD2 versions. | FR-ING-003 | M | P19-AC03 |
| P19-R20 | Inventory sync for the Standard reference scale (2 M resources) completes within 2 h per tenant on reference hardware, with bounded memory per job (≤ 512 MiB). | NFR-SCL-001, NFR-PERF-003 | S | P19-AC13 |

## Traceability notes
- FR-AWS-006, FR-GCP-005 and FR-AZR-005 also cover metrics and recommendations. Phase 19 delivers only the inventory clause; metrics move to Phase 20 and native recommendations to Phase 21.
- FR-RES-003 is a **should** in the PRD; Phase 19 treats SCD2 as a must because Phases 21–26 depend on point-in-time inventory for evidence and realized-savings baselines.
- UJ-05 (find quick wins) depends on this phase indirectly: evidence shown in the UI cites inventory versions.

## Assumptions
- A1: Customers enable AWS Config with an aggregator in the management or delegated-admin account for full fidelity. Without it, Resource Explorer gives a reduced attribute set (no relationships for many types), and the match rate may drop.
- A2: GCP Cloud Asset API is enabled on the project used for quota (`quota_project`) and the principal holds `roles/cloudasset.viewer` at the chosen scope.
- A3: Azure principals hold `Reader` at the management-group or subscription scope; Resource Graph results reflect that RBAC.
- A4: Provider inventory APIs are eventually consistent (minutes to hours). Inventory freshness is reported, never assumed real-time.
