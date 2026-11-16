# Phase 01 — PRD, personas, acceptance criteria, licensing decision [LIC]: API contracts

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

## Summary: no API, event or SDK contracts are introduced or frozen in Phase 01

Phase 01 is a requirements and licensing phase. It produces no code, so it introduces **no endpoints, no events and no SDK interfaces**. Technical contracts are reviewed and frozen for v0.1 in [Phase 02](../phase-02/API_CONTRACTS.md).

## What Phase 01 freezes instead

| Artifact | Freeze level after Phase 01 | Owner | Change rule after freeze |
|---|---|---|---|
| Requirement IDs (FR-*, NFR-*) in [PRD.md](../../product/PRD.md) | **Frozen** (IDs) | Product owner | New IDs may be added; existing IDs never renumbered or reused; withdrawals marked Deprecated |
| Requirement text and priority | Baseline | Product owner | Change by PR with rationale and traceability-matrix update |
| Persona IDs PER-01…PER-10, journey IDs UJ-01…UJ-13 | **Frozen** (IDs) | Product owner | Same as requirement IDs |
| Product acceptance criteria AC-01…AC-11 | **Baseline** | Product owner + QA lead | Threshold changes require sign-off from the original approvers |
| Open-question decisions OQ-01…OQ-24 | Recorded | Decision approver per row | Superseded only by a new decision-log row |
| Reference scale and SLO targets | Baseline (provisional until Phase 34) | Architecture lead | Change by PR; Phase 34 benchmark may amend with evidence |

## Contract-relevant decisions taken in Phase 01 (inputs to Phase 02)

| Decision | Contract affected (Phase 02) |
|---|---|
| OQ-01 product name / trademark | CloudEvents type prefix `dev.cloudledger.*` ([EVENTS.md](../../contracts/EVENTS.md)), problem `type` URI domain ([API_GUIDELINES.md §3](../../contracts/API_GUIDELINES.md#3-errors-rfc-9457-problem-details)), manifest `apiVersion: cloudledger.dev/plugin/v1`, Go module path |
| OQ-21 license model | SPDX identifiers used in headers and capability manifests (`LicenseRef-CloudLedger-SAL-1.0` or PolyForm identifier) |
| OQ-22 Plugin Interfaces license (recommendation) | License of `sdk/*` interfaces, `api/openapi/`, `schemas/` ([LICENSE_MAP.md](../../legal/LICENSE_MAP.md)) |
| OQ-15 SaaS in scope (default) | Region-pinning fields, tenant `data_region` |
| OQ-13 reference hardware | Performance SLOs referenced by rate-limit and query-budget defaults |

## Reviewed but not changed
- [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md): checked only for consistency with PRD requirement IDs (e.g. money-as-string supports NFR-ACC-003; rate limits are operational, not license limits, consistent with NFR-LIC-004).
- [COMPATIBILITY.md](../../contracts/COMPATIBILITY.md): checked against NFR-CMP-001 (deprecation ≥ 2 minors).

## Permissions
Not applicable: no permission strings are defined in Phase 01. The permission catalog is owned by Phase 05.
