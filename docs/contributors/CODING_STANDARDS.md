# Coding Standards

Status: **DRAFT plan**. No code exists yet. These standards are adopted in Phase 03, when the lint configuration (`.golangci.yml`, ESLint config, migration lint) is created to enforce them. Where a rule says "enforced by CI", the enforcement is planned, not existing.

Rules marked **MUST** block merge. **SHOULD** rules are reviewer judgment.

## 1. Go

### 1.1 Layout

- One Go module at the repository root (module path decided in Phase 03, OQ-01 dependent). SDK packages under `sdk/` are separate Go modules with independent SemVer ([COMPATIBILITY.md](../contracts/COMPATIBILITY.md)).
- Domain modules live in `internal/<module>/` ([REPOSITORY_LAYOUT.md](REPOSITORY_LAYOUT.md)). Each module exposes its public surface in `internal/<module>/api.go` (interfaces, DTOs, errors). Implementation lives in sub-packages (`store/`, `service/`, `http/`, `jobs/`).
- `package main` only under `apps/`. No business logic in `main`.
- File names `snake_case.go`; test files next to code; test fixtures in `testdata/`.
- Constructors take dependencies explicitly (`New(deps Deps) *Service`); no package-level mutable state, no `init()` side effects except registration of compile-time plugins.

### 1.2 Module boundaries

| Rule | Enforcement |
|---|---|
| `internal/platform` imports no other `internal/*` package | import-lint (`depguard` or `go-arch-lint`) MUST |
| Domain modules import other domain modules only through their `api.go` package, never sub-packages | import-lint MUST |
| No import cycles | compiler + import-lint |
| `providers/*` import only `sdk/provider` (and std/allowed libs), never `internal/*` | import-lint MUST |
| `sdk/*` (permissive-path candidate per [LICENSE_MAP.md](../legal/LICENSE_MAP.md)) never imports core packages | import-lint MUST |
| Business logic never contains engine-specific SQL for analytics; it uses the semantic layer (FR-ANL-002) | import-lint: only `internal/analytics/adapters/*` import ClickHouse/DuckDB drivers |
| Only `internal/platform/db` opens database connections and sets `app.tenant_id` | import-lint on `pgx` |

### 1.3 Errors

- Wrap with context: `fmt.Errorf("load connector %s: %w", id, err)`. Never discard errors; `errcheck` MUST pass.
- Domain errors are typed sentinels or structs in the module's `api.go` (`ErrNotFound`, `ErrConflict`, `*ValidationError`). The HTTP layer maps them to RFC 9457 problem types ([API_GUIDELINES.md](../contracts/API_GUIDELINES.md)); handlers never build ad-hoc status codes.
- Ingestion and job errors carry an error class (`transient`, `auth`, `permission_partial`, `data`, `not_ready`, `bug`) used for retry policy and metrics ([INGESTION_PIPELINE.md §3](../architecture/INGESTION_PIPELINE.md)).
- Error messages never include secrets, tag values, amounts or other tenant data.
- `panic` only for programmer errors at startup. Request and job boundaries recover panics, log them with stack trace, and return `internal` / classify as `bug`.
- Cross-tenant lookups return "not found", never "forbidden" (no existence oracles, [TENANCY.md](../architecture/TENANCY.md)).

### 1.4 Context

- `context.Context` is the first parameter of every function that does I/O, blocks or may be cancelled. Never stored in structs.
- Tenant identity travels as a typed `tenancy.TenantContext` (MUST); repository methods require it in their signature so a call without tenant scope does not compile. Never read the tenant from a global or from untyped context values in domain code.
- Every outbound call has a deadline (inherited or explicit). No `context.Background()` in request or job paths (lint rule).
- Long-running jobs check `ctx.Done()` between chunks and heartbeat their lease.

### 1.5 Logging and telemetry

- `log/slog` only, via the logger from `internal/platform/observability`; no `fmt.Print*` or `log.*` in non-test code (lint).
- Constant messages plus attributes: `logger.InfoContext(ctx, "ingestion run completed", slog.String("event", "ingestion.run.completed"), slog.Int64("rows", n))`. Use the `*Context` variants so trace and tenant IDs are attached.
- Follow the log schema, redaction rules, span names and metric naming in [OBSERVABILITY.md](../operations/OBSERVABILITY.md). Secrets use the `secret.Value` type, whose `LogValue()` returns `[REDACTED]`.
- New metrics MUST use bounded labels; tenant, user, connector and resource IDs are forbidden as labels (NFR-OBS-001).

### 1.6 Money and quantities

- Monetary amounts, prices, quantities, rates and allocation shares use the project decimal type (`internal/platform/money`, wrapping the decimal library chosen in Phase 03 per ADR-0007). **No `float32`/`float64` in finance packages** (`internal/billing`, `internal/finance`, `internal/allocation`, `internal/recommendations` savings code, `internal/forecasting` budget math, `internal/analytics` result handling). Enforced by a custom analyzer (MUST).
- Statistical models (forecasting, anomaly scores) may use floats internally, but values crossing into money (forecast amounts, thresholds) are converted to decimal at an explicit, tested boundary.
- Amounts always travel with a currency (`money.Amount{Value, Currency}`); arithmetic across currencies without an explicit FX conversion is a compile or runtime error.
- Rounding only at presentation or defined allocation steps, half-even by default, residuals assigned deterministically. JSON serializes money as strings.
- Time: UTC everywhere (`time.Time` in UTC; `timestamptz`); IDs are UUIDv7 (ADR-0016).

### 1.7 Concurrency and resources

- Use `errgroup` with context for fan-out; bound concurrency explicitly. No unbounded goroutines per row or file.
- Stream large inputs (row groups/chunks); respect the per-job memory budget. Close bodies and readers (`bodyclose` lint).
- Tests run with `-race` in CI.

### 1.8 Generated code

- Generated sources (OpenAPI server/client, sqlc queries, protobuf/gRPC, JSON Schema types, mocks) live in `gen/` sub-packages or files suffixed `_gen.go`, start with `// Code generated … DO NOT EDIT.` and are committed.
- Generators are pinned in `scripts/tools.versions` and run by `make generate`. CI fails if regeneration produces a diff.
- Generated files also carry SPDX headers (generator templates include them); see §6.
- Never hand-edit generated files; change the source (OpenAPI document, `.proto`, SQL) instead.

### 1.9 Style

`gofmt` + `goimports` (MUST); golangci-lint with at least `govet`, `staticcheck`, `errcheck`, `gosec`, `revive`, `bodyclose`, `contextcheck`, `depguard`, `forbidigo`, `gocritic`, `sqlclosecheck`, `nilerr`. Exported identifiers have doc comments. Prefer small interfaces defined by the consumer.

## 2. TypeScript and web (`apps/web`)

### 2.1 Language and tooling

- TypeScript `strict: true`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. No `any` (lint error; justified `unknown` + narrowing instead). No `@ts-ignore`; `@ts-expect-error` with a reason only.
- ESLint (typescript-eslint strict-type-checked, react, react-hooks, jsx-a11y, import ordering, a custom `no-hardcoded-strings` rule for i18n) and Prettier. Vitest for unit tests.
- API types are generated from the OpenAPI document (`make generate`); no hand-written request/response types for the CloudLedger API.

### 2.2 BFF and security

- The browser never receives API access tokens; the BFF holds the session and calls the API server-side (ADR-0002). Server-only modules import `server-only`.
- No secrets or internal URLs in `NEXT_PUBLIC_*` variables (lint).
- Money is received as strings and formatted with a decimal-safe formatter; never `parseFloat` on amounts (lint rule on finance components). Charts may convert to numbers for rendering only, with exact values in tooltips and tables.
- Untrusted strings (tags, resource names, AI output) are rendered as text; `dangerouslySetInnerHTML` is forbidden outside a reviewed sanitizer wrapper. Exports escape CSV formula characters.

### 2.3 Component conventions

- React Server Components by default; `"use client"` only where interaction requires it.
- UI primitives from shadcn/ui in `apps/web/components/ui/`; feature components in `apps/web/features/<feature>/`; charts through a single ECharts wrapper that applies theme, locale and accessibility settings.
- Components are named `PascalCase`, one component per file, props typed with an exported `…Props` type. Data fetching lives in server components or route handlers, not in leaf UI components.
- Every widget shows data freshness and completeness (FR-DSH-003) using the shared `Freshness` component.
- Tailwind utility classes; design tokens via CSS variables; no inline style colors.

### 2.4 Internationalization (NFR-I18N-001)

- All user-visible strings come from message catalogs (`apps/web/messages/<locale>.json`, ICU MessageFormat). English is the only locale at v1.0, but no literals in JSX (lint).
- Numbers, currencies and dates use locale-aware formatters with the tenant's reporting currency and timezone. Dates are stored and transmitted in UTC.

### 2.5 Accessibility (NFR-A11Y-001, WCAG 2.2 AA)

- Semantic HTML first; ARIA only when needed. All interactive elements keyboard-reachable with visible focus.
- Charts have an accessible data-table alternative and text summary; color is never the only carrier of meaning; contrast meets AA in light and dark themes.
- `jsx-a11y` lint plus axe-core checks in Playwright journeys ([TESTING_STRATEGY.md](TESTING_STRATEGY.md)); new pages need an axe assertion.

## 3. Protobuf, OpenAPI, JSON Schema

- OpenAPI 3.1 is the source of truth for REST (ADR-0011); follow [API_GUIDELINES.md](../contracts/API_GUIDELINES.md). `oasdiff` breaking-change check runs in CI.
- Protobuf for plugin gRPC: `buf lint` and `buf breaking` against the last release.
- JSON Schemas for manifests, semantic queries and events live in `schemas/` and are versioned per [COMPATIBILITY.md](../contracts/COMPATIBILITY.md).

## 4. SQL and migration conventions

| Rule | Detail |
|---|---|
| Location and naming | `database/<store>/migrations/NNNNNN_<verb>_<object>.up.sql` (6-digit sequence, `snake_case`), e.g. `000042_add_connectors_last_verified_at.up.sql`. No down migrations ([UPGRADES_AND_MIGRATIONS.md](../operations/UPGRADES_AND_MIGRATIONS.md)). |
| Immutability | a merged migration is never edited; fixes are new migrations |
| Expand/contract | breaking changes split across releases; N-1 binary must work with the new schema |
| Tenancy | every tenant-owned table: `tenant_id uuid NOT NULL`, `PRIMARY KEY (tenant_id, id)`, composite FKs, RLS enabled **and forced** via the migration helper ([DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md)); a catalog test fails otherwise |
| Types | money/quantity `numeric(38,12)` (ClickHouse `Decimal(38,12)`, DuckDB `DECIMAL(38,12)`); timestamps `timestamptz` in UTC; IDs `uuid` (v7); enums as `text` + `CHECK`; JSON as `jsonb` |
| Naming | tables plural `snake_case`; PK `pk_<table>` implicit; indexes `ix_<table>_<cols>`; unique `uq_<table>_<cols>`; checks `ck_<table>_<rule>`; FKs `fk_<table>_<ref>` |
| Locks | `SET lock_timeout = '5s'` at the top; `CREATE INDEX CONCURRENTLY` in its own non-transactional file; no table rewrites on hot tables |
| Queries in code | parameterized only (sqlc or pgx with args); no string concatenation of values; analytics SQL only via the semantic compiler |
| Comments | each migration starts with SPDX header, a one-line purpose, the phase and requirement IDs |
| Review | `database/**` requires a `finance-correctness` owner ([GOVERNANCE.md](../../GOVERNANCE.md)) |

## 5. Commit and PR conventions

- **Conventional Commits:** `type(scope): summary` with types `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `revert`; scope = module or area (`billing`, `web`, `providers/aws`, `legal`). Breaking changes use `!` and a `BREAKING CHANGE:` footer.
- Summary ≤ 72 characters, imperative mood; body explains why. Reference phase tasks and requirements (`Refs: P12-T04, FR-ING-005`).
- **DCO sign-off on every commit** (`git commit -s`) and a signed **CLA** ([CONTRIBUTING.md](../../CONTRIBUTING.md), [CLA.md](../../CLA.md)). CI `dco` and `cla` checks block merge.
- One logical change per PR; update CHANGELOG `Unreleased` and the relevant phase docs.
- AI-assisted code is held to the same standards; the contributor remains responsible for license provenance ([CONTRIBUTING.md §3](../../CONTRIBUTING.md)).

## 6. SPDX headers and license boundaries

Every source file (Go, TypeScript, SQL, shell, YAML workflows, protobuf, Dockerfiles) MUST carry the SPDX header that [LICENSE_MAP.md](../legal/LICENSE_MAP.md) assigns to its path, checked by `reuse lint` in CI. Do not copy header text from this document; take it from the license map, which is the single source of truth and is still pending legal review. Files that cannot carry comments (JSON, images, fixtures) are covered via `REUSE.toml`/`.reuse/dep5` annotations.

Moving code between a core path and a permissive-path candidate (`sdk/*`, `api/openapi`, `schemas/*`, `providers/examples`) requires the `license-boundary` label and Licensor review (LICENSE_MAP.md rule 2). New dependencies must satisfy [LICENSE_COMPLIANCE.md](../legal/LICENSE_COMPLIANCE.md).
