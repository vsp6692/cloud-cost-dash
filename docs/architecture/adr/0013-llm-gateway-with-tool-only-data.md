# ADR-0013: LLM gateway with tool-only data access and semantic queries (no model-generated SQL)

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
NL analytics is valuable but prompt injection and data exfiltration are real risks.

## Decision
`internal/ai` exposes a model-agnostic gateway (OpenAI-compatible, Anthropic, Ollama-compatible). Models can only call allow-listed **read-only tools** that execute through the normal API authorization as the requesting user. NL-to-query produces a semantic-query JSON validated against a schema and compiled by the semantic layer. Model output is never executed as SQL. Untrusted data is delimited. Responses carry citations and freshness.

## Alternatives considered
- Text-to-SQL against a read-only replica: rejected because ABAC cannot be guaranteed and there are resource-exhaustion risks.

## Consequences
- Less expressive than arbitrary SQL. Unsupported questions are refused with an explanation.
