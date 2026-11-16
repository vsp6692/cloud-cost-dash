# Testing Strategy

Status: **DRAFT plan**. No tests, fixtures or CI pipelines exist yet. Test infrastructure is delivered in Phase 03; suites grow phase by phase; the complete release suite is certified in Phase 38. Sources: README "Testing and definition of done", PRD §6–7 (NFR-*, AC-01…AC-11), [CLAUDE_MASTER_PROMPT.md](../../CLAUDE_MASTER_PROMPT.md) quality bar.

## 1. Principles

1. **Correctness over coverage.** A financial calculation is done when golden datasets reconcile exactly, not when a coverage number is reached.
2. **Every critical claim has an automated check:** totals (golden datasets), isolation (attack suite), authorization (matrix), engine parity (contract suite), journeys (Playwright).
3. **Deterministic tests.** Fixed clocks, seeded randomness (seed printed on failure), no network to real clouds in PR CI, UTC everywhere.
4. **Synthetic data only.** Fixtures are generated or hand-written; never real billing exports.
5. **Results are never fabricated.** Phase `TEST_RESULTS.md` records actual commands, environment, date and outcomes. Entries remain `NOT RUN` until executed. Tests skipped for lack of cloud credentials are reported as `SKIPPED (no credentials)`, never as passing. Copying results between runs, estimating numbers or marking a test passed without running it is a release-blocking defect.

## 2. Test pyramid

| Level | Share (approx.) | Runtime target | Location (planned) | Tools |
|---|---|---|---|---|
| Unit | ~70% | < 3 min total | next to code (`*_test.go`, `*.test.ts`) | Go `testing`, testify (assertions only), `rapid` (property), Vitest |
| Integration | ~20% | < 15 min | `tests/integration/`, module `*_integration_test.go` (build tag `integration`) | Testcontainers (PostgreSQL, ClickHouse, MinIO, Dex), Toxiproxy |
| Contract | — (gating) | < 20 min | `tests/contracts/{analytics,providers,recommendations,openapi}`, `sdk/*/testkit` | Go suites, Schemathesis/oasdiff |
| E2E | ~5% | < 30 min (sharded) | `tests/e2e/` | Playwright + axe-core against Compose stack with fake providers |
| Security | gating | < 20 min | `tests/security/` | Go + Playwright suites, prompt-injection corpus, ZAP baseline |
| Performance | scheduled + release | hours | `tests/performance/` | k6, query benchmarks |
| Failure injection / chaos | scheduled + release | hours | `tests/integration/faults`, `deploy/chaos/` | Toxiproxy, Chaos Mesh |

## 3. Test types

### 3.1 Unit tests
Pure functions and services with in-memory fakes (no mocks of the database for SQL logic; that belongs in integration tests). Table-driven, including negative and edge cases (empty input, boundary dates, month ends, leap years, DST irrelevance, max decimal scale, Unicode and injection strings as data).

### 3.2 Integration tests (Testcontainers)
Real PostgreSQL with migrations applied and RLS enforced under the application role (never a superuser), real ClickHouse, MinIO. Cover repositories, job queue semantics (leases, retries, unique keys, `SKIP LOCKED`), outbox relay, ingestion end-to-end on fixtures, atomic swap, restatement, migrations on seeded data. Containers are reused per package and each test uses its own tenant(s) for isolation.

### 3.3 Contract suites

| Suite | What it proves | Gate |
|---|---|---|
| **Analytics parity** (`tests/contracts/analytics`, FR-ANL-003, AC-04) | identical semantic queries return exactly equal decimal results on PostgreSQL, DuckDB and ClickHouse; NULL, time, restatement, isolation, limits, rounding, Unicode groups per [ANALYTICS_ADAPTERS.md §4](../architecture/ANALYTICS_ADAPTERS.md) | PR (if `internal/analytics` or `database/**` changed) + nightly + release-blocking |
| **Provider compatibility** (`sdk/provider/testkit`) | every connector honors its capability manifest; a declared but unimplemented capability fails (UJ-12); pagination, throttling, partial permissions, schema versions | PR for `providers/**`, release |
| **Recommendation** (`sdk/recommendation/testkit`) | deterministic fixtures per rule; evidence, confidence and savings fields; overlap: Σ net savings ≤ achievable savings (AC-05) | PR, release |
| **OpenAPI** (`tests/contracts/openapi`) | implementation matches the OpenAPI document (schema-driven requests and response validation); `oasdiff` reports no breaking changes against the last release | PR |
| **Events** | event payloads validate against `schemas/events`; version rules | PR |

### 3.4 Golden datasets
Per provider and per schema version (`tests/fixtures/golden/<provider>/<scenario>/`): raw input files, expected normalized totals by billing period × account × charge category × currency (AC-01), expected allocation outputs, invoices with expected reconciliation variances by category (NFR-ACC-002), FX and commitment amortization cases. Scenarios include restatements, late corrections, credits, refunds, taxes, marketplace, multi-currency and commitments. Golden expectation changes require `finance-correctness` approval and a written reason in the PR.

### 3.5 Property-based tests
Using `rapid` (Go) and fast-check (TS) for: allocation conservation (Σ allocated = Σ source, residuals deterministic), shared-cost splits, rounding residual assignment, recommendation overlap invariants, dedup-key stability, semantic-query compiler invariants (tenant predicate always present), decimal serialization round-trips, FX conversion consistency.

### 3.6 End-to-end (Playwright) with accessibility
One spec per user journey, run against the Compose stack with fixture-backed connectors (AC-09). Each journey also runs axe-core on every visited page and fails on WCAG 2.2 AA violations (NFR-A11Y-001).

| Journey | Spec focus (including alternate paths from PRD §4) |
|---|---|
| UJ-01 First-time setup | bootstrap admin, AWS connect, wrong ExternalId, no data yet, freshness on dashboard |
| UJ-02 Organization onboarding | three clouds, discovery, partial permissions, backfill progress |
| UJ-03 Budgets and anomalies | threshold alert, anomaly drill-down, channel failure → retry/DLQ |
| UJ-04 Allocation and chargeback | tag normalization, shared-cost preview/publish, untagged cost |
| UJ-05 Quick wins | filter, evidence, reduced confidence with missing telemetry |
| UJ-06 Recommendation lifecycle | approval, rejection, realized savings |
| UJ-07 Commitment analysis | amortized vs. billed, no double counting |
| UJ-08 Invoice reconciliation | variance categories, tolerance blocks close |
| UJ-09 Period close and audit | immutable snapshot, hash verification, mutation rejected |
| UJ-10 Operate the platform | Helm/Compose install smoke, OIDC, backup, restore drill, upgrade (partly outside the browser) |
| UJ-11 MSP multi-tenant | delegated roles, cross-tenant denial audited |
| UJ-12 Contributor builds a provider | scaffold → suite (CLI-driven, not browser) |
| UJ-13 AI assistant | cited answer, injection in tag values, unauthorized scope refusal |

### 3.7 Security tests

| Suite | Content | Requirement |
|---|---|---|
| Cross-tenant attack suite | every API route, analytics query, export, cache, object path, job and AI tool attempted with another tenant's IDs → 404, no data, audited | NFR-SEC-001, AC-02 |
| Authorization matrix | generated from role × permission × resource scope; positive and negative case per cell, including ABAC data scopes | AC-03 |
| Prompt-injection corpus | injections in tag values, resource names, descriptions, uploaded files; unauthorized-scope questions; assert no raw model SQL executed, tool allow-list enforced | FR-AI-006, AC-06 |
| RLS catalog test | every table with `tenant_id` has RLS enabled and forced | TENANCY.md |
| Redaction tests | canary secrets/emails/amounts never appear in logs or spans | OBSERVABILITY.md §4.2 |
| Input hardening | zip bombs, oversized files, XXE in XLSX, CSV formula injection, SSRF webhook destinations | INGESTION_PIPELINE.md §6 |
| No license enforcement | test asserts no license-check code paths or limits exist | NFR-LIC-004 |
| SAST/DAST | CodeQL, Semgrep, gosec, ZAP baseline on the E2E stack; external pen test in Phase 34 | NFR-SEC-002 |

### 3.8 Failure injection
Provider throttling (`429`, `Retry-After`), partial permissions, expired federation, truncated or corrupt files, delayed billing corrections, PG/ClickHouse/object-store outages, worker kill mid-swap, queue lease expiry, clock skew. Integration-level via Toxiproxy and fake providers; cluster-level chaos per [BACKUP_DR.md §8.2](../operations/BACKUP_DR.md#82-chaos-and-failure-injection-tests-phase-33).

### 3.9 Performance (k6)
Scenarios per profile at PRD §8 reference scale: dashboard query mix, metadata API, export, AI (with stub LLM), ingestion throughput (NFR-PERF-003), backfill under load, upgrade under load. Gates are the SLOs in [SLOS.md](../operations/SLOS.md) on reference hardware (OQ-13), run in Phase 34 and for release candidates. PR CI runs a small smoke variant only to catch large regressions.

### 3.10 Migration, backup and restore tests
Migration lint and lock-duration tests, N-1 compatibility, upgrade-path test, automated restore verification ([UPGRADES_AND_MIGRATIONS.md §7](../operations/UPGRADES_AND_MIGRATIONS.md#7-testing-upgrades-planned), [BACKUP_DR.md §6](../operations/BACKUP_DR.md#6-automated-restore-verification)).

## 4. Coverage policy

| Scope | Target | Notes |
|---|---|---|
| Core business logic (`internal/billing`, `finance`, `allocation`, `analytics` compiler, `authz`, `recommendations`, `forecasting`, `tenants`) | **≥ 85% meaningful line coverage** (NFR-MNT-001) | per-package gate; a PR may not lower a core package below 85% or by more than 1 point |
| Other Go packages | ≥ 70% guideline | not gating |
| Web | ≥ 70% for `lib/` and feature logic | components covered by E2E |
| Generated code, `main` packages | excluded | |

Coverage is a floor, not proof. Reviewers reject tests written only to raise coverage (assertion-free tests, snapshot dumps of financial results without expected values). Coverage never substitutes for golden datasets, parity, isolation or authorization suites. Releases are blocked by unresolved billing inaccuracies or critical/high security findings regardless of coverage.

## 5. Flaky-test policy

| Rule | Detail |
|---|---|
| Detection | CI records per-test outcomes; a test failing and passing on the same commit is flagged flaky |
| Retries | no automatic retries for unit, contract or security suites. E2E may retry once; a pass-on-retry is still reported as flaky |
| Quarantine | a flaky test is moved to a `quarantine` tag within 1 business day with an issue (owner, link to failures). Quarantine is not allowed for security, isolation, authorization, parity or golden-dataset tests: those are fixed or the change is reverted |
| Time limit | quarantined tests are fixed or deleted (with a replacement) within 14 days; the quarantine list is reviewed weekly and must be empty at release certification |
| Root causes to avoid | real time and sleeps (use fake clocks and polling with deadlines), shared tenants between tests, ordering assumptions in result sets, unpinned container images |

## 6. CI pipeline (planned GitHub Actions)

All actions pinned by SHA; workflows least-privilege (`permissions:` explicit). Required checks block merge.

| # | Stage | Trigger | Contents | Required on PR |
|---|---|---|---|---|
| 1 | `cla` | PR | CLA Assistant: every commit author has signed ([CLA.md](../../CLA.md)) | yes |
| 2 | `dco` | PR | `Signed-off-by` on every commit | yes |
| 3 | `secrets-scan` | PR, push | gitleaks on diff and history of the PR | yes |
| 4 | `reuse` | PR | `reuse lint`: SPDX headers per [LICENSE_MAP.md](../legal/LICENSE_MAP.md) | yes |
| 5 | `license-compliance` | PR, main, release | `go-licenses`, npm license checker, policy from `compliance/` ([LICENSE_COMPLIANCE.md](../legal/LICENSE_COMPLIANCE.md)) | yes |
| 6 | `lint` | PR | gofmt/goimports, golangci-lint (import boundaries, no floats in finance), ESLint, `tsc`, Prettier, migration lint, `buf lint`, OpenAPI lint, markdown/link check | yes |
| 7 | `generate-check` | PR | `make generate` produces no diff | yes |
| 8 | `unit` | PR | Go (`-race`) and Vitest, coverage gates | yes |
| 9 | `build` | PR | binary (linux/amd64, linux/arm64), web build, container images (not pushed) | yes |
| 10 | `integration` | PR | Testcontainers suites (sharded) | yes |
| 11 | `contracts` | PR (path-filtered) + nightly | analytics parity (all engines), provider, recommendation, OpenAPI (`oasdiff` breaking check), events | yes when paths match |
| 12 | `security` | PR | cross-tenant suite, authorization matrix, RLS catalog, redaction, prompt-injection corpus | yes |
| 13 | `sast` | PR, nightly | CodeQL (Go, TS), Semgrep, gosec | yes (no new high/critical) |
| 14 | `e2e` | PR (label or web/api changes) + main | Playwright UJ-01…UJ-13 + axe-core on Compose stack | yes on main merges queue |
| 15 | `image-scan` | PR, release | Trivy vulnerabilities + licenses on images | yes (no fixable critical) |
| 16 | `migrations` | PR touching `database/**` | lock-duration test, N-1 compatibility smoke | yes when paths match |
| 17 | `perf-smoke` | PR (label), nightly | small k6 run, regression threshold | no |
| 18 | `nightly` | schedule | full contracts, chaos/failure-injection, long property runs, DAST (ZAP), flaky detection report | — |
| 19 | `release` | tag | full suite, SLO gates (k6 at reference scale), upgrade-path test, restore verification, ScanCode/ORT deep license scan, SBOM (Syft, SPDX + CycloneDX), `THIRD_PARTY_NOTICES` generation, Cosign signing and attestations, SLSA provenance, CLA coverage report for release diff | release gate (Phase 38) |

The release gate also requires the legal publication conditions in [LICENSE_COMPLIANCE.md §5](../legal/LICENSE_COMPLIANCE.md#5-release-gate-phase-38).

## 7. Reporting test results

| Where | What |
|---|---|
| PR | CI check summaries; contributors paste the commands they ran locally in the PR template |
| Phase `TEST_RESULTS.md` | per test case `PXX-TC##`: status (`NOT RUN`, `PASS`, `FAIL`, `SKIPPED (reason)`, `BLOCKED`), command, commit SHA, environment, date, link to CI run or artifact |
| Release certification (Phase 38) | aggregated report from CI artifacts only |

A result without a reproducible command and CI or log evidence is treated as `NOT RUN`.
