# Phase 23 Design

## Components and behavior
Evaluate storage tier/access patterns, orphaned volumes, snapshot chains, database utilization and log retention. Respect backup retention, legal holds, restore dependencies and database HA. Include retrieval, I/O and migration costs; record data-loss risk and a reversible implementation path where possible.

Normative foundation: [architecture](../../architecture/README.md), [database schema](../../architecture/DATABASE_SCHEMA.md), [API conventions](../../contracts/API_GUIDELINES.md), [security](../../security/README.md). Phase 02 freezes unresolved contract details before feature implementation.

## Data and migrations
Affected logical entities: recommendations and immutable evidence; no cloud writes. Use UUIDv7 identities, UTC instants and exact decimal money with currency. Persist tenant ownership on every tenant entity; include tenant in foreign and unique keys. Schema changes use forward-only expand/contract migrations with backfill and compensating recovery. No destructive contraction until older binaries and jobs have drained.

## Processing and consistency
Authenticate → resolve tenant and scoped permissions → validate versioned input → execute bounded domain operation → commit state and audit/outbox together → return a versioned response. Readers use a consistent snapshot. Replayed jobs carry a stable business key and cannot duplicate published financial records.

## Security and operations
Authorization is enforced on server reads, writes, background jobs, caches and downloads. Cache keys include tenant, scope/policy version and snapshot. Store secret references, redact logs, deny arbitrary filesystem and network access from untrusted inputs. Trace every operation; expose bounded-cardinality latency, failure, backlog and freshness metrics. Readiness fails when required stores cannot serve safely.

## Failure and recovery
Exercise: Snapshot parent dependency; legal hold; dormant disaster-recovery database; retrieval fee exceeds savings; unknown access history. Transient failures receive bounded retries; invalid data is quarantined with actionable diagnostics. Failed operations expose no partial published result. Recovery replays pinned input versions and checks control totals and audit continuity before publication.
