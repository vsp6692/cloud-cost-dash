# Prioritized Backlog

Priority: **P0** (blocks the next release) · **P1** (required for the release) · **P2** (should) · **P3** (could). Items are epics. Phase `IMPLEMENTATION.md` files break them into tasks (`PNN-T##`). Near-term items are detailed. Later items stay at epic level until their phase starts.

## Now: v0.1 (Phases 01–05)

| # | Item | Phase | Pri | Notes / acceptance hook |
|---|---|---|---|---|
| B-001 | Review and approve PRD, personas, requirement IDs (freeze) | 01 | P0 | P01 acceptance |
| B-002 | Resolve blocking open questions OQ-01…24 (accept defaults or decide) | 01 | P0 | decision log in OPEN_QUESTIONS.md |
| B-003 | Engage counsel. Decide license (OQ-21), plugin-interface license (OQ-22), CLA (OQ-23), Licensor entity (OQ-24) | 01 | P0 | publication gate |
| B-004 | Trademark clearance for product name | 01 | P1 | OQ-01 |
| B-005 | Confirm reference scale, SLOs and reference hardware | 01 | P1 | PRD §8, OQ-13 |
| B-006 | Privacy DPIA outline | 01 | P2 | NFR-PRIV-001 |
| B-007 | Ratify ADR-0001…0017; threat model review; contract freeze for v0.1 | 02 | P0 | P02 acceptance |
| B-008 | Monorepo scaffold (Go, Next.js, Makefile, Compose Lite, health endpoints, config, OTel) | 03 | P0 | fresh checkout builds |
| B-009 | CI: lint, unit, integration (Testcontainers), CodeQL, Semgrep, Trivy, Gitleaks, SBOM, signing | 03 | P0 | CI green |
| B-010 | License compliance CI: go-licenses, npm licenses, Trivy license, REUSE/SPDX, CLA + DCO, CODEOWNERS for legal paths | 03 | P0 | NFR-LIC-001…003 |
| B-011 | Import-lint module boundaries; decimal lib and migration tool selection | 03 | P1 | ADR-0001/0007 |
| B-012 | Tenancy schema + RLS + composite keys + migration helper + catalog test | 04 | P0 | FR-TEN-001, NFR-SEC-001 |
| B-013 | Hash-chained audit log + verifier; outbox; job queue tables | 04 | P0 | FR-AUD-001 |
| B-014 | Tenant lifecycle + platform admin APIs | 04 | P1 | FR-TEN-004 |
| B-015 | OIDC via BFF, sessions, API tokens | 05 | P0 | FR-IAM-001/007/010 |
| B-016 | Built-in and custom roles, Cedar authorizer, ABAC data scopes → predicate AST | 05 | P0 | FR-IAM-004…006 |
| B-017 | Authorization matrix test generator (role × permission × scope, ±) | 05 | P0 | AC-03 |

## Next: v0.2 (Phases 06–14)
| # | Epic | Phase | Pri |
|---|---|---|---|
| B-020 | Connector framework, verification, scope discovery, raw store, ingestion runs, staging/swap | 06 | P0 |
| B-021 | AWS CUR 2.0 Data Exports + Organizations + templates + fixtures | 06 | P0 |
| B-022 | GCP BigQuery export + WIF + templates + fixtures | 07 | P0 |
| B-023 | Azure exports + agreement types + federated credentials + templates + fixtures | 08 | P0 |
| B-024 | Generic file imports with safe parsing and DQ reports | 09 | P1 |
| B-025 | Invoice model, import and reconciliation foundation | 10 | P1 |
| B-026 | Full FOCUS 1.2 conformance, mapping versioning, re-normalization | 11 | P0 |
| B-027 | Backfill, restatements, retries, DLQ, health API | 12 | P0 |
| B-028 | Semantic layer + three engine adapters + parity suite | 13 | P0 |
| B-029 | Global/provider dashboards + onboarding wizard + E2E | 14 | P0 |

## Later (epic level)
| Release | Epics |
|---|---|
| v0.3 | B-030 allocation engine (15) · B-031 dashboard builder (16) · B-032 budgets/forecast/anomalies/basic alerts (17) · B-033 FX/commitments/unit economics/calendars (18) |
| v0.5 | B-040 inventory (19) · B-041 telemetry incl. K8s via OpenCost input (20) · B-042 recommendation SDK + native recs (21) · B-043 compute/K8s/serverless rules (22) · B-044 storage/DB/backup/log rules (23) · B-045 network rules (24) · B-046 commitments/regions/governance + overlap resolver (25) · B-047 lifecycle/approvals/realized savings (26) |
| v0.7 | B-050 LLM gateway + governed NL-to-query (27) · B-051 conversational analytics/reports (28) · B-052 finance exports/journal (29) · B-053 period close/scheduled reports/audit evidence (30) |
| v0.9 | B-060 SAML/SCIM/custom policies/MSP mode (31) · B-061 integrations/approvals (32) · B-062 HA/DR/observability (33) · B-063 scale/security/pen test (34) · B-064 provider SDK + plugin licensing checks (35) · B-065 other SDKs (36) · B-066 contributor program, CLA live, trademark, governance (37) |
| v1.0 | B-070 release certification incl. license gate (38) · B-071 public docs + reference deployments + approved license docs (39) · B-072 v1.0 + support policy + commercial licensing program ready (40) |

## Deferred / non-goals (see PRD §2.2)
Auto-remediation · commitment purchasing · non-AWS/GCP/Azure first-party connectors · sub-hourly cost · native mobile apps.
