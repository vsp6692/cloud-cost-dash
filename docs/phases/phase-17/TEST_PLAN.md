# Phase 17 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P17-TC01 | P17-R01 | Given an authorized fixture, verify: Budgets on any scope (hierarchy node, dimension filter) with monthly, quarterly or annual periods aligned to the accounting calendar. | FR-BUD-001 |
| P17-TC02 | P17-R02 | Given an authorized fixture, verify: Threshold alerts on actual and forecasted spend. | FR-BUD-002 |
| P17-TC03 | P17-R03 | Given an authorized fixture, verify: Forecasting with prediction intervals. Model selection documented and back-tested. | FR-BUD-003 |
| P17-TC04 | P17-R04 | Given an authorized fixture, verify: Anomaly detection with explainability (top contributing dimensions), feedback (true/false positive) and suppression. | FR-BUD-004 |
| P17-TC05 | P17-R05 | Given an authorized fixture, verify: Alert channels: email, Slack, Microsoft Teams, generic webhooks (HMAC signed). | FR-BUD-005 |
| P17-TC06 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P17-TC07 | cross-cutting | Inject Missing days; seasonal step; negative credit; partial current day; threshold oscillation; repeated delivery; clock boundary; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P17-TC08 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P17-TC09 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
