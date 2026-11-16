# Development Phases (01–40)

Every phase directory `phase-XX/` contains:

| File | Content |
|---|---|
| `README.md` | Goal, scope, out-of-scope, dependencies, deliverables, release checkpoint, status, completion checklist |
| `REQUIREMENTS.md` | Phase requirements `PXX-R##`, traced to PRD IDs (`FR-*`, `NFR-*`), with priority and acceptance reference |
| `DESIGN.md` | Design for this phase: components, data model and migrations, sequence diagrams, security, failure modes |
| `IMPLEMENTATION.md` | Ordered work breakdown (`PXX-T##`), files and packages, migrations, feature flags, rollout and rollback |
| `API_CONTRACTS.md` | Endpoints, events, SDK interfaces and schemas introduced or changed (or "None" with reason) |
| `TEST_PLAN.md` | Test cases `PXX-TC##` (unit, integration, contract, E2E, security, performance, failure injection), fixtures, environments |
| `TEST_RESULTS.md` | Execution log. **All entries `NOT RUN` until actually executed.** Never fabricate results. |
| `ACCEPTANCE.md` | Acceptance criteria `PXX-AC##`, evidence required, sign-off table, exit gate |

Status legend: `NOT STARTED` → `IN PROGRESS` → `IN REVIEW` → `ACCEPTED`. All phases are currently **NOT STARTED**. The planning documents themselves are drafts awaiting the Phase 01 and 02 reviews.

Licensing note: CloudLedger is source-available (see [docs/legal](../legal/README.md)). Licensing changes affect documentation and CI compliance tasks only (marked **[LIC]** below). They do not change phase scope.

## Phase index

| Phase | Title | Release | Depends on | Primary PRD requirements | Primary verification |
|---|---|---|---|---|---|
| [01](phase-01/README.md) | PRD, personas, acceptance criteria, licensing decision **[LIC]** | v0.1 | — | all (baseline), OQ-01…24 | Requirements review sign-off |
| [02](phase-02/README.md) | Architecture, ADRs, extension contracts **[LIC: ADR-0015, license map]** | v0.1 | 01 | NFR-*, ADR-0001…0017 | Design review |
| [03](phase-03/README.md) | Monorepo, local dev, CI, standards **[LIC: license CI, SPDX, CLA]** | v0.1 | 02 | FR-OPS-001/002, NFR-MNT-001, NFR-SEC-005, NFR-LIC-001…004 | Fresh checkout builds; CI green |
| [04](phase-04/README.md) | Tenancy schema, migrations, audit foundation | v0.1 | 03 | FR-TEN-001…004, 007, FR-AUD-001, NFR-SEC-001 | Isolation and migration tests |
| [05](phase-05/README.md) | SSO (OIDC), RBAC, ABAC foundations | v0.1 | 04 | FR-IAM-001, 004–010 | Authorization matrix |
| [06](phase-06/README.md) | AWS standalone/Organizations, CUR 2.0/S3/Athena + ingestion framework | v0.2 | 04, 05 | FR-CON-*, FR-AWS-001…004, FR-NRM-002 | AWS connector fixtures |
| [07](phase-07/README.md) | GCP billing/projects/BigQuery/GCS | v0.2 | 06 | FR-GCP-001…003 | GCP connector fixtures |
| [08](phase-08/README.md) | Azure billing/subscriptions/exports | v0.2 | 06 | FR-AZR-001…003 | Azure connector fixtures |
| [09](phase-09/README.md) | CSV/JSON/Parquet/XLSX imports | v0.2 | 06 | FR-IMP-001…004 | Malformed/valid file tests |
| [10](phase-10/README.md) | Invoice import and reconciliation (foundation) | v0.2 | 06, 07, 08, 09 | FR-FIN-004, FR-AWS-005, FR-GCP-004, FR-AZR-004 | Golden invoice fixtures |
| [11](phase-11/README.md) | FOCUS normalization, allocation dimensions | v0.2 | 06–09 | FR-NRM-001…006, FR-TEN-003 | Golden totals and mapping |
| [12](phase-12/README.md) | Backfill, incremental sync, ingestion health | v0.2 | 06–11 | FR-ING-001…006, FR-CON-005 | Retry/idempotency tests |
| [13](phase-13/README.md) | PostgreSQL/DuckDB/ClickHouse analytics adapters + semantic layer | v0.2 | 11 | FR-ANL-001…004 | Cross-engine contract suite |
| [14](phase-14/README.md) | Global and provider dashboards | v0.2 | 05, 13 | FR-DSH-001…003, FR-TEN-006 | UI/E2E + totals |
| [15](phase-15/README.md) | Tag allocation, shared-cost distribution | v0.3 | 11, 13 | FR-ALC-001…007, FR-IAM-006 | Allocation invariants |
| [16](phase-16/README.md) | Dashboard builder and saved views | v0.3 | 14, 15 | FR-DSH-004…006 | Permissioned UI tests |
| [17](phase-17/README.md) | Budgets, forecasting, anomalies, alerts | v0.3 | 13, 15 | FR-BUD-001…005 | Deterministic time series |
| [18](phase-18/README.md) | FX, commitments, unit economics, accounting calendars | v0.3 | 11, 13 | FR-FIN-001…003, 008 | Accounting test cases |
| [19](phase-19/README.md) | Resource inventory for all three clouds | v0.5 | 06–08, 13 | FR-RES-001…003, FR-AWS-006, FR-GCP-005, FR-AZR-005 | Provider inventory contracts |
| [20](phase-20/README.md) | Utilization and telemetry collectors | v0.5 | 19 | FR-TEL-001…003 | Missing-data scenarios |
| [21](phase-21/README.md) | Recommendation SDK, rules and evidence | v0.5 | 13, 19, 20 | FR-REC-001, 002, 005 | Rule contract tests |
| [22](phase-22/README.md) | Compute/Kubernetes/serverless optimization | v0.5 | 21 | FR-REC-003 (compute, k8s, serverless) | Synthetic workload fixtures |
| [23](phase-23/README.md) | Storage/backup/database optimization | v0.5 | 21 | FR-REC-003 (storage, backups, DB, logs) | Safety/impact checks |
| [24](phase-24/README.md) | Network/egress/load balancer optimization | v0.5 | 21 | FR-REC-003 (network) | Pricing and topology tests |
| [25](phase-25/README.md) | Commitments, regions, architecture optimization + overlap resolution | v0.5 | 18, 22, 23, 24 | FR-REC-003 (commitments, regions/ARM, licensing, governance), FR-REC-004 | Non-overlap savings tests |
| [26](phase-26/README.md) | Review/approval, recommendation lifecycle, realized savings | v0.5 | 21, 25 | FR-REC-006…008 | Workflow/E2E tests |
| [27](phase-27/README.md) | LLM gateway and governed NL-to-query | v0.7 | 05, 13 | FR-AI-001…004, 006, 008 | Prompt injection/RBAC tests |
| [28](phase-28/README.md) | Conversational analytics and reports | v0.7 | 27, 16 | FR-AI-005, 007 | Citation and correctness tests |
| [29](phase-29/README.md) | Finance exports and reconciliation | v0.7 | 10, 15, 18 | FR-FIN-004, 006, FR-ALC-007 | Export-to-ledger validation |
| [30](phase-30/README.md) | Scheduled reports, period close, audit evidence | v0.7 | 29, 04 | FR-FIN-005, 007, FR-AUD-002 | Snapshot immutability tests |
| [31](phase-31/README.md) | Enterprise SSO (SAML)/SCIM/custom policies, MSP mode **[LIC: MSP note]** | v0.9 | 05 | FR-IAM-002, 003, 005, 008, FR-TEN-005, FR-AUD-003 | Provisioning/access tests |
| [32](phase-32/README.md) | Advanced alerts and approval integrations | v0.9 | 17, 26 | FR-BUD-005, 006, FR-NTF-001, 002, FR-REC-008 | Delivery/retry tests |
| [33](phase-33/README.md) | HA, backups, DR and observability | v0.9 | 12, 13, 30 | FR-OPS-001…004, FR-TEN-004, NFR-AVL-001 | Restore/chaos tests |
| [34](phase-34/README.md) | Scale, security and penetration testing | v0.9 | 33 | NFR-PERF-*, NFR-SEC-*, NFR-SCL-001 | Defined SLO gates |
| [35](phase-35/README.md) | External provider connector SDK **[LIC: plugin licensing, manifest license]** | v0.9 | 06–09, 12 | FR-SDK-001, 003 | Example provider compiles and passes suite |
| [36](phase-36/README.md) | Recommendation/pricing/dashboard SDKs **[LIC: SDK license designation]** | v0.9 | 21, 16, 35 | FR-SDK-002 | Plugin compatibility tests |
| [37](phase-37/README.md) | Contributor docs, samples, governance **[LIC: CLA, trademark, governance]** | v0.9 | 35, 36 | FR-SDK-004 | External contributor walkthrough |
| [38](phase-38/README.md) | Regression and release certification **[LIC: license release gate]** | v1.0 | 01–37 | AC-01…AC-11 | Complete release test suite |
| [39](phase-39/README.md) | Public docs, migration and reference deployments **[LIC: public license docs]** | v1.0 | 38 | FR-OPS-001, NFR-* | Clean install verification |
| [40](phase-40/README.md) | Stable v1.0, support and maintenance policies **[LIC: counsel-approved final license]** | v1.0 | 39 | all | Signed release checklist |

See the [dependency graph](../planning/DEPENDENCY_GRAPH.md) and [release plan](../planning/RELEASE_PLAN.md).

## Note on early-phase scope
Phases 06–08 deliver connectors **and** the shared ingestion framework (raw storage, ingestion runs, staging, PG analytics adapter baseline, minimal FOCUS core mapping) so that data is usable end-to-end. Phase 11 completes full FOCUS conformance and mapping versioning. Phase 13 generalizes analytics to DuckDB and ClickHouse with the parity suite. Phase 12 hardens operations (backfill, health, restatements).

## Phase execution rules (from the master prompt)
A. Read requirements and dependencies, and inspect the code. B. Post a brief implementation plan. C. Write tests first or alongside the code. D. Make small, reviewable changes. E. Run fmt, lint, static analysis, unit, integration, contract, security and E2E tests, and report actual commands and results. F. Update docs. G. Write the acceptance report. H. **Stop at the phase boundary.**
