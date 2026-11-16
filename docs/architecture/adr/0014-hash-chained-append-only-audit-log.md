# ADR-0014: Hash-chained append-only audit log

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Finance and security require tamper evidence.

## Decision
`audit_events` is insert-only (no UPDATE/DELETE grants; trigger guard). Each row stores `prev_hash` and `hash = SHA-256(canonical_json(event) || prev_hash)` per tenant chain. Periodic anchors (chain head hashes) are written to WORM object storage. A verifier command checks chain integrity.

## Alternatives considered
- Plain log table: rejected because it is not tamper-evident.

## Consequences
- Serialized writes per tenant chain (acceptable volume).
- Optional SIEM streaming.
