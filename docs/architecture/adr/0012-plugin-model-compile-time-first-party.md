# ADR-0012: Plugin model: compile-time first-party modules; out-of-process gRPC for third-party plugins

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Community providers and rules must be added without core changes, and untrusted code must be isolated.

## Decision
First-party providers (AWS, GCP, Azure) are Go modules implementing `sdk/provider` interfaces, compiled in. Third-party plugins run as separate processes speaking a versioned gRPC protocol (go-plugin style handshake), with resource limits, no direct DB access, and only the credentials scoped to their connector. Capability manifests declare supported features, SDK version and license. WASM is evaluated for recommendation rules in Phase 36.

## Alternatives considered
- Go `plugin` package: rejected because it is fragile (exact toolchain match required).
- Scripting (Lua/JS): rejected because it is insufficient for provider SDKs.

## Consequences
- Two execution paths share one interface and one compatibility suite.
