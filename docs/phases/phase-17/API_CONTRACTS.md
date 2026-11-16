# Phase 17 API and Extension Contracts

Status: proposed; implementation **NOT STARTED**.

## Canonical interfaces
Use the [OpenAPI contract](../../../api/openapi/cloudledger.v1.yaml) and [API guidelines](../../contracts/API_GUIDELINES.md). Planned implementation surfaces: `internal/forecasting, internal/alerts`. Logical entities: budgets, forecast_runs, anomalies, notification_deliveries. This phase must reconcile its requirements with the canonical contract during design review; it must not introduce parallel endpoint spellings.

Validate all request and response fields against canonical schemas, reject unknown unsafe enum values and preserve additive compatibility. Collections use opaque tenant-bound cursors. Mutations use scoped idempotency keys and If-Match for versioned records; asynchronous work returns a durable job identity and status URL.

## Invariants and errors
Tenant comes from authenticated context; a supplied tenant identifier cannot grant access. Return 401 for unauthenticated requests, 403 for denied actions without object disclosure, 404 for unavailable scoped objects, 409 for stale versions/idempotency conflicts, 422 for invalid domain input, 429 with Retry-After for quotas and 503 for transient dependencies. Follow canonical Problem Details with request ID and no secrets. Decimal amounts serialize as strings with explicit currency; instants use UTC RFC3339.

## Events and compatibility
Use the [event registry](../../contracts/EVENTS.md) and [SDK compatibility policy](../../contracts/COMPATIBILITY.md). Publish domain events only through the transactional outbox with tenant, trace, event ID and schema version; consumers deduplicate at-least-once delivery. Never invent a new event spelling without registering its JSON Schema. Version affected manifests and pin snapshot, rule, mapping or pricing versions in reproducible outputs.

## Required contract checks
Assert authorization, pagination stability, malformed input, decimal serialization, version conflicts, replay and safe errors for every introduced surface. Public API/SDK removal requires the documented deprecation window.
