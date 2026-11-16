# Phase 03 — Monorepo, local dev, CI, standards: Implementation plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Ordered work breakdown. Each task is a small, reviewable PR. Sizes: **S** ≤ 1 day, **M** 2–4 days, **L** ≥ 1 week. All paths are planned; none exist yet.

## Preconditions
- Phase 02 accepted (ADR-0001…0017 ratified, OQ-22 LICENSE_MAP designation confirmed).
- Phase 01 decisions recorded for OQ-03, OQ-05, OQ-17, OQ-23, OQ-24 (or explicit placeholders).
- Private GitHub repository with branch protection available. Repository stays private, all rights reserved.

## Tasks

| ID | Task | Files / directories | Size | Requirements |
|---|---|---|---|---|
| P03-T01 | Repository layout: create directories from README with a `README.md` per empty directory naming its owning phase; `.editorconfig`, `.gitignore`, `.gitattributes` | `apps/`, `internal/*/README.md`, `providers/`, `sdk/`, `database/`, `schemas/`, `deploy/`, `tests/`, `compliance/`, `scripts/` | S | P03-R01 |
| P03-T02 | [LIC] SPDX/REUSE foundation first, so every later file is born compliant: `REUSE.toml`, `LICENSES/LicenseRef-CloudLedger-SAL-1.0.txt` (copy of draft LICENSE.md), `LICENSES/Apache-2.0.txt` only if OQ-22 Option A; header templates for Go, TS, SQL, YAML, shell | `REUSE.toml`, `LICENSES/`, `tools/headers/` | S | P03-R16 |
| P03-T03 | Go module and command tree: `go.mod`, `cmd/cloudledger` (root, `api`, `worker`, `scheduler`, `migrate`, `admin`, `version`), `apps/api` and `apps/worker` thin mains; unknown mode exits non-zero; SIGTERM drain | `go.mod`, `cmd/cloudledger/`, `apps/api/main.go`, `apps/worker/main.go` | M | P03-R02 |
| P03-T04 | `internal/platform/config`: typed struct, defaults → YAML → env precedence, strict mode, secret redaction, `cloudledger admin config dump`, doc generator writing `docs/operations/CONFIGURATION.md` | `internal/platform/config/`, `docs/operations/CONFIGURATION.md` | M | P03-R03 |
| P03-T05 | `internal/platform/observability`: slog JSON handler with trace correlation, OTel providers (OTLP only if endpoint configured), Prometheus exporter on admin port, metric label guard rejecting `tenant_id` | `internal/platform/observability/` | M | P03-R05 |
| P03-T06 | `internal/platform/httpserver`: router, request-ID, recovery, OTel, security headers, RFC 9457 Problem Details writer, `/healthz`, `/readyz`, `/api/v1/version` | `internal/platform/httpserver/` | M | P03-R04 |
| P03-T07 | `internal/platform/db`: pgx pool, readiness probe (`SELECT 1` + schema version), `WithTenantTx` signature stub (returns `ErrNotImplemented`; implemented in Phase 04) | `internal/platform/db/` | S | P03-R04, P03-R09 |
| P03-T08 | ADR-0018 (migration tool) drafted; `cloudledger migrate up|status` wired to the chosen tool; `0001_bootstrap.sql` (extensions, roles, schema `cl`, default privileges); migration lint in CI | `docs/architecture/adr/0018-*.md`, `database/postgres/migrations/0001_bootstrap.sql`, `database/postgres/atlas.hcl` (if Atlas) | M | P03-R09 |
| P03-T09 | ADR-0019 (decimal library) drafted; `internal/platform/money` (`Decimal`, `Money`, JSON string codec, pgx codec, half-even helpers) with table tests | `docs/architecture/adr/0019-*.md`, `internal/platform/money/` | M | P03-R10 |
| P03-T10 | `nofloatmoney` analyzer and golangci-lint integration, with a seeded-violation fixture | `tools/lint/nofloatmoney/`, `.golangci.yml` | M | P03-R10 |
| P03-T11 | Import-lint rules B1–B6 (`.go-arch-lint.yml`, depguard config) and negative fixtures | `.go-arch-lint.yml`, `.golangci.yml`, `tools/lint/testdata/` | M | P03-R11 |
| P03-T12 | `internal/platform/{timeutil,ids,jobs}`: UTC clock, UUIDv7, `jobs.Queue`/`Handler`/`Job` interfaces + in-memory fake | `internal/platform/timeutil/`, `ids/`, `jobs/` | S | P03-R20 |
| P03-T13 | `apps/web` scaffold: Next.js App Router, TS strict, Tailwind, shadcn/ui, ESLint, Vitest, Playwright + axe-core, `messages/en.json`, `app/api/health/route.ts`, OpenAPI client generation script (`pnpm gen:api` from `api/openapi/cloudledger.v1.yaml`) | `apps/web/`, `pnpm-workspace.yaml`, `package.json` | M | P03-R07 |
| P03-T14 | Container images: `Dockerfile.go` (distroless static, UID 65532), `Dockerfile.web`; multi-arch buildx | `deploy/docker/` | S | P03-R06, P03-R12 |
| P03-T15 | Docker Compose Lite: postgres, minio, one-shot `migrate`, api, worker (`--with-scheduler`), web, optional otel-collector profile; health checks; `.env` generation by `make bootstrap` | `deploy/docker/compose.lite.yaml`, `deploy/docker/otel-collector.yaml` | M | P03-R06 |
| P03-T16 | `Makefile` with all planned targets (see below), including env-gated `test-cloud-*` stubs that print SKIPPED | `Makefile`, `scripts/dev/` | S | P03-R08 |
| P03-T17 | CI workflow `ci.yml`: fmt, lint, unit (`-race`, coverage), integration (Testcontainers PG), `.coverage-core.txt` gate wiring | `.github/workflows/ci.yml`, `.coverage-core.txt` | M | P03-R12 |
| P03-T18 | Security workflow `security.yml`: CodeQL (Go, JS/TS), Semgrep (default + `tools/lint/semgrep/`), Gitleaks (PR diff + scheduled full history, custom `clt_` rule), Trivy fs/config; waiver file with expiry | `.github/workflows/security.yml`, `.gitleaks.toml`, `compliance/security-waivers.yaml` | M | P03-R13 |
| P03-T19 | Images workflow `images.yml`: buildx amd64+arm64, Trivy image (vuln + license), Syft SBOM (SPDX, CycloneDX), Cosign keyless sign + SBOM attest on `main`; action-pin checker; Renovate/Dependabot | `.github/workflows/images.yml`, `scripts/ci/check-action-pins.sh`, `renovate.json` | M | P03-R14 |
| P03-T20 | [LIC] License compliance workflow: `compliance/allowed-licenses.txt`, `denied-licenses.txt`, `license-exceptions.yaml` + schema; `go-licenses check`; `scripts/compliance/check-npm-licenses.mjs`; `scripts/compliance/validate-exceptions.mjs`; `reuse lint`; negative fixtures | `.github/workflows/license-compliance.yml`, `compliance/`, `scripts/compliance/` | M | P03-R15, P03-R16 |
| P03-T21 | [LIC] CLA Assistant + DCO app configuration, `.github/CODEOWNERS` for legal paths, branch protection required checks list (documented; applied by an org admin) | `.github/CODEOWNERS`, `.github/cla.yml` (if action-based), `docs/contributors/DEVELOPMENT.md#branch-protection` | S | P03-R17 |
| P03-T22 | [LIC] NFR-LIC-004 scanner: Semgrep rules + `tests/compliance/nolicense_test.go` + seeded violation fixture; outbound-call-at-startup test (no network egress with default config) | `tools/lint/semgrep/no-license-enforcement.yml`, `tests/compliance/` | M | P03-R18 |
| P03-T23 | Engineering standards docs: `docs/contributors/DEVELOPMENT.md`, `CODING_STANDARDS.md`, PR template (security + licensing checklist), Conventional Commits check, `make docs-lint` (markdownlint, lychee, `scripts/docs/lint_ids.py` from Phase 01) | `docs/contributors/`, `.github/pull_request_template.md` | S | P03-R19 |
| P03-T24 | Fresh-checkout verification job (`fresh-clone.yml`, weekly + manual): clean runner, `git clone && make bootstrap && make build && make test`, timed against the 20-minute budget, on amd64 and arm64 | `.github/workflows/fresh-clone.yml` | S | P03-R08, P03-R01 |

Order rationale: T02 precedes all code so headers are present from the first file; T08/T09 ADRs are drafted early so reviewers can accept them before Phase 04 needs them.

## Make targets (planned)

| Target | Behaviour |
|---|---|
| `make bootstrap` | install pinned tools (`tools/go.mod`, pnpm), generate local `.env` with random DB/MinIO passwords |
| `make build` | `go build ./...`, `pnpm -r build`, images optional via `make images` |
| `make lint` | gofmt check, golangci-lint (incl. `nofloatmoney`, depguard), go-arch-lint, ESLint, tsc, Semgrep local rules |
| `make test` | `go test -race ./...` (unit), `pnpm -r test` (Vitest) |
| `make test-integration` | Testcontainers PostgreSQL (and MinIO from Phase 06) |
| `make test-contract` | OpenAPI conformance of implemented routes (health only in this phase) |
| `make test-e2e` | Playwright against `make up` stack (web health page + axe-core) |
| `make test-security` | Gitleaks, Semgrep, Trivy fs/config locally |
| `make license-check` | go-licenses, npm license script, exceptions validator, `reuse lint`, NFR-LIC-004 scan |
| `make docs-lint` | markdownlint-cli2, `lychee --offline docs/`, `python3 scripts/docs/lint_ids.py --check unique,traceability` |
| `make migrate-up` | `cloudledger migrate up` against the local stack |
| `make sbom` | Syft SBOM for built images |
| `make up` / `make down` | Compose Lite start / stop and remove volumes (`down` keeps volumes unless `CLEAN=1`) |
| `make test-cloud-aws|gcp|azure` | exit 0 with `SKIPPED (CLOUDLEDGER_IT_<P>=1 not set)`; real tests added in Phases 06–08 |

## Migrations
- `0001_bootstrap.sql` only. Sequence `0002`–`0009` reserved for Phase 03 fixes. No tenant tables.
- The migration runs as `cloudledger_migrator`. The app connects as `cloudledger_app` and must fail to create objects (asserted by P03-TC22).

## Feature flags
No product feature flags. Configuration keys introduced: `server.*`, `admin.*`, `database.*`, `objectstore.*` (connection only), `observability.*` (`otlp_endpoint` empty by default), `telemetry.enabled=false` (OQ-17), `config.strict` (default `true` in CI, `false` in dev). `features.*` namespace is created but empty.

## Rollout and rollback
- Rollout: merge to `main` behind branch protection; images are pushed only to the private registry; nothing is published.
- Rollback: revert the PR. `0001_bootstrap` is idempotent (`IF NOT EXISTS`) and can be re-applied; on a dev database, rollback is `make down CLEAN=1`.
- CI changes are introduced as non-required checks for one day of green runs, then made required.

## Definition of done
1. All tasks merged; `make lint test test-integration license-check docs-lint` green on `main` (planned commands; actual commands and results recorded in TEST_RESULTS.md).
2. Fresh-clone job green on amd64 and arm64 within budget.
3. Negative fixtures prove each gate fails when it should (denied license, missing SPDX, float in money package, forbidden import, leaked secret, NFR-LIC-004 violation, expired exception).
4. ADR-0018 and ADR-0019 accepted or alternatives recorded; DATABASE_SCHEMA.md and ADR-0007 notes updated.
5. CONFIGURATION.md generated and committed; CHANGELOG *Unreleased* updated.
6. No Phase 04 work started.
