# ADR-0016: UUIDv7 identifiers and UTC timestamps

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
IDs must be globally unique, sortable and safe to expose. Time zones cause billing errors.

## Decision
All entity IDs are UUIDv7. Exposed IDs are opaque. All timestamps are stored as UTC (`timestamptz`/`DateTime64(3,'UTC')`). Billing periods are `[start, end)` intervals in UTC as the provider defines them. Presentation time zone and the accounting calendar are tenant settings applied at query time.

## Alternatives considered
- Serial integers: rejected because of enumeration risk and poor fit for sharding.

## Consequences
- Calendar math is centralized in `internal/platform/timeutil`.
