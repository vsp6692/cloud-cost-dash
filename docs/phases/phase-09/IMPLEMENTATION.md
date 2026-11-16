# Phase 09: Implementation Plan

Order matters: the safety primitives come before any parser, and parsers come before the import service. Each task is one or a few reviewable PRs, with tests in the same PR (execution rule C).

| ID | Task | Files / dirs | Size | Depends on |
|---|---|---|---|---|
| P09-T01 | `limits` budget types and typed errors; `sniff` magic-byte detection | `internal/platform/fileparse/{limits,sniff}/` | S | — |
| P09-T02 | Streaming gzip and single-entry zip with ratio/absolute caps, nested-archive rejection, entry-name isolation | `internal/platform/fileparse/archive/` | M | T01 |
| P09-T03 | CSV/TSV reader: RFC 4180, encodings (UTF-8, UTF-16 BOM, opt-in Windows-1252), header row index, line cap, source positions | `fileparse/csv/` | M | T01, T02 |
| P09-T04 | JSON-array-at-pointer and NDJSON readers with depth and line caps | `fileparse/{jsonarr,ndjson}/` | M | T01 |
| P09-T05 | XLSX streaming reader: XXE/DTD off, shared-strings cap, sheet selection, stored-text extraction, date-serial handling, macro/external-link rejection | `fileparse/xlsx/` | L | T01, T02 |
| P09-T06 | Parquet row-group reader: decimal/int/string/timestamp logical types, column/string caps | `fileparse/parquet/` | M | T01 |
| P09-T07 | `safewriter` CSV/XLSX with formula neutralization and money-column typing | `fileparse/safewriter/` | S | T01 |
| P09-T08 | Fuzz targets per reader plus a CI fuzz job (time-boxed per PR, longer nightly) | `fileparse/**/fuzz_test.go`, `.github/workflows/fuzz.yml` | S | T03–T06 |
| P09-T09 | Expression language: PEG grammar, type checker, decimal evaluator, budgets, depguard rule | `internal/billing/mapping/expr/`, `.golangci.yml` | L | — |
| P09-T10 | Migrations: `imports`, `import_runs`, `import_upload_parts`, `mapping_definitions` lifecycle columns, RLS variant for built-ins plus catalog-test allow-list | `database/postgres/migrations/<seq>_imports.{up,down}.sql` | M | — |
| P09-T11 | Template compiler, validation rules, DQ report builder, schema fingerprint, dedup key | `internal/billing/imports/{template,validate,dq,fingerprint}.go` | L | T09, T10 |
| P09-T12 | Upload sessions, parts, whole-file verification, `:start`, preview, period split, staging and swap via Phase 06 `Stage` | `internal/billing/imports/{service,upload,preview}.go` | L | T03–T07, T11 |
| P09-T13 | `providers/generic`: manifest, `BillingSource` for upload and object-store (S3/MinIO, GCS, Blob), settle time, marker/manifest gating, checkpoint `{key → etag}` | `providers/generic/` | M | T12 |
| P09-T14 | REST handlers + OpenAPI (`/imports`, `/mappings`, `/ingestion/runs/{id}/quality`), events, audit actions | `internal/billing/imports/http/`, `api/openapi/cloudledger.v1.yaml`, `schemas/events/import.*.json` | M | T12 |
| P09-T15 | Web upload wizard, template editor (form plus YAML view), preview grid, DQ report page | `apps/web/app/(app)/imports/`, `apps/web/components/imports/` | L | T14 |
| P09-T16 | Fixture corpus, golden DQ reports, built-in templates, docs (grammar in GENERIC_IMPORTS.md, user guide), CHANGELOG | `tests/fixtures/imports/{valid,malformed,attack,restatement,polling}/`, `schemas/focus/mappings/generic/`, `docs/` | M | all |

## Migrations
- Forward-only, expand-only in this phase (new tables and nullable or defaulted columns). The `.down.sql` drops only the new tables and columns and is used in CI rollback tests, not in production (DATABASE_SCHEMA conventions).
- The `ck_mapping_status` constraint is added `NOT VALID` and then `VALIDATE`d, to avoid a long lock on existing provider mapping rows from 06–08.

## Feature flags
| Flag | Default | Effect |
|---|---|---|
| `features.imports.enabled` | `true` in Lite, `true` in Standard | Hides the UI entry points and returns `404` on `/imports` when false |
| `features.imports.object_store_polling` | `false` until P09-AC02 passes | Disables scheduling of generic polling connectors |
| `features.imports.xlsx` | `true` | Emergency switch to reject XLSX if a parser CVE appears |
| `imports.limits.*` | see REQUIREMENTS P09-R11 | Operator-tunable caps (operational protections, not license limits) |

## Rollout
1. Merge T01–T08 behind no flag (library code only).
2. Enable uploads in dev and staging with the attack corpus run against the deployed worker.
3. Enable polling after P09-TC20…TC23 pass against MinIO and the GCS/Azurite emulators.

## Rollback
- Disable `features.imports.enabled`. Existing imported periods stay live and queryable.
- Data rollback for a specific bad import: re-import the previous file for that period (atomic swap) or use the Phase 12 period-version rollback when available.
- Schema rollback: not needed for an expand-only migration; the new tables can remain.

## Definition of done
- All P09-TC* executed and recorded with real commands. Fuzzing ran for the planned time with no unresolved crashers.
- Golden DQ reports and totals equal, with exact decimal comparison.
- `golangci-lint` clean, including the float lint for `internal/billing/...` and the depguard rule for `expr`.
- RLS catalog test green, including the documented built-in-template policy variant.
- OpenAPI diff reviewed (`oasdiff`). Event schemas validated.
- Security review notes linked in ACCEPTANCE.md. CHANGELOG updated. Stopped at the phase boundary.
