# Phase 32 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P32-TC01 | P32-R01 | Given an authorized fixture, verify: Alert channels: email, Slack, Microsoft Teams, generic webhooks (HMAC signed). | FR-BUD-005 |
| P32-TC02 | P32-R02 | Given an authorized fixture, verify: Delivery retries, dead-letter queue, delivery log, de-duplication and digest mode. | FR-BUD-006 |
| P32-TC03 | P32-R03 | Given an authorized fixture, verify: No automatic remediation. Optional ticket creation (Jira, ServiceNow, GitHub Issues) and IaC snippets. | FR-REC-008 |
| P32-TC04 | P32-R04 | Given an authorized fixture, verify: Integrations: Slack, Teams, email (SMTP), webhooks, Jira, ServiceNow, GitHub Issues. | FR-NTF-001 |
| P32-TC05 | P32-R05 | Given an authorized fixture, verify: Approval workflows can be answered from Slack or Teams with signed callbacks. | FR-NTF-002 |
| P32-TC06 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P32-TC07 | cross-cutting | Inject Forged callback; replay; deprovisioned approver; 429 response; SMTP outage; duplicate ticket; SSRF destination; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P32-TC08 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P32-TC09 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
