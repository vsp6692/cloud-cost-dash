# Phase 34 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P34-TC01 | P34-R01 | Given an authorized fixture, verify: No cross-tenant data access through any API, query, export, AI or cache path. | NFR-SEC-001 |
| P34-TC02 | P34-R02 | Given an authorized fixture, verify: OWASP ASVS 4.0 Level 2 for the web app and API. Level 3 controls for authn, session and audit. | NFR-SEC-002 |
| P34-TC03 | P34-R03 | Given an authorized fixture, verify: Secrets never stored in plaintext. Envelope encryption with a KMS-backed KEK, or secret references to external stores. | NFR-SEC-003 |
| P34-TC04 | P34-R04 | Given an authorized fixture, verify: TLS 1.2+ (1.3 preferred) in transit. AES-256 at rest (storage-provider or app-level for secrets). | NFR-SEC-004 |
| P34-TC05 | P34-R05 | Given an authorized fixture, verify: SBOM (SPDX/CycloneDX), Cosign-signed images, SLSA provenance level 3 target, pinned dependencies. | NFR-SEC-005 |
| P34-TC06 | P34-R06 | Given an authorized fixture, verify: Dashboard query p95 ≤ 2 s for 13 months of data at the Standard reference scale (see §8) on ClickHouse. ≤ 5 s on PostgreSQL at Lite scale. | NFR-PERF-001 |
| P34-TC07 | P34-R07 | Given an authorized fixture, verify: API p95 ≤ 300 ms for metadata endpoints. | NFR-PERF-002 |
| P34-TC08 | P34-R08 | Given an authorized fixture, verify: ≥ 50 M cost rows/hour per worker on the ClickHouse profile (reference hardware TBD in Phase 01). | NFR-PERF-003 |
| P34-TC09 | P34-R09 | Given an authorized fixture, verify: Horizontal scaling of API and worker pools. Analytics scales via engine choice. | NFR-SCL-001 |
| P34-TC10 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P34-TC11 | cross-cutting | Inject Cross-tenant cache collision; overload; malformed query; authorization race; dependency compromise; benchmark dataset drift; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P34-TC12 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P34-TC13 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
