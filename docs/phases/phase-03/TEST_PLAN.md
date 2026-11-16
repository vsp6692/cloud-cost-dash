# Phase 03 — Monorepo, local dev, CI, standards: Test plan

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Every command below is **planned**: the Makefile and workflows are created in this phase. Results go to [TEST_RESULTS.md](TEST_RESULTS.md) only after real execution.

## Environments
| Env | Description |
|---|---|
| E1 local | Developer laptop (macOS/Linux), Docker, Go stable, Node LTS + pnpm |
| E2 CI | GitHub Actions `ubuntu-latest` (amd64) and arm64 runner (native or QEMU) |
| E3 Compose | `make up` Lite stack: PostgreSQL, MinIO, migrate, api, worker, web |
| E4 fresh clone | clean runner with no caches (`fresh-clone.yml`) |
| E5 scratch repo | throwaway private repo/branch for negative CI fixtures (CLA, CODEOWNERS, Gitleaks) |

## Test cases

| ID | Type | Description | Preconditions / fixtures | Expected result | Requirements |
|---|---|---|---|---|---|
| P03-TC01 | unit | Config precedence defaults → YAML → env | table test with temp YAML + `t.Setenv` | env wins over YAML, YAML over default | P03-R03 |
| P03-TC02 | unit (negative) | Unknown key in strict mode | YAML with `databse.url` | startup error exit 2 naming the key path | P03-R03 |
| P03-TC03 | unit (negative) | Invalid value types and ranges (port 70000, bad duration) | env overrides | exit 2, message contains key, no value echo for secret keys | P03-R03 |
| P03-TC04 | unit / security | Secret redaction in logs and `admin config dump` | `database.password=s3cr3t` | output shows `***`; grep of captured logs finds no `s3cr3t` | P03-R03 |
| P03-TC05 | integration | `/healthz` returns 200 with no dependencies | api started with PG stopped | 200 `{"status":"ok"}` | P03-R04 |
| P03-TC06 | integration | `/readyz` 200 when PG reachable and schema version == expected | Testcontainers PG + `migrate up` | 200, checks `database=ok`, `schema=ok` | P03-R04, P03-R09 |
| P03-TC07 | failure-injection | `/readyz` 503 when PG becomes unreachable, recovers when back | stop/start PG container | 503 `db_unreachable` + `Retry-After`; returns to 200 within 10 s; no DSN in body/logs | P03-R04 |
| P03-TC08 | integration (negative) | `/readyz` 503 `schema_behind` before migrations; `schema_ahead` beyond N-1 window | empty DB; DB migrated with a future test migration | correct reason codes | P03-R04, P03-R09 |
| P03-TC09 | contract | `/healthz`, `/readyz`, `/api/v1/version` validate against OpenAPI schemas; Problem Details on 404/405 | running api; OpenAPI doc | all responses schema-valid; `request_id` present | P03-R04 |
| P03-TC10 | unit | Run modes dispatch; unknown mode exits 64; `version` prints build info | built binary | expected exit codes and output | P03-R02 |
| P03-TC11 | integration / failure-injection | SIGTERM during in-flight request: `/readyz` → 503 `draining`, request completes, exit 0 within drain timeout | slow test handler | as stated; requests after drain start get connection refused/503 | P03-R02, P03-R04 |
| P03-TC12 | unit | Logs are JSON with `trace_id`, `span_id`, `request_id`; OTLP exporter disabled when endpoint empty | in-memory exporter | fields present; no exporter created | P03-R05 |
| P03-TC13 | unit (negative) | Metric label guard rejects `tenant_id` label | register gauge with `tenant_id` | registration error / test failure | P03-R05 |
| P03-TC14 | security | No outbound network calls at startup with default config (OQ-17) | run api/worker in a network namespace that logs egress (or `HTTP(S)_PROXY` sink) | zero egress attempts other than configured PG/MinIO | P03-R18 |
| P03-TC15 | E2E | `make up` brings all services healthy; web `/api/health` 200; `make down` cleans up | E3 | all health checks pass within 120 s | P03-R06, P03-R07 |
| P03-TC16 | security | Container hardening: non-root UID, read-only root FS, dropped caps, no shell in Go image; Trivy config scan clean | built images, compose file | `docker inspect` assertions pass; Trivy misconfig 0 high/critical | P03-R06, P03-R13 |
| P03-TC17 | unit | Web: Vitest smoke, TS strict compile, ESLint, i18n catalog lint (no hard-coded UI strings in components) | `apps/web` | all pass; seeded hard-coded string fixture fails lint | P03-R07 |
| P03-TC18 | E2E | Playwright opens web shell, axe-core reports no serious/critical violations | E3 | 0 serious/critical | P03-R07 |
| P03-TC19 | E2E | Fresh clone: `git clone && make bootstrap && make build && make test` on clean runner; layout directories present with owner-phase READMEs | E4 | success < 20 min; layout check script passes | P03-R01, P03-R08 |
| P03-TC20 | integration | CI pipeline runs all required jobs on a PR; branch protection blocks merge when any required job fails | E5, PR with failing unit test | merge blocked | P03-R12 |
| P03-TC21 | integration | `migrate up` on empty DB applies `0001_bootstrap`; re-run is a no-op; checksum file valid | Testcontainers PG | extensions and roles exist; second run 0 changes | P03-R09 |
| P03-TC22 | security | `cloudledger_app` has no BYPASSRLS/SUPERUSER/CREATEROLE/CREATEDB, cannot `CREATE TABLE`, does not own schema `cl` | after TC21 | `pg_roles`/`pg_namespace` assertions pass; DDL attempt fails with permission error | P03-R09 |
| P03-TC23 | unit (negative) | Migration lint rejects destructive change without expand/contract annotation (e.g. `DROP COLUMN`) and tampered migration checksum | fixture migrations | lint fails with explanatory message | P03-R09 |
| P03-TC24 | unit | `money` package: string JSON round-trip, half-even rounding table, no precision loss for 38,12 values, currency code validation | table tests incl. `0.125→0.12`, `0.135→0.14`, max-precision values | exact equality | P03-R10 |
| P03-TC25 | unit (negative) | `nofloatmoney` flags `float64` in `internal/billing/...` fixture; allows annotated exception | `tools/lint/nofloatmoney/testdata` | analysistest diagnostics as expected | P03-R10 |
| P03-TC26 | unit (negative) | Import-lint: `providers/aws` importing `internal/billing` fails (B3); domain→domain internals fails (B2); `internal/platform` importing a domain fails (B1) | `tools/lint/testdata` packages | lint fails for each with rule ID | P03-R11 |
| P03-TC27 | unit (negative) | Import-lint: permissive-path package importing a core package fails (B4); import cycle fails (B6); `apps/api` importing anything but `cmd/cloudledger` fails (B5) | fixtures | lint fails | P03-R11 |
| P03-TC28 | integration | Multi-arch images build for linux/amd64 and linux/arm64; binary runs `version` on both | buildx, QEMU or native arm64 | both succeed | P03-R12 |
| P03-TC29 | security | Semgrep default + custom rules run; seeded SQL string concatenation fixture is flagged | fixture | finding reported; job fails | P03-R13 |
| P03-TC30 | security (negative) | Gitleaks blocks a commit containing a fake AWS key pattern and a fake `clt_` token | E5 PR | job fails; secret not printed in logs | P03-R13 |
| P03-TC31 | security | CodeQL (Go, JS/TS) runs; Trivy vuln scan fails on seeded vulnerable dependency unless an unexpired waiver exists; expired waiver fails | fixture lockfile; `security-waivers.yaml` | expected pass/fail per case | P03-R13 |
| P03-TC32 | security | Supply chain: action-pin checker fails on tag-pinned action; SBOM (SPDX + CycloneDX) produced with license fields; `cosign verify` with expected identity succeeds on a `main` image; workflow `permissions` least-privilege | E2 | all assertions pass | P03-R14 |
| P03-TC33 | license (negative) | go-licenses fails on a Go dependency under a denied license (GPL-3.0 test module) | fixture module | job fails naming package + license | P03-R15 |
| P03-TC34 | license (negative) | npm license script fails on unknown/no-license package and on AGPL package | fixture `package.json` | fails | P03-R15 |
| P03-TC35 | license | Exceptions validator: valid MPL-2.0 exception passes; expired, missing approver, or malformed entry fails | fixture YAML files | as stated | P03-R15 |
| P03-TC36 | license | Trivy license scan of images reports no denied licenses outside documented base-image aggregation | built images | 0 denied | P03-R15 |
| P03-TC37 | license (negative) | `reuse lint` fails on a Go file without SPDX header and on a wrong identifier; passes on tree | fixture files | as stated | P03-R16 |
| P03-TC38 | license | CLA check: PR from an author without a CLA signature is blocked; DCO check fails without `Signed-off-by` | E5 | `cla/required` and DCO fail; merge blocked | P03-R17 |
| P03-TC39 | license | CODEOWNERS: PR touching `docs/legal/**` or `compliance/**` requires a Licensor-designated approver | E5 | review required from designated team | P03-R17 |
| P03-TC40 | license (negative) | NFR-LIC-004 scanner: seeded `validateLicenseKey` / `maxUsers` gate fixture fails; clean tree passes; quota package allow-listed | `tests/compliance/testdata/violation` | as stated | P03-R18 |
| P03-TC41 | doc-lint | `CONFIGURATION.md` is up to date with the config struct (generator diff empty); `make docs-lint` passes; PR template contains security + licensing checklist | E2 | no diff; exit 0 | P03-R03, P03-R19 |
| P03-TC42 | unit | `timeutil` always returns UTC; UUIDv7 monotonic within a ms and parseable; in-memory `jobs` fake honours `Handler` contract | unit tests | pass | P03-R20 |
| P03-TC43 | integration | `make test-cloud-aws|gcp|azure` without env vars report SKIPPED and exit 0; never reported as PASS | E2 | output contains `SKIPPED` | P03-R08 |
| P03-TC44 | failure-injection | Compose: kill worker container → restarts; api keeps serving; `/readyz` unaffected; graceful stop within drain timeout on `make down` | E3 | as stated | P03-R02, P03-R06 |

Cross-tenant tests do not apply: no tenant data exists until Phase 04. P03-TC22 lays the groundwork (app role cannot bypass RLS).

## Planned commands
```bash
make bootstrap                      # planned
make lint                           # planned: TC13, TC17, TC25–TC27
make test                           # planned: TC01–TC04, TC10, TC12, TC24, TC42
make test-integration               # planned: TC05–TC08, TC11, TC21–TC23
make test-contract                  # planned: TC09
make up && make test-e2e            # planned: TC15, TC18, TC44
make test-security                  # planned: TC14, TC16, TC29–TC31
make license-check                  # planned: TC33–TC37, TC40
make docs-lint                      # planned: TC41
make test-cloud-aws                 # planned: TC43 (expects SKIPPED)
gh workflow run fresh-clone.yml     # planned: TC19, TC28
```
TC20, TC30, TC32, TC38 and TC39 are executed as CI observations on scratch PRs; evidence = workflow run URL.

## Exit criteria for testing
All TCs recorded with real results. Negative tests must demonstrate the failure (a gate that never fails is not evidence).
