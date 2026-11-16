# ADR-0017: OpenTelemetry-native observability

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Operators need traces, metrics and logs across API, workers and plugins.

## Decision
Instrument with the OpenTelemetry SDKs (Go, Node). Export OTLP to a collector. Expose Prometheus metrics. Use structured JSON logs (slog) with trace correlation. Tenant ID is recorded in spans and logs, not as an unbounded metric label.

## Alternatives considered
- Vendor-specific APM SDKs: rejected.

## Consequences
- Grafana dashboards and alert rules ship in `deploy/`.
