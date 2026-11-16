# Phase 05 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P05-TC01 | P05-R01 | Given an authorized fixture, verify: OIDC SSO login (Authorization Code + PKCE). | FR-IAM-001 |
| P05-TC02 | P05-R02 | Given an authorized fixture, verify: Built-in roles: platform admin, tenant owner, FinOps admin, finance manager, engineering manager, developer, auditor, viewer. | FR-IAM-004 |
| P05-TC03 | P05-R03 | Given an authorized fixture, verify: Custom roles composed from granular permissions. | FR-IAM-005 |
| P05-TC04 | P05-R04 | Given an authorized fixture, verify: ABAC: restrict data visibility by attributes (provider, account, project, subscription, hierarchy node, tag or dimension value). | FR-IAM-006 |
| P05-TC05 | P05-R05 | Given an authorized fixture, verify: API tokens (personal and service) that are scoped, expiring, hashed at rest, and revocable. | FR-IAM-007 |
| P05-TC06 | P05-R06 | Given an authorized fixture, verify: IdP group → role/scope mapping. | FR-IAM-008 |
| P05-TC07 | P05-R07 | Given an authorized fixture, verify: Local password authentication only for the Lite bootstrap admin. Disable-able, with MFA (TOTP) when enabled. | FR-IAM-009 |
| P05-TC08 | P05-R08 | Given an authorized fixture, verify: Session management: idle and absolute timeouts, revocation, device listing. | FR-IAM-010 |
| P05-TC09 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P05-TC10 | cross-cutting | Inject Expired token; revoked session; forged tenant header; stale group membership; CSRF; OIDC issuer/audience mismatch; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P05-TC11 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P05-TC12 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
