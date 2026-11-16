# Phase 02 — Architecture, ADRs, extension contracts [LIC: ADR-0015, license map]: API contracts

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

## Endpoints, events and SDK changes
**None are implemented in Phase 02.** No code exists. This phase reviews and **freezes** contracts so that Phases 03–08 implement against a stable baseline. The freeze is recorded in `docs/contracts/FREEZE_v0.1.md` (deliverable D5).

## Contracts reviewed and their freeze level

| Contract | Source | Freeze level at Phase 02 exit | Owner | Notes |
|---|---|---|---|---|
| URL base `/api/v1`, JSON `snake_case`, opaque UUIDv7 IDs, RFC 3339 UTC | [API_GUIDELINES §1](../../contracts/API_GUIDELINES.md#1-basics) | `frozen-v0.1` | API owner | ADR-0011, ADR-0016 |
| Money as `{"amount": "<decimal string>", "currency": "ISO4217"}` | API_GUIDELINES §1, ADR-0007 | `frozen-v0.1` | API owner + finance SME | clients never parse money as float |
| Authentication mechanisms (BFF session → bearer, `clt_<prefix>_<secret>` tokens) | API_GUIDELINES §2 | `frozen-v0.1` (format); details `draft-v0` until Phase 05 | security lead | token format feeds Phase 03 Gitleaks rule |
| Problem Details (RFC 9457) and `code` list | API_GUIDELINES §3 | `frozen-v0.1` | API owner | 404 for cross-tenant (no existence oracle) |
| Cursor pagination (signed, tenant-bound cursors) | §4 | `frozen-v0.1` | API owner | |
| Filtering/sorting syntax | §5 | `frozen-v0.1` | API owner | unknown filter → 422 |
| `Idempotency-Key` semantics (24 h, replay header, 409 on reuse) | §6 | `frozen-v0.1` | API owner | storage table designed in Phase 04 |
| ETag / If-Match (412) | §7 | `frozen-v0.1` | API owner | |
| Rate limiting (buckets, `RateLimit-*`, `Retry-After`) | §8 | `frozen-v0.1` | API owner | operational, not license limits |
| Long-running Operation resource | §9 | `frozen-v0.1` | API owner | `getOperation` moved to Phase 06 |
| Versioning and deprecation | §10, [COMPATIBILITY.md](../../contracts/COMPATIBILITY.md) | `frozen-v0.1` | API owner | pre-1.0 breaking changes listed under **Breaking** |
| Freshness `meta` on analytics responses | §12 | `draft-v0` | analytics owner | implemented Phase 13 |
| OpenAPI document | [`cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml) | conventions `frozen-v0.1`; operation bodies `draft-v0` | API owner | `x-phase` corrections below |
| CloudEvents 1.0 envelope, `tenantid`/`traceparent` extensions, `.vN` versioning | [EVENTS.md](../../contracts/EVENTS.md) | `frozen-v0.1` | events owner | type prefix `dev.cloudledger` placeholder pending OQ-01 |
| Event catalog payloads | EVENTS.md, `schemas/events/` | `draft-v0` | producing phase | phase column corrected (F-07) |
| Provider SDK interfaces and error taxonomy | [PROVIDER_SDK.md](../../contracts/PROVIDER_SDK.md) | `draft-v0` | SDK owner | v1 freeze in Phase 35 |
| Capability manifest | [CAPABILITY_MANIFEST.md](../../contracts/CAPABILITY_MANIFEST.md) | `draft-v0` | SDK owner | `license` field informational only |
| Analytics adapter interface and semantic query | [ANALYTICS_ADAPTERS.md](../../architecture/ANALYTICS_ADAPTERS.md) | `draft-v0` | analytics owner | Phase 06 implements the write-path subset only |
| Configuration key compatibility | COMPATIBILITY.md | `frozen-v0.1` (policy) | ops owner | keys themselves introduced from Phase 03 |

## OpenAPI `x-phase` corrections (change requests)

| operationId | Current `x-phase` | Proposed | Reason |
|---|---|---|---|
| `getOperation` | 12 | 06 | `verifyConnector` (06) returns `202` Operation |
| `listIngestionRuns`, `getIngestionRun` | 12 | 06 | Phase 06 ingestion framework needs run visibility; `cancelIngestionRun` stays 12 |
| `listConnectorScopes` | 07 | 06 | AWS Organizations scope discovery is Phase 06 |
| `syncConnector` | 12 | 12 (unchanged) | Phase 06 triggers first sync automatically; manual sync is Phase 12 |
| `verifyAuditChain` | 30 | 30 (unchanged) | Phase 04 ships a CLI verifier only |
| `verifyConnector` description | refers to health endpoint (12) | refers to `Connector.capabilities` | avoid dependency on Phase 12 |

## Event catalog phase corrections

| Event | Listed phase | First produced | Hardened |
|---|---|---|---|
| `connector.verified.v1` | 06 | 06 | — |
| `ingestion.run.completed.v1`, `ingestion.run.failed.v1` | 12 | 06 | 12 |
| `cost.period.normalized.v1` | 11 | 06 | 11 |
| `tenant.created.v1`, `tenant.deleted.v1`, `audit.anchor.written.v1` | 04 | 04 | — |

## Change control after the freeze
1. Open a change request in `FREEZE_v0.1.md` (contract, change, reason, compatibility class).
2. Contract owner approves; breaking changes to `frozen-v0.1` items also need architecture lead approval.
3. CHANGELOG entry under **Changed** or **Breaking**; affected phase API_CONTRACTS updated.
