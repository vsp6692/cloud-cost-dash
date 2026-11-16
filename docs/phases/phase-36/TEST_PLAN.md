# Phase 36 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P36-TC01 | P36-R01 | Given an authorized fixture, verify: Recommendation, pricing and dashboard-widget SDKs with compatibility tests. | FR-SDK-002 |
| P36-TC02 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P36-TC03 | cross-cutting | Inject Incompatible SDK major; malicious widget; expired price; plugin timeout; nondeterministic rule; undeclared capability; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P36-TC04 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P36-TC05 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
