# Phase 07 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P07-R01 | Guided onboarding wizard with per-connector status, permission validation results and next steps. | FR-TEN-006 | M | P07-AC01 |
| P07-R02 | Connection verification performs granular permission checks per capability and reports pass, fail or unknown with remediation text. | FR-CON-002 | M | P07-AC02 |
| P07-R03 | Prefer keyless federation (AWS STS AssumeRole with ExternalId or web identity, GCP Workload Identity Federation or SA impersonation, Azure workload identity federation). Static keys only when federation is unavailable, stored as secret references. | FR-CON-003 | M | P07-AC03 |
| P07-R04 | Connectors never modify customer cloud resources, configurations or billing settings. Templates grant read access plus only the minimum non-destructive permissions needed to run queries (e.g. Athena query execution with results written to a dedicated CloudLedger results prefix, BigQuery `jobs.create`). Each such permission is documented, scoped and optional. | FR-CON-004 | M | P07-AC04 |
| P07-R05 | Provide IaC templates (CloudFormation/Terraform, gcloud/Terraform, Bicep/ARM/Terraform) to create least-privilege access. | FR-CON-006 | M | P07-AC05 |
| P07-R06 | Billing account, organization, folder and project scopes. | FR-GCP-001 | M | P07-AC06 |
| P07-R07 | Ingest Cloud Billing detailed (resource-level) and standard BigQuery exports, plus pricing export where enabled. Handle late-arriving rows by `export_time` watermark. | FR-GCP-002 | M | P07-AC07 |
| P07-R08 | GCS-based file ingestion path for billing files the customer exports from BigQuery to GCS (Google no longer offers a native file export of Cloud Billing data to GCS). | FR-GCP-003 | S | P07-AC08 |
| P07-R09 | Preserve the original raw records (object storage) and link every normalized row to its source file, row and ingestion run (lineage). | FR-NRM-002 | M | P07-AC09 |
