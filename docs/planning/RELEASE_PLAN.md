# Milestone and Release Plan

Release checkpoints are **scope checkpoints, not calendar promises** (README). A release is cut only when all its phases are ACCEPTED and the release gate passes.

| Release | Phases | Theme | Who can use it | Release gate (in addition to phase acceptance) |
|---|---|---|---|---|
| **v0.1** | 01–05 | Foundations: requirements, architecture, repo/CI, tenancy, identity | contributors only (internal) | CI green incl. license compliance; RLS catalog test; authz matrix; repo remains private until the legal publication gate passes |
| **v0.2** | 06–14 | Multi-cloud ingestion → FOCUS → analytics → dashboards | early adopters (Lite) | Golden totals per provider (AC-01 subset); engine parity (AC-04); UJ-01/UJ-02 E2E |
| **v0.3** | 15–18 | Allocation, dashboard builder, budgets/anomalies, FX/commitments | FinOps teams | Allocation invariants; deterministic forecast/anomaly fixtures; accounting cases; UJ-03/UJ-04 |
| **v0.5** | 19–26 | Inventory, telemetry, recommendations, lifecycle | engineering teams | Rule contract tests; overlap invariant (AC-05); UJ-05/06/07 |
| **v0.7** | 27–30 | AI assistant, finance exports, period close | finance + AI users | AI safety corpus (AC-06); snapshot immutability; UJ-08/09/13 |
| **v0.9** | 31–37 | Enterprise identity, integrations, HA/DR, scale/security, SDKs, governance | enterprises, plugin authors | Restore drill (AC-07); SLO gates; pen test with no open critical/high; example plugins pass (AC-08); UJ-10/11/12 |
| **v1.0** | 38–40 | Certification, public docs, stable release | general availability | AC-01…AC-11 all pass; signed artifacts + SBOM; counsel-approved license in effect |

## Release mechanics
- SemVer pre-releases `v0.N.0-rc.K` → `v0.N.0`.
- Artifacts: multi-arch container images (`api`/`worker` single image + `web`), Helm chart, Compose bundle, SBOM (SPDX + CycloneDX), Cosign signatures, SLSA provenance, `THIRD_PARTY_NOTICES.md`.
- Release notes include: phases included, breaking changes, migrations, known limitations, security fixes, and the **license version** applying to the release.

## Publication policy
- The repository stays **private** until the publication gate in [LICENSING_EVALUATION.md §6](../legal/LICENSING_EVALUATION.md#6-publication-gate) passes (counsel approval, Licensor details, CLA tooling, license CI).
- Earliest intended public visibility: after v0.1 acceptance and the legal gate (decision for the Licensor).
