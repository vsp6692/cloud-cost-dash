# ADR-0006: FOCUS 1.2 as normalization baseline with versioned mappings

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
The README requires a FOCUS-aligned model with a documented version. FOCUS evolves (1.0 → 1.1 → 1.2 → newer).

## Decision
Pin **FOCUS 1.2** as the normalized schema baseline (to be re-confirmed at the start of Phase 11, OQ-02). Store provider-specific fields as `x_`-prefixed extension columns plus a raw JSON column. Mappings are versioned artifacts (`mapping_id`, `version`, `focus_version`). Normalized rows record `mapping_version`. Adding a newer FOCUS version means adding a new mapping version and migration, not changing the old one.

## Alternatives considered
- Custom schema: rejected because of interoperability loss.
- Track latest FOCUS automatically: rejected because it is unauditable.

## Consequences
- Re-normalization jobs are required when mappings change.
- A conformance test validates required FOCUS columns and value domains.
