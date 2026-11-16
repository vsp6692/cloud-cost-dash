# Local Development

Status: **PLANNED for Phase 03**. None of the tooling below exists yet: there is no `Makefile`, no Compose file, no Go module and no web app. This document specifies what Phase 03 must deliver ("fresh checkout builds; CI green"). Commands are illustrative and will be confirmed in the Phase 03 `IMPLEMENTATION.md`.

## 1. Prerequisites (planned)

| Tool | Version policy | Purpose |
|---|---|---|
| Go | pinned in `go.mod` (`go` and `toolchain` directives) | backend |
| Node.js | current LTS, pinned in `.nvmrc` / `package.json` `engines` | web app |
| pnpm | pinned via `packageManager` in `package.json` (Corepack) | JS workspace |
| Docker Engine + Compose v2 | recent stable | dependencies, Testcontainers, Lite profile |
| GNU make | ≥ 4 | task runner |
| Optional: `kind` or `k3d`, `helm` | pinned in `scripts/tools.versions` | Helm chart testing |

Developer tools (golangci-lint, sqlc/oapi-codegen, buf, migrate tooling, reuse, go-licenses, gitleaks) are installed into `./.tools/` at pinned versions by `make tools`; nothing is installed globally. Supported dev hosts: Linux and macOS (amd64, arm64); Windows via WSL2.

## 2. First run (planned)

```bash
git clone <repo-url> cloudledger && cd cloudledger
make bootstrap        # tools, Go modules, pnpm install, git hooks (DCO sign-off reminder, SPDX check)
make dev-up           # start dependencies (PostgreSQL, ClickHouse, MinIO, OTel Collector, Mailpit, Dex)
make migrate          # apply control-plane and analytics migrations
make seed             # load the synthetic demo tenant and golden fixtures (no real data)
make run              # api + worker (embedded scheduler) + web with live reload
```

Then open `http://localhost:3000` and sign in through the local Dex OIDC provider with the seeded synthetic user. All credentials in the dev stack are development-only values in `deploy/docker/dev/.env.example`; they must never be reused anywhere else.

## 3. Local stack (planned `deploy/docker/compose.dev.yaml`)

| Service | Image (pinned by digest) | Port | Purpose |
|---|---|---|---|
| `postgres` | PostgreSQL (supported major) | 5432 | control plane, job queue, PG analytics schema |
| `clickhouse` | ClickHouse server | 8123 / 9000 | analytics engine (enable with `ANALYTICS=clickhouse`) |
| `minio` | MinIO | 9000 / 9001 | object storage |
| `otel-collector` | OTel Collector contrib | 4317 / 4318 | traces, metrics, logs |
| `prometheus`, `grafana`, `tempo`, `loki` | optional profile `observability` | 9090 / 3001 … | dashboards from `deploy/observability/` |
| `dex` | Dex | 5556 | local OIDC IdP with synthetic users |
| `mailpit` | Mailpit | 8025 | captures outbound email |
| `toxiproxy` | optional profile `chaos` | 8474 | failure injection |
| `fake-providers` | built from `tests/fixtures/providers/` | 8600 | fixture-backed AWS/GCP/Azure endpoints (S3-compatible exports, mocked billing and inventory APIs) |

The app processes (`api`, `worker`, `web`) run on the host for fast reload by default; `make dev-up-full` runs them in containers too, matching the Lite profile.

DuckDB runs in-process; select it with `ANALYTICS=duckdb make run`.

## 4. Make targets (planned)

| Target | Description |
|---|---|
| `make help` | list targets |
| `make bootstrap` / `make tools` | install pinned tools and dependencies |
| `make dev-up` / `dev-down` / `dev-reset` | start, stop, or wipe and restart the local stack |
| `make migrate` / `make migrate-new NAME=<desc> STORE=<postgres\|clickhouse\|duckdb>` | apply migrations / scaffold a new migration with SPDX header |
| `make seed` | load synthetic demo data |
| `make run` / `run-api` / `run-worker` / `run-web` | run processes with live reload |
| `make build` | build the `cloudledger` binary and the web app |
| `make image` | build container images locally (linux/amd64 and linux/arm64) |
| `make generate` | regenerate code from OpenAPI, protobuf, SQL and JSON Schema; CI fails if output differs |
| `make fmt` | `gofmt`/`goimports`, Prettier, SQL formatter |
| `make lint` | golangci-lint (incl. import-boundary and float-in-finance rules), ESLint, TypeScript `tsc --noEmit`, migration lint, OpenAPI lint |
| `make test` | unit tests (Go + Vitest), fast, no Docker |
| `make test-integration` | Testcontainers-based integration tests (Docker required) |
| `make test-contracts` | analytics parity, provider, recommendation and OpenAPI contract suites |
| `make test-security` | cross-tenant attack suite, authorization matrix, prompt-injection corpus |
| `make test-e2e` | Playwright journeys UJ-01…UJ-13 with axe-core against the Compose stack |
| `make test-perf` | k6 scenarios (local smoke size) |
| `make test-all` | everything above except perf |
| `make coverage` | coverage report with per-package thresholds |
| `make license-check` | dependency license policy (`go-licenses`, npm checker) per [LICENSE_COMPLIANCE.md](../legal/LICENSE_COMPLIANCE.md) |
| `make reuse` | SPDX header check (`reuse lint`) per [LICENSE_MAP.md](../legal/LICENSE_MAP.md) |
| `make sbom` | Syft SBOM (SPDX + CycloneDX) |
| `make secrets-scan` | gitleaks over the working tree |
| `make docs-check` | Markdown lint, link check, Mermaid render check |
| `make ci` | the local equivalent of the required PR checks (`lint test test-integration test-contracts license-check reuse`) |

`make lint test` is the minimum before every PR ([CONTRIBUTING.md](../../CONTRIBUTING.md)).

## 5. Test commands (planned)

| Goal | Command |
|---|---|
| One Go package | `go test ./internal/allocation/...` |
| One Go test | `go test ./internal/billing/... -run TestControlTotals -count=1` |
| Race detector | `go test -race ./...` (CI runs this) |
| Integration for one module | `make test-integration PKG=./internal/billing/...` |
| Analytics parity on one engine | `make test-contracts SUITE=analytics ENGINE=clickhouse` |
| Update golden files | `go test ./... -update` (review diffs carefully; financial goldens need `finance-correctness` approval) |
| Web unit tests | `pnpm --filter web test` (Vitest) |
| One E2E journey | `pnpm --filter e2e exec playwright test journeys/uj-01` |
| Property tests with more cases | `RAPID_CHECKS=10000 go test ./internal/allocation/...` |

## 6. Working with providers locally

- Default: fixture-backed fake providers (`fake-providers`), so no cloud account is needed. All E2E journeys run against fixtures (AC-09).
- Optional live testing against your own sandbox accounts: set credentials only in your shell or a local secret store, never in files under the repository. Live tests are tagged (`//go:build live`) and never run in PR CI. Report them separately from fixture-backed results.

## 7. Troubleshooting (planned)

| Symptom | Likely cause |
|---|---|
| Integration tests fail to start containers | Docker not running, or Testcontainers cannot reach the socket (set `DOCKER_HOST`) |
| `make generate` leaves a diff in CI | generated code not committed after an OpenAPI/proto/SQL change |
| `reuse lint` fails | new file without an SPDX header ([LICENSE_MAP.md](../legal/LICENSE_MAP.md)) |
| `depguard`/import-lint error | module boundary violation; see [CODING_STANDARDS.md §1.2](CODING_STANDARDS.md#12-module-boundaries) |
| `float` lint error in a finance package | use the decimal type (ADR-0007) |
