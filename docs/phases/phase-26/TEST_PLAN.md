# Phase 26 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P26-TC01 | P26-R01 | Given an authorized fixture, verify: Lifecycle: open → acknowledged → in-review → approved/rejected → implemented → verified, with snooze, dismiss, expire and superseded (replaced by a newer evaluation). | FR-REC-006 |
| P26-TC02 | P26-R02 | Given an authorized fixture, verify: Realized savings measurement against a baseline after implementation, with a confidence statement. | FR-REC-007 |
| P26-TC03 | P26-R03 | Given an authorized fixture, verify: No automatic remediation. Optional ticket creation (Jira, ServiceNow, GitHub Issues) and IaC snippets. | FR-REC-008 |
| P26-TC04 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P26-TC05 | cross-cutting | Inject Self-approval policy; simultaneous reviewers; expired advice; snooze expiry; cost increase after implementation; confounded baseline; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P26-TC06 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P26-TC07 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
