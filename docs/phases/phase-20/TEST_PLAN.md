# Phase 20 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P20-TC01 | P20-R01 | Given an authorized fixture, verify: Inventory via Resource Explorer and/or AWS Config aggregators. Metrics via CloudWatch. Recommendations via Compute Optimizer and Trusted Advisor (entitlement dependent). | FR-AWS-006 |
| P20-TC02 | P20-R02 | Given an authorized fixture, verify: Inventory via Cloud Asset Inventory, metrics via Cloud Monitoring, recommendations via Recommender API. | FR-GCP-005 |
| P20-TC03 | P20-R03 | Given an authorized fixture, verify: Inventory via Resource Graph, metrics via Azure Monitor, recommendations via Advisor, pricing via Retail Prices API. | FR-AZR-005 |
| P20-TC04 | P20-R04 | Given an authorized fixture, verify: Collect utilization metrics (CPU, memory where available, network, disk IOPS and throughput, requests) at configurable granularity. | FR-TEL-001 |
| P20-TC05 | P20-R05 | Given an authorized fixture, verify: Track metric coverage. Missing or partial data lowers recommendation confidence and is surfaced explicitly. | FR-TEL-002 |
| P20-TC06 | P20-R06 | Given an authorized fixture, verify: Kubernetes cost and utilization (requests, limits, usage) via an optional in-cluster agent or Prometheus integration (OpenCost-compatible input). | FR-TEL-003 |
| P20-TC07 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P20-TC08 | cross-cutting | Inject Sparse memory metrics; late samples; reset counters; incompatible units; duplicate timestamps; disconnected Kubernetes agent; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P20-TC09 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P20-TC10 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
