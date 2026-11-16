# Phase 21 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P21-TC01 | P21-R01 | Given an authorized fixture, verify: Inventory via Resource Explorer and/or AWS Config aggregators. Metrics via CloudWatch. Recommendations via Compute Optimizer and Trusted Advisor (entitlement dependent). | FR-AWS-006 |
| P21-TC02 | P21-R02 | Given an authorized fixture, verify: Inventory via Cloud Asset Inventory, metrics via Cloud Monitoring, recommendations via Recommender API. | FR-GCP-005 |
| P21-TC03 | P21-R03 | Given an authorized fixture, verify: Inventory via Resource Graph, metrics via Azure Monitor, recommendations via Advisor, pricing via Retail Prices API. | FR-AZR-005 |
| P21-TC04 | P21-R04 | Given an authorized fixture, verify: Recommendation SDK: rule plugins declare inputs, evaluation and evidence output, with deterministic results for identical inputs. | FR-REC-001 |
| P21-TC05 | P21-R05 | Given an authorized fixture, verify: Each recommendation has evidence, confidence (with factors), risk level, projected monthly savings (gross and net), effort, implementation steps, rollback guidance and the data freshness of the inputs. | FR-REC-002 |
| P21-TC06 | P21-R06 | Given an authorized fixture, verify: Ingest provider-native recommendations (Compute Optimizer, Trusted Advisor, Recommender, Advisor) with provenance and dedup against native rules. | FR-REC-005 |
| P21-TC07 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P21-TC08 | cross-cutting | Inject Stale inputs; missing price; provider duplicate; nondeterministic rule; plugin panic; unsupported resource; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P21-TC09 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P21-TC10 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
