# CloudLedger — Source-Available Multi-Cloud FinOps Platform

> Working project name. Verify trademark and repository availability before publication.
>
> **Status:** pre-alpha, planning stage. No application code has been written yet. See [`docs/`](docs/README.md) for the architecture, PRD and the 40-phase plan.
>
> **License:** CloudLedger is **source-available**, not OSI open source. It is **free for internal use**, including production use by individuals, startups and enterprises managing their own cloud costs, with no user, account or resource limits. **Commercial redistribution, resale, white-labeling, embedding, and hosting or managed services for third parties require a separate commercial license.** The proposed license is a draft pending legal review. See [Licensing](#licensing).

## Vision
Build a source-available (free for internal use; commercial license required for redistribution and third-party hosting), self-hostable, optionally SaaS-operated, multi-tenant FinOps platform for AWS, Google Cloud, and Azure. Support individual and organization-wide billing scopes, configurable dashboards, cost allocation by tags/labels, full-fidelity billing ingestion, resource inventory, actionable savings recommendations, finance-grade reconciliation and exports, secure AI-assisted analytics, and community-contributed providers.

## Non-negotiable principles
1. Tenant isolation and least privilege from day one; cloud integrations read-only by default.
2. Accurate and auditable financial data: source lineage, immutable snapshots, adjustments, deduplication, reconciliation, and currency provenance.
3. Configuration-driven dashboards and allocation rules per tenant; no company-specific hardcoding.
4. FOCUS-aligned normalized cost model with provider-specific extensions and original raw data preserved.
5. Pluggable analytics: PostgreSQL for control-plane; PostgreSQL, DuckDB, or ClickHouse for cost queries depending on scale.
6. Provider and recommendation SDKs, capability manifests, contract tests, and contributor documentation.
7. Every phase ships requirements, design, code, tests, documentation, and verified acceptance criteria.
8. AI cannot bypass authorization or perform mutations without a separate approved workflow.
9. Internal use stays free and unrestricted: no license keys, feature gating or artificial user/account/resource limits.

## Users and roles
Individual users, startups, enterprises, MSPs, engineering, finance, auditors. Roles: platform admin, tenant owner, FinOps admin, finance manager, engineering manager, developer, auditor, and custom scoped roles. Support OIDC/SAML through identity integration, optional SCIM, and tenant/resource-level ABAC in addition to RBAC.

## Integrations
| Provider | Billing and finance | Inventory, metrics, optimization | Scopes |
|---|---|---|---|
| AWS | CUR 2.0/Data Exports, S3, Athena, Cost Explorer, invoices | Organizations, Resource Explorer/Config, CloudWatch, Compute Optimizer, Trusted Advisor (where entitled) | standalone, payer/management, linked accounts |
| GCP | Cloud Billing BigQuery export, billing APIs, GCS, invoice data | Cloud Asset Inventory, Cloud Monitoring, Recommender | organizations, folders, billing accounts, projects |
| Azure | Cost Management exports/query, Cost Details, Blob, invoices | Resource Graph, Monitor, Advisor, Retail Prices | billing accounts/profiles, invoice sections, management groups, subscriptions, resource groups |
| Generic | CSV, XLSX, JSON, Parquet, object-store and query-engine adapters | SDK-defined capabilities | user-defined |

Use per-connector capability discovery, granular permission checks, retry/backoff, incremental sync, backfill, checkpointing, source lineage, deduplication, schema versioning, and ingestion health. Provider permissions and invoice availability vary by account agreement and scope: document limitations, do not assume universal access.

## Major modules
- Tenant onboarding, cloud account connection, credential verification and integration status.
- Global/provider/account/project/resource dashboards; saved filters, widgets, templates, custom dimensions and role-based views.
- Cost allocation by tags/labels, inheritance, custom business mappings, shared cost distribution, showback and chargeback.
- Actual, billed, effective, amortized, list costs; discounts, taxes, credits, refunds, marketplace, commitments; FX and accounting calendars.
- Budgets, anomaly detection, forecasts, alerts, Slack/Teams/email/webhooks.
- Resource inventory and utilization telemetry.
- Recommendation engine: idle/stale/orphaned resources, compute rightsizing, K8s requests/autoscaling, storage/snapshots, databases, serverless, networking/egress/NAT/load balancers, logging/retention, backups, commitments, regional/ARM alternatives, licensing, tagging and governance.
- Recommendation evidence, confidence, impact, estimated savings (net of commitments and overlap), implementation and rollback guidance, approvals and measured realized savings.
- AI assistant: model-agnostic gateway (OpenAI/Anthropic/Ollama-compatible), tenant-scoped tool calls, governed read-only SQL, source citations, freshness, query limits and report creation.
- Finance: invoice reconciliation, period close, immutable report manifests, audit logs, CSV/XLSX/JSON/Parquet/PDF exports and scheduled reports.
- Provider, recommendation, pricing and dashboard plugin SDKs.

## Technical architecture
- Web: Next.js, TypeScript, Tailwind, shadcn/ui, Apache ECharts.
- API and ingestion workers: Go modular monolith with separately scalable jobs; REST/OpenAPI.
- Control plane: PostgreSQL.
- Analytics adapters: PostgreSQL (small), DuckDB (embedded/single-node), ClickHouse (large scale). All must pass shared query contracts.
- Object storage: S3/GCS/Azure Blob/MinIO; raw source files retained under configurable policies.
- Job processing: pluggable queue/scheduler, with Temporal optional if justified by deployment profile.
- Security: OIDC/SAML, RBAC+ABAC, encryption, secret references, immutable audit trail, no stored static cloud credentials when federation is available.
- Deployment: Docker Compose, Helm, Terraform/Bicep samples; Lite, Standard, HA Enterprise profiles.
- Observability: OpenTelemetry, Prometheus/Grafana.
- CI: GitHub Actions, Go/Vitest/Playwright, Testcontainers, k6, CodeQL/Semgrep/Trivy/Gitleaks, SBOM, Cosign, license compliance (dependency license scan, SPDX headers, CLA check, third-party notices).

## Proposed repository
```text
cloudledger/
├── README.md LICENSE.md COMMERCIAL_LICENSE.md LICENSE_FAQ.md CLA.md TRADEMARK_POLICY.md
├── CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md GOVERNANCE.md CHANGELOG.md ROADMAP.md
├── .github/workflows/ .github/ISSUE_TEMPLATE/
├── apps/web/ apps/api/ apps/worker/
├── internal/{identity,tenants,billing,allocation,inventory,recommendations,forecasting,finance,alerts,audit,ai}/
├── providers/{aws,gcp,azure,examples}/
├── sdk/{provider,recommendation,pricing,dashboard}/
├── database/{postgres,clickhouse,duckdb}/
├── schemas/{focus,events}/
├── api/openapi/
├── deploy/{docker,helm,terraform,bicep}/
├── tests/{unit,integration,contracts,e2e,security,performance,fixtures}/
├── compliance/            # license allow/deny lists, exceptions
├── docs/{architecture,product,providers,finance,security,operations,contributors,legal,planning,phases}/
└── scripts/
```

## Forty-phase implementation roadmap
| Phase | Deliverable | Primary verification |
|---|---|---|
| 01 | PRD, personas, acceptance criteria | Requirements review |
| 02 | Architecture, ADRs, extension contracts | Design review |
| 03 | Monorepo, local dev, CI, standards | Fresh checkout builds |
| 04 | Tenancy schema, migrations, audit foundation | Isolation/migration tests |
| 05 | SSO, RBAC, ABAC foundations | Authorization matrix |
| 06 | AWS standalone/Organizations, CUR/S3/Athena | AWS connector fixtures |
| 07 | GCP billing/projects/BigQuery/GCS | GCP connector fixtures |
| 08 | Azure billing/subscriptions/exports | Azure connector fixtures |
| 09 | CSV/JSON/Parquet/XLSX imports | Malformed/valid file tests |
| 10 | Invoice import and reconciliation | Golden invoice fixtures |
| 11 | FOCUS normalization, allocation dimensions | Golden totals and mapping |
| 12 | Backfill, incremental sync, ingestion health | Retry/idempotency tests |
| 13 | PostgreSQL/DuckDB/ClickHouse analytics adapters | Cross-engine contract suite |
| 14 | Global and provider dashboards | UI/E2E + totals |
| 15 | Tag allocation, shared-cost distribution | Allocation invariants |
| 16 | Dashboard builder and saved views | Permissioned UI tests |
| 17 | Budgets, forecasting, anomalies, alerts | Deterministic time series |
| 18 | FX, commitments, unit economics | Accounting test cases |
| 19 | Resource inventory for all three clouds | Provider inventory contracts |
| 20 | Utilization and telemetry collectors | Missing-data scenarios |
| 21 | Recommendation SDK, rules and evidence | Rule contract tests |
| 22 | Compute/Kubernetes/serverless optimization | Synthetic workload fixtures |
| 23 | Storage/backup/database optimization | Safety/impact checks |
| 24 | Network/egress/load balancer optimization | Pricing and topology tests |
| 25 | Commitments, regions, architecture optimization | Non-overlap savings tests |
| 26 | Review/approval, recommendation lifecycle | Workflow/E2E tests |
| 27 | LLM gateway and governed NL-to-query | Prompt injection/RBAC tests |
| 28 | Conversational analytics and reports | Citation and correctness tests |
| 29 | Finance exports and reconciliation | Export-to-ledger validation |
| 30 | Scheduled reports, period close, audit evidence | Snapshot immutability tests |
| 31 | Enterprise SSO/SCIM/custom policies | Provisioning/access tests |
| 32 | Advanced alerts and approval integrations | Delivery/retry tests |
| 33 | HA, backups, DR and observability | Restore/chaos tests |
| 34 | Scale, security and penetration testing | Defined SLO gates |
| 35 | External provider connector SDK | Example provider compiles |
| 36 | Recommendation/pricing/dashboard SDKs | Plugin compatibility tests |
| 37 | Contributor docs, samples, governance | External contributor walkthrough |
| 38 | Regression and release certification | Complete release test suite |
| 39 | Public docs, migration and reference deployments | Clean install verification |
| 40 | Stable v1.0, support and maintenance policies | Signed release checklist |

### Release checkpoints
v0.1 phases 1–5; v0.2 phases 6–14; v0.3 phases 15–18; v0.5 phases 19–26; v0.7 phases 27–30; v0.9 phases 31–37; v1.0 phases 38–40. These are scope checkpoints, not calendar promises.

## Testing and definition of done
Every phase must contain `docs/phases/phase-XX/{README,REQUIREMENTS,DESIGN,IMPLEMENTATION,API_CONTRACTS,TEST_PLAN,TEST_RESULTS,ACCEPTANCE}.md`. All critical calculations need deterministic golden datasets and reconciliation; all connectors need provider contract tests; all roles need positive/negative authorization tests; all analytical adapters need query parity tests; every critical user journey needs Playwright E2E. Include failure injection, throttling, partial data, delayed billing corrections, migrations, backup restore, cross-tenant attacks, prompt injection, and load tests. Target meaningful >=85% unit coverage for core business logic, but never substitute coverage for correctness. Block releases on unresolved billing inaccuracies or critical security findings.

## Decisions and open questions
Default: source-available license (proposed CL-SAL-1.0, pending legal review; see `docs/legal/`), self-hosted + optional SaaS, Go + Next.js, PostgreSQL control plane, pluggable analytics, read-only integrations, multi-LLM AI. Confirm name, initial deployment constraints, provider permission templates, FOCUS version, ingestion latency/SLOs, invoice jurisdictions, retention requirements, and release acceptance thresholds in Phase 1.

## Licensing

> The licensing documents are **proposed drafts that must be reviewed by qualified legal counsel before publication**. Until a counsel-approved license is published, all rights are reserved.

CloudLedger is **source-available**. It is not described or distributed as OSI-approved open-source software.

| Free (no commercial license needed) | Requires a commercial license |
|---|---|
| Download, inspect, build and test | Reselling CloudLedger |
| Self-host and use in production for **your own and your affiliates'** cloud costs, with no user, account or resource limits | Hosting CloudLedger as a SaaS or managed service for third parties (paid **or** free) |
| Modify for your internal requirements | White-labeling or rebranding for distribution |
| Contractors operating it on your behalf, for your internal use | Embedding it in a commercially distributed product |
| Contributing fixes, features, connectors and plugins (under the CLA) | Selling derivative products substantially based on CloudLedger source |
| Sharing reports and exports produced by CloudLedger | Commercial redistribution, sublicensing, or providing CloudLedger functionality to external customers |

The license does not restrict independent implementations that do not use CloudLedger's source code.

- [LICENSE.md](LICENSE.md): proposed CloudLedger Source-Available License 1.0 (draft)
- [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md): commercial licensing for SaaS providers, MSPs, OEMs, resellers and white-label partners
- [LICENSE_FAQ.md](LICENSE_FAQ.md): internal use vs. commercial redistribution and third-party services
- [CLA.md](CLA.md) and [CONTRIBUTING.md](CONTRIBUTING.md): contributor IP terms
- [TRADEMARK_POLICY.md](TRADEMARK_POLICY.md): name and logo use
- [docs/legal/](docs/legal/README.md): licensing evaluation (BUSL 1.1 vs. custom), license map, plugin licensing rules, compliance CI
