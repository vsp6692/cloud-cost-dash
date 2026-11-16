# Phase 09: API Contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md) (§3 Problem Details, §4 cursor pagination, §6 `Idempotency-Key`, §7 `ETag`/`If-Match`, §9 `202` Operations). §13 catalog row "Imports" is implemented here. Machine-readable source: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml), operations tagged `x-phase: "09"`. Permission names are proposals; Phase 05 owns the final catalog.

## 1. Permissions

| Permission | Built-in roles (default) |
|---|---|
| `imports:read` | tenant owner, FinOps admin, finance manager, auditor |
| `imports:write` | tenant owner, FinOps admin |
| `mappings:read` | tenant owner, FinOps admin, finance manager, auditor |
| `mappings:manage` | tenant owner, FinOps admin |

All endpoints also apply ABAC on `provider = generic` and on the import connector. A principal whose data scope excludes the connector gets `404`.

## 2. Imports

| Method | Path | Request | Response | Errors | Permission |
|---|---|---|---|---|---|
| GET | `/api/v1/imports` | `filter[connector_id]`, `filter[status]`, `sort=-created_at`, cursor | `{data:[Import], next_cursor}` | 422 unknown filter | `imports:read` |
| POST | `/api/v1/imports` | `Idempotency-Key` (required); `CreateImport` | `201 Import` (`status: awaiting_upload`) + `ETag` | 413 `payload_too_large` (declared size > cap), 422 `unsupported_format`, 404 connector or mapping, 409 `idempotency_key_reuse` | `imports:write` |
| PUT | `/api/v1/imports/{id}/parts/{part_no}` | raw bytes ≤ 64 MiB, header `Content-SHA256: <hex>` | `200 {part_no, size_bytes, sha256}` | 409 `import_not_awaiting_upload`, 413, 422 `checksum_mismatch` | `imports:write` |
| GET | `/api/v1/imports/{id}` | — | `Import` with `runs[]` and `quality_summary` | 404 | `imports:read` |
| POST | `/api/v1/imports/{id}:preview` | `{mapping_definition_id?, rows?: ≤1000}` | `200 ImportPreview` | 409 `upload_incomplete`, 422 `format_mismatch`, `encoding_error`, `limit_exceeded` | `imports:write` |
| POST | `/api/v1/imports/{id}:start` | `If-Match`, `Idempotency-Key` | `202 Operation` (`kind: import`) | 409 `upload_incomplete`, 412, 422 `checksum_mismatch`, `format_mismatch` | `imports:write` |
| POST | `/api/v1/imports/{id}:cancel` | `If-Match` | `200 Import` (`cancelled`) | 409 `not_cancellable` (already swapping or finished) | `imports:write` |
| GET | `/api/v1/ingestion/runs/{id}/quality` | — | `DataQualityReport` (GENERIC_IMPORTS §5 shape) | 404 | `imports:read` or `ingestion:read` |
| GET | `/api/v1/ingestion/runs/{id}/quality/rejected-sample` | — | `302` to a pre-signed URL (single object, TTL ≤ 5 min, tenant prefix) | 404 | `imports:read` |

Note: GENERIC_IMPORTS.md §1 describes `PUT parts` + `POST …/complete`, and §3 shows `POST /imports/{id}/preview`. OpenAPI uses the custom-method style `:start`. This phase standardizes on `:start` and `:preview` (API_GUIDELINES action style), and GENERIC_IMPORTS.md must be updated.

```yaml
CreateImport:
  connector_id: string            # provider must be 'generic'
  mapping_definition_id: string   # a published version; drafts allowed only for :preview
  file_name: string               # ≤ 512 chars, display only
  declared_format: csv|tsv|json|ndjson|xlsx|parquet
  compression: none|gzip|zip
  size_bytes: integer
  sha256: string                  # hex, whole file
Import:
  id, connector_id, source: upload|api|object_store, file_name, declared_format, sniffed_format, compression,
  size_bytes, sha256, mapping: {id, key, version, focus_version},
  status: awaiting_upload|uploaded|queued|processing|succeeded|partially_succeeded|failed_validation|quarantined|failed|cancelled|expired
  part_size: integer, parts_received: integer
  runs: [{ingestion_run_id, billing_period, status, rows_accepted, rows_rejected}]
  quality_summary: {rows_read, rows_accepted, rows_rejected, duplicates, reject_ratio: "0.000191"}
  error: Problem | null
  created_at, updated_at, requested_by
ImportPreview:
  mapping: {key, version}
  columns: [{focus_column, source_expr, type}]
  rows: [{source_row, mapped: {BilledCost: "1520.400000000000", BillingCurrency: "EUR", ...}, errors: [{code, column, message}]}]
  focus_coverage: {mandatory_missing: [], conditional_missing: ["ResourceId"]}
  totals: [{currency, charge_category, accepted_sum, rejected_sum}]
```

`partially_succeeded` means a multi-period file in which at least one period swapped and at least one failed validation. Each period's outcome is in `runs[]`.

## 3. Mappings (generic-import templates)

| Method | Path | Request | Response | Errors | Permission |
|---|---|---|---|---|---|
| GET | `/api/v1/mappings` | `filter[kind]=generic_import`, `filter[key]`, `filter[status]`, `filter[builtin]=true\|false` | `{data:[MappingSummary]}` | 422 | `mappings:read` |
| POST | `/api/v1/mappings` | `{key, focus_version: "1.2", definition}` (new key → version 1; existing key → next version as draft) | `201 Mapping` (`draft`) | 409 `draft_exists`, 422 `validation_failed` (JSON pointers) | `mappings:manage` |
| GET | `/api/v1/mappings/{id}` | — | `Mapping` + `ETag` | 404 | `mappings:read` |
| PATCH | `/api/v1/mappings/{id}` | `If-Match`; `{definition}` | `Mapping` | 409 `mapping_not_draft`, 412, 422 | `mappings:manage` |
| POST | `/api/v1/mappings/{id}:validate` | `{sample_import_id?}` | `{valid, errors[], warnings[], focus_coverage}` | 404 | `mappings:manage` |
| POST | `/api/v1/mappings/{id}:publish` | `If-Match`, `Idempotency-Key` | `Mapping` (`published`, `checksum`) | 409 `mapping_not_draft`, 422 | `mappings:manage` |

`{id}` addresses one immutable version. Phase 11 adds `/api/v1/mappings/{key}/versions/{version}` addressing, `:activate` and re-normalization. Phase 09 IDs remain valid. Built-in templates return `403 forbidden` on PATCH/publish (their existence is public).

## 4. Connectors
Generic import connectors use the Phase 06 `/api/v1/connectors` endpoints with `provider: "generic"`:
```json
{"provider":"generic","name":"DC chargeback","root_scope":{"type":"object_store","uri":"s3://acme-finops/chargeback/"},
 "auth":{"method":"assume_role","role_arn":"arn:aws:iam::123456789012:role/cl-read","external_id_ref":"…"},
 "config":{"mapping_key":"dc-chargeback","include":["**/*.csv.gz"],"exclude":["**/_tmp/**"],"settle_seconds":300,
           "require_marker":"_SUCCESS","period_from":"path","period_pattern":"period=(?P<yyyy>\\d{4})-(?P<mm>\\d{2})","poll_interval":"1h"}}
```
For upload-only connectors, `root_scope = {"type":"upload"}`. `period_pattern` is evaluated with RE2 (linear time) and capped at 256 chars.

## 5. Events (proposed additions to [EVENTS.md](../../contracts/EVENTS.md))

| Type (`dev.cloudledger.` + …) | Producer | Consumers | Idempotency key | Payload |
|---|---|---|---|---|
| `import.uploaded.v1` | billing/imports | audit, UI | import id | `import_id, connector_id, sha256, size_bytes, declared_format` |
| `import.completed.v1` | billing/imports | UI notifications, health | import id + status | `import_id, status, runs[{ingestion_run_id, billing_period, status}], quality_summary` |
| `ingestion.run.quarantined.v1` | billing | alerts, health | run id | `run_id, connector_id, reason: schema_drift\|unknown_schema, schema_fingerprint, expected_fingerprint` |
| `mapping.published.v1` | billing/mapping | audit, UI | mapping id | also listed by Phase 11; Phase 09 is the first producer |

Successful swaps also emit the existing `cost.period.normalized.v1`.

## 6. Audit actions
`import.create`, `import.start`, `import.cancel`, `import.quarantined`, `mapping.create`, `mapping.update`, `mapping.publish`, `import.limit_exceeded` (outcome `error`, with the limit kind).

## 7. SDK / interface changes
- `sdk/provider`: no interface change. `BillingArtifact.Format` gains values `tsv`, `ndjson`, `xlsx`, and `csv.zip`. Additive.
- Internal: `fileparse.RecordReader` and `safewriter.Writer` are exported module APIs (`internal/platform`), consumed by Phase 10, 16, 29 and 30.
