# Phase 30 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P30-TC01 | P30-R01 | Given an authorized fixture, verify: Period close: lock, immutable snapshot, report manifest with content hashes, post-close adjustments recorded in the next open period. | FR-FIN-005 |
| P30-TC02 | P30-R02 | Given an authorized fixture, verify: Scheduled reports with delivery and an immutable archive. | FR-FIN-007 |
| P30-TC03 | P30-R03 | Given an authorized fixture, verify: Audit log search and export for auditors. | FR-AUD-002 |
| P30-TC04 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P30-TC05 | cross-cutting | Inject Two concurrent closes; correction after close; daylight-saving overlap; object hash mismatch; schedule replay; unauthorized audit export; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P30-TC06 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P30-TC07 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
