#!/usr/bin/env python3
"""Creates placeholder READMEs for planned modules. Each one states the module is NOT implemented yet. Safe to re-run: existing files are never overwritten."""
import os, sys
root = sys.argv[1]
M = {
 "apps/web": ("Next.js web UI and BFF (ADR-0002)", "03 (scaffold), 05 (auth), 14, 16, 28", "docs/architecture/SYSTEM_CONTEXT.md"),
 "apps/api": ("Entry point for the `cloudledger` Go binary (`api`, `migrate`, `admin` run modes)", "03", "docs/architecture/SYSTEM_CONTEXT.md"),
 "apps/worker": ("Worker and scheduler run modes of the same binary (job pools per queue)", "03, 06, 12", "docs/architecture/INGESTION_PIPELINE.md"),
 "internal/platform": ("Cross-cutting: config, observability, DB/tx with RLS session, jobs/outbox, object storage, secrets/crypto, time utilities", "03, 04", "docs/architecture/SYSTEM_CONTEXT.md"),
 "internal/identity": ("Authentication: OIDC/SAML, sessions, API tokens, SCIM", "05, 31", "docs/security/SECURITY_ARCHITECTURE.md"),
 "internal/authz": ("RBAC+ABAC authorization (Cedar) and predicate compilation (ADR-0008)", "05, 31", "docs/security/AUTHORIZATION_MODEL.md"),
 "internal/tenants": ("Tenants, settings, hierarchy, lifecycle", "04", "docs/architecture/TENANCY.md"),
 "internal/connectors": ("Connector registry, manifests, credential verification, scope discovery", "06–08, 35", "docs/contracts/PROVIDER_SDK.md"),
 "internal/billing": ("Ingestion runs, raw storage, parsing, FOCUS normalization, restatements", "06–12", "docs/architecture/INGESTION_PIPELINE.md"),
 "internal/analytics": ("Semantic layer and PG/DuckDB/ClickHouse adapters (ADR-0004)", "13", "docs/architecture/ANALYTICS_ADAPTERS.md"),
 "internal/allocation": ("Tag rules, mappings, shared-cost distribution", "15", "docs/architecture/ALLOCATION_ENGINE.md"),
 "internal/dashboards": ("Dashboards, widgets, saved views, templates", "14, 16", "docs/phases/phase-16/README.md"),
 "internal/inventory": ("Resource inventory and telemetry", "19, 20", "docs/architecture/RESOURCE_INVENTORY.md"),
 "internal/recommendations": ("Rule engine, overlap resolution, lifecycle, realized savings", "21–26", "docs/architecture/RECOMMENDATION_ENGINE.md"),
 "internal/forecasting": ("Budgets, forecasts, anomaly detection", "17", "docs/architecture/FORECASTING_ANOMALIES.md"),
 "internal/finance": ("FX, commitments, invoices, reconciliation, period close, exports", "10, 18, 29, 30", "docs/architecture/FINANCE_RECONCILIATION.md"),
 "internal/alerts": ("Channels, delivery, approvals, ticketing integrations", "17, 32", "docs/phases/phase-32/README.md"),
 "internal/audit": ("Hash-chained audit log (ADR-0014)", "04, 30", "docs/architecture/DATABASE_SCHEMA.md"),
 "internal/ai": ("LLM gateway, tools, guardrails (ADR-0013)", "27, 28", "docs/architecture/LLM_SECURITY.md"),
 "providers/aws": ("First-party AWS provider", "06, 19–21", "docs/providers/AWS.md"),
 "providers/gcp": ("First-party GCP provider", "07, 19–21", "docs/providers/GCP.md"),
 "providers/azure": ("First-party Azure provider", "08, 19–21", "docs/providers/AZURE.md"),
 "providers/generic": ("Generic file-import provider (CSV/JSON/XLSX/Parquet)", "09", "docs/providers/GENERIC_IMPORTS.md"),
 "providers/examples": ("Example out-of-tree-style provider used by the SDK compatibility suite", "35", "docs/contracts/PROVIDER_SDK.md"),
 "sdk/provider": ("Provider SDK interfaces, gRPC IDL, testkit", "35", "docs/contracts/PROVIDER_SDK.md"),
 "sdk/recommendation": ("Recommendation rule SDK and testkit", "21, 36", "docs/contracts/RECOMMENDATION_SDK.md"),
 "sdk/pricing": ("Pricing source SDK", "36", "docs/contracts/CAPABILITY_MANIFEST.md"),
 "sdk/dashboard": ("Dashboard widget SDK (signed bundles, CSP)", "36", "docs/contracts/CAPABILITY_MANIFEST.md"),
 "database/postgres": ("Control-plane migrations (and the PG analytics adapter schema)", "04+", "docs/architecture/DATABASE_SCHEMA.md"),
 "database/clickhouse": ("ClickHouse analytics DDL and migrations", "13", "docs/architecture/ANALYTICS_ADAPTERS.md"),
 "database/duckdb": ("DuckDB analytics DDL", "13", "docs/architecture/ANALYTICS_ADAPTERS.md"),
 "deploy/docker": ("Docker Compose (Lite profile)", "03, 33, 39", "docs/architecture/DEPLOYMENT_PROFILES.md"),
 "deploy/helm": ("Helm chart (Standard/HA)", "33, 39", "docs/architecture/DEPLOYMENT_PROFILES.md"),
 "deploy/terraform": ("Terraform samples: cloud onboarding roles and reference deployments", "06–08, 39", "docs/providers/README.md"),
 "deploy/bicep": ("Azure Bicep samples", "08, 39", "docs/providers/AZURE.md"),
 "tests/unit": ("Cross-package unit test helpers (most unit tests live next to code)", "03+", "docs/contributors/TESTING_STRATEGY.md"),
 "tests/integration": ("Testcontainers-based integration tests", "03+", "docs/contributors/TESTING_STRATEGY.md"),
 "tests/contracts": ("Analytics parity, provider, recommendation, OpenAPI and event contract suites", "13, 21, 35", "docs/contributors/TESTING_STRATEGY.md"),
 "tests/e2e": ("Playwright journeys UJ-01…UJ-13", "14+", "docs/contributors/TESTING_STRATEGY.md"),
 "tests/security": ("Cross-tenant attack suite, authz matrix, prompt-injection corpus, fuzzing", "04, 05, 27, 34", "docs/security/THREAT_MODEL.md"),
 "tests/performance": ("k6 and ingestion/query benchmarks", "34", "docs/operations/SLOS.md"),
 "tests/fixtures": ("Synthetic golden datasets (never real customer data)", "06+", "docs/contributors/TESTING_STRATEGY.md"),
 "compliance": ("License allow/deny lists and exception records used by license CI", "03", "docs/legal/LICENSE_COMPLIANCE.md"),
}
n=0
for path,(purpose,phases,doc) in M.items():
    d=os.path.join(root,path); os.makedirs(d,exist_ok=True)
    f=os.path.join(d,"README.md")
    if os.path.exists(f): continue
    depth=path.count("/")+1
    rel="../"*depth
    open(f,"w").write(f"# `{path}`\n\n**Status: NOT IMPLEMENTED.** This directory is a placeholder from the planning stage. It contains no code yet.\n\n- **Purpose:** {purpose}\n- **Delivered in phase(s):** {phases}\n- **Design:** [{doc}]({rel}{doc})\n- **License:** see [docs/legal/LICENSE_MAP.md]({rel}docs/legal/LICENSE_MAP.md)\n")
    n+=1
print(n,"READMEs created")
