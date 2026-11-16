# Phase 03 — Monorepo, local dev, CI, standards: API contracts

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Phase 03 implements the first three operations of [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml) (operations with `x-phase: "03"`) and establishes the cross-cutting conventions every later endpoint inherits. Conventions follow [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md); §13 lists health as Phase 03.

## 1. Endpoints

| Method | Path | operationId | Auth | Request | Response | Errors |
|---|---|---|---|---|---|---|
| GET | `/healthz` | `getLiveness` | none | — | `200 {"status":"ok"}` | none expected; process not running = connection refused |
| GET | `/readyz` | `getReadiness` | none | — | `200 {"status":"ready","checks":{"database":"ok","schema":"ok"}}` | `503` Problem Details, `code` = `unavailable`, `checks` map with failing reason (`db_unreachable`, `schema_behind`, `schema_ahead`, `draining`, `objectstore_unreachable` in worker mode) + `Retry-After: 5` |
| GET | `/api/v1/version` | `getVersion` | none (no secrets, no hostnames) | — | `200 {"version":"0.1.0-dev","commit":"<sha>","build_date":"<RFC3339>","schema_version":1,"api_version":"v1","go_version":"…"}` | `500 internal` (only `request_id`) |
| GET | `/api/health` (web BFF, not part of the public API) | — | none | — | `200 {"status":"ok"}` | — |
| GET | `:9090/metrics` (admin port, not public) | — | network-restricted | — | Prometheus text format | — |

Notes:
- `/healthz` and `/readyz` are outside `/api/v1` by design (orchestrator probes), are excluded from rate limiting and from access logs at INFO.
- `/readyz` details never include DSNs, hostnames or credentials.
- `/api/v1/version` deliberately exposes build metadata only. Operators may disable it (`server.expose_version=false` → `404`).

## 2. Cross-cutting conventions implemented in this phase
| Convention | Behaviour |
|---|---|
| Problem Details | `application/problem+json` with `type`, `title`, `status`, `code`, `detail`, `instance`, `request_id` (API_GUIDELINES §3). Unknown routes → `404 not_found`; panics → `500 internal`. |
| Request ID | Accept `X-Request-Id` if it matches `^[A-Za-z0-9._-]{1,64}$`, otherwise generate a UUIDv7; echo in response header and Problem Details. |
| Trace context | W3C `traceparent` accepted and propagated (ADR-0017). |
| Security headers | `X-Content-Type-Options: nosniff`; `Cache-Control: no-store` on `/api/*`; no CORS headers by default (§11). |
| Methods | `405` Problem Details with `Allow` header for wrong methods. |

## 3. Events
None. The outbox and event envelope (CloudEvents 1.0, [EVENTS.md](../../contracts/EVENTS.md)) are implemented from Phase 04.

## 4. SDK and interface changes
| Interface | Package | Stability |
|---|---|---|
| `jobs.Queue`, `jobs.Handler`, `jobs.Job` | `internal/platform/jobs` | internal; in-memory fake only; PG implementation in Phase 04 |
| `money.Decimal`, `money.Money` | `internal/platform/money` | internal; JSON contract = string amount + ISO 4217 currency |
| `config.Config` keys | `internal/platform/config` | operator-facing; documented in `docs/operations/CONFIGURATION.md`; renames require ≥ 2 minor-release aliases per [COMPATIBILITY.md](../../contracts/COMPATIBILITY.md) |
| CLI | `cloudledger api|worker|scheduler|migrate|admin|version` | operator-facing; exit codes: 0 ok, 1 runtime error, 2 config error, 64 usage error |
| `sdk/provider` | — | not touched (draft v0 starts in Phase 06) |

## 5. Contract verification
- The OpenAPI document is linted (`spectral` or `redocly lint`, planned in `make lint`).
- `make test-contract` (planned) validates live responses of the three operations against the OpenAPI schemas.
- `oasdiff` breaking-change check is wired in CI against `main` but non-blocking until v0.1 (pre-1.0 policy in COMPATIBILITY.md).
