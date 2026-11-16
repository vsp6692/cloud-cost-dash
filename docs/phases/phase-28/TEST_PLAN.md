# Phase 28 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P28-TC01 | P28-R01 | Given an authorized fixture, verify: Answers include citations (query IDs, data freshness, filters applied) and state uncertainty. | FR-AI-005 |
| P28-TC02 | P28-R02 | Given an authorized fixture, verify: AI cannot perform mutations. Report creation is the only write, and it goes through the normal API with user confirmation. | FR-AI-007 |
| P28-TC03 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P28-TC04 | cross-cutting | Inject Revoked access to old citation; stale result; fabricated query ID; injection in resource label; repeated confirmation; disabled external model; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P28-TC05 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P28-TC06 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
