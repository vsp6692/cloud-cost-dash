# Phase 27 — Acceptance

Status: **NOT STARTED**. No criterion has been evaluated.

## Criteria

| ID | Criterion (measurable) | Evidence required | Requirements | PRD AC |
|---|---|---|---|---|
| P27-AC01 | All three adapters pass contract tests on recorded fixtures and produce identical neutral event sequences. The CI configuration contains no real provider endpoint or credential. | P27-TC01, TC02, TC28 results; CI config review | P27-R01, R19 | AC-06 |
| P27-AC02 | AI is off for 100% of newly created tenants. Enabling requires `ai:configure`. Secret values appear in 0 API responses, logs, audit records or prompts. | P27-TC03, TC04, TC05 | P27-R02, R03 | AC-03 |
| P27-AC03 | 0 non-allow-listed tool executions across all tests. Static check proves all tools are read-only. | P27-TC06, TC07, TC16 | P27-R04 | AC-06 |
| P27-AC04 | Cross-tenant and ABAC suites on the AI path: 0 rows outside the principal's tenant or scope. Refusals are indistinguishable for existing and non-existing out-of-scope entities. | P27-TC08, TC09, TC24, TC25, TC30 | P27-R05, R16 | AC-02 |
| P27-AC05 | 0 SQL statements originating from model output are executed (engine query log audit). All limit violations return typed errors. | P27-TC10, TC11, TC12, TC13 | P27-R06, R07 | AC-06 |
| P27-AC06 | Rate limits and token budgets are enforced before provider calls. When exhausted, 0 provider calls are made. The ledger fails closed. | P27-TC14, TC15 | P27-R08 | — |
| P27-AC07 | Prompt-injection corpus (≥ 150 cases) passes at 100%, with 0 forbidden tool calls, strings or scopes. | P27-TC16, TC17, TC18; corpus case count | P27-R09, R10, R11 | AC-06 |
| P27-AC08 | Egress policies are enforced: captured provider payloads under `aggregates_only` contain 0 resource IDs not named by the user. `local_only` makes 0 external connections. netguard blocks all SSRF targets in the test matrix. | P27-TC19, TC20, TC21, TC22 | P27-R12, R13, R14 | AC-02 |
| P27-AC09 | Retention purge deletes 100% of expired conversations. Owner-only access is verified. | P27-TC23, TC24 | P27-R15 | — |
| P27-AC10 | All scripted hallucination cases are flagged `ungrounded`. | P27-TC26 | P27-R17 | AC-06 |
| P27-AC11 | Telemetry contains no prompt content and no unbounded tenant labels. | P27-TC27 | P27-R18 | — |
| P27-AC12 | The tenant-enablement E2E passes with no axe-core violations. | P27-TC29 | P27-R02, R05 | AC-09 (partial UJ-13) |

## Exit gate
- Every P27-AC is met, with evidence linked in [TEST_RESULTS.md](TEST_RESULTS.md) (actual commands, commit SHAs).
- The security review of the AI threat model, egress and netguard is complete with no open critical or high findings.
- `docs/architecture/LLM_SECURITY.md` and the operator guide are updated. The OpenAPI diff is reviewed.
- Work stops at the phase boundary. Phase 28 is not started without approval.

## Known limitations (planned)
- Groundedness is a heuristic in this phase (monetary values only). Full numeric verification and citations come in Phase 28.
- Injection resistance is probabilistic for model behavior. Guarantees come from structure (read-only tools, authz as user, schema validation), not from model compliance.
- Provider tool-calling quality varies, especially for small local models. Unsupported questions are refused rather than answered approximately.
- Token counting for Ollama-compatible endpoints may be approximate when the server omits usage. A tokenizer estimate is used and labeled.

## Sign-off

| Role | Name | Date | Decision | Notes |
|---|---|---|---|---|
| Product owner | | | | |
| Tech lead | | | | |
| Security reviewer | | | | |
| QA lead | | | | |
| Privacy / DPO reviewer | | | | |
