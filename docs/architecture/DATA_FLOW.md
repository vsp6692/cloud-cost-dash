# Data Flows

All flows carry `tenant_id`, `trace_id` and, for data-producing work, an `ingestion_run_id` or `job_id` that later appears in lineage.

## 1. Billing ingestion → analytics (end-to-end)

```mermaid
sequenceDiagram
  autonumber
  participant SCH as Scheduler
  participant Q as Job queue (PG)
  participant W as Worker (ingest)
  participant P as Provider plugin
  participant C as Cloud (S3/BQ/Blob)
  participant OBJ as Object storage (raw)
  participant N as Worker (normalize)
  participant A as Analytics store
  participant AL as Worker (allocate)
  participant OB as Outbox/events

  SCH->>Q: enqueue ingest.billing(connector, scope, window)
  W->>Q: lease job (SKIP LOCKED, visibility timeout)
  W->>P: DiscoverBillingArtifacts(scope, checkpoint)
  P->>C: list manifests / query partitions (read-only creds via STS/WIF)
  P-->>W: artifacts[] (id, period, version, etag, size, schema)
  loop each new/changed artifact
    W->>C: stream download (checksummed)
    W->>OBJ: put raw/{tenant}/{connector}/{period}/{sha256} (immutable)
    W->>PG: source_object row (hash, schema_version, period, version)
  end
  W->>Q: enqueue normalize(run_id) ; checkpoint advanced in same tx
  N->>OBJ: read raw objects
  N->>N: parse → validate → map (mapping_version) → dedup key → FOCUS rows
  N->>A: write to staging partition (run_id)
  N->>N: invariants: Σ source == Σ staged per (period, account, currency, charge_category)
  N->>A: atomic partition swap for (tenant, connector, billing_period)  // restatement-safe
  N->>OB: event cost.period.normalized
  OB-->>AL: allocate(tenant, period)
  AL->>A: write allocated_cost (rule_version) + verify allocation invariant
  AL->>OB: event cost.period.allocated → triggers aggregates, budgets, anomalies, recs refresh
```

Key properties:
- **Idempotent**: raw objects are content-addressed. A normalized partition is a pure function of (raw objects, mapping_version). Re-running produces identical rows and swaps an identical partition.
- **Restatement-safe**: the unit of replacement is `(tenant, connector, billing_period)`. The new version is fully staged and validated before an atomic swap. The prior version is retained for N days for audit diffing.
- **Fail-closed**: an invariant failure leaves the previous partition live, marks the run `failed_validation` and raises an ingestion-health alert.

## 2. Query path (dashboards, API, AI)

```mermaid
flowchart LR
  R[Request: semantic query JSON] --> AU[authn → principal]
  AU --> AZ[authz: permission check + ABAC scope → predicate AST]
  AZ --> SC[semantic compiler: metrics, dims, filters, grain]
  SC -->|inject tenant_id + scope predicates, limits| SQL[engine-specific SQL + params]
  SQL --> CA{result cache<br/>key = tenant+principal-scope-hash+query-hash+data-version}
  CA -- miss --> ENG[(analytics engine)]
  ENG --> RS[result + freshness + lineage refs]
  CA -- hit --> RS
```

- The cache key includes the **data version** (a monotonically increasing counter per tenant, bumped on partition swap or allocation publish). Stale results are therefore never served after a restatement.
- The cache key includes the **scope hash** of the principal, so two users with different ABAC scopes never share entries.

## 3. Inventory, telemetry and recommendations

```mermaid
flowchart LR
  INV[inventory sync] --> RS[(resources, SCD2)]
  MET[metrics sync] --> MR[(metric rollups hourly/daily)]
  PR[pricing sync] --> PX[(price catalog, versioned)]
  NAT[native recs ingest] --> NR[(provider_recommendations)]
  RS & MR & PX & NR & COST[(normalized cost)] --> ENG[rule engine: plugins evaluate per resource/pool]
  ENG --> CAND[candidates + evidence]
  CAND --> OV[overlap resolver → net savings]
  OV --> REC[(recommendations, versioned evidence)]
  REC --> LC[lifecycle / approvals] --> RZ[realized savings measurement]
```

## 4. Finance flow

```mermaid
flowchart LR
  INVC[invoice import/fetch] --> IM[(invoices + lines)]
  NC[(normalized BilledCost)] --> REC[reconciler: match by invoice_id, period, account, currency]
  IM --> REC
  REC --> VAR[(variances categorized)]
  VAR --> CLOSE{period close}
  CLOSE -->|tolerance OK + acknowledged| SNAP[immutable snapshot + manifest SHA-256]
  CLOSE -->|blocked| VAR
  SNAP --> EXP[exports: CSV/XLSX/JSON/Parquet/PDF/journal]
```

## 5. Event bus

The transactional **outbox** in PostgreSQL is the source of truth for domain events. A relay publishes them to in-process subscribers and enqueues dependent jobs, and optionally publishes to NATS or Kafka for external consumers (HA profile). Events use the CloudEvents 1.0 envelope. See [../contracts/EVENTS.md](../contracts/EVENTS.md).
