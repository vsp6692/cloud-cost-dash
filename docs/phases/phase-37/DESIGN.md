# Phase 37 Design

## Components and behavior
Publish reproducible scaffold, local fixture workflow and compatibility suite instructions. Separate maintainer roles, security disclosure and decision process. Explain source-available internal-use terms and draft CLA without claiming counsel approval. Walkthrough must be performed by a contributor without undocumented local setup.

Normative foundation: [architecture](../../architecture/README.md), [database schema](../../architecture/DATABASE_SCHEMA.md), [API conventions](../../contracts/API_GUIDELINES.md), [security](../../security/README.md). Phase 02 freezes unresolved contract details before feature implementation.

## Data and migrations
Affected logical entities: No database migration. Use UUIDv7 identities, UTC instants and exact decimal money with currency. Persist tenant ownership on every tenant entity; include tenant in foreign and unique keys. Schema changes use forward-only expand/contract migrations with backfill and compensating recovery. No destructive contraction until older binaries and jobs have drained.

## Processing and consistency
Authenticate → resolve tenant and scoped permissions → validate versioned input → execute bounded domain operation → commit state and audit/outbox together → return a versioned response. Readers use a consistent snapshot. Replayed jobs carry a stable business key and cannot duplicate published financial records.

## Security and operations
Authorization is enforced on server reads, writes, background jobs, caches and downloads. Cache keys include tenant, scope/policy version and snapshot. Store secret references, redact logs, deny arbitrary filesystem and network access from untrusted inputs. Trace every operation; expose bounded-cardinality latency, failure, backlog and freshness metrics. Readiness fails when required stores cannot serve safely.

## Failure and recovery
Exercise: Fresh checkout without secrets; missing CLA; unlicensed dependency; wrong SPDX header; broken example; inaccessible docs. Transient failures receive bounded retries; invalid data is quarantined with actionable diagnostics. Failed operations expose no partial published result. Recovery replays pinned input versions and checks control totals and audit continuity before publication.
