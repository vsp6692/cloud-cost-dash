# Phase 09: Generic Imports (CSV, JSON/NDJSON, XLSX, Parquet)

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.2 (phases 06–14) |
| Depends on | Phase 06 (ingestion framework, raw storage, `source_objects`, `ingestion_runs`, staging + `Stage.Commit`, PG analytics baseline, minimal FOCUS core mapping); transitively 04, 05 |
| Primary PRD requirements | FR-IMP-001…004, FR-NRM-002, FR-NRM-004 (template versions), FR-ING-003, FR-ING-006 |
| Primary verification | Valid and malformed file corpus, attack-file corpus, parser fuzzing, golden data-quality reports |
| Key ADRs | [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md), [ADR-0010](../../architecture/adr/0010-immutable-content-addressed-raw-storage-and.md), [ADR-0006](../../architecture/adr/0006-focus-1-2-as-normalization-baseline.md), [ADR-0009](../../architecture/adr/0009-keyless-cloud-federation-and-secret-references.md), [ADR-0011](../../architecture/adr/0011-api-first-rest-openapi-3-1.md) |
| Provider doc | [GENERIC_IMPORTS.md](../../providers/GENERIC_IMPORTS.md) (authoritative for formats, template syntax, validation rules and DQ report shape) |

> No code exists yet. Everything below is a plan, not a shipped capability.

## Goal
Let a tenant load cost data that has no first-party connector (other clouds, SaaS vendors, data-centre chargeback, internal platform costs) from CSV/TSV, JSON, NDJSON, XLSX and Parquet files. Files can arrive by UI upload, API upload or object-store polling. They go through the **same** pipeline as cloud connectors: content-addressed raw storage, streaming parse, validation, a versioned mapping template, dedup, staging, control-total invariants and atomic swap. Each import produces a data-quality report. Parsing must be safe against hostile files.

## Scope
1. **Generic provider** (`providers/generic`): implements `BillingSource` for uploads and for object-store polling (S3/MinIO, GCS, Azure Blob) with read-only federated credentials.
2. **Import connectors**: one connector (`provider = generic`) per logical source, so health, restatement and lineage work as they do for cloud connectors.
3. **Safe streaming parsers** in `internal/platform/fileparse` (reused by Phase 10 invoice uploads and Phase 16/29 exports): CSV/TSV (gzip, zip), JSON array at a JSON pointer, NDJSON, XLSX (streaming SAX, XXE off), Parquet (row-group streaming).
4. **Mapping templates**: versioned `mapping_definitions` rows with a closed, side-effect-free expression language. Lifecycle `draft → published → retired`. Two built-in templates: "Simple cost CSV" and "FOCUS 1.2 CSV passthrough".
5. **Preview**: apply a template to the first 1 000 rows without writing anything.
6. **Validation** (file and row level) and a **data-quality report** per run (FR-IMP-003). Includes the control-total identity `source_sum = accepted_sum + rejected_sum` and a formula-neutralized rejected-row sample.
7. **Safety controls** (FR-IMP-004): size caps, decompression-ratio caps, XLSX XXE/billion-laughs protection, macro/external-link rejection, magic-byte sniffing, column/line/depth caps, zip-slip immunity.
8. **Safe tabular writer** (`fileparse/safewriter`): CSV/XLSX output with formula-injection neutralization. Used here for rejected samples and reused by every later export.
9. **Schema drift**: a header fingerprint change against the template's last import causes quarantine and an alert, unless the template opts into `schema_drift: additive`.
10. **Malformed-file and attack corpus** under `tests/fixtures/imports/`, plus Go native fuzzing per format.

## Out of scope
- Invoice import and reconciliation (Phase 10 reuses `fileparse` and the upload session).
- Full FOCUS conformance validator, re-normalization of earlier imports after a template version change, and tag-key normalization rules (Phase 11). This phase records `mapping_version` and leaves earlier versions readable.
- Backfill planning, retry/DLQ hardening, the health API and the period diff API (Phase 12). Polling uses the Phase 06 scheduler and checkpoints.
- Query-engine adapters (Snowflake, BigQuery-as-generic) and PDF parsing.
- ClamAV malware scanning beyond an optional hook interface (off by default, HA profile).
- XLS (binary BIFF), XLSM and ODS: these are **rejected**.

## Dependencies
| Kind | Item |
|---|---|
| Phases | 06 (pipeline, raw store, `Stage`, scheduler, checkpoints), 05 (permissions, ABAC, API tokens), 04 (RLS, audit, outbox), 03 (CI, fuzzing job, license checks) |
| External libraries (license-checked per [LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md)) | Parquet reader (`apache/arrow-go` or `parquet-go`), XLSX streaming reader (`excelize` stream API or a vetted SAX reader), `golang.org/x/text` encodings, object-store SDKs already used by 06–08 |
| Docs (may still be in progress) | [GENERIC_IMPORTS.md](../../providers/GENERIC_IMPORTS.md), [INGESTION_PIPELINE.md](../../architecture/INGESTION_PIPELINE.md), [FOCUS_NORMALIZATION.md](../../architecture/FOCUS_NORMALIZATION.md), [TRUST_BOUNDARIES.md](../../architecture/TRUST_BOUNDARIES.md), [security docs](../../security/README.md) |

## Deliverables
- `internal/platform/fileparse/{csv,jsonarr,ndjson,xlsx,parquet,archive,sniff,limits,safewriter}`
- `internal/billing/imports/` (upload sessions, import service, template engine, preview, DQ report builder)
- `internal/billing/mapping/expr/` (expression language: grammar, type checker, evaluator with step and memory budget)
- `providers/generic/` (BillingSource for upload and object-store polling, manifest)
- Migrations: `imports`, `import_upload_parts`, lifecycle columns on `mapping_definitions` (see DESIGN §3)
- API: `/api/v1/imports…`, `/api/v1/mappings…`, `GET /api/v1/ingestion/runs/{id}/quality`
- Fixture corpus and golden DQ reports, fuzz targets, built-in templates under `schemas/focus/mappings/generic/`
- Docs: GENERIC_IMPORTS.md finalized (expression grammar), user guide "Importing cost files", CHANGELOG

## Key risks
| Risk | Mitigation |
|---|---|
| Hostile files exhaust memory or disk (zip bombs, billion laughs, huge lines) | Streaming everywhere; ratio and absolute caps checked while streaming; per-job memory budget; fuzzing in CI |
| Float contamination from spreadsheets (`0.1+0.2`) | Use the XLSX cell's stored text; `x_precision_warning`; decimal-only parsing; float lint |
| Expression language turns into a code-execution surface | Closed grammar, no reflection or I/O, step and allocation budget, fuzzed parser |
| Partially written objects read during polling | Settle time, optional `_SUCCESS` marker or manifest requirement |
| CSV locale ambiguity (`1.520,40`) | Separators declared in the template; never guessed; reject with `DECIMAL_PARSE` |
| A deleted source object silently deletes cost data | Deletion only raises a warning; explicit "re-import period" action required |

## Documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: all tasks P09-T01…P09-T16 merged
- [ ] Tests: every P09-TC* executed, with real commands and evidence recorded in TEST_RESULTS.md (fuzzing run for ≥ the planned duration)
- [ ] Docs: GENERIC_IMPORTS.md (grammar), DATABASE_SCHEMA.md (new tables), OpenAPI, EVENTS.md (new events), user guide
- [ ] Security review: parser hardening, expression sandbox, upload path, object-store credentials, formula neutralization
- [ ] License check: new parser dependencies pass license CI (NFR-LIC-001)
- [ ] CHANGELOG entry under Unreleased (v0.2)
- [ ] Acceptance sign-off recorded in ACCEPTANCE.md
- [ ] Stopped at phase boundary: no Phase 10+ work started
