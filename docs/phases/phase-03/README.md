# Phase 03 — Monorepo, local dev, CI, standards: Overview

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

| Field | Value |
|---|---|
| Release checkpoint | v0.1 (phases 01–05) |
| Depends on | [Phase 02](../phase-02/README.md) (ratified ADRs, frozen v0.1 contracts, confirmed LICENSE_MAP designations) |
| Primary PRD requirements | FR-OPS-001, FR-OPS-002, NFR-MNT-001, NFR-SEC-005, NFR-PORT-001, NFR-OBS-001, NFR-ACC-003, NFR-LIC-001…004 |
| Primary verification | A fresh checkout builds and tests on a clean runner; CI (including license compliance) is green |
| Licensing marker | **[LIC]** license CI, SPDX headers, CLA/DCO, CODEOWNERS for legal paths |

## Goal
Create the first code in the repository: a buildable, testable, observable monorepo skeleton with local development (Docker Compose Lite), a complete CI pipeline (quality, security, supply chain and license compliance), and the engineering standards later phases rely on. **No business functionality is built in this phase.**

## Scope
1. Monorepo layout from the [README](../../../README.md#proposed-repository) reconciled with [ADR-0001](../../architecture/adr/0001-go-modular-monolith-with-separately-scalable.md): one Go module, one `cloudledger` binary (`cmd/cloudledger`) with run modes `api | worker | scheduler | migrate | admin`; `apps/api` and `apps/worker` are thin entrypoints that call the same command tree (see [DESIGN.md](DESIGN.md#2-layout-decision)).
2. `internal/platform/{config,observability,db,jobs,timeutil,ids,httpserver}` skeletons. `jobs` is an interface only (OQ-05 default, [ADR-0005](../../architecture/adr/0005-postgresql-backed-durable-job-queue-and.md)).
3. Health endpoints `GET /healthz`, `GET /readyz`, `GET /api/v1/version` ([API_GUIDELINES §13](../../contracts/API_GUIDELINES.md#13-resource-catalog-v1-overview)).
4. OpenTelemetry bootstrap (slog JSON logs, OTLP traces and metrics, Prometheus `/metrics`) ([ADR-0017](../../architecture/adr/0017-opentelemetry-native-observability.md)).
5. Configuration loading: `CLOUDLEDGER_*` environment variables plus an optional YAML file; `features.<name>` flags; `docs/operations/CONFIGURATION.md`.
6. `apps/web`: Next.js (App Router, TypeScript, Tailwind, shadcn/ui), pnpm workspace, a health route and an empty shell ([ADR-0002](../../architecture/adr/0002-next-js-web-app-as-bff.md)).
7. Docker Compose Lite skeleton (`deploy/docker`): PostgreSQL, MinIO, api, worker (embedded scheduler), web, optional OTel Collector (OQ-03 Lite first).
8. Migration tool decision (**ADR-0018**, proposed) and `0001_bootstrap` migration (extensions, database roles).
9. Decimal library decision (**ADR-0019**, proposed) and a lint rule that forbids binary floating point in money packages ([ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md)).
10. Import-lint module boundaries, including `providers/*` and `sdk/*` never importing `internal/*`, and permissive-path packages never importing core packages ([LICENSE_MAP rule 3](../../legal/LICENSE_MAP.md)).
11. CI on GitHub Actions (SHA-pinned): lint, unit, integration (Testcontainers), coverage, CodeQL, Semgrep, Trivy, Gitleaks, SBOM (Syft), Cosign keyless signing on `main`, multi-arch images.
12. **[LIC]** License compliance CI per [LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md): go-licenses, pnpm license check, Trivy license scan, `reuse lint` + SPDX headers, CLA Assistant + DCO, CODEOWNERS on legal paths, `compliance/` allow/deny/exception files, and an automated NFR-LIC-004 check (no license keys, usage limits or phone-home code).
13. Engineering standards: coding standards, commit and PR conventions, CHANGELOG discipline, branch protection.

## Out of scope
- Any tenant, identity, connector, billing or analytics logic (Phases 04+). No tenant tables; `0001_bootstrap` creates roles and extensions only.
- Helm chart and Standard/HA profiles (Phase 33; Standard Helm targeted by v0.2 per OQ-03 but not in this phase).
- Release pipeline, SLSA provenance, `THIRD_PARTY_NOTICES` generation gate and ScanCode/ORT deep scan (Phase 38). This phase only produces the SBOM per build.
- Real cloud credentials. `make test-cloud-*` targets are opt-in stubs.
- Accepting external pull requests: blocked until counsel approves the CLA (OQ-23). The repository remains **private, all rights reserved**.
- Publishing images or packages publicly.

## Dependencies
| Type | Dependency | Needed for |
|---|---|---|
| Phase | 02 accepted: ADR-0001…0017 ratified, v0.1 contracts frozen, OQ-22 LICENSE_MAP designation confirmed | layout, SPDX identifiers, import rules |
| Phase | 01 decisions: OQ-03 (Lite first), OQ-05 (PG queue), OQ-17 (no phone-home), OQ-23 (CLA terms), OQ-24 (Licensor name for SPDX copyright line) | config defaults, CLA tooling, headers |
| External | GitHub organization with Actions, CodeQL (GitHub Advanced Security for private repos), branch protection | CI |
| External | CLA Assistant app or `contributor-assistant/github-action`, DCO app | [LIC] |
| External | Container registry (private) supporting OCI artifacts and Cosign signatures; Sigstore keyless (Fulcio/Rekor) reachability from CI | signing |
| Tooling | Go (current stable), Node LTS + pnpm, Docker with buildx, `reuse` (Python), Syft, Trivy, Gitleaks, Semgrep | build and CI |

## Deliverables
- Go module, `cmd/cloudledger`, `apps/{api,worker,web}`, `internal/platform/*` skeletons
- `Makefile` with the targets listed in [IMPLEMENTATION.md](IMPLEMENTATION.md#make-targets-planned)
- `deploy/docker/compose.lite.yaml`, Dockerfiles (distroless, non-root)
- `database/postgres/migrations/0001_bootstrap.sql`
- ADR-0018 (migration tool) and ADR-0019 (decimal library), status Proposed until accepted at this phase's review
- `.github/workflows/{ci,security,license-compliance,images}.yml`, `.github/CODEOWNERS`, PR template
- `compliance/{allowed-licenses.txt,denied-licenses.txt,license-exceptions.yaml}`, `REUSE.toml`, `LICENSES/`
- `scripts/compliance/*`, `tools/lint/*` (custom analyzers and Semgrep rules)
- `docs/operations/CONFIGURATION.md`, `docs/contributors/DEVELOPMENT.md`, `docs/contributors/CODING_STANDARDS.md`

## Key risks
| Risk | Mitigation |
|---|---|
| Licensor entity (OQ-24) not yet known, so SPDX copyright lines are incomplete | Use `SPDX-FileCopyrightText: [LICENSOR LEGAL NAME]` placeholder centrally in `REUSE.toml`; one-line change when decided |
| OQ-22 unresolved at Phase 02 exit | Default all paths to `LicenseRef-CloudLedger-SAL-1.0`; `REUSE.toml` annotations make the switch to Apache-2.0 for interface paths a single change |
| Transitive dependency with unknown license blocks CI on day one | Exception workflow with expiry; prefer replacing the dependency |
| CodeQL unavailable on private repo without GHAS | Semgrep remains mandatory; CodeQL job marked optional with recorded reason |
| arm64 builds slow on emulation | Native arm64 runners if available; otherwise build multi-arch only on `main` |
| Over-engineering the skeleton | Strict out-of-scope list; only interfaces needed by Phases 04–06 |

## Phase documents
[REQUIREMENTS.md](REQUIREMENTS.md) · [DESIGN.md](DESIGN.md) · [IMPLEMENTATION.md](IMPLEMENTATION.md) · [API_CONTRACTS.md](API_CONTRACTS.md) · [TEST_PLAN.md](TEST_PLAN.md) · [TEST_RESULTS.md](TEST_RESULTS.md) · [ACCEPTANCE.md](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: all tasks P03-T01…P03-T24 merged in small reviewed PRs
- [ ] `make bootstrap && make build && make test` passes on a fresh clone on a clean runner (amd64 and arm64)
- [ ] `make up` brings the Lite stack to healthy; `make down` cleans up
- [ ] Tests: every P03-TC in [TEST_PLAN.md](TEST_PLAN.md) executed and recorded with real evidence in [TEST_RESULTS.md](TEST_RESULTS.md)
- [ ] Negative CI checks demonstrated (denied license, missing SPDX header, unsigned CLA, leaked secret, forbidden import, float in money package)
- [ ] ADR-0018 and ADR-0019 reviewed and accepted (or alternatives recorded)
- [ ] Docs: CONFIGURATION.md, DEVELOPMENT.md, CODING_STANDARDS.md, ADR index updated; DATABASE_SCHEMA.md "decided in Phase 03" notes resolved
- [ ] Security review: CI permissions (least-privilege `GITHUB_TOKEN`), secret handling, container hardening, Cosign identity policy
- [ ] [LIC] License compliance CI green; CODEOWNERS on legal paths active; CLA/DCO checks required on `main`
- [ ] [LIC] NFR-LIC-004 automated check present and green
- [ ] CHANGELOG.md updated under *Unreleased*
- [ ] Acceptance sign-off recorded in [ACCEPTANCE.md](ACCEPTANCE.md)
- [ ] Stopped at the phase boundary: no Phase 04 work (no tenant tables, no RLS policies) started
