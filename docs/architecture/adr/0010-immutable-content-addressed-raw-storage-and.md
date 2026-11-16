# ADR-0010: Immutable content-addressed raw storage and atomic partition swap for restatements

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Providers restate billing periods. Auditors need to trace numbers to sources.

## Decision
Raw source objects are stored under `raw/{tenant}/{connector}/{capability}/{period}/{sha256}` and never mutated (object lock in HA). Normalized data is written to staging and swapped atomically per `(tenant, connector, billing_period)` after invariant validation. Previous versions are retained for a configurable period for diffing.

## Alternatives considered
- In-place upserts: rejected because of partial-failure states and lost history.

## Consequences
- Storage overhead (mitigated by retention policies).
- Every engine adapter must implement atomic partition replacement.
