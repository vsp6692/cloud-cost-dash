# Phase 27 — Implementation plan

Follow the phase execution rules A–H ([phase index](../README.md)). Write tests before or with each task. All commands below are **planned**. No code exists yet.

## Feature flags
| Flag | Default | Purpose |
|---|---|---|
| `features.ai_gateway` (`CLOUDLEDGER_FEATURES_AI_GATEWAY`) | `false` | Operator kill switch for the whole AI module. If false, `/api/v1/ai/*` returns `404`. |
| `features.ai_external_providers` (`CLOUDLEDGER_FEATURES_AI_EXTERNAL_PROVIDERS`) | `true` | Operator-level switch. When false, only non-external (local) endpoints are allowed, regardless of tenant settings. |

Flags are rollout and kill switches only. They are not license gating (NFR-LIC-004). Tenant-level enablement (`ai_settings.enabled`) stays `false` by default independently of the flags.

## Tasks

| ID | Task | Files / dirs | Size | Depends on |
|---|---|---|---|---|
| P27-T01 | Write the AI threat model delta in `docs/architecture/LLM_SECURITY.md`. Define the tool allow-list, egress policies and refusal taxonomy. | `docs/architecture/LLM_SECURITY.md` | S | — |
| P27-T02 | Add migrations `p27_001_ai_provider_configs.sql`, `p27_002_ai_usage_ledger.sql`, `p27_003_ai_conversation_ext.sql`. RLS catalog test is updated automatically. | `database/postgres/migrations/` | S | T01 |
| P27-T03 | Gateway interfaces, `ChatStream` normalization, turn loop with caps (8 tool calls, 60 s turn). | `internal/ai/gateway/` | M | T02 |
| P27-T04 | Mock adapter with YAML scripts, plus a fixture library for tests. | `internal/ai/adapters/mock/`, `tests/fixtures/ai/scripts/` | S | T03 |
| P27-T05 | OpenAI-compatible, Anthropic and Ollama adapters. Contract tests replay recorded HTTP fixtures (tool calls, streaming, errors, 429). | `internal/ai/adapters/{openai,anthropic,ollama}/` | L | T03 |
| P27-T06 | netguard integration: per-tenant endpoint allow-list, `is_external` classification at config-save and at dial time, DNS-rebinding pinning. | `internal/platform/netguard/`, `internal/ai/policy/` | M | T05 |
| P27-T07 | Tool registry and read-only tools. Static test asserts that tools depend only on `Reader` interfaces. | `internal/ai/tools/` | M | T03 |
| P27-T08 | NL-to-query validation: JSON Schema (`schemas/semantic/query.v1.json`), registry check, AI limits profile (`semantic.AILimits`), SQL-keyword rejection, compiler cost estimate. | `internal/ai/tools/query.go`, `internal/analytics/semantic/limits.go` | M | T07 |
| P27-T09 | Guardrails: prompt assembly, delimiting, output validation, groundedness check, refusal templates, `prompt_version`. | `internal/ai/guardrails/` | L | T03, T07 |
| P27-T10 | Egress policy, minimization and redaction pipeline. | `internal/ai/policy/` | M | T07, T09 |
| P27-T11 | Budgets and rate limits (token bucket in PG via `ai_usage` plus an in-memory front cache; fail-closed). | `internal/ai/policy/budget.go` | M | T02 |
| P27-T12 | Conversations: store, owner checks, retention, purge job (`ai.purge` queue, daily), user and admin delete. | `internal/ai/conversations/`, `apps/worker` job registration | M | T02 |
| P27-T13 | API handlers and OpenAPI: settings, provider configs, conversations, messages (JSON response; SSE in Phase 28). | `apps/api/handlers/ai/`, `api/openapi/cloudledger.v1.yaml` | M | T03–T12 |
| P27-T14 | Cedar policy additions: `ai:use`, `ai:configure`, `ai:conversations:admin_delete`. Built-in role mapping (tenant owner and FinOps admin: configure; all non-auditor roles: use; auditor: none by default). | `internal/authz/policies/` | S | T13 |
| P27-T15 | Admin UI: AI settings (provider, model, test connection, egress policy, budgets, retention, tool toggles). Minimal chat panel without streaming. | `apps/web/app/(tenant)/settings/ai/`, `apps/web/components/ai/` | M | T13 |
| P27-T16 | Prompt-injection corpus (≥ 150 cases, YAML) and harness. Cross-tenant and ABAC suites for the AI path. | `tests/security/ai/prompt_injection_corpus/`, `tests/security/ai/` | L | T09–T13 |
| P27-T17 | Observability: spans, metrics, redacted debug logs. | `internal/ai/...` | S | T03 |
| P27-T18 | Docs: operator guide `docs/operations/AI_GATEWAY.md`, user guide, CHANGELOG. | `docs/` | S | all |

## Planned commands
```
make lint                                                     (planned)
go test ./internal/ai/... ./internal/platform/netguard/...    (planned)
go test -tags=integration ./tests/integration/ai/...          (planned; Testcontainers PG + ClickHouse)
go test ./tests/security/ai/... -run TestPromptInjectionCorpus (planned; mock LLM only)
go test ./tests/contracts/ai/...                              (planned; recorded provider fixtures)
pnpm --filter web test && pnpm --filter web exec playwright test ai-settings (planned)
```

## Rollout
1. Merge migrations (expand only). No behavior change while the flag is off.
2. Enable `features.ai_gateway` in staging with the mock adapter. Run the corpus and isolation suites.
3. Run the manual live-provider smoke test with a test tenant (opt-in, outside CI). Record it in TEST_RESULTS as a manual entry.
4. Release with the flag default `false` for v0.7-rc. Operators enable it explicitly. Tenants still opt in individually.

## Rollback
- Set `features.ai_gateway=false`. Endpoints disappear and no outbound LLM traffic occurs. Data stays in place.
- Migrations are additive. The contract step (dropping columns) is never needed for rollback. To remove data entirely, purge AI tables per tenant with `cloudledger admin ai purge --tenant <id>` (planned).

## Definition of done
- All P27-R requirements map to passing tests in TEST_RESULTS.md, with actual commands and commit SHAs.
- The corpus produces 0 unauthorized tool calls, 0 cross-scope leaks and 0 SQL executions.
- `grep`-based CI check: there is no code path from `internal/ai` to `database/sql`, `pgx` or analytics adapter `Execute` except through `analytics.Service` with a `SecurityContext`.
- The security review is signed off. LLM_SECURITY.md is updated. OpenAPI diff is reviewed.
- Stopped at the phase boundary.
