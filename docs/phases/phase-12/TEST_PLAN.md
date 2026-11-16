# Phase 12 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P12-TC01 | P12-R01 | Given an authorized fixture, verify: Health status per connector and capability: last success, last attempt, freshness lag, error class, next run. | FR-CON-005 |
| P12-TC02 | P12-R02 | Given an authorized fixture, verify: Deterministic deduplication keyed by provider-native line identifiers plus a content hash. | FR-NRM-006 |
| P12-TC03 | P12-R03 | Given an authorized fixture, verify: Incremental sync with persisted checkpoints per connector, capability and scope. | FR-ING-001 |
| P12-TC04 | P12-R04 | Given an authorized fixture, verify: Backfill up to a configurable horizon (default 13 months, subject to provider availability). | FR-ING-002 |
| P12-TC05 | P12-R05 | Given an authorized fixture, verify: Idempotent processing: replaying any ingestion run yields identical normalized results. | FR-ING-003 |
| P12-TC06 | P12-R06 | Given an authorized fixture, verify: Retry with exponential backoff and jitter, provider-aware rate limits, circuit breaking and a dead-letter queue. | FR-ING-004 |
| P12-TC07 | P12-R07 | Given an authorized fixture, verify: Billing-period restatement handling: a provider re-delivering a period atomically supersedes the previous version. | FR-ING-005 |
| P12-TC08 | P12-R08 | Given an authorized fixture, verify: Schema-version detection for provider exports. Unknown schema → quarantine plus alert, not silent loss. | FR-ING-006 |
| P12-TC09 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P12-TC10 | cross-cutting | Inject Worker dies before checkpoint; lease expiry; duplicate job; unknown export schema; 13-month backfill interrupted; provider correction after close; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P12-TC11 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P12-TC12 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
