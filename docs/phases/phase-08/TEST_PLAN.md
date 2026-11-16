# Phase 08 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P08-TC01 | P08-R01 | Given an authorized fixture, verify: Guided onboarding wizard with per-connector status, permission validation results and next steps. | FR-TEN-006 |
| P08-TC02 | P08-R02 | Given an authorized fixture, verify: Connection verification performs granular permission checks per capability and reports pass, fail or unknown with remediation text. | FR-CON-002 |
| P08-TC03 | P08-R03 | Given an authorized fixture, verify: Prefer keyless federation (AWS STS AssumeRole with ExternalId or web identity, GCP Workload Identity Federation or SA impersonation, Azure workload identity federation). Static keys only when federation is unavailable, stored as secret references. | FR-CON-003 |
| P08-TC04 | P08-R04 | Given an authorized fixture, verify: Connectors never modify customer cloud resources, configurations or billing settings. Templates grant read access plus only the minimum non-destructive permissions needed to run queries (e.g. Athena query execution with results written to a dedicated CloudLedger results prefix, BigQuery `jobs.create`). Each such permission is documented, scoped and optional. | FR-CON-004 |
| P08-TC05 | P08-R05 | Given an authorized fixture, verify: Provide IaC templates (CloudFormation/Terraform, gcloud/Terraform, Bicep/ARM/Terraform) to create least-privilege access. | FR-CON-006 |
| P08-TC06 | P08-R06 | Given an authorized fixture, verify: Billing account (EA, MCA, MOSA/PAYG where supported), billing profile, invoice section, management group, subscription and resource-group scopes. | FR-AZR-001 |
| P08-TC07 | P08-R07 | Given an authorized fixture, verify: Ingest Cost Management exports (actual and amortized; FOCUS export where available) from Blob storage. | FR-AZR-002 |
| P08-TC08 | P08-R08 | Given an authorized fixture, verify: Cost Details API for on-demand reports when exports are unavailable. Query API for previews. | FR-AZR-003 |
| P08-TC09 | P08-R09 | Given an authorized fixture, verify: Preserve the original raw records (object storage) and link every normalized row to its source file, row and ingestion run (lineage). | FR-NRM-002 |
| P08-TC10 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P08-TC11 | cross-cutting | Inject EA versus MCA scope mismatch; expired SAS; delayed export; 429 Retry-After; duplicate actual/amortized charges; unavailable Cost Details capability; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P08-TC12 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P08-TC13 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
