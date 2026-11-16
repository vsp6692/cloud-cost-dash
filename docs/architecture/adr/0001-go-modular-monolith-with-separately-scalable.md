# ADR-0001: Go modular monolith with separately scalable run modes

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
We need fast delivery, strong typing, low-ops self-hosting (Lite) and horizontal scale (HA). Microservices add operational burden that Lite users cannot absorb. A single unstructured binary risks tight coupling.

## Decision
Build one Go binary with run modes `api`, `worker`, `scheduler`, `migrate`, `admin`. Domain modules live in `internal/<module>` with an exported `api.go` interface. Cross-module imports of internals are forbidden and enforced by import-lint. Asynchronous coupling goes through the transactional outbox.

## Alternatives considered
- Microservices from day one: rejected because of operational cost and premature distribution.
- Node.js/TypeScript backend: rejected because Go gives better data-processing throughput, static binaries and concurrency for ingestion.

## Consequences
- Simple Lite deployment (one image).
- Worker pools scale independently by queue.
- Modules can be extracted later because contracts are interfaces plus events.
- Import-lint and architecture tests are required from Phase 03.
