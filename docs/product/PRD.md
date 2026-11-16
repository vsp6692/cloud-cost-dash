# CloudLedger — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Document status | **DRAFT v0.1**: to be reviewed and approved in Phase 01 |
| Product | CloudLedger, a source-available multi-cloud FinOps platform (working name; trademark not yet verified) |
| License | Source-available. Proposed CloudLedger Source-Available License 1.0 (draft, pending legal review). Free for internal use; commercial license required for redistribution and third-party hosting. See [`docs/legal/`](../legal/README.md). Not OSI open source. |
| Authoritative vision | [`README.md`](../../README.md) |
| Owners | Product: TBD · Architecture: TBD · Security: TBD · Finance SME: TBD |
| Related | [Architecture](../architecture/README.md) · [Open questions](OPEN_QUESTIONS.md) · [Traceability](../planning/TRACEABILITY_MATRIX.md) · [Glossary](GLOSSARY.md) |

> **Implementation status:** no product code exists yet. Every requirement here is a target, not a shipped capability.

---

## 1. Problem statement

Organizations running workloads on AWS, Google Cloud and Azure face several problems:

1. **Fragmented billing data.** Each provider uses different schemas, scopes, cost semantics (billed vs. amortized vs. effective), currencies and correction behavior.
2. **Poor allocation.** Tags and labels are inconsistent, shared costs are hard to distribute, and business hierarchies (cost centers, products, teams) exist outside the cloud.
3. **Untrustworthy numbers.** Dashboards rarely reconcile to invoices. Finance cannot audit how a number was produced.
4. **Generic savings advice.** Recommendations lack evidence, double-count savings across overlapping actions, and never measure realized savings.
5. **Lock-in and data-sovereignty concerns.** Commercial FinOps SaaS tools require sending billing data to a third party and cannot be self-hosted, inspected or extended.

CloudLedger is a source-available, self-hostable (optionally SaaS-operated) platform, free for internal use, that normalizes multi-cloud billing to FOCUS, allocates cost configurably per tenant, reconciles to invoices, and produces evidence-backed savings recommendations, with a governed AI assistant and an extensible SDK.

## 2. Goals and non-goals

### 2.1 Goals (v1.0)
- G1: Ingest full-fidelity billing data from AWS, GCP and Azure (plus generic files), preserve raw data, and normalize it to a documented FOCUS version.
- G2: Produce numbers that reconcile to provider invoices within documented tolerances, with full lineage.
- G3: Configurable, tenant-specific allocation, dashboards and visibility rules with no per-customer code.
- G4: Evidence-based recommendations with confidence, risk, net savings that are not double-counted, and measured realized savings.
- G5: Strong security: tenant isolation, SSO, RBAC+ABAC, read-only cloud federation, immutable audit trail.
- G6: Deployable from a single laptop (Lite) to HA enterprise clusters.
- G7: Extensible through provider, recommendation, pricing and dashboard SDKs without changes to the core.

### 2.2 Non-goals (v1.0 exclusions)
- NG1: **Automated remediation.** CloudLedger never mutates customer cloud resources by default. Remediation is limited to generated guidance, IaC snippets and ticket and approval workflows. Any future mutation capability requires a separate opt-in workflow and ADR.
- NG2: Purchasing commitments (RIs, Savings Plans, CUDs) on the customer's behalf.
- NG3: General-purpose BI or a data warehouse replacement.
- NG4: Accounts-payable or ERP functionality (payments, purchase orders). CloudLedger exports to ledgers and does not replace them.
- NG5: Billing of the customer's own end users, beyond showback and chargeback reports.
- NG6: Providers other than AWS/GCP/Azure as first-party connectors (OCI, Alibaba, SaaS vendors, etc. are community SDK targets).
- NG7: Real-time (sub-hourly) cost. Billing data latency is bounded by provider export latency (typically 8–48 h).
- NG8: Mobile native apps. The web UI is responsive.

## 3. Personas

| ID | Persona | Context | Primary needs | Key journeys |
|---|---|---|---|---|
| PER-01 | **Individual developer / indie hacker** | One personal AWS or GCP account, self-hosted Lite | Fast setup, "what is costing me money", idle resources | UJ-01, UJ-05 |
| PER-02 | **Startup CTO** | 1–3 clouds, < 50 accounts, no FinOps team | Global dashboard, budgets, anomaly alerts, quick wins | UJ-01, UJ-03, UJ-05 |
| PER-03 | **FinOps practitioner (FinOps admin)** | Enterprise, hundreds of accounts or projects or subscriptions | Allocation rules, shared costs, commitments, chargeback, recommendations at scale | UJ-02, UJ-04, UJ-06, UJ-07 |
| PER-04 | **Finance manager / controller** | Owns budget and month-end close | Invoice reconciliation, amortization, FX, period close, exports to ERP | UJ-08, UJ-09 |
| PER-05 | **Engineering manager** | Owns a team's services | Team-scoped view, unit costs, recommendations for owned resources | UJ-04, UJ-06 |
| PER-06 | **Developer** | Owns specific workloads | Scoped visibility, actionable recommendations with evidence and rollback | UJ-06 |
| PER-07 | **Auditor** | Internal or external audit | Read-only access to immutable reports, lineage and audit logs | UJ-09 |
| PER-08 | **Platform administrator / operator** | Runs the CloudLedger deployment | Install, upgrade, backup, observability, tenant management | UJ-10 |
| PER-09 | **MSP operator** (requires commercial license; see [COMMERCIAL_LICENSE.md](../../COMMERCIAL_LICENSE.md)) | Manages many customer tenants | Multi-tenant management, per-customer branding and visibility, cross-tenant isolation | UJ-11 |
| PER-10 | **Community contributor** | Builds a provider or recommendation plugin | SDK, contract tests, docs, examples | UJ-12 |

## 4. User journeys

Each journey becomes a Playwright E2E scenario. IDs are referenced from the [acceptance matrix](../planning/ACCEPTANCE_MATRIX.md).

| ID | Journey | Steps (happy path) | Critical failure paths |
|---|---|---|---|
| UJ-01 | **First-time setup, single account** | Install Lite → first-admin bootstrap → create tenant → connect AWS account via CloudFormation template (IAM role + ExternalId) → permission check reports capabilities → first sync → global dashboard shows MTD cost with freshness | Missing permission, export not yet delivered, wrong ExternalId, no data yet |
| UJ-02 | **Organization onboarding** | Connect AWS management account, GCP billing account and Azure billing account → discover linked accounts, projects and subscriptions → map them to the business hierarchy → backfill 13 months | Partial permissions on some children, throttling, very large backfill |
| UJ-03 | **Budgets and anomalies** | Create budget on a scope → configure thresholds → anomaly is detected → Slack/email alert → user drills to root-cause dimensions | Alert channel failure (retry, DLQ), noisy anomaly suppression |
| UJ-04 | **Allocation and chargeback** | Define tag normalization (e.g. `CostCenter`, `cost-center` → `cost_center`) → define a shared-cost rule (split platform cost by usage) → preview → publish rule version → chargeback report per cost center | Rule overlap, untagged cost, conflicting rule versions |
| UJ-05 | **Find quick wins** | Open recommendations → filter by category and confidence → view evidence (metrics, pricing, inventory) → export or create ticket | Missing telemetry → reduced confidence, not a fabricated recommendation |
| UJ-06 | **Recommendation lifecycle** | Developer sees a recommendation on an owned resource → requests approval → manager approves → implemented outside CloudLedger → realized savings measured after N days | Rejected, snoozed, resource deleted, savings not realized |
| UJ-07 | **Commitment analysis** | View commitment coverage and utilization → amortized vs. billed views → commitment purchase recommendation net of existing commitments | Overlapping recommendations must not double count |
| UJ-08 | **Invoice reconciliation** | Import or fetch invoice → automatic match against normalized cost → variance report by category (tax, credit, rounding, late correction) → acknowledge variances | Variance beyond tolerance blocks period close |
| UJ-09 | **Period close and audit** | Finance closes a period → immutable snapshot and report manifest (hashes) → auditor verifies hashes and lineage → late corrections appear as adjustments in the next open period | Attempt to mutate a closed period is rejected and audited |
| UJ-10 | **Operate the platform** | Install Standard or HA via Helm → configure OIDC → monitoring dashboards → backup → restore drill → upgrade with migrations | Failed migration rolls back, restore verification |
| UJ-11 | **MSP multi-tenant** | MSP creates customer tenants → delegates tenant-owner roles → customer users see only their tenant | Cross-tenant access attempts are denied and audited |
| UJ-12 | **Contributor builds a provider** | Scaffold provider from template → implement SDK interfaces → write manifest → run the provider compatibility suite → submit PR | Manifest declares capability not implemented → suite fails |
| UJ-13 | **Ask the AI assistant** | User asks "Why did EC2 cost increase last week in team X?" → assistant runs authorized semantic queries → answer with citations, freshness and query links → user saves as report | Prompt injection in tag values or resource names; question about an unauthorized scope → refusal |

## 5. Functional requirements

Priority: **M** = must (v1.0 blocker), **S** = should, **C** = could. The `Phase` column is the delivering phase. Requirement IDs are stable and must never be reused.

### 5.1 Tenancy and onboarding (TEN)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-TEN-001 | Support multiple tenants per deployment with strict data isolation at the API, database and analytics layers. | M | 04 |
| FR-TEN-002 | Tenants can be individual (single user) or organizational (many users, hierarchy). | M | 04 |
| FR-TEN-003 | Configurable tenant hierarchy (business units, cost centers, teams, products, environments) as a versioned tree, independent of cloud hierarchy. | M | 04, 11 |
| FR-TEN-004 | Platform admin can create, suspend, export and delete tenants. Deletion follows a documented retention and crypto-shredding process. | M | 04, 33 |
| FR-TEN-005 | MSP mode: a parent organization can manage child tenants without seeing their data unless explicitly delegated. (Feature available in the codebase. Operating it for external customers requires a commercial license. Internal multi-tenant use across Affiliates is free.) | S | 31 |
| FR-TEN-006 | Guided onboarding wizard with per-connector status, permission validation results and next steps. | M | 06–08, 14 |
| FR-TEN-007 | Tenant settings: default currency, accounting calendar, fiscal year start, time zone, data retention. | M | 04, 18 |

### 5.2 Identity and access (IAM)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-IAM-001 | OIDC SSO login (Authorization Code + PKCE). | M | 05 |
| FR-IAM-002 | SAML 2.0 SP support. | M | 31 |
| FR-IAM-003 | SCIM 2.0 user and group provisioning. | S | 31 |
| FR-IAM-004 | Built-in roles: platform admin, tenant owner, FinOps admin, finance manager, engineering manager, developer, auditor, viewer. | M | 05 |
| FR-IAM-005 | Custom roles composed from granular permissions. | M | 05, 31 |
| FR-IAM-006 | ABAC: restrict data visibility by attributes (provider, account, project, subscription, hierarchy node, tag or dimension value). | M | 05, 15 |
| FR-IAM-007 | API tokens (personal and service) that are scoped, expiring, hashed at rest, and revocable. | M | 05 |
| FR-IAM-008 | IdP group → role/scope mapping. | M | 05, 31 |
| FR-IAM-009 | Local password authentication only for the Lite bootstrap admin. Disable-able, with MFA (TOTP) when enabled. | S | 05 |
| FR-IAM-010 | Session management: idle and absolute timeouts, revocation, device listing. | M | 05 |

### 5.3 Cloud connectors: common (CON)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-CON-001 | Each connector declares a capability manifest (billing, inventory, metrics, recommendations, invoices, pricing) and the scopes it supports. | M | 06 |
| FR-CON-002 | Connection verification performs granular permission checks per capability and reports pass, fail or unknown with remediation text. | M | 06–08 |
| FR-CON-003 | Prefer keyless federation (AWS STS AssumeRole with ExternalId or web identity, GCP Workload Identity Federation or SA impersonation, Azure workload identity federation). Static keys only when federation is unavailable, stored as secret references. | M | 06–08 |
| FR-CON-004 | Connectors never modify customer cloud resources, configurations or billing settings. Templates grant read access plus only the minimum non-destructive permissions needed to run queries (e.g. Athena query execution with results written to a dedicated CloudLedger results prefix, BigQuery `jobs.create`). Each such permission is documented, scoped and optional. | M | 06–08 |
| FR-CON-005 | Health status per connector and capability: last success, last attempt, freshness lag, error class, next run. | M | 12 |
| FR-CON-006 | Provide IaC templates (CloudFormation/Terraform, gcloud/Terraform, Bicep/ARM/Terraform) to create least-privilege access. | M | 06–08 |

### 5.4 AWS (AWS)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-AWS-001 | Standalone account and AWS Organizations management-account (payer) scopes, including linked-account discovery. | M | 06 |
| FR-AWS-002 | Ingest CUR 2.0 via Data Exports (Parquet) from S3, including manifest-based billing-period overwrites (restatements). | M | 06 |
| FR-AWS-003 | Optional Athena query path for very large CUR datasets. | S | 06 |
| FR-AWS-004 | Cost Explorer API for validation and quick-start preview (cost-aware rate limiting, since the API is charged per request). | S | 06 |
| FR-AWS-005 | Invoice data where available (Invoicing API / billing console exports, entitlement dependent). | S | 10 |
| FR-AWS-006 | Inventory via Resource Explorer and/or AWS Config aggregators. Metrics via CloudWatch. Recommendations via Compute Optimizer and Trusted Advisor (entitlement dependent). | M | 19, 20, 21 |

### 5.5 GCP (GCP)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-GCP-001 | Billing account, organization, folder and project scopes. | M | 07 |
| FR-GCP-002 | Ingest Cloud Billing detailed (resource-level) and standard BigQuery exports, plus pricing export where enabled. Handle late-arriving rows by `export_time` watermark. | M | 07 |
| FR-GCP-003 | GCS-based file ingestion path for billing files the customer exports from BigQuery to GCS (Google no longer offers a native file export of Cloud Billing data to GCS). | S | 07 |
| FR-GCP-004 | Invoice data where available. | S | 10 |
| FR-GCP-005 | Inventory via Cloud Asset Inventory, metrics via Cloud Monitoring, recommendations via Recommender API. | M | 19, 20, 21 |

### 5.6 Azure (AZR)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-AZR-001 | Billing account (EA, MCA, MOSA/PAYG where supported), billing profile, invoice section, management group, subscription and resource-group scopes. | M | 08 |
| FR-AZR-002 | Ingest Cost Management exports (actual and amortized; FOCUS export where available) from Blob storage. | M | 08 |
| FR-AZR-003 | Cost Details API for on-demand reports when exports are unavailable. Query API for previews. | S | 08 |
| FR-AZR-004 | Invoice data where available (billing-account-type dependent). | S | 10 |
| FR-AZR-005 | Inventory via Resource Graph, metrics via Azure Monitor, recommendations via Advisor, pricing via Retail Prices API. | M | 19, 20, 21 |

### 5.7 Generic imports (IMP)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-IMP-001 | Import CSV, JSON/NDJSON, XLSX and Parquet cost files through the UI, API or object-store polling. | M | 09 |
| FR-IMP-002 | Column mapping templates (versioned) to the normalized model, with preview and validation. | M | 09 |
| FR-IMP-003 | Data-quality report per import: row counts, rejected rows with reasons, totals, duplicates. | M | 09 |
| FR-IMP-004 | Safe parsing: size limits, formula-injection neutralization on export, zip-bomb protection, streaming parse. | M | 09 |

### 5.8 Normalization and data model (NRM)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-NRM-001 | Normalize all cost data to a pinned FOCUS version (see ADR-0006) with provider extension columns (`x_` prefix). | M | 11 |
| FR-NRM-002 | Preserve the original raw records (object storage) and link every normalized row to its source file, row and ingestion run (lineage). | M | 06–11 |
| FR-NRM-003 | Distinguish ListCost, ContractedCost, BilledCost and EffectiveCost (amortized), and charge categories (Usage, Purchase, Tax, Credit, Adjustment) and charge class (Correction). | M | 11 |
| FR-NRM-004 | Versioned mapping definitions. Re-normalization of history when mappings change, without losing previous versions. | M | 11 |
| FR-NRM-005 | Allocation dimensions: tags and labels (raw and normalized keys), custom dimensions, hierarchy nodes. | M | 11, 15 |
| FR-NRM-006 | Deterministic deduplication keyed by provider-native line identifiers plus a content hash. | M | 11, 12 |

### 5.9 Ingestion operations (ING)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-ING-001 | Incremental sync with persisted checkpoints per connector, capability and scope. | M | 12 |
| FR-ING-002 | Backfill up to a configurable horizon (default 13 months, subject to provider availability). | M | 12 |
| FR-ING-003 | Idempotent processing: replaying any ingestion run yields identical normalized results. | M | 12 |
| FR-ING-004 | Retry with exponential backoff and jitter, provider-aware rate limits, circuit breaking and a dead-letter queue. | M | 12 |
| FR-ING-005 | Billing-period restatement handling: a provider re-delivering a period atomically supersedes the previous version. | M | 12 |
| FR-ING-006 | Schema-version detection for provider exports. Unknown schema → quarantine plus alert, not silent loss. | M | 12 |

### 5.10 Analytics engines (ANL)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-ANL-001 | Pluggable analytics store: PostgreSQL, DuckDB, ClickHouse. | M | 13 |
| FR-ANL-002 | A semantic query layer (metrics, dimensions, filters, time grain) compiled per engine. No engine-specific SQL in business logic. | M | 13 |
| FR-ANL-003 | Cross-engine contract suite: identical inputs produce identical results (exact decimal equality). | M | 13 |
| FR-ANL-004 | Mandatory tenant and ABAC predicate injection by the query compiler. | M | 13 |

### 5.11 Dashboards (DSH)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-DSH-001 | Global, provider, account/project/subscription, service, region and resource dashboards. | M | 14 |
| FR-DSH-002 | Cost-type switcher (billed, effective/amortized, list, contracted), currency selector, and include/exclude taxes and credits. | M | 14 |
| FR-DSH-003 | Data freshness and completeness indicators on every widget. | M | 14 |
| FR-DSH-004 | Dashboard builder: widgets (time series, bar, pie/treemap, table, KPI, heatmap), saved filters, templates, per-role default dashboards. | M | 16 |
| FR-DSH-005 | Dashboard sharing with permission checks. Widgets never show data outside the viewer's ABAC scope. | M | 16 |
| FR-DSH-006 | Export widget data (CSV/XLSX) subject to permissions. | S | 16 |

### 5.12 Allocation (ALC)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-ALC-001 | Tag and label key normalization and value mapping rules. | M | 15 |
| FR-ALC-002 | Tag inheritance (account/project/subscription/resource-group → resource) where the provider doesn't propagate. | M | 15 |
| FR-ALC-003 | Business mapping rules (conditions → hierarchy node or custom dimension), ordered with explicit precedence. | M | 15 |
| FR-ALC-004 | Shared-cost distribution: even, fixed percentage, proportional to cost, proportional to custom metric. | M | 15 |
| FR-ALC-005 | Allocation invariant: allocated + unallocated total equals the source total for every period (to the smallest currency unit, with documented residual handling). | M | 15 |
| FR-ALC-006 | Rule versioning, preview (diff before publish), effective dating, re-run history. | M | 15 |
| FR-ALC-007 | Showback and chargeback reports per hierarchy node. | M | 15, 29 |

### 5.13 Budgets, forecasting, anomalies, alerts (BUD)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-BUD-001 | Budgets on any scope (hierarchy node, dimension filter) with monthly, quarterly or annual periods aligned to the accounting calendar. | M | 17 |
| FR-BUD-002 | Threshold alerts on actual and forecasted spend. | M | 17 |
| FR-BUD-003 | Forecasting with prediction intervals. Model selection documented and back-tested. | M | 17 |
| FR-BUD-004 | Anomaly detection with explainability (top contributing dimensions), feedback (true/false positive) and suppression. | M | 17 |
| FR-BUD-005 | Alert channels: email, Slack, Microsoft Teams, generic webhooks (HMAC signed). | M | 17, 32 |
| FR-BUD-006 | Delivery retries, dead-letter queue, delivery log, de-duplication and digest mode. | M | 32 |

### 5.14 Finance (FIN)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-FIN-001 | Multi-currency: preserve billing currency, convert to the tenant reporting currency using versioned FX rate sources (rate date and policy recorded). | M | 18 |
| FR-FIN-002 | Commitment tracking (RIs, Savings Plans, CUDs, Azure reservations and savings plans): inventory, utilization, coverage, amortization. | M | 18 |
| FR-FIN-003 | Unit economics: custom business metrics (e.g. orders, MAU) uploaded or API-pushed. Cost per unit. | S | 18 |
| FR-FIN-004 | Invoice import (PDF metadata plus structured line data where available) and reconciliation with variance categorization. | M | 10, 29 |
| FR-FIN-005 | Period close: lock, immutable snapshot, report manifest with content hashes, post-close adjustments recorded in the next open period. | M | 30 |
| FR-FIN-006 | Exports: CSV, XLSX, JSON, Parquet, PDF. Ledger-friendly journal export with configurable GL mapping. | M | 29 |
| FR-FIN-007 | Scheduled reports with delivery and an immutable archive. | M | 30 |
| FR-FIN-008 | Accounting calendars: calendar months, 4-4-5, 4-5-4, 5-4-4, custom fiscal year start. | S | 18 |

### 5.15 Inventory and telemetry (RES, TEL)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-RES-001 | Unified resource inventory across the three clouds with provider-native IDs, type, region, tags, relationships, lifecycle state and first and last seen. | M | 19 |
| FR-RES-002 | Join inventory to cost by resource ID (with a documented match rate). | M | 19 |
| FR-RES-003 | Inventory change history (snapshots or SCD2). | S | 19 |
| FR-TEL-001 | Collect utilization metrics (CPU, memory where available, network, disk IOPS and throughput, requests) at configurable granularity. | M | 20 |
| FR-TEL-002 | Track metric coverage. Missing or partial data lowers recommendation confidence and is surfaced explicitly. | M | 20 |
| FR-TEL-003 | Kubernetes cost and utilization (requests, limits, usage) via an optional in-cluster agent or Prometheus integration (OpenCost-compatible input). | S | 20, 22 |

### 5.16 Recommendations (REC)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-REC-001 | Recommendation SDK: rule plugins declare inputs, evaluation and evidence output, with deterministic results for identical inputs. | M | 21 |
| FR-REC-002 | Each recommendation has evidence, confidence (with factors), risk level, projected monthly savings (gross and net), effort, implementation steps, rollback guidance and the data freshness of the inputs. | M | 21 |
| FR-REC-003 | Categories: idle, stale or orphaned resources, compute rightsizing, Kubernetes requests and autoscaling, serverless, storage and snapshots, databases, network, egress, NAT and load balancers, logging and retention, backups, commitments, regions and ARM, licensing, tagging and governance. | M | 22–25 |
| FR-REC-004 | Savings overlap resolution: recommendations on the same resource or commitment pool are combined without double counting (documented algorithm). | M | 25 |
| FR-REC-005 | Ingest provider-native recommendations (Compute Optimizer, Trusted Advisor, Recommender, Advisor) with provenance and dedup against native rules. | M | 21 |
| FR-REC-006 | Lifecycle: open → acknowledged → in-review → approved/rejected → implemented → verified, with snooze, dismiss, expire and superseded (replaced by a newer evaluation). | M | 26 |
| FR-REC-007 | Realized savings measurement against a baseline after implementation, with a confidence statement. | M | 26 |
| FR-REC-008 | No automatic remediation. Optional ticket creation (Jira, ServiceNow, GitHub Issues) and IaC snippets. | M | 26, 32 |

### 5.17 AI assistant (AI)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-AI-001 | Model-agnostic LLM gateway: OpenAI-compatible, Anthropic and Ollama-compatible endpoints. Configurable per tenant, disabled by default. | M | 27 |
| FR-AI-002 | The assistant only accesses data through authorized tools that call the same API authorization as the user. It never gets direct DB credentials. | M | 27 |
| FR-AI-003 | Governed NL-to-query: the LLM produces a semantic query (JSON) validated against the schema and compiled by the semantic layer. Raw SQL from the model is never executed. | M | 27 |
| FR-AI-004 | Query limits: row limit, time-range limit, cost and timeout budget, per-user rate limits and token budgets. | M | 27 |
| FR-AI-005 | Answers include citations (query IDs, data freshness, filters applied) and state uncertainty. | M | 28 |
| FR-AI-006 | Prompt-injection resistance: untrusted data (tags, names, descriptions) is delimited and never treated as instructions. Tool allow-lists. Output validation. | M | 27 |
| FR-AI-007 | AI cannot perform mutations. Report creation is the only write, and it goes through the normal API with user confirmation. | M | 28 |
| FR-AI-008 | Conversation retention controls and redaction. Tenant opt-out of sending data to external model providers. | M | 27 |

### 5.18 Audit (AUD)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-AUD-001 | Append-only, tamper-evident (hash-chained) audit log of security-relevant and financial actions. | M | 04 |
| FR-AUD-002 | Audit log search and export for auditors. | M | 30 |
| FR-AUD-003 | Optional streaming of audit events to a SIEM (webhook, syslog, OTLP logs). | S | 31 |

### 5.19 Notifications and integrations (NTF)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-NTF-001 | Integrations: Slack, Teams, email (SMTP), webhooks, Jira, ServiceNow, GitHub Issues. | S | 32 |
| FR-NTF-002 | Approval workflows can be answered from Slack or Teams with signed callbacks. | C | 32 |

### 5.20 Operations (OPS)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-OPS-001 | Deployment profiles Lite (Docker Compose), Standard (Helm) and HA Enterprise (Helm + external managed DBs). | M | 03, 33 |
| FR-OPS-002 | OpenTelemetry traces, metrics and logs. Prometheus endpoints. Grafana dashboards. | M | 03, 33 |
| FR-OPS-003 | Backup and restore for PostgreSQL, the analytics store and object storage, with documented RPO/RTO and automated restore verification. | M | 33 |
| FR-OPS-004 | Zero-downtime upgrades for Standard and HA with forward-compatible (expand/contract) migrations. | M | 33, 38 |

### 5.21 SDK and community (SDK)
| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-SDK-001 | Provider SDK with interfaces, capability manifest, scaffold and compatibility suite. | M | 35 |
| FR-SDK-002 | Recommendation, pricing and dashboard-widget SDKs with compatibility tests. | M | 36 |
| FR-SDK-003 | Plugin execution model with version compatibility checks (see ADR-0012). | M | 35 |
| FR-SDK-004 | Contributor documentation, samples and governance. | M | 37 |

## 6. Non-functional requirements

| ID | Category | Requirement | Verification |
|---|---|---|---|
| NFR-SEC-001 | Security | No cross-tenant data access through any API, query, export, AI or cache path. | Automated cross-tenant attack suite (Phase 04, 05, 13, 27, 34) |
| NFR-SEC-002 | Security | OWASP ASVS 4.0 Level 2 for the web app and API. Level 3 controls for authn, session and audit. | ASVS checklist + pen test (Phase 34) |
| NFR-SEC-003 | Security | Secrets never stored in plaintext. Envelope encryption with a KMS-backed KEK, or secret references to external stores. | Secret-scan + DB inspection test |
| NFR-SEC-004 | Security | TLS 1.2+ (1.3 preferred) in transit. AES-256 at rest (storage-provider or app-level for secrets). | Config tests |
| NFR-SEC-005 | Supply chain | SBOM (SPDX/CycloneDX), Cosign-signed images, SLSA provenance level 3 target, pinned dependencies. | Release pipeline (Phase 38) |
| NFR-ACC-001 | Accuracy | Normalized totals equal provider source totals exactly (decimal) per billing period, account and currency, before FX. | Golden datasets |
| NFR-ACC-002 | Accuracy | Invoice reconciliation variance ≤ the configured tolerance (default 0.01 in invoice currency per invoice line group), with all variances categorized. | Golden invoices |
| NFR-ACC-003 | Accuracy | All monetary arithmetic uses fixed-point decimals (no binary floating point). | Static check + tests |
| NFR-PERF-001 | Performance | Dashboard query p95 ≤ 2 s for 13 months of data at the Standard reference scale (see §8) on ClickHouse. ≤ 5 s on PostgreSQL at Lite scale. | k6 + query benchmarks (Phase 34) |
| NFR-PERF-002 | Performance | API p95 ≤ 300 ms for metadata endpoints. | k6 |
| NFR-PERF-003 | Ingestion | ≥ 50 M cost rows/hour per worker on the ClickHouse profile (reference hardware TBD in Phase 01). | Benchmark |
| NFR-SCL-001 | Scalability | Horizontal scaling of API and worker pools. Analytics scales via engine choice. | Load tests |
| NFR-AVL-001 | Availability | HA profile: 99.9% monthly API availability target. RPO ≤ 15 min, RTO ≤ 1 h (control plane). | Chaos + restore drills (Phase 33) |
| NFR-FRS-001 | Freshness | New provider data processed within 1 h of availability in the source export (excluding provider latency). | Ingestion health SLO |
| NFR-OBS-001 | Observability | Every request and job carries a trace ID and tenant ID (tenant ID never in metric label cardinality without bounds). | Tests |
| NFR-A11Y-001 | Accessibility | WCAG 2.2 AA for the web UI. | axe-core in Playwright |
| NFR-I18N-001 | i18n | UI strings externalized. Locale-aware number, currency and date formatting. English at v1.0. | Lint rule |
| NFR-PRIV-001 | Privacy | PII minimization (user emails, names only). GDPR-supporting data export and deletion. Data residency through self-hosting or region-pinned SaaS. | DPIA in Phase 01 |
| NFR-MNT-001 | Maintainability | ≥ 85% meaningful unit coverage on core business logic packages. Lint and static analysis clean. | CI gates |
| NFR-CMP-001 | Compatibility | Public API and SDK follow SemVer. Deprecations announced ≥ 2 minor releases ahead. | Compatibility policy |
| NFR-PORT-001 | Portability | Runs on linux/amd64 and linux/arm64. No hard dependency on any single cloud. | CI matrix |
| NFR-LIC-001 | Licensing | Every dependency and container layer complies with the [third-party license policy](../legal/LICENSE_COMPLIANCE.md). Denied or unknown licenses fail CI. | License CI (Phase 03), release gate (Phase 38) |
| NFR-LIC-002 | Licensing | Every source file carries the SPDX header specified in the [license map](../legal/LICENSE_MAP.md). `THIRD_PARTY_NOTICES` and the SBOM with license data ship with each release. | `reuse lint`, release pipeline |
| NFR-LIC-003 | Licensing | Every merged contribution is covered by a signed CLA (individual or corporate). | CLA check on PRs |
| NFR-LIC-004 | Licensing | The product contains no license keys, feature gating, usage limits or phone-home license enforcement. Internal use is unrestricted. | Code review + test asserting no license-check code paths |

## 7. Acceptance criteria (product-level)

Product-level acceptance criteria. Phase-level criteria live in each `docs/phases/phase-XX/ACCEPTANCE.md`.

- **AC-01 (Accuracy):** For each provider's golden dataset, normalized totals by billing period × account × charge category × currency equal the source totals exactly. Invoice reconciliation produces zero uncategorized variances.
- **AC-02 (Isolation):** The cross-tenant attack suite (API, analytics, exports, AI, caches, object storage paths) produces zero leaks across every role.
- **AC-03 (Authorization):** For every (role × permission × resource scope), positive and negative tests exist and pass.
- **AC-04 (Engine parity):** The analytics contract suite passes on PostgreSQL, DuckDB and ClickHouse with identical decimal results.
- **AC-05 (Recommendations):** Every recommendation rule has deterministic fixtures. Overlap tests prove the sum of net savings is ≤ the achievable savings for every resource and commitment pool.
- **AC-06 (AI safety):** The prompt-injection corpus and unauthorized-scope tests pass. No raw model SQL is executed.
- **AC-07 (Operations):** Clean installs of Lite, Standard and HA succeed from docs. The backup/restore drill meets RPO/RTO.
- **AC-08 (Extensibility):** An example external provider and an example recommendation plugin pass their compatibility suites with no core changes.
- **AC-09 (Journeys):** UJ-01 … UJ-13 pass as Playwright E2E tests against fixture-backed connectors.
- **AC-10 (Release integrity):** Signed artifacts, SBOM, and no open critical or high security findings or billing inaccuracies.
- **AC-11 (License compliance):** License CI is green, notices are generated, CLA coverage is 100%, and counsel has approved the license documents before public release.

## 8. Reference scale (sizing assumptions, to be confirmed in Phase 01)

| Profile | Tenants | Cloud accounts | Cost rows / month | Resources | Users | Analytics engine |
|---|---|---|---|---|---|---|
| Lite | 1–5 | ≤ 50 | ≤ 5 M | ≤ 50 k | ≤ 50 | PostgreSQL or DuckDB |
| Standard | ≤ 100 | ≤ 2 000 | ≤ 300 M | ≤ 2 M | ≤ 2 000 | ClickHouse (single shard) or PostgreSQL |
| HA Enterprise | ≤ 1 000 | ≤ 50 000 | ≥ 3 B | ≥ 20 M | ≥ 20 000 | ClickHouse cluster |

## 9. Release scope summary

See [`docs/planning/RELEASE_PLAN.md`](../planning/RELEASE_PLAN.md). Checkpoints: v0.1 (phases 1–5), v0.2 (6–14), v0.3 (15–18), v0.5 (19–26), v0.7 (27–30), v0.9 (31–37), v1.0 (38–40).

## 10. Assumptions and constraints
- A1: Provider data availability depends on contract type, entitlement and scope (e.g. Azure EA vs. MCA, AWS invoice APIs, Trusted Advisor support tiers). CloudLedger detects capabilities rather than assuming them.
- A2: Billing data is eventually consistent. Providers restate prior periods. The current month is always "provisional" until the provider finalizes and, if enabled, the period is closed.
- A3: Customers own and configure their export destinations (S3 bucket, BigQuery dataset, storage account). CloudLedger reads from them.
- A4: SaaS operation is optional. All features must work self-hosted with no phone-home. Telemetry is opt-in.
- A5: CloudLedger performs no currency trading-grade FX. Rates come from configured sources (provider rates, ECB reference rates, or a custom table).
- A6: Licensing is source-available (see [`docs/legal/`](../legal/README.md)). The license affects permitted *use and distribution* only; it does not change features, architecture or roadmap scope. SaaS and MSP capabilities remain in the architecture. Offering them to third parties requires a commercial license.

## 11. Success metrics (post-launch)
- Time-to-first-dashboard ≤ 30 minutes (Lite, single account, with existing export).
- ≥ 95% of cost allocated (non-"unallocated") for tenants with a defined tagging policy within 60 days.
- Recommendation acceptance rate and realized-to-projected savings ratio tracked per category.
- Reconciliation: ≥ 99% of invoice line groups auto-matched.

## 12. Open questions
Tracked with proposed defaults in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md). Phase 01 exit requires every *blocking* question to be resolved or accepted as a default.
