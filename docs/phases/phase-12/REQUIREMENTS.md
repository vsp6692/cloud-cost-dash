# Phase 12 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P12-R01 | Health status per connector and capability: last success, last attempt, freshness lag, error class, next run. | FR-CON-005 | M | P12-AC01 |
| P12-R02 | Deterministic deduplication keyed by provider-native line identifiers plus a content hash. | FR-NRM-006 | M | P12-AC02 |
| P12-R03 | Incremental sync with persisted checkpoints per connector, capability and scope. | FR-ING-001 | M | P12-AC03 |
| P12-R04 | Backfill up to a configurable horizon (default 13 months, subject to provider availability). | FR-ING-002 | M | P12-AC04 |
| P12-R05 | Idempotent processing: replaying any ingestion run yields identical normalized results. | FR-ING-003 | M | P12-AC05 |
| P12-R06 | Retry with exponential backoff and jitter, provider-aware rate limits, circuit breaking and a dead-letter queue. | FR-ING-004 | M | P12-AC06 |
| P12-R07 | Billing-period restatement handling: a provider re-delivering a period atomically supersedes the previous version. | FR-ING-005 | M | P12-AC07 |
| P12-R08 | Schema-version detection for provider exports. Unknown schema → quarantine plus alert, not silent loss. | FR-ING-006 | M | P12-AC08 |
