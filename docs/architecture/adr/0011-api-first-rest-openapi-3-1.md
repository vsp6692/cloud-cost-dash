# ADR-0011: API-first REST/OpenAPI 3.1 with standard error, pagination and idempotency conventions

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
There are many clients (web, CLI, automation, AI tools, partners).

## Decision
Public HTTP API is versioned `/api/v1`, described in OpenAPI 3.1 (source of truth, code-generated types). Errors use RFC 9457 Problem Details. Cursor pagination. `Idempotency-Key` on unsafe methods. Rate limits with `RateLimit-*` headers. ETags for optimistic concurrency.

## Alternatives considered
- GraphQL: rejected because authorization and cost control for arbitrary queries are harder; the semantic query endpoint covers flexible analytics.
- gRPC public API: rejected because it is less accessible; gRPC is used internally for plugins.

## Consequences
- Contract tests validate the implementation against OpenAPI.
