# Architecture Decision Records

Format: lightweight MADR. Status values: Proposed → Accepted / Rejected / Superseded. All ADRs are **Proposed** until ratified in Phase 02 (ADR-0015 additionally requires legal review).

| ADR | Title | Status |
|---|---|---|
| [ADR-0001](0001-go-modular-monolith-with-separately-scalable.md) | Go modular monolith with separately scalable run modes | Proposed |
| [ADR-0002](0002-next-js-web-app-as-bff.md) | Next.js web app as BFF with server-side sessions | Proposed |
| [ADR-0003](0003-postgresql-control-plane-with-shared-schema.md) | PostgreSQL control plane with shared-schema multi-tenancy and Row-Level Security | Proposed |
| [ADR-0004](0004-pluggable-analytics-engines-behind-a-semantic.md) | Pluggable analytics engines behind a semantic layer with a shared contract suite | Proposed |
| [ADR-0005](0005-postgresql-backed-durable-job-queue-and.md) | PostgreSQL-backed durable job queue and transactional outbox; Temporal optional | Proposed |
| [ADR-0006](0006-focus-1-2-as-normalization-baseline.md) | FOCUS 1.2 as normalization baseline with versioned mappings | Proposed |
| [ADR-0007](0007-fixed-point-decimal-money-end-to.md) | Fixed-point decimal money end-to-end | Proposed |
| [ADR-0008](0008-authorization-rbac-abac-via-cedar-policies.md) | Authorization: RBAC + ABAC via Cedar policies with SQL predicate compilation | Proposed |
| [ADR-0009](0009-keyless-cloud-federation-and-secret-references.md) | Keyless cloud federation and secret references | Proposed |
| [ADR-0010](0010-immutable-content-addressed-raw-storage-and.md) | Immutable content-addressed raw storage and atomic partition swap for restatements | Proposed |
| [ADR-0011](0011-api-first-rest-openapi-3-1.md) | API-first REST/OpenAPI 3.1 with standard error, pagination and idempotency conventions | Proposed |
| [ADR-0012](0012-plugin-model-compile-time-first-party.md) | Plugin model: compile-time first-party modules; out-of-process gRPC for third-party plugins | Proposed |
| [ADR-0013](0013-llm-gateway-with-tool-only-data.md) | LLM gateway with tool-only data access and semantic queries (no model-generated SQL) | Proposed |
| [ADR-0014](0014-hash-chained-append-only-audit-log.md) | Hash-chained append-only audit log | Proposed |
| [ADR-0015](0015-source-available-licensing.md) | Source-available licensing (replaces Apache-2.0 proposal) | Proposed (requires legal review) |
| [ADR-0016](0016-uuidv7-identifiers-and-utc-timestamps.md) | UUIDv7 identifiers and UTC timestamps | Proposed |
| [ADR-0017](0017-opentelemetry-native-observability.md) | OpenTelemetry-native observability | Proposed |

New ADRs: copy [template.md](template.md), take the next number, and open a PR labeled `adr`.
