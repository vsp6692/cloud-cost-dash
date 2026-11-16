# Phase 27 — API contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md) (RFC 9457 errors, `Idempotency-Key`, `ETag`/`If-Match`, cursor pagination, snake_case). Source of truth after implementation: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml). The §13 catalog lists `/api/v1/ai/conversations` and `POST /{id}/messages` for phases 27–28. Settings and provider-config endpoints are **new** and must be added to §13.

## 1. Endpoints

| Method & path | Permission | Status | Notes |
|---|---|---|---|
| `GET /api/v1/ai/settings` | `ai:configure` or `ai:use` (redacted view) | new | Returns `ai_settings`. `credential_ref` is never returned, only `credential_configured: true`. |
| `PATCH /api/v1/ai/settings` | `ai:configure` | new | Requires `If-Match`. Audited `ai.config.update`. Enabling requires a valid `provider_config_id`. |
| `GET/POST /api/v1/ai/provider-configs` | `ai:configure` | new | Create with `adapter`, `base_url`, `model`, `credential_ref`, `params`. `is_external` is computed server-side. |
| `PATCH/DELETE /api/v1/ai/provider-configs/{id}` | `ai:configure` | new | `If-Match`. Delete is refused (`409 conflict`) while the config is referenced by settings. |
| `POST /api/v1/ai/provider-configs/{id}:test` | `ai:configure` | new | Sends a fixed no-data prompt and returns latency and model id. Contains no tenant data. |
| `GET /api/v1/ai/conversations` | `ai:use` | §13 | Returns only the caller's conversations. Cursor pagination. |
| `POST /api/v1/ai/conversations` | `ai:use` | §13 | Accepts `Idempotency-Key`. Body `{ "title"?: string }`. |
| `GET /api/v1/ai/conversations/{id}` | `ai:use` (owner) | §13 | Returns messages and tool-call summaries. A non-owner or a cross-tenant caller gets `404`. |
| `DELETE /api/v1/ai/conversations/{id}` | `ai:use` (owner) or `ai:conversations:admin_delete` | §13 | Hard-deletes content and audits the deletion. |
| `POST /api/v1/ai/conversations/{id}/messages` | `ai:use` | §13 | Phase 27: `application/json` synchronous response. Phase 28 adds `Accept: text/event-stream`. |
| `GET /api/v1/ai/usage` | `ai:use` (self) / `ai:configure` (tenant) | new | Token usage against budgets. |

### Message request / response (Phase 27 shape)
```json
// POST /api/v1/ai/conversations/{id}/messages
{ "content": "Top 5 services by effective cost last month for team payments" }

// 200
{
  "message": {"id": "…", "role": "assistant", "content": "…", "prompt_version": "2026.11-1", "guardrail_flags": []},
  "tool_calls": [{
    "id": "…", "tool": "run_semantic_query", "authz_decision": "allow",
    "arguments": {"metrics": ["effective_cost"], "dimensions": ["service_name"], "filters": {"and": [{"dim":"hierarchy:team","op":"eq","value":"payments"}]},
                  "time": {"field":"charge_period_start","from":"2026-10-01","to":"2026-11-01","grain":"month"}, "limit": 5},
    "query_id": "q_…", "rows_returned": 5
  }],
  "usage": {"tokens_in": 1830, "tokens_out": 212, "user_daily_remaining": 197958}
}
```

### Errors (in addition to the standard set)
| HTTP | `code` | When |
|---|---|---|
| 404 | `not_found` | AI disabled for the tenant, operator flag off, or a non-owned or cross-tenant conversation (no oracle) |
| 403 | `ai_egress_denied` | The selected endpoint violates the egress policy (e.g. external under `local_only`) |
| 422 | `ai_limit_exceeded`, `sql_not_allowed`, `unsupported_query` | Returned to the model as tool errors. Surfaced to the client only if the turn ends unresolved. |
| 429 | `rate_limited`, `query_budget_exceeded` | Per-user RPM, daily or monthly token budget. Includes `Retry-After`. |
| 503 | `ai_provider_unavailable`, `ai_misconfigured` | Provider failure, or the secret ref cannot be resolved |

Rate-limit bucket: `ai` ([API_GUIDELINES §8](../../contracts/API_GUIDELINES.md)).

## 2. Internal interfaces
- `gateway.Gateway`, `gateway.ModelAdapter`, `tools.Tool` (see [DESIGN.md §1](DESIGN.md)).
- `semantic.AILimits{MaxRows:1000, MaxDims:6, MaxSpan: map[Grain]Duration, MaxCost: tenant budget, Timeout: 15s}`, passed to `analytics.Service.Query(ctx, q, secCtx, limits)`.
- Tool argument schemas: `schemas/ai/tools/*.schema.json` (new). The `run_semantic_query.query` field reuses `schemas/semantic/query.v1.json` by `$ref`.

## 3. Events
These new types will be added to the [EVENTS.md](../../contracts/EVENTS.md) catalog. They carry no prompt or answer content.

| Type | Producer | Consumers | Idempotency key |
|---|---|---|---|
| `dev.cloudledger.ai.settings.changed.v1` | ai | audit, UI cache invalidation | tenant + settings version |
| `dev.cloudledger.ai.budget.exceeded.v1` | ai | alerts (tenant admins) | tenant + user + budget window |
| `dev.cloudledger.ai.guardrail.triggered.v1` | ai | security monitoring, SIEM (Phase 31) | message id + flag |

## 4. SDK changes
None. AI tools are first-party only and are not exposed to plugins in v1.
