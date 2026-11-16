# Cross-Document Review Findings (input to Phases 01–02)

Inconsistencies and open points found while drafting the documentation set. Each item must be resolved, or explicitly deferred, during the Phase 01 (requirements) and Phase 02 (architecture) reviews.

| ID | Finding | Source | Proposed resolution | Status |
|---|---|---|---|---|
| RF-01 | FR-CON-004 "no mutating permission" conflicts with Athena query results and BigQuery `jobs.create` | providers review | PRD reworded to "never modify customer resources; minimal non-destructive query permissions documented" | **Fixed in draft** |
| RF-02 | FR-GCP-003 assumed a native GCS billing export (no longer offered) | providers review | PRD reworded: GCS path for customer-exported files | **Fixed in draft** |
| RF-03 | Manifest example AWS billing permissions incomplete | providers review | added `s3:GetBucketLocation`, `bcm-data-exports:*` reads, KMS note | **Fixed in draft** |
| RF-04 | Dedup key included the content hash | finance review | split into line identity key + content hash (INGESTION_PIPELINE updated) | **Fixed in draft** |
| RF-05 | FR-REC-006 lacked the `superseded` state present in the schema | finance review | PRD updated | **Fixed in draft** |
| RF-06 | Missing events: period reopened, adjustment recorded, FX rate set published, inventory/metrics events | finance + providers review | added to EVENTS.md. JSON Schemas still to be added in `schemas/events/` (Phase 18–20/30) | Partially fixed |
| RF-07 | DATABASE_SCHEMA lacks `allocation_runs`, allocation preview storage, `period_snapshots.version/superseded_by`, `cloud_scopes` history (for tag inheritance) | finance review | add in Phase 02 schema review | Open |
| RF-08 | `cost_allocated` grain: per row vs. per shared-pool group | finance review | adopt ALLOCATION_ENGINE.md design; update DATABASE_SCHEMA §3 in Phase 02 | Open |
| RF-09 | FR-ALC-005 says "smallest currency unit"; design keeps exact 12-dp invariant, then cent-level rounding for chargeback reports | finance review | reword FR-ALC-005 in Phase 01 | Open |
| RF-10 | Forecasting with a Prophet-like model uses float64, conflicting with ADR-0007 | finance review | ADR-0007 exemption for statistical models (outputs converted to decimal, never used in ledgers) or decimal-only models | Open (Phase 02) |
| RF-11 | `cost_preview` capability (Cost Explorer / Azure Query API) not in PROVIDER_SDK | providers review | add optional `PreviewSource` interface in Phase 02 contract freeze | Open |
| RF-12 | `plugins_installed.license_spdx` nullable although manifest requires `license`; table not tenant-scoped (plugins are deployment-wide by design) | phases 33–40 review | make NOT NULL; document deployment scope | Open |
| RF-13 | PRD cites OWASP ASVS 4.0; ASVS 5.0 is current | phases 33–40 review | Phase 01: decide ASVS version | Open |
| RF-14 | LICENSE_MAP puts `providers/examples` under SDK license while PLUGIN_LICENSING requires CL-SAL headers in-tree | phases 33–40 review | Clarify: `providers/examples` is the documented exception (follows SDK license) | Open (legal) |
| RF-15 | TRADEMARK_POLICY allows "CloudLedger connector for X" phrasing but forbids "CloudLedger" as first word of plugin names | phases 33–40 review | Clarify: descriptive phrase allowed in text, not as product name | Open (legal) |
| RF-16 | Some planned tools are AGPL (Grafana, Loki, Tempo, MinIO, k6); go-plugin is MPL-2.0 | phases 33–40 review | Treat AGPL tools as operator-installed or build-only, never vendored; record an MPL-2.0 exception or write an in-house handshake | Open (Phase 03) |
| RF-17 | Accounting periods: UTC vs. tenant timezone boundaries | finance review | Phase 01 decision | Open |
| RF-18 | Azure MCA: mapping of "billing account" vs. "billing profile" to the invoice scope | finance review | Phase 08 | Open |
| RF-19 | README tree has `apps/api` and `apps/worker`, but ADR-0001 specifies one binary | ops review | Phase 03: single `cmd/cloudledger` (in `apps/api`); `apps/worker` holds only worker image or config | Open |
| RF-20 | PRD lacks SLO targets for Standard availability, alert delivery latency, job success, analytics RPO/RTO, DuckDB latency | ops review | proposed values in docs/operations/SLOS.md; confirm in Phase 01 | Open |
| RF-21 | Standard profile RPO 1 h requires continuous WAL archiving | ops review | adopt in DEPLOYMENT_PROFILES (Phase 02) | Open |
| RF-22 | Backups retain deleted-tenant data until expiry (GDPR erasure) | ops review | per-tenant DEK crypto-shredding makes backup copies unreadable; record in the DPIA | Open (Phase 01 DPIA) |
| RF-23 | LICENSE_MAP did not list `schemas/semantic` and `schemas/manifest` | ops review | added | **Fixed in draft** |
| RF-24 | README (vision) says "governed read-only SQL" for AI; ADR-0013 and FR-AI-003 forbid model-generated SQL (semantic queries only) | security review | Clarify the README wording in Phase 01 ("governed read-only semantic queries") | Open (owner decision) |
| RF-25 | ADR-0002 implies cookie-held session; design uses a DB `sessions` table with a sealed session-ID cookie | security review | update ADR-0002 wording in Phase 02 | Open |
| RF-26 | `api_tokens.secret_hash` ambiguous (argon2id vs HMAC) | security review | HMAC-SHA256 with a pepper held outside the DB (SECURITY_ARCHITECTURE) | Open (Phase 02 schema) |
| RF-27 | DATABASE_SCHEMA lacks `credentials_refs`, `encrypted_secrets`, `tenant_keys`, `subject_keys` DDL | security review | add in Phase 02 | Open |
| RF-28 | 7-year audit retention vs. tenant purge deleting rows | security review | retain audit chain anchors plus crypto-shredded PII; legal and DPIA decision | Open (Phase 01) |
| RF-29 | Architecture README role list omits "viewer" | security review | align with FR-IAM-004 | Open |
