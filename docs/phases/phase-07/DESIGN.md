# Phase 07 Design

## Components and behavior
Use federation or service-account impersonation with bounded BigQuery jobs. Read standard and detailed billing exports through versioned mappings. Persist export_time watermark plus overlap window and stable row identity; advance only after publication. GCS input is customer-exported billing files. Record query bytes and budget exhaustion.

Normative foundation: [architecture](../../architecture/README.md), [database schema](../../architecture/DATABASE_SCHEMA.md), [API conventions](../../contracts/API_GUIDELINES.md), [security](../../security/README.md). Phase 02 freezes unresolved contract details before feature implementation.

## Data and migrations
Affected logical entities: connectors, cloud_scopes, ingestion_checkpoints. Use UUIDv7 identities, UTC instants and exact decimal money with currency. Persist tenant ownership on every tenant entity; include tenant in foreign and unique keys. Schema changes use forward-only expand/contract migrations with backfill and compensating recovery. No destructive contraction until older binaries and jobs have drained.

## Processing and consistency
Authenticate → resolve tenant and scoped permissions → validate versioned input → execute bounded domain operation → commit state and audit/outbox together → return a versioned response. Readers use a consistent snapshot. Replayed jobs carry a stable business key and cannot duplicate published financial records.

## Security and operations
Authorization is enforced on server reads, writes, background jobs, caches and downloads. Cache keys include tenant, scope/policy version and snapshot. Store secret references, redact logs, deny arbitrary filesystem and network access from untrusted inputs. Trace every operation; expose bounded-cardinality latency, failure, backlog and freshness metrics. Readiness fails when required stores cannot serve safely.

## Failure and recovery
Exercise: Late export row; duplicate timestamp; missing project permission; disabled pricing export; BigQuery job timeout; partial GCS delivery. Transient failures receive bounded retries; invalid data is quarantined with actionable diagnostics. Failed operations expose no partial published result. Recovery replays pinned input versions and checks control totals and audit continuity before publication.
