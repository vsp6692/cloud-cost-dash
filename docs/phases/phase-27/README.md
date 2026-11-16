# Phase 27 — LLM gateway and governed NL-to-query

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.7 (phases 27–30) |
| Depends on | [Phase 05](../phase-05/README.md) (OIDC, RBAC, ABAC), [Phase 13](../phase-13/README.md) (semantic layer, analytics adapters) |
| PRD requirements | FR-AI-001, FR-AI-002, FR-AI-003, FR-AI-004, FR-AI-006, FR-AI-008, NFR-SEC-001, NFR-PRIV-001 |
| Product acceptance | AC-02 (isolation, AI path), AC-06 (AI safety) |
| Primary verification | Prompt-injection corpus, RBAC/ABAC and cross-tenant tests against a deterministic mock LLM |

## Goal
Deliver a model-agnostic, tenant-configurable LLM gateway that lets an authorized user ask cost questions in natural language. The model can only call allow-listed **read-only tools**. These tools run as the requesting user through the same authorization and semantic compiler as the REST API. The model emits **semantic-query JSON only**. CloudLedger never executes model-generated SQL ([ADR-0013](../../architecture/adr/0013-llm-gateway-with-tool-only-data.md)).

## Scope
- `internal/ai/gateway`: provider-neutral chat/tool-calling interface, streaming, timeouts, retries, token accounting.
- Adapters: OpenAI-compatible (`/v1/chat/completions`), Anthropic Messages API, Ollama-compatible (`/api/chat`). A deterministic scripted **mock** adapter is used in CI.
- Per-tenant AI configuration in `tenant_settings.ai_settings`, **disabled by default** (OQ-16). Provider credentials are stored only as secret references (ADR-0009).
- Read-only tool registry: `semantic_catalog`, `run_semantic_query`, `get_freshness`, `list_recommendations`, `get_recommendation`, `list_anomalies`, `list_budgets`. Every tool call is authorized as the user (`ai:use` plus the tool's underlying permission) and recorded in `ai_tool_calls`.
- Governed NL-to-query: model output is validated against `schemas/semantic/query.v1.json` and AI limits (≤ 1 000 rows, time-span cap per grain, compiler cost estimate, 15 s timeout), then compiled with tenant and ABAC predicates injected.
- Limits: per-user and per-tenant request rate limits, daily and monthly token budgets, and a per-conversation tool-call cap.
- Prompt-injection defenses: untrusted-data delimiting, instruction hierarchy, tool allow-list, argument schema validation, output validation, and refusal templates.
- Data egress policy: `local_only` / `aggregates_only` / `allow_rows` with redaction and an external-provider opt-out. Egress goes through `internal/platform/netguard` and a per-tenant endpoint allow-list.
- Conversation store with retention (default 30 days, OQ-09), user and admin deletion, redaction at rest, and a purge job.
- Minimal API: AI settings, conversations, and non-streaming message exchange. SSE streaming, citations UI and report saving are delivered in Phase 28.

## Out of scope
- Citation rendering, uncertainty statements, SSE streaming UX and saving reports ([Phase 28](../phase-28/README.md)).
- Any write or mutating tool. AI mutations are prohibited (FR-AI-007).
- Model hosting or fine-tuning. Vector stores or RAG over raw cost rows.
- Provider-specific features beyond tool or function calling (vision, audio, batch APIs).

## Dependencies
| Dependency | Needed for |
|---|---|
| Phase 05 `authz.Authorizer`, principal, data scopes | Tool authorization as the user, ABAC predicate injection |
| Phase 13 semantic compiler, catalog, `Limits` | Query validation, compilation and execution |
| Phase 04 audit log, RLS, tenant context | Audit of config changes and denials; conversation isolation |
| Phase 17 `internal/platform/netguard` (assumed introduced there; hardened in Phase 32) | SSRF-safe egress to LLM endpoints |
| Phase 21 recommendations read API, Phase 17 anomalies/budgets read API | Read-only tools |

## Deliverables
- Go packages `internal/ai/{gateway,adapters/{openai,anthropic,ollama,mock},tools,guardrails,conversations,policy}`.
- Migrations `p27_*` (AI provider configs, usage ledger, conversation and tool-call extensions).
- OpenAPI additions for `/api/v1/ai/*` (see [API_CONTRACTS.md](API_CONTRACTS.md)).
- Prompt-injection corpus `tests/security/ai/prompt_injection_corpus/` (≥ 150 cases) and its harness.
- Admin UI: tenant AI settings page (provider, model, egress policy, budgets, retention).
- Docs: `docs/architecture/LLM_SECURITY.md` updates, operator guide `docs/operations/AI_GATEWAY.md`, egress allow-list examples.

## Key risks
| Risk | Mitigation |
|---|---|
| Prompt injection via tags, resource names or descriptions causes tool misuse or exfiltration | Delimited untrusted data, tools only read as the user, no write tools, output validation, corpus tests |
| Model generates invalid or overly expensive queries | Strict JSON Schema plus registry plus limits; compiler cost estimate; typed refusal |
| Data egress to third-party providers contrary to tenant policy | Disabled by default; `local_only` policy; aggregates-only minimization; netguard allow-list |
| Hallucinated numbers | Phase 27 groundedness checks on tool results; full numeric verification in Phase 28 |
| Provider API drift (tool-call formats) | Adapter contract tests on recorded fixtures; mock adapter in CI |
| Cost runaway | Token budgets, per-user rate limits, tool-call caps |

## Links
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md) · [PRD §5.17](../../product/PRD.md) · [ADR-0013](../../architecture/adr/0013-llm-gateway-with-tool-only-data.md) · [ADR-0008](../../architecture/adr/0008-authorization-rbac-abac-via-cedar-policies.md) · [LLM_SECURITY.md](../../architecture/LLM_SECURITY.md) · [TRUST_BOUNDARIES.md](../../architecture/TRUST_BOUNDARIES.md) · [ANALYTICS_ADAPTERS.md](../../architecture/ANALYTICS_ADAPTERS.md) · [TENANCY.md](../../architecture/TENANCY.md)

## Completion checklist
- [ ] Code merged
- [ ] Tests written and passing (results recorded in TEST_RESULTS.md)
- [ ] Docs updated (API, architecture, operations)
- [ ] Security review completed (AI threat model, egress, prompt injection)
- [ ] CHANGELOG updated
- [ ] Acceptance sign-off (ACCEPTANCE.md)
- [ ] Stopped at phase boundary — Phase 28 not started
