# System Context, Containers and Components (C4)

## Level 1: System context

```mermaid
flowchart LR
  subgraph Users
    U1[FinOps / Finance / Eng users]
    U2[Auditor]
    U3[Platform operator]
    U4[Contributor / plugin author]
  end

  CL[(CloudLedger)]

  IdP[Identity Provider<br/>OIDC / SAML / SCIM]
  AWS[AWS<br/>Data Exports·S3·Athena·CE·Orgs·Config·CloudWatch·Compute Optimizer]
  GCP[GCP<br/>BigQuery billing export·GCS·Asset Inventory·Monitoring·Recommender]
  AZ[Azure<br/>Cost Mgmt exports·Blob·Cost Details·Resource Graph·Monitor·Advisor·Retail Prices]
  FX[FX rate sources<br/>ECB / custom]
  LLM[LLM providers<br/>OpenAI-compatible / Anthropic / Ollama]
  CH[Chat & ticketing<br/>Slack·Teams·Email·Webhooks·Jira·ServiceNow·GitHub]
  ERP[ERP / Ledger<br/>via exports]
  SIEM[SIEM]

  U1 -->|HTTPS| CL
  U2 -->|HTTPS read-only| CL
  U3 -->|Helm/Compose, admin API| CL
  U4 -->|SDK, plugins| CL
  CL -->|OIDC/SAML, SCIM inbound| IdP
  CL -->|read-only federated| AWS
  CL -->|read-only federated| GCP
  CL -->|read-only federated| AZ
  CL --> FX
  CL -->|tenant opt-in| LLM
  CL --> CH
  CL -->|files| ERP
  CL -->|audit stream| SIEM
```

## Level 2: Containers

```mermaid
flowchart TB
  Browser[Web browser]
  subgraph CloudLedger
    WEB[apps/web<br/>Next.js BFF + UI]
    API[cloudledger api<br/>Go REST/OpenAPI]
    WRK[cloudledger worker<br/>Go job runners]
    SCH[cloudledger scheduler<br/>leader-elected]
    PLG[Out-of-process plugins<br/>gRPC]
    PG[(PostgreSQL<br/>control plane + job queue + outbox)]
    AN[(Analytics store<br/>PG / DuckDB / ClickHouse)]
    OBJ[(Object storage<br/>raw + staged + reports)]
    KMS[[KMS / Vault<br/>KEK + secret refs]]
    OTEL[OTel Collector → Prometheus/Grafana/Loki/Tempo]
  end
  Browser --> WEB
  WEB -->|session cookie → server-side token| API
  API --> PG
  API --> AN
  API --> OBJ
  API --> KMS
  SCH --> PG
  WRK --> PG
  WRK --> AN
  WRK --> OBJ
  WRK --> KMS
  WRK <--> PLG
  WRK -->|cloud APIs| Clouds[(AWS/GCP/Azure)]
  API & WRK & WEB --> OTEL
```

Container responsibilities:

| Container | Responsibility | Scaling |
|---|---|---|
| `apps/web` | UI, server components, BFF that holds the session and calls the API with a server-side access token (no tokens in browser storage) | stateless, N replicas |
| `api` | authn/z, REST endpoints, semantic query compilation, read paths, command validation, enqueue jobs | stateless, N replicas |
| `worker` | job execution by queue (`ingest`, `normalize`, `allocate`, `inventory`, `metrics`, `recommend`, `alerts`, `reports`, `ai`) | per-queue pools, N replicas |
| `scheduler` | cron and interval job creation, leader election via PG advisory lock | 1 active (+ standby) |
| plugins | third-party providers and recommendation rules, isolated process with a capability-scoped gRPC API | per worker |

## Level 3: Components (Go modules under `internal/`)

```mermaid
flowchart LR
  subgraph platform[internal/platform: cross-cutting]
    cfg[config] --- log[observability] --- db[db/tx + RLS session] --- jobs[jobs/queue + outbox] --- obj[objectstore] --- sec[secrets/crypto]
  end
  identity[identity<br/>OIDC/SAML/SCIM, sessions, tokens]
  authz[authz<br/>RBAC+ABAC, Cedar, predicate compiler]
  tenants[tenants<br/>tenants, hierarchy, settings]
  connectors[connectors<br/>registry, manifests, credential verification]
  billing[billing<br/>ingestion runs, raw, normalization, FOCUS]
  analytics[analytics<br/>semantic layer, adapters]
  allocation[allocation<br/>tag rules, mappings, shared costs]
  inventory[inventory<br/>resources, relationships, telemetry]
  recommendations[recommendations<br/>rule engine, overlap, lifecycle, realized]
  forecasting[forecasting<br/>budgets, forecasts, anomalies]
  finance[finance<br/>FX, commitments, invoices, reconciliation, close, exports]
  alerts[alerts<br/>channels, delivery, approvals]
  audit[audit<br/>hash-chained log]
  ai[ai<br/>LLM gateway, tools, guardrails]
  dashboards[dashboards<br/>views, widgets, templates]

  identity --> authz
  authz --> analytics
  connectors --> billing & inventory
  billing --> analytics
  allocation --> analytics
  analytics --> dashboards & forecasting & recommendations & finance & ai
  inventory --> recommendations
  recommendations --> alerts
  forecasting --> alerts
  finance --> audit
  identity & tenants & allocation & recommendations & finance --> audit
```

Note: README's proposed `internal/` list is extended with `connectors`, `analytics`, `dashboards`, `authz` and `platform`. `identity` covers authentication only. See ADR-0001.

### Module dependency rules
1. `platform` depends on nothing internal.
2. Domain modules may depend on `platform`, `authz` (interfaces) and `audit` (interface). They never import another domain module's internals, only its exported `api.go` interface.
3. Cycles are forbidden (enforced by `go-arch-lint` or `depguard` in CI from Phase 03).
4. Providers (`providers/*`) depend only on `sdk/provider`, never on `internal/*`.
