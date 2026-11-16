# Phase 29 — API Contracts

Conventions: [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md). Base `/api/v1`, RFC 9457 errors, cursor pagination, money as `{"amount": "<decimal string>", "currency": "XXX"}`, `Idempotency-Key` **required** on every POST below (financial operations), `ETag`/`If-Match` on mutable resources. Machine-readable source: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml) (to be updated in P29-T14).

## Endpoints

| Method & path | Permission | Notes | New vs. §13 |
|---|---|---|---|
| `GET /reconciliations` | `reconciliations:read` | filters: `invoice_id`, `status`, `period`, `provider` | listed (`/reconciliations`) |
| `POST /reconciliations` | `reconciliations:run` | body `{invoice_id}` → 202 Operation | refines |
| `GET /reconciliations/{id}` | `reconciliations:read` | result + line groups + `meta.data_version` | refines |
| `GET /reconciliations/{id}/variances` | `reconciliations:read` | paginated; `filter[category]`, `filter[ack_status]` | **new** |
| `POST /reconciliations/{id}/variances/{vid}:acknowledge` | `reconciliations:acknowledge` | body `{reason, category}`; 403 `sod_violation`; 409 `variance_changed` if stale version | **new** |
| `GET /gl-mappings` / `POST /gl-mappings` | `gl_mappings:read` / `write` | create draft version | **new** |
| `GET/PATCH /gl-mappings/{id}` | `gl_mappings:read` / `write` | draft only; `If-Match` | **new** |
| `POST /gl-mappings/{id}:preview` | `gl_mappings:read` | body `{period}` → 202; result: per-account totals, unmapped amount, diff vs. current published | **new** |
| `POST /gl-mappings/{id}:publish` | `gl_mappings:publish` | requires a preview run on the same version | **new** |
| `POST /exports` | `exports:create` | 202 Operation; see body below | listed (`/exports`) |
| `GET /exports`, `GET /exports/{id}` | `exports:read` | status, files, manifest summary | listed |
| `GET /exports/{id}/manifest` | `exports:read` | canonical manifest JSON + `sha256` | **new** |
| `POST /exports/{id}:download-url` | `exports:download` | body `{file}` → `{url, expires_at}` (TTL ≤ 15 min); 409 if not `succeeded` | **new** |

### `POST /exports` request
```json
{
  "type": "journal",
  "formats": ["csv", "xlsx"],
  "period": {"accounting_period": "FY2026-P10"},
  "cost_metric": "effective_cost",
  "currency": "reporting",
  "group_by": ["hierarchy:cost_center"],
  "gl_mapping_set_id": "0193…",
  "allow_partial_scope": false
}
```
`type` ∈ `showback | chargeback | journal | cost_detail | reconciliation`. `formats` ⊆ `csv | xlsx | json | ndjson | parquet | pdf` (`pdf` only for `showback`, `chargeback`, `reconciliation` summaries). Unknown fields → 422.

### Journal CSV columns
`journal_id, entry_date, accounting_period, entity, currency, line_no, gl_account, cost_center, debit, credit, description, hierarchy_path, source_ref` — `debit`/`credit` fixed scale = currency minor unit; `source_ref` = export ID + line hash.

### Manifest (canonical JSON, keys sorted, UTF-8, no insignificant whitespace)
```json
{"manifest_version":1,"export_id":"…","tenant_id":"…","type":"journal","data_version":1842,
 "rule_set_version":12,"gl_mapping":{"id":"…","version":3},"fx_rate_set_id":"…",
 "scope":{"hash":"…","partial":false},"query":{...semantic query...},
 "control_totals":[{"currency":"EUR","period":"FY2026-P10","debit":"…","credit":"…","source":"…"}],
 "files":[{"name":"journal.csv","format":"csv","rows":12034,"sha256":"…","bytes":1839201}],
 "created_at":"2026-11-15T00:00:00Z","requested_by":"…"}
```

### Errors (new codes)
| Status | `code` |
|---|---|
| 403 | `sod_violation` |
| 409 | `variance_changed`, `export_not_ready`, `mapping_not_previewed` |
| 422 | `journal_unbalanced`, `unsupported_format_for_type`, `partial_scope_not_allowed` |
| 429 | `rate_limited` (bucket `export`) |

## Events (to be added to the EVENTS.md catalog unless noted)
| Type | Producer | Consumers | Idempotency key |
|---|---|---|---|
| `dev.cloudledger.reconciliation.completed.v1` (existing) | finance | period close (Phase 30), alerts | result id |
| `dev.cloudledger.variance.acknowledged.v1` | finance | period close readiness, audit | variance id + ack id |
| `dev.cloudledger.gl_mapping.published.v1` | finance | exports cache | mapping set id + version |
| `dev.cloudledger.export.completed.v1` | finance | notifications, Phase 30 delivery | export id |
| `dev.cloudledger.export.failed.v1` | finance | notifications | export id + attempt |

Consumed: `cost.period.restated.v1`, `invoice.imported.v1`, `cost.period.allocated.v1`.

## Internal Go interfaces
```go
type Exporter interface {
    Start(ctx context.Context, tc tenant.Context, req ExportRequest) (ExportID, error)
}
type FormatWriter interface {
    WriteHeader(cols []Column) error
    WriteRow(r Row) error         // must apply Neutralizer for csv/xlsx
    Close() (FileStats, error)    // rows, bytes, sha256
}
type Validator interface {
    Validate(ctx context.Context, e Export, files []FileStats) (ValidationReport, error)
}
```
No SDK changes in this phase.
