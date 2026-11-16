# ADR-0007: Fixed-point decimal money end-to-end

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Floating-point arithmetic causes reconciliation drift. Providers report up to 10+ decimal places on unit prices.

## Decision
Monetary and quantity values use decimals: Go `github.com/cockroachdb/apd/v3` (or `shopspring/decimal`, decided in Phase 03) and `NUMERIC(38,12)`/`Decimal(38,12)`/`DECIMAL(38,12)` in storage. Rounding happens only at presentation or at explicitly defined allocation steps, using banker's rounding (half-even) by default, with residuals assigned deterministically. JSON APIs serialize money as **strings**.

## Alternatives considered
- float64: rejected.

## Consequences
- A lint rule forbids float types in finance packages.
- Performance cost accepted. Analytics engines aggregate natively in decimal.
