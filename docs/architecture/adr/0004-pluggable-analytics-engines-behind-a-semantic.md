# ADR-0004: Pluggable analytics engines behind a semantic layer with a shared contract suite

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Data volumes range from thousands to billions of rows. The README requires PostgreSQL, DuckDB and ClickHouse support with consistent semantics.

## Decision
Business logic issues **semantic queries** (metrics, dimensions, filters, grain, cost type, currency) only. `internal/analytics` compiles them per engine through an `Adapter` interface (DDL, bulk load, partition swap, query compile and execute, capabilities). A shared contract test suite runs identical fixtures on all engines and asserts exact decimal equality.

## Alternatives considered
- ClickHouse only: rejected because it is too heavy for Lite.
- An ORM or generic SQL builder: rejected because engine differences (decimals, partitions, arrays) leak.

## Consequences
- Every new metric must be implemented in three compilers and pass parity tests.
- Some features (e.g. approximate distinct) are capability-gated per engine.
