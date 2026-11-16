# ADR-0008: Authorization: RBAC + ABAC via Cedar policies with SQL predicate compilation

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
We need role-based permissions, custom roles, and attribute-based data visibility (by account, project, tag or hierarchy) enforced consistently in the API, analytics and AI.

## Decision
Model permissions as `action` × `resource type`. Evaluate with an embedded Cedar engine (`cedar-go`) behind an `authz.Authorizer` interface. Data-level ABAC scopes compile into a predicate AST that the semantic compiler injects into every analytics query. Default deny. Every decision can be logged with policy IDs.

## Alternatives considered
- OPA/Rego sidecar: viable, but needs an extra process and Rego is harder to analyze.
- Hand-written role checks: rejected because they don't scale to custom roles.

## Consequences
- A policy test matrix (role × action × resource) is required.
- Predicate compilation must be proven equivalent to Cedar evaluation by tests.
