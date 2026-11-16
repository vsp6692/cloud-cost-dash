# Phase 03 — Monorepo, local dev, CI, standards: Acceptance

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Acceptance is granted only on recorded evidence in [TEST_RESULTS.md](TEST_RESULTS.md). No criterion is met today.

## Acceptance criteria

| ID | Criterion (Given / When / Then or measurable) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P03-AC01 | **Given** a clean runner with no caches, **when** `git clone && make bootstrap && make build && make test` runs, **then** it succeeds in < 20 min on amd64 and arm64, the binary exposes all run modes, and the README layout exists | `fresh-clone.yml` run URLs (both arches), timing | P03-R01, P03-R02, P03-R08 | TC10, TC19, TC43 |
| P03-AC02 | **Given** a running api, **then** `/healthz`, `/readyz`, `/api/v1/version` behave per API_CONTRACTS incl. 503 reasons and draining | integration + contract test logs | P03-R02, P03-R04 | TC05–TC11 |
| P03-AC03 | **Given** `make up`, **then** all Lite services are healthy within 120 s, images are hardened, web shell passes axe-core | E2E log, `docker inspect` output, axe report | P03-R06, P03-R07 | TC15–TC18, TC44 |
| P03-AC04 | Logs are JSON with trace correlation; no outbound telemetry by default; `tenant_id` cannot be a metric label | unit logs, egress capture | P03-R05 | TC12, TC13 |
| P03-AC05 | Config precedence, strict mode, redaction and generated CONFIGURATION.md work as specified | unit test output; generator diff empty | P03-R03 | TC01–TC04, TC41 |
| P03-AC06 | ADR-0018 and ADR-0019 are reviewed; `0001_bootstrap` applies idempotently; app role cannot bypass RLS or run DDL; money package passes rounding tables | ADR PR links with decisions; integration logs | P03-R09, P03-R10 | TC21–TC24 |
| P03-AC07 | `nofloatmoney` and import-lint rules B1–B6 fail on every seeded violation and pass on the tree | lint output for fixtures and tree | P03-R10, P03-R11 | TC25–TC27 |
| P03-AC08 | All required CI jobs run on PRs, multi-arch builds succeed, branch protection blocks failing PRs | workflow URLs, branch-protection screenshot/export | P03-R12 | TC20, TC28 |
| P03-AC09 | CodeQL, Semgrep, Trivy, Gitleaks run and block on seeded findings; waivers expire | CI run URLs for each negative fixture | P03-R13 | TC16, TC29–TC31 |
| P03-AC10 | Actions SHA-pinned; SBOMs with license data produced; `cosign verify` succeeds for a `main` image with the expected OIDC identity | SBOM artifacts, cosign output | P03-R14 | TC32 |
| P03-AC11 | [LIC] Denied/unknown dependency licenses fail CI for Go, npm and images; exceptions validated with expiry | CI logs for TC33–TC36 | P03-R15 | TC33–TC36 |
| P03-AC12 | [LIC] `reuse lint` passes on the tree and fails on missing/wrong SPDX headers per LICENSE_MAP | lint output | P03-R16 | TC37 |
| P03-AC13 | [LIC] CLA and DCO checks are required and block unsigned PRs; CODEOWNERS enforces Licensor approval on legal paths; external PRs remain disabled until OQ-23 approval | scratch-PR run URLs, repo settings export | P03-R17 | TC38, TC39 |
| P03-AC14 | [LIC] NFR-LIC-004 scanner fails on seeded license-key/usage-limit code and passes on the tree; zero egress at startup | scanner output, egress capture | P03-R18 | TC14, TC40 |
| P03-AC15 | DEVELOPMENT.md, CODING_STANDARDS.md, PR template and `make docs-lint` exist and pass | doc links, lint output | P03-R19 | TC41 |
| P03-AC16 | Platform `timeutil`, `ids` and `jobs` interfaces exist with tests; in-memory fake only | unit output | P03-R20 | TC42 |

## Requirement coverage
| Requirement | AC |
|---|---|
| P03-R01 | AC01 |
| P03-R02 | AC01, AC02 |
| P03-R03 | AC05 |
| P03-R04 | AC02 |
| P03-R05 | AC04 |
| P03-R06, R07 | AC03 |
| P03-R08 | AC01 |
| P03-R09 | AC06 |
| P03-R10 | AC06, AC07 |
| P03-R11 | AC07 |
| P03-R12 | AC08 |
| P03-R13 | AC09 |
| P03-R14 | AC10 |
| P03-R15 | AC11 |
| P03-R16 | AC12 |
| P03-R17 | AC13 |
| P03-R18 | AC14 |
| P03-R19 | AC15 |
| P03-R20 | AC16 |

## Exit gate
Phase 03 is accepted when **all** of the following hold:
1. P03-AC01…AC16 are met with linked evidence; every P03-TC has a real result (no NOT RUN).
2. No open critical/high findings from CodeQL, Semgrep, Trivy or Gitleaks without an approved, unexpired waiver.
3. License compliance CI is green and required on `main` ([LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md)).
4. ADR-0018 and ADR-0019 have a recorded decision.
5. CHANGELOG updated; security review and acceptance sign-off recorded below.
6. Work stopped at the phase boundary (no tenant tables, no RLS policies, no identity code).

## Known limitations
- CodeQL may be unavailable for private repositories without GitHub Advanced Security; Semgrep then remains the mandatory SAST gate and the gap is recorded.
- SLSA provenance, `THIRD_PARTY_NOTICES` generation and ScanCode/ORT deep scans are deferred to Phase 38.
- SPDX copyright lines carry a Licensor placeholder until OQ-24 is resolved; interface-path identifiers depend on the OQ-22 outcome.
- CLA tooling is configured but external contributions stay disabled; the repository stays private and all rights reserved until the [publication gate](../../legal/LICENSING_EVALUATION.md#6-publication-gate) passes.
- Coverage gate (≥ 85 %) is wired but applies to no package yet (`.coverage-core.txt` empty).

## Sign-off
| Role | Name | Date | Decision |
|---|---|---|---|
| Architecture lead | | | |
| Engineering lead | | | |
| Security lead | | | |
| QA lead | | | |
| Licensor representative [LIC] | | | |
| Product owner | | | |
