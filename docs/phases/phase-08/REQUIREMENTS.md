# Phase 08 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P08-R01 | Guided onboarding wizard with per-connector status, permission validation results and next steps. | FR-TEN-006 | M | P08-AC01 |
| P08-R02 | Connection verification performs granular permission checks per capability and reports pass, fail or unknown with remediation text. | FR-CON-002 | M | P08-AC02 |
| P08-R03 | Prefer keyless federation (AWS STS AssumeRole with ExternalId or web identity, GCP Workload Identity Federation or SA impersonation, Azure workload identity federation). Static keys only when federation is unavailable, stored as secret references. | FR-CON-003 | M | P08-AC03 |
| P08-R04 | Connectors never modify customer cloud resources, configurations or billing settings. Templates grant read access plus only the minimum non-destructive permissions needed to run queries (e.g. Athena query execution with results written to a dedicated CloudLedger results prefix, BigQuery `jobs.create`). Each such permission is documented, scoped and optional. | FR-CON-004 | M | P08-AC04 |
| P08-R05 | Provide IaC templates (CloudFormation/Terraform, gcloud/Terraform, Bicep/ARM/Terraform) to create least-privilege access. | FR-CON-006 | M | P08-AC05 |
| P08-R06 | Billing account (EA, MCA, MOSA/PAYG where supported), billing profile, invoice section, management group, subscription and resource-group scopes. | FR-AZR-001 | M | P08-AC06 |
| P08-R07 | Ingest Cost Management exports (actual and amortized; FOCUS export where available) from Blob storage. | FR-AZR-002 | M | P08-AC07 |
| P08-R08 | Cost Details API for on-demand reports when exports are unavailable. Query API for previews. | FR-AZR-003 | S | P08-AC08 |
| P08-R09 | Preserve the original raw records (object storage) and link every normalized row to its source file, row and ingestion run (lineage). | FR-NRM-002 | M | P08-AC09 |
