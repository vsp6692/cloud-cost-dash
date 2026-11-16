#!/usr/bin/env python3
"""Generates docs/architecture/adr/*.md from the ADR definitions below (one-time scaffolding; ADRs are edited by hand afterwards)."""
import os, sys
root = sys.argv[1]
out = os.path.join(root, "docs/architecture/adr")
ADRS = [
("0001","Go modular monolith with separately scalable run modes",
"We need fast delivery, strong typing, low-ops self-hosting (Lite) and horizontal scale (HA). Microservices add operational burden that Lite users cannot absorb. A single unstructured binary risks tight coupling.",
"Build one Go binary with run modes `api`, `worker`, `scheduler`, `migrate`, `admin`. Domain modules live in `internal/<module>` with an exported `api.go` interface. Cross-module imports of internals are forbidden and enforced by import-lint. Asynchronous coupling goes through the transactional outbox.",
["Microservices from day one: rejected because of operational cost and premature distribution.",
 "Node.js/TypeScript backend: rejected because Go gives better data-processing throughput, static binaries and concurrency for ingestion."],
["Simple Lite deployment (one image).","Worker pools scale independently by queue.","Modules can be extracted later because contracts are interfaces plus events.","Import-lint and architecture tests are required from Phase 03."]),
("0002","Next.js web app as BFF with server-side sessions",
"The UI needs rich dashboards (ECharts), SSR for performance, and secure token handling.",
"`apps/web` uses Next.js (App Router), TypeScript, Tailwind, shadcn/ui and Apache ECharts. The Next.js server acts as a Backend-for-Frontend: it holds the OIDC session in an encrypted, HttpOnly, SameSite=Lax cookie and calls the Go API with a short-lived access token server-side. No tokens are stored in browser JS-accessible storage. The API is still fully usable directly (API tokens) for automation.",
["SPA with tokens in the browser: rejected because of XSS token-theft risk.","Go-rendered templates: rejected because the dashboard builder needs rich interactivity."],
["Two runtimes (Go + Node).","CSRF protection required on BFF mutation routes.","Typed API client generated from OpenAPI."]),
("0003","PostgreSQL control plane with shared-schema multi-tenancy and Row-Level Security",
"Tenants must be strictly isolated while supporting up to ~1000 tenants per deployment. Options are database-per-tenant, schema-per-tenant, or a shared schema.",
"Use a shared schema in which every tenant-owned table has `tenant_id UUID NOT NULL`, composite primary and foreign keys that include `tenant_id`, and PostgreSQL RLS policies `USING (tenant_id = current_setting('app.tenant_id')::uuid)`. The application connects as a non-owner role without `BYPASSRLS`. Each transaction does `SET LOCAL app.tenant_id`. Platform-admin operations use a separate role and are audited.",
["DB-per-tenant: rejected because of migration fan-out and connection overhead.","Schema-per-tenant: rejected because of catalog bloat at 1000 tenants and complex migrations."],
["Defense in depth: app filters + RLS.","Composite keys prevent cross-tenant FK references.","Tests must assert that RLS is enabled on every tenant table (catalog check in CI).","Tenant-level export and deletion require explicit tooling."]),
("0004","Pluggable analytics engines behind a semantic layer with a shared contract suite",
"Data volumes range from thousands to billions of rows. The README requires PostgreSQL, DuckDB and ClickHouse support with consistent semantics.",
"Business logic issues **semantic queries** (metrics, dimensions, filters, grain, cost type, currency) only. `internal/analytics` compiles them per engine through an `Adapter` interface (DDL, bulk load, partition swap, query compile and execute, capabilities). A shared contract test suite runs identical fixtures on all engines and asserts exact decimal equality.",
["ClickHouse only: rejected because it is too heavy for Lite.","An ORM or generic SQL builder: rejected because engine differences (decimals, partitions, arrays) leak."],
["Every new metric must be implemented in three compilers and pass parity tests.","Some features (e.g. approximate distinct) are capability-gated per engine."]),
("0005","PostgreSQL-backed durable job queue and transactional outbox; Temporal optional",
"Ingestion, normalization and recommendation jobs need durability, retries, scheduling and idempotency. Lite must not require extra infrastructure.",
"Implement `jobs.Queue` over PostgreSQL (`FOR UPDATE SKIP LOCKED`, visibility timeouts, attempts, exponential backoff with jitter, unique job keys for dedup, a dead-letter state), e.g. using the River library or an equivalent in-house implementation. Domain events are written to an `outbox` table in the same transaction as state changes and relayed to subscribers. A Temporal adapter may be added for HA deployments if long-running workflows justify it.",
["Temporal mandatory: rejected because of Lite operational overhead.","Redis or RabbitMQ: rejected because it adds a dependency and is not transactional with state."],
["Queue throughput bounded by PG. Acceptable at the documented scale; partitioned queue tables if needed.","The outbox guarantees at-least-once delivery, so consumers must be idempotent."]),
("0006","FOCUS 1.2 as normalization baseline with versioned mappings",
"The README requires a FOCUS-aligned model with a documented version. FOCUS evolves (1.0 → 1.1 → 1.2 → newer).",
"Pin **FOCUS 1.2** as the normalized schema baseline (to be re-confirmed at the start of Phase 11, OQ-02). Store provider-specific fields as `x_`-prefixed extension columns plus a raw JSON column. Mappings are versioned artifacts (`mapping_id`, `version`, `focus_version`). Normalized rows record `mapping_version`. Adding a newer FOCUS version means adding a new mapping version and migration, not changing the old one.",
["Custom schema: rejected because of interoperability loss.","Track latest FOCUS automatically: rejected because it is unauditable."],
["Re-normalization jobs are required when mappings change.","A conformance test validates required FOCUS columns and value domains."]),
("0007","Fixed-point decimal money end-to-end",
"Floating-point arithmetic causes reconciliation drift. Providers report up to 10+ decimal places on unit prices.",
"Monetary and quantity values use decimals: Go `github.com/cockroachdb/apd/v3` (or `shopspring/decimal`, decided in Phase 03) and `NUMERIC(38,12)`/`Decimal(38,12)`/`DECIMAL(38,12)` in storage. Rounding happens only at presentation or at explicitly defined allocation steps, using banker's rounding (half-even) by default, with residuals assigned deterministically. JSON APIs serialize money as **strings**.",
["float64: rejected."],
["A lint rule forbids float types in finance packages.","Performance cost accepted. Analytics engines aggregate natively in decimal."]),
("0008","Authorization: RBAC + ABAC via Cedar policies with SQL predicate compilation",
"We need role-based permissions, custom roles, and attribute-based data visibility (by account, project, tag or hierarchy) enforced consistently in the API, analytics and AI.",
"Model permissions as `action` × `resource type`. Evaluate with an embedded Cedar engine (`cedar-go`) behind an `authz.Authorizer` interface. Data-level ABAC scopes compile into a predicate AST that the semantic compiler injects into every analytics query. Default deny. Every decision can be logged with policy IDs.",
["OPA/Rego sidecar: viable, but needs an extra process and Rego is harder to analyze.","Hand-written role checks: rejected because they don't scale to custom roles."],
["A policy test matrix (role × action × resource) is required.","Predicate compilation must be proven equivalent to Cedar evaluation by tests."]),
("0009","Keyless cloud federation and secret references",
"Static long-lived cloud keys are a major breach risk.",
"Default to AWS IAM role assumption with ExternalId (or web identity when running in AWS), GCP Workload Identity Federation or service-account impersonation, and Azure workload identity federated credentials. Where static secrets are unavoidable, store only **secret references** (Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Kubernetes) or envelope-encrypted values (AES-256-GCM DEK, KMS- or file-based KEK).",
["Store encrypted keys only: rejected as the default."],
["Onboarding templates must create federation trust.","A credential verifier reports capability-level permissions."]),
("0010","Immutable content-addressed raw storage and atomic partition swap for restatements",
"Providers restate billing periods. Auditors need to trace numbers to sources.",
"Raw source objects are stored under `raw/{tenant}/{connector}/{capability}/{period}/{sha256}` and never mutated (object lock in HA). Normalized data is written to staging and swapped atomically per `(tenant, connector, billing_period)` after invariant validation. Previous versions are retained for a configurable period for diffing.",
["In-place upserts: rejected because of partial-failure states and lost history."],
["Storage overhead (mitigated by retention policies).","Every engine adapter must implement atomic partition replacement."]),
("0011","API-first REST/OpenAPI 3.1 with standard error, pagination and idempotency conventions",
"There are many clients (web, CLI, automation, AI tools, partners).",
"Public HTTP API is versioned `/api/v1`, described in OpenAPI 3.1 (source of truth, code-generated types). Errors use RFC 9457 Problem Details. Cursor pagination. `Idempotency-Key` on unsafe methods. Rate limits with `RateLimit-*` headers. ETags for optimistic concurrency.",
["GraphQL: rejected because authorization and cost control for arbitrary queries are harder; the semantic query endpoint covers flexible analytics.","gRPC public API: rejected because it is less accessible; gRPC is used internally for plugins."],
["Contract tests validate the implementation against OpenAPI."]),
("0012","Plugin model: compile-time first-party modules; out-of-process gRPC for third-party plugins",
"Community providers and rules must be added without core changes, and untrusted code must be isolated.",
"First-party providers (AWS, GCP, Azure) are Go modules implementing `sdk/provider` interfaces, compiled in. Third-party plugins run as separate processes speaking a versioned gRPC protocol (go-plugin style handshake), with resource limits, no direct DB access, and only the credentials scoped to their connector. Capability manifests declare supported features, SDK version and license. WASM is evaluated for recommendation rules in Phase 36.",
["Go `plugin` package: rejected because it is fragile (exact toolchain match required).","Scripting (Lua/JS): rejected because it is insufficient for provider SDKs."],
["Two execution paths share one interface and one compatibility suite."]),
("0013","LLM gateway with tool-only data access and semantic queries (no model-generated SQL)",
"NL analytics is valuable but prompt injection and data exfiltration are real risks.",
"`internal/ai` exposes a model-agnostic gateway (OpenAI-compatible, Anthropic, Ollama-compatible). Models can only call allow-listed **read-only tools** that execute through the normal API authorization as the requesting user. NL-to-query produces a semantic-query JSON validated against a schema and compiled by the semantic layer. Model output is never executed as SQL. Untrusted data is delimited. Responses carry citations and freshness.",
["Text-to-SQL against a read-only replica: rejected because ABAC cannot be guaranteed and there are resource-exhaustion risks."],
["Less expressive than arbitrary SQL. Unsupported questions are refused with an explanation."]),
("0014","Hash-chained append-only audit log",
"Finance and security require tamper evidence.",
"`audit_events` is insert-only (no UPDATE/DELETE grants; trigger guard). Each row stores `prev_hash` and `hash = SHA-256(canonical_json(event) || prev_hash)` per tenant chain. Periodic anchors (chain head hashes) are written to WORM object storage. A verifier command checks chain integrity.",
["Plain log table: rejected because it is not tamper-evident."],
["Serialized writes per tenant chain (acceptable volume).","Optional SIEM streaming."]),
("0015","Source-available licensing (replaces Apache-2.0 proposal)",
"The project owner wants CloudLedger to be free for anyone's internal use (including production at any scale), while reserving resale, third-party hosting or managed services, white-labeling, embedding and derivative products for commercial licensing, with **no mandatory future conversion** to open source.",
"Adopt a source-available model. The proposed license is the custom **CloudLedger Source-Available License 1.0** (`LICENSE.md`), with PolyForm Internal Use 1.0.0 + additional permission as the fallback. Contributions are accepted under a **CLA** with relicensing rights, plus DCO sign-off. Plugin Interfaces may be permissively licensed (OQ-22). License compliance (dependency policy, SPDX headers, CLA, notices) is enforced in CI. **All legal texts are drafts until approved by qualified counsel.** This ADR affects licensing and documentation only; architecture, APIs, schemas and the 40-phase scope are unchanged.",
["Apache-2.0: rejected because it permits resale and third-party hosting.","BUSL 1.1: rejected because each version must convert to a GPL-compatible license by its Change Date (≤ 4 years).","Elastic License 2.0: rejected because it permits commercial redistribution and embedding.","FSL: rejected because it converts after 2 years.","SSPL: rejected because it doesn't prohibit hosting and is contentious."],
["CloudLedger must not be described as open source or OSI-approved.","GPL/AGPL/SSPL dependencies cannot be used.","Some enterprises and contributors may hesitate. Mitigated by a clear FAQ and free internal use without limits.","Independent competing implementations are not restricted.","See docs/legal/LICENSING_EVALUATION.md."]),
("0016","UUIDv7 identifiers and UTC timestamps",
"IDs must be globally unique, sortable and safe to expose. Time zones cause billing errors.",
"All entity IDs are UUIDv7. Exposed IDs are opaque. All timestamps are stored as UTC (`timestamptz`/`DateTime64(3,'UTC')`). Billing periods are `[start, end)` intervals in UTC as the provider defines them. Presentation time zone and the accounting calendar are tenant settings applied at query time.",
["Serial integers: rejected because of enumeration risk and poor fit for sharding."],
["Calendar math is centralized in `internal/platform/timeutil`."]),
("0017","OpenTelemetry-native observability",
"Operators need traces, metrics and logs across API, workers and plugins.",
"Instrument with the OpenTelemetry SDKs (Go, Node). Export OTLP to a collector. Expose Prometheus metrics. Use structured JSON logs (slog) with trace correlation. Tenant ID is recorded in spans and logs, not as an unbounded metric label.",
["Vendor-specific APM SDKs: rejected."],
["Grafana dashboards and alert rules ship in `deploy/`."]),
]
os.makedirs(out, exist_ok=True)
idx = ["# Architecture Decision Records\n", "Format: lightweight MADR. Status values: Proposed → Accepted / Rejected / Superseded. All ADRs are **Proposed** until ratified in Phase 02 (ADR-0015 additionally requires legal review).\n",
       "| ADR | Title | Status |","|---|---|---|"]
for num, title, ctx, dec, alts, cons in ADRS:
    slug = "-".join(w for w in "".join(c.lower() if c.isalnum() else " " for c in title).split()[:6])
    fn = f"{num}-{slug}.md"
    if num == "0015": fn = "0015-source-available-licensing.md"
    status = "Proposed (requires legal review)" if num=="0015" else "Proposed"
    body = f"# ADR-{num}: {title}\n\n- **Status:** {status}\n- **Date:** 2026-11-15\n- **Deciders:** maintainer council (to be ratified in Phase 02)\n\n## Context\n{ctx}\n\n## Decision\n{dec}\n\n## Alternatives considered\n" + "\n".join(f"- {a}" for a in alts) + "\n\n## Consequences\n" + "\n".join(f"- {c}" for c in cons) + "\n"
    open(os.path.join(out, fn), "w").write(body)
    idx.append(f"| [ADR-{num}]({fn}) | {title} | {status} |")
idx.append("\nNew ADRs: copy [template.md](template.md), take the next number, and open a PR labeled `adr`.\n")
open(os.path.join(out, "README.md"), "w").write("\n".join(idx) + "\n")
open(os.path.join(out, "template.md"), "w").write("# ADR-NNNN: Title\n\n- **Status:** Proposed\n- **Date:** YYYY-MM-DD\n- **Deciders:**\n\n## Context\n\n## Decision\n\n## Alternatives considered\n\n## Consequences\n")
print(len(ADRS), "ADRs")
