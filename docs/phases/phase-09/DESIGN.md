# Phase 09: Design

Authoritative behaviour (formats, template syntax, validation table, DQ report): [GENERIC_IMPORTS.md](../../providers/GENERIC_IMPORTS.md). This document covers phase-level component design, data model changes, sequences, security and failure modes.

## 1. Components and packages

| Package | Responsibility | Depends on |
|---|---|---|
| `internal/platform/fileparse/sniff` | Magic-byte detection (PK zip, gzip `1f8b`, `PAR1`, UTF BOMs, JSON/NDJSON heuristics) | — |
| `internal/platform/fileparse/limits` | `Budget` type: byte, decompressed-byte, ratio, rows, line length, depth, memory counters; returns typed `LimitExceeded{kind}` | — |
| `internal/platform/fileparse/archive` | gzip and single-entry zip readers that enforce the ratio while streaming; entry names never touch the file system | limits |
| `internal/platform/fileparse/{csv,jsonarr,ndjson,xlsx,parquet}` | Streaming `RecordReader` → `iter.Seq2[Record, error]`; `Record` = ordered `(column, rawString, cellKind)` plus source position | limits, archive |
| `internal/platform/fileparse/safewriter` | CSV/XLSX writer with formula neutralization and money-column typing (reused by Phase 10, 16, 29, 30) | — |
| `internal/billing/mapping/expr` | Expression grammar (PEG), type checker, evaluator (decimal via `apd`), step and allocation budget | `platform/decimal` |
| `internal/billing/imports` | Upload sessions, import service, template compiler, preview, row validator, DQ report builder, schema fingerprinting | fileparse, expr, billing ingest framework (06) |
| `providers/generic` | `Provider` + `BillingSource` for `upload` and `object_store` sources; manifest `capabilities.billing.sources: [upload, s3, gcs, azblob]` | `sdk/provider` only |
| `apps/web/app/(app)/imports/…` | Upload wizard (select connector or create one → choose or create template → preview → start), import list, DQ report view | API |

The generic provider does not import `internal/*` (SYSTEM_CONTEXT dependency rule 4). Parsing happens in the core worker, which streams bytes from the provider's `ArtifactReader` into `fileparse`.

```mermaid
flowchart LR
  UI[Web upload wizard] -->|BFF| API[api: /imports, /mappings]
  CLI[API client + token] --> API
  API -->|parts| OBJ[(object storage<br/>uploads/{tenant}/{import}/part-n)]
  API -->|:start → enqueue ingest.import| Q[(jobs)]
  SCH[scheduler] -->|poll connector| Q
  Q --> W[worker: ingest]
  W -->|ListArtifacts/OpenArtifact| GP[providers/generic]
  GP -->|LIST/GET read-only| COS[(customer object store)]
  W -->|stream + sha256| RAW[(raw/{tenant}/{connector}/billing/{period}/{sha256})]
  W --> FP[fileparse readers]
  FP --> TM[template engine expr]
  TM --> V[row validator]
  V -->|accepted| ST[analytics Stage]
  V -->|rejected| RS[rejected sample via safewriter]
  ST --> INV[invariants + control totals]
  INV -->|ok| SW[Stage.Commit swap]
  INV -->|fail| FV[failed_validation]
  SW --> DQ[(data_quality_reports)]
  SW --> OB[outbox: import.completed, cost.period.normalized]
```

## 2. Upload sequence

```mermaid
sequenceDiagram
  autonumber
  participant C as Client (BFF or API token)
  participant A as API
  participant O as Object storage
  participant Q as Job queue
  participant W as Worker
  C->>A: POST /imports {connector_id, mapping_ref, file_name, size, sha256, format} + Idempotency-Key
  A->>A: authz imports:write; size ≤ cap; format allowed
  A-->>C: 201 {id, status: awaiting_upload, part_size, upload_urls? }
  loop parts
    C->>A: PUT /imports/{id}/parts/{n} (≤ 64 MiB, Content-SHA256)
    A->>O: put uploads/{tenant}/{id}/part-n
  end
  C->>A: POST /imports/{id}:start (If-Match)
  A->>A: verify part hashes + whole-file sha256, sniff first 8 KiB
  A->>Q: enqueue ingest.import(tenant, connector, import_id) [unique_key]
  A-->>C: 202 Operation
  W->>O: concat parts → raw/{tenant}/{connector}/billing/_unassigned/{sha256} (content-addressed; skip if exists)
  W->>W: parse → split rows by billing_period → per-period stage → invariants → swap
  W->>A: imports.status = succeeded|failed_validation|quarantined|failed
```

A file whose rows span several billing periods produces one `ingestion_run` per period (the unit of swap), all linked to one `imports` row. The raw object is stored once.

## 3. Data model and migrations

Consistent with [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md) §2.3. **Proposed additions; DATABASE_SCHEMA.md must be updated in the same PR.**

```sql
-- <seq>_imports.up.sql
CREATE TABLE imports (
  tenant_id uuid NOT NULL, id uuid NOT NULL,
  connector_id uuid NOT NULL,                       -- provider = 'generic'
  source text NOT NULL CHECK (source IN ('upload','api','object_store')),
  file_name text NOT NULL CHECK (length(file_name) <= 512),
  declared_format text NOT NULL CHECK (declared_format IN ('csv','tsv','json','ndjson','xlsx','parquet')),
  compression text NOT NULL DEFAULT 'none' CHECK (compression IN ('none','gzip','zip')),
  size_bytes bigint NOT NULL, sha256 bytea NOT NULL,
  mapping_definition_id uuid NOT NULL,              -- pinned template version
  status text NOT NULL CHECK (status IN ('awaiting_upload','uploaded','queued','processing','succeeded',
                                         'partially_succeeded','failed_validation','quarantined','failed','cancelled','expired')),
  source_object_id uuid, error jsonb, requested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, connector_id) REFERENCES connectors(tenant_id, id)
);
CREATE INDEX ix_imports_connector ON imports (tenant_id, connector_id, created_at DESC);
CREATE TABLE import_runs (                           -- import → one ingestion run per billing period
  tenant_id uuid NOT NULL, import_id uuid NOT NULL, ingestion_run_id uuid NOT NULL,
  PRIMARY KEY (tenant_id, import_id, ingestion_run_id));
CREATE TABLE import_upload_parts (
  tenant_id uuid NOT NULL, import_id uuid NOT NULL, part_no int NOT NULL CHECK (part_no BETWEEN 1 AND 10000),
  size_bytes bigint NOT NULL, sha256 bytea NOT NULL, storage_uri text NOT NULL,
  PRIMARY KEY (tenant_id, import_id, part_no));
-- mapping_definitions lifecycle (expand only)
ALTER TABLE mapping_definitions
  ADD COLUMN kind text NOT NULL DEFAULT 'provider' CHECK (kind IN ('provider','generic_import','invoice_import')),
  ADD COLUMN checksum bytea, ADD COLUMN published_at timestamptz, ADD COLUMN published_by uuid,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD CONSTRAINT ck_mapping_status CHECK (status IN ('draft','published','retired'));
-- RLS template applied to imports, import_runs, import_upload_parts.
```

`mapping_definitions.tenant_id` is nullable for built-ins (DATABASE_SCHEMA §2.3). The standard RLS template (`tenant_id = current_setting(...)`) would hide built-ins. This phase uses a variant policy: `USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)` with `WITH CHECK (tenant_id = current_setting(...)::uuid)`, so tenants can read built-ins but never write them. The CI catalog test from Phase 04 needs an allow-list entry for this policy shape. That is a documented deviation and must be reviewed.

`ingestion_runs` gains no columns. Imports use `capability = 'billing'`, `trigger = 'manual'` (upload) or `'schedule'` (polling). `source_objects.format` stores the sniffed format, and `schema_fingerprint` = SHA-256 of the sorted `(column name, inferred kind)` list.

Analytics side: no schema change. Rows go to `cost_focus` with `connector_id` = the import connector. Template-defined `x_` extensions go into `x_raw` until Phase 11 adds the generic-extension column policy.

Retention: upload parts are deleted 24 h after `:start` or after `expired` (sessions expire 24 h after creation if never started). Raw objects follow the 25-month default (OQ-09).

## 4. Template engine

- Grammar: literals (decimal strings, dates, strings), column refs (`col("Amount")` or bare identifiers for safe names), operators `+ - * /` on decimals (division at 34 significant digits, half-even to 12 dp), comparison, `if(cond,a,b)`, functions `month_start`, `month_end_exclusive`, `parse_date(fmt)`, `parse_decimal(dec_sep, grp_sep)`, `lower`, `upper`, `trim`, `substr`, `concat`, `coalesce`, `lookup(table_key)`, `map{…}`.
- No loops, recursion or user functions. Each row runs on a budget of 10 000 evaluation steps and 64 KiB of allocations, and exceeding it rejects the row with `EXPR_BUDGET`.
- Compiled once per run into a closure tree. A type error at save time returns `422` with a JSON pointer into the definition.
- Dedup: `sha256(provider='generic', connector_id, natural_key values, billing_period, charge_period, content_hash, occurrence_ordinal)`, consistent with Phase 11 P11-R09. Within-file duplicates on the natural key: keep the first and count the rest.

## 5. Security

| Concern | Design |
|---|---|
| Trust boundary | Uploaded bytes and customer object-store contents are untrusted ([TRUST_BOUNDARIES.md](../../architecture/TRUST_BOUNDARIES.md)). Parsing runs in the worker under a per-job memory limit (`GOMEMLIMIT`-aware budget plus a cgroup limit in Helm). |
| XXE / billion laughs | The XLSX reader uses `encoding/xml` with `Strict=true`, a custom `Entity` map of size 0, rejects tokens of type `xml.Directive` (DOCTYPE), has depth ≤ 64, and caps the shared-strings table at 64 MiB / 2 M entries. |
| Zip bomb | Ratio and absolute cap enforced on the decompressing reader per 1 MiB chunk. XLSX `[Content_Types].xml` entry count ≤ 10 000. |
| Formula injection | `safewriter` neutralizes on write and never on store (so lineage stays byte-exact). |
| Upload abuse | `imports:write`, export/upload rate-limit bucket, tenant daily volume quota (operational, not a license limit; NFR-LIC-004), and `Idempotency-Key` required. |
| Object-store credentials | Same `CredentialProvider` and federation as 06–08. The manifest egress list is limited to the configured endpoint. |
| Logs | File names and tag values are logged at DEBUG only and with truncation. Amounts are never logged at INFO. |
| Expression sandbox | Pure Go evaluator. No `reflect`, `os`, `net` or `plugin` imports are allowed in `expr` (enforced by depguard). |

## 6. Failure modes

| Failure | Behaviour |
|---|---|
| Client abandons upload | Session `expired` after 24 h; parts garbage-collected |
| Part hash mismatch | `422 checksum_mismatch` for that part; the client retries the part |
| Worker crash mid-parse | Job retried (Phase 06 lease). Staging for the run is dropped. Raw object already content-addressed, so it is reused. |
| Limit exceeded | Run `failed`, `error.code = limit_exceeded`, `error.kind`. No staging remains. Audit event written. |
| Reject ratio > threshold | `failed_validation`; previous live version untouched; DQ report still stored |
| Unknown or drifted schema | `quarantined`; alert via `ingestion.run.quarantined.v1`; resumes when the template is updated and the import re-run |
| Object deleted at source | Warning on connector; no data deleted |
| Object rewritten during read | etag changes between LIST and GET → `not_ready`, rescheduled after settle time |
| Template retired while an import is queued | The import keeps its pinned `mapping_definition_id` (versions are immutable) |

## 7. ADRs and references
ADR-0006 (FOCUS baseline), ADR-0007 (decimals), ADR-0009 (credentials), ADR-0010 (content-addressed raw and swap), ADR-0011 (API conventions), ADR-0012 (generic provider is first-party, in-process), ADR-0014 (audit). No new ADR is needed. If the expression language later becomes shared with the allocation condition AST, raise an ADR then.
