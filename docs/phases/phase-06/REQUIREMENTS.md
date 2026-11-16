# Phase 06 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P06-R01 | Guided onboarding wizard with per-connector status, permission validation results and next steps. | FR-TEN-006 | M | P06-AC01 |
| P06-R02 | Each connector declares a capability manifest (billing, inventory, metrics, recommendations, invoices, pricing) and the scopes it supports. | FR-CON-001 | M | P06-AC02 |
| P06-R03 | Connection verification performs granular permission checks per capability and reports pass, fail or unknown with remediation text. | FR-CON-002 | M | P06-AC03 |
| P06-R04 | Prefer keyless federation (AWS STS AssumeRole with ExternalId or web identity, GCP Workload Identity Federation or SA impersonation, Azure workload identity federation). Static keys only when federation is unavailable, stored as secret references. | FR-CON-003 | M | P06-AC04 |
| P06-R05 | Connectors never modify customer cloud resources, configurations or billing settings. Templates grant read access plus only the minimum non-destructive permissions needed to run queries (e.g. Athena query execution with results written to a dedicated CloudLedger results prefix, BigQuery `jobs.create`). Each such permission is documented, scoped and optional. | FR-CON-004 | M | P06-AC05 |
| P06-R06 | Provide IaC templates (CloudFormation/Terraform, gcloud/Terraform, Bicep/ARM/Terraform) to create least-privilege access. | FR-CON-006 | M | P06-AC06 |
| P06-R07 | Standalone account and AWS Organizations management-account (payer) scopes, including linked-account discovery. | FR-AWS-001 | M | P06-AC07 |
| P06-R08 | Ingest CUR 2.0 via Data Exports (Parquet) from S3, including manifest-based billing-period overwrites (restatements). | FR-AWS-002 | M | P06-AC08 |
| P06-R09 | Optional Athena query path for very large CUR datasets. | FR-AWS-003 | S | P06-AC09 |
| P06-R10 | Cost Explorer API for validation and quick-start preview (cost-aware rate limiting, since the API is charged per request). | FR-AWS-004 | S | P06-AC10 |
| P06-R11 | Preserve the original raw records (object storage) and link every normalized row to its source file, row and ingestion run (lineage). | FR-NRM-002 | M | P06-AC11 |
