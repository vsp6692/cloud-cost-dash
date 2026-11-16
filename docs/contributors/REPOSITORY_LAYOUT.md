# Repository Layout

Status: **DRAFT plan**. Today the repository contains only top-level policy documents, `docs/` and `scripts/docs/`. The tree below is the **planned** monorepo, created in Phase 03 and populated phase by phase. It follows the README "Proposed repository" tree, plus the additions from [SYSTEM_CONTEXT.md](../architecture/SYSTEM_CONTEXT.md) and ADR-0001 (`internal/{platform,authz,connectors,analytics,dashboards}`), `compliance/`, `docs/legal`, `docs/planning`, `schemas/manifest` and `schemas/semantic`.

The license that applies to each path is defined only in [LICENSE_MAP.md](../legal/LICENSE_MAP.md) (pending legal review); this document does not restate it.

## 1. Tree

```text
cloudledger/
├── README.md LICENSE.md COMMERCIAL_LICENSE.md LICENSE_FAQ.md CLA.md TRADEMARK_POLICY.md
├── CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md GOVERNANCE.md CHANGELOG.md ROADMAP.md
├── CLAUDE_MASTER_PROMPT.md
├── NOTICE                       # Licensor copyright and required attributions (planned)
├── Makefile go.mod go.sum package.json pnpm-workspace.yaml REUSE.toml
├── .github/
│   ├── workflows/               # CI stages (TESTING_STRATEGY.md §6)
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS               # approvals per GOVERNANCE.md
├── apps/
│   ├── api/                     # main package of the `cloudledger` binary + api/migrate/admin run-mode wiring
│   ├── worker/                  # worker and scheduler run-mode wiring (job registry, queue pools)
│   └── web/                     # Next.js app: UI + BFF
├── internal/
│   ├── platform/                # config, observability, db/tx + RLS session, jobs/queue + outbox, objectstore, secrets/crypto, money, http kit
│   ├── identity/                # OIDC/SAML/SCIM, sessions, API tokens (authentication only)
│   ├── authz/                   # RBAC + ABAC, Cedar policies, predicate compiler
│   ├── tenants/                 # tenants, hierarchy, settings, lifecycle
│   ├── connectors/              # connector registry, capability manifests, credential verification
│   ├── billing/                 # ingestion runs, raw storage, parsing, FOCUS normalization, invariants
│   ├── analytics/               # semantic layer, query compiler, engine adapters
│   ├── allocation/              # tag rules, mappings, shared costs, showback/chargeback
│   ├── inventory/               # resources, relationships, telemetry
│   ├── recommendations/         # rule engine, evidence, overlap, lifecycle, realized savings
│   ├── forecasting/             # budgets, forecasts, anomalies
│   ├── finance/                 # FX, commitments, invoices, reconciliation, period close, exports
│   ├── alerts/                  # channels, delivery, approvals
│   ├── dashboards/              # dashboards, widgets, templates, saved views
│   ├── audit/                   # hash-chained audit log
│   └── ai/                      # LLM gateway, tools, guardrails
├── providers/
│   ├── aws/ gcp/ azure/         # first-party connectors (compile-time modules)
│   └── examples/                # templates for plugin authors
├── sdk/
│   ├── provider/                # provider SDK interfaces + testkit (compatibility suite)
│   ├── recommendation/          # recommendation SDK + testkit
│   ├── pricing/                 # pricing SDK + testkit
│   └── dashboard/               # dashboard SDK + testkit
├── database/
│   ├── postgres/                # control-plane migrations, analytics-schema migrations, sqlc queries
│   ├── clickhouse/              # ClickHouse migrations
│   └── duckdb/                  # DuckDB migrations
├── schemas/
│   ├── focus/                   # FOCUS column definitions and mapping metadata
│   ├── events/                  # event JSON Schemas (.vN)
│   ├── manifest/                # capability manifest JSON Schemas
│   └── semantic/                # semantic query JSON Schema, metric and dimension registry schema
├── api/
│   └── openapi/                 # OpenAPI 3.1 document (source of truth for REST)
├── deploy/
│   ├── docker/                  # Compose files: Lite profile and local development
│   ├── helm/                    # Helm chart(s) for Standard and HA
│   ├── terraform/               # samples for managed services (AWS, GCP, Azure)
│   ├── bicep/                   # Azure samples
│   └── observability/           # Grafana dashboards, Prometheus rules, Collector config (OBSERVABILITY.md)
├── tests/
│   ├── unit/                    # cross-package unit helpers (most unit tests live next to code)
│   ├── integration/             # Testcontainers suites, failure injection
│   ├── contracts/               # analytics parity, provider, recommendation, OpenAPI, events
│   ├── e2e/                     # Playwright journeys UJ-01…UJ-13 + axe-core
│   ├── security/                # cross-tenant, authz matrix, prompt injection, redaction
│   ├── performance/             # k6 scenarios, query benchmarks
│   └── fixtures/                # golden datasets, synthetic provider exports, fake provider server
├── compliance/                  # allowed/denied license lists, license exceptions (LICENSE_COMPLIANCE.md)
├── docs/
│   ├── architecture/            # architecture docs and ADRs
│   ├── product/                 # PRD, glossary, open questions
│   ├── contracts/               # API guidelines, events, SDK, manifest, compatibility
│   ├── providers/               # per-provider setup, permissions, limitations
│   ├── finance/                 # finance user and auditor documentation
│   ├── security/                # threat model, security architecture
│   ├── operations/              # SLOs, observability, backup/DR, configuration, upgrades, runbooks
│   ├── contributors/            # this guide
│   ├── legal/                   # licensing evaluation, license map, compliance, plugin licensing
│   ├── planning/                # dependency graph, risk register, backlog, release plan, traceability
│   └── phases/                  # phase-01 … phase-40 specifications and results
└── scripts/                     # dev, CI, compliance and docs scripts (e.g. scripts/docs/)
```

## 2. Directory purposes and rules

| Path | Purpose | Key rules | Owners (planned CODEOWNERS) |
|---|---|---|---|
| `apps/api`, `apps/worker` | Composition roots for the single `cloudledger` binary and its run modes (`api`, `worker`, `scheduler`, `migrate`, `admin`; ADR-0001) | wiring only, no business logic | maintainers |
| `apps/web` | Next.js UI and BFF (ADR-0002) | no tokens in the browser; generated API types | maintainers |
| `internal/platform` | Cross-cutting infrastructure | imports no other `internal/*` module | maintainers |
| `internal/<domain>` | Domain modules | public surface in `api.go`; no imports of other modules' internals; tenant context required | per GOVERNANCE.md table |
| `internal/billing`, `finance`, `allocation`; `database/**` | Money-critical code and schemas | golden datasets; decimal only | `finance-correctness` |
| `internal/identity`, `authz`, `ai`; `deploy/**` | Security-critical code and deployment | authz matrix tests | `security` |
| `providers/aws|gcp|azure` | First-party connectors | depend only on `sdk/provider`; pass the provider testkit | provider area owners |
| `providers/examples` | Copyable templates for plugin authors | same license designation as SDK (LICENSE_MAP.md) | maintainers |
| `sdk/*` | Public plugin interfaces and testkits; separate Go modules with independent SemVer | must not import core packages; changes follow COMPATIBILITY.md | maintainers + Licensor review for license boundary |
| `database/*` | Migrations per store | forward-only, expand/contract (CODING_STANDARDS.md §4) | `finance-correctness` |
| `schemas/*` | Machine-readable contracts (FOCUS, events, manifests, semantic queries) | versioned; CI validates examples | maintainers |
| `api/openapi` | REST contract | `oasdiff` breaking-change gate | maintainers |
| `deploy/*` | Packaging for Lite, Standard and HA profiles; observability assets | pinned images by digest; hardened defaults | `security` |
| `tests/*` | Suites that span packages | synthetic data only; see TESTING_STRATEGY.md | maintainers |
| `compliance/` | License policy data used by CI | changes require Licensor designee | Licensor designee |
| `docs/legal` | Licensing documents | changes require Licensor designee | Licensor designee |
| `docs/planning` | Planning artifacts (risk register, traceability, release plan) | updated at phase gates | maintainer council |
| `docs/phases` | Per-phase specs and evidence | `TEST_RESULTS.md` entries `NOT RUN` until executed | phase owners |
| `scripts/` | Automation helpers | no secrets; POSIX shell or Go | maintainers |

## 3. Differences from the README tree

| Addition or change | Reason |
|---|---|
| `internal/platform`, `authz`, `connectors`, `analytics`, `dashboards` | module split in SYSTEM_CONTEXT.md and ADR-0001 (`identity` covers authentication only) |
| `schemas/manifest`, `schemas/semantic` | capability manifest and semantic query schemas need versioned, machine-readable homes |
| `deploy/observability` | ADR-0017: Grafana dashboards and alert rules ship in `deploy/` |
| `NOTICE`, `REUSE.toml`, `.github/CODEOWNERS` | license compliance and governance requirements |
| `apps/api` hosts the binary's `main` | the README lists separate `apps/api` and `apps/worker`, while ADR-0001 specifies one binary with run modes; this layout reconciles both (final decision in Phase 03) |
