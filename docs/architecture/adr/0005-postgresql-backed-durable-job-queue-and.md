# ADR-0005: PostgreSQL-backed durable job queue and transactional outbox; Temporal optional

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Ingestion, normalization and recommendation jobs need durability, retries, scheduling and idempotency. Lite must not require extra infrastructure.

## Decision
Implement `jobs.Queue` over PostgreSQL (`FOR UPDATE SKIP LOCKED`, visibility timeouts, attempts, exponential backoff with jitter, unique job keys for dedup, a dead-letter state), e.g. using the River library or an equivalent in-house implementation. Domain events are written to an `outbox` table in the same transaction as state changes and relayed to subscribers. A Temporal adapter may be added for HA deployments if long-running workflows justify it.

## Alternatives considered
- Temporal mandatory: rejected because of Lite operational overhead.
- Redis or RabbitMQ: rejected because it adds a dependency and is not transactional with state.

## Consequences
- Queue throughput bounded by PG. Acceptable at the documented scale; partitioned queue tables if needed.
- The outbox guarantees at-least-once delivery, so consumers must be idempotent.
