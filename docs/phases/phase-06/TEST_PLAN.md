# Phase 06 Test Plan

All tests are planned and **NOT RUN**. Use synthetic two-tenant fixtures with distinct roles, reproducible clocks and versioned input hashes. Cloud credentials are optional for fixture tests; live-provider checks are separate and must report unavailable credentials explicitly.

| Test ID | Requirement | Scenario and expected result | PRD trace |
|---|---|---|---|
| P06-TC01 | P06-R01 | Given an authorized fixture, verify: Guided onboarding wizard with per-connector status, permission validation results and next steps. | FR-TEN-006 |
| P06-TC02 | P06-R02 | Given an authorized fixture, verify: Each connector declares a capability manifest (billing, inventory, metrics, recommendations, invoices, pricing) and the scopes it supports. | FR-CON-001 |
| P06-TC03 | P06-R03 | Given an authorized fixture, verify: Connection verification performs granular permission checks per capability and reports pass, fail or unknown with remediation text. | FR-CON-002 |
| P06-TC04 | P06-R04 | Given an authorized fixture, verify: Prefer keyless federation (AWS STS AssumeRole with ExternalId or web identity, GCP Workload Identity Federation or SA impersonation, Azure workload identity federation). Static keys only when federation is unavailable, stored as secret references. | FR-CON-003 |
| P06-TC05 | P06-R05 | Given an authorized fixture, verify: Connectors never modify customer cloud resources, configurations or billing settings. Templates grant read access plus only the minimum non-destructive permissions needed to run queries (e.g. Athena query execution with results written to a dedicated CloudLedger results prefix, BigQuery `jobs.create`). Each such permission is documented, scoped and optional. | FR-CON-004 |
| P06-TC06 | P06-R06 | Given an authorized fixture, verify: Provide IaC templates (CloudFormation/Terraform, gcloud/Terraform, Bicep/ARM/Terraform) to create least-privilege access. | FR-CON-006 |
| P06-TC07 | P06-R07 | Given an authorized fixture, verify: Standalone account and AWS Organizations management-account (payer) scopes, including linked-account discovery. | FR-AWS-001 |
| P06-TC08 | P06-R08 | Given an authorized fixture, verify: Ingest CUR 2.0 via Data Exports (Parquet) from S3, including manifest-based billing-period overwrites (restatements). | FR-AWS-002 |
| P06-TC09 | P06-R09 | Given an authorized fixture, verify: Optional Athena query path for very large CUR datasets. | FR-AWS-003 |
| P06-TC10 | P06-R10 | Given an authorized fixture, verify: Cost Explorer API for validation and quick-start preview (cost-aware rate limiting, since the API is charged per request). | FR-AWS-004 |
| P06-TC11 | P06-R11 | Given an authorized fixture, verify: Preserve the original raw records (object storage) and link every normalized row to its source file, row and ingestion run (lineage). | FR-NRM-002 |
| P06-TC12 | cross-cutting | Repeat reads, writes, jobs and artifact retrieval as a different tenant and a revoked principal; assert no data disclosure or unauthorized state change. | NFR-SEC-001, NFR-ACC-001 |
| P06-TC13 | cross-cutting | Inject Rotated STS credentials; missing linked-account permissions; duplicate manifest; overwritten period; Athena throttling; encrypted S3 object without decrypt permission; assert documented recovery, bounded retries and no partial publication. | NFR-SEC-001, NFR-ACC-001 |
| P06-TC14 | cross-cutting | Replay identical work, crash around commit and retry; assert stable results and audit continuity. | NFR-SEC-001, NFR-ACC-001 |
| P06-TC15 | cross-cutting | Apply to empty and prior-version stores; verify tenant constraints and compensating recovery preserve control totals. | NFR-SEC-001, NFR-ACC-001 |

## Execution evidence
Run domain unit tests, database integration tests, applicable provider/analytics contracts and Playwright user journeys. Pin environment, seed, clock, artifact digest and fixture hash. Money uses exact decimal golden comparisons; UI values must agree with semantic API totals. Record latency distributions on the approved reference hardware where performance applies. No test command is claimed until an executable implementation exists.
