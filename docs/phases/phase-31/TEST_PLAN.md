# Phase 31 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P31-TC01 | P31-R01 | Given an authorized fixture, verify: MSP mode: a parent organization can manage child tenants without seeing their data unless explicitly delegated. (Feature available in the codebase. Operating it for external customers requires a commercial license. Internal multi-tenant use across Affiliates is free.) | FR-TEN-005 |
| P31-TC02 | P31-R02 | Given an authorized fixture, verify: SAML 2.0 SP support. | FR-IAM-002 |
| P31-TC03 | P31-R03 | Given an authorized fixture, verify: SCIM 2.0 user and group provisioning. | FR-IAM-003 |
| P31-TC04 | P31-R04 | Given an authorized fixture, verify: Custom roles composed from granular permissions. | FR-IAM-005 |
| P31-TC05 | P31-R05 | Given an authorized fixture, verify: IdP group → role/scope mapping. | FR-IAM-008 |
| P31-TC06 | P31-R06 | Given an authorized fixture, verify: Optional streaming of audit events to a SIEM (webhook, syslog, OTLP logs). | FR-AUD-003 |
| P31-TC07 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P31-TC08 | cross-cutting | Inject SAML wrapping attack; certificate rotation; SCIM retry; deleted group; expired MSP delegation; SIEM unavailable; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P31-TC09 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P31-TC10 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
