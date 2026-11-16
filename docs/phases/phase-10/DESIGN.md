# Phase 10: Design

Matching and categorization semantics are defined in [FINANCE_RECONCILIATION.md](../../architecture/FINANCE_RECONCILIATION.md) §6–7. This document adds the phase-level components, schema changes, sequences, security and failure modes.

## 1. Components

| Package | Responsibility |
|---|---|
| `internal/finance/invoices` | Invoice service: import from provider `InvoiceSource`, upload (structured file via `fileparse` plus optional PDF), header integrity checks, revisioning, `invoice.imported.v1` |
| `internal/finance/reconciliation/candidates` | Builds the candidate set (InvoiceId rule or fallback key) as **aggregates** via the analytics adapter. It reads Σ BilledCost grouped by group-key columns and never pulls rows. |
| `internal/finance/reconciliation/groups` | Versioned per-provider group-key mapping (`schemas/finance/group-keys/{aws,azure,gcp,generic}.v1.yaml`) that maps FOCUS columns to invoice `category`/`account_ref` |
| `internal/finance/reconciliation/categorize` | Ordered rule chain (pure functions). Each rule returns `(matched bool, evidence)`. |
| `internal/finance/reconciliation` | Orchestrates a run: header check, variances, tolerance, status, persistence, result hash, event |
| `providers/aws/invoices`, `providers/azure/invoices` | `InvoiceSource` implementations (read-only; SDK error classes) |
| `providers/gcp` | Manifest declares `invoices: {availability: not_applicable, fallback: upload}` |
| `apps/web/app/(app)/finance/invoices/…` | List, detail, variance table, acknowledge dialog, upload form |

Analytics access in this phase goes through the Phase 06 PG baseline adapter, using one fixed internal aggregation query per candidate rule. After Phase 13 it switches to semantic queries. The query is wrapped behind `reconciliation.CostAggregator` so the swap needs no reconciler change.

```mermaid
flowchart LR
  subgraph Sources
    AWSAPI[AWS Invoicing API] --> IS
    AZAPI[Azure Billing invoices API] --> IS
    UP[Upload CSV/XLSX/JSON + PDF] --> IS
  end
  IS[invoices service] --> INV[(invoices / invoice_lines)]
  IS --> OBJ[(raw/{tenant}/{connector}/invoices/{period}/{sha256})]
  IS -->|invoice.imported.v1| OB[(outbox)]
  OB --> RJ[reconcile job]
  RST[cost.period.restated.v1] --> RJ
  RJ --> CA[CostAggregator: Σ BilledCost by group key]
  CA --> AN[(analytics cost_focus)]
  RJ --> CAT[categorize chain]
  CAT --> RR[(reconciliation_results / _groups / _variances)]
  RR -->|reconciliation.completed.v1| OB
```

## 2. Reconciliation sequence

```mermaid
sequenceDiagram
  autonumber
  participant J as reconcile job
  participant PG as control plane
  participant A as analytics
  J->>PG: load invoice (status valid) + lines + tolerance + group-key mapping vN
  J->>A: data_version D; Σ BilledCost by (group key) WHERE InvoiceId = I  (rule A)
  alt rule A returns 0 rows
    J->>A: Σ BilledCost by group key WHERE BillingAccountId, period, BillingCurrency, issuer (rule B)
  end
  J->>J: v_g = invoice_g − computed_g (exact); header check
  J->>A: evidence probes (tax rows, credits, Correction rows after provider_final, boundary-day rows, completeness)
  J->>J: categorize each v_g ≠ 0 (first match wins); status
  J->>PG: tx: supersede previous result for invoice; insert result + groups + variances; outbox event
```

Candidate rule B also needs `InvoiceIssuerName ≈ issuer_entity`, using a tenant-editable `invoice_issuer_aliases` table seeded per provider (for example `Amazon Web Services EMEA SARL`).

## 3. Data model and migrations

Base tables: [DATABASE_SCHEMA.md §2.6](../../architecture/DATABASE_SCHEMA.md) (`invoices`, `invoice_lines`, `reconciliation_results`, `reconciliation_variances`). **Proposed additions and changes, which must update DATABASE_SCHEMA.md in the same PR:**

```sql
-- <seq>_invoices_reconciliation.up.sql (expand-only)
ALTER TABLE invoices
  ADD COLUMN connector_id uuid, ADD COLUMN revision int NOT NULL DEFAULT 1, ADD COLUMN content_sha256 bytea NOT NULL,
  ADD COLUMN pdf_source_object_id uuid, ADD COLUMN header_confirmed_by uuid,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN version bigint NOT NULL DEFAULT 1,
  ADD CONSTRAINT ck_invoice_status CHECK (status IN ('valid','invalid','superseded'));
-- unique key (tenant, provider, billing_account, invoice_number) becomes (… , revision); a partial unique index keeps one non-superseded revision
ALTER TABLE invoices DROP CONSTRAINT invoices_tenant_id_provider_billing_account_invoice_number_key;
CREATE UNIQUE INDEX uq_invoice_current ON invoices (tenant_id, provider, billing_account, invoice_number) WHERE status <> 'superseded';
ALTER TABLE invoice_lines ADD COLUMN group_key text, ADD COLUMN currency char(3) NOT NULL;
CREATE UNIQUE INDEX uq_invoice_line ON invoice_lines (tenant_id, invoice_id, line_no);

ALTER TABLE reconciliation_results
  ADD COLUMN candidate_rule text NOT NULL CHECK (candidate_rule IN ('invoice_id','account_period_currency')),
  ADD COLUMN mapping_versions jsonb NOT NULL, ADD COLUMN group_key_mapping_version int NOT NULL,
  ADD COLUMN result_sha256 bytea NOT NULL, ADD COLUMN superseded_by uuid, ADD COLUMN version bigint NOT NULL DEFAULT 1;
-- status enum gains 'superseded' (CHECK replaced NOT VALID → VALIDATE)

CREATE TABLE reconciliation_groups (          -- per line group; tolerance unit (NFR-ACC-002)
  tenant_id uuid NOT NULL, id uuid NOT NULL, result_id uuid NOT NULL, group_key text NOT NULL,
  invoice_amount numeric(38,12) NOT NULL, computed_amount numeric(38,12) NOT NULL, variance numeric(38,12) NOT NULL,
  invoice_line_count int NOT NULL, status text NOT NULL CHECK (status IN ('matched','within_tolerance','variance','acknowledged')),
  PRIMARY KEY (tenant_id, id), UNIQUE (tenant_id, result_id, group_key));
ALTER TABLE reconciliation_variances ADD COLUMN group_id uuid, ADD COLUMN rule_order int NOT NULL;
CREATE TABLE reconciliation_tolerances (tenant_id uuid NOT NULL, provider text NOT NULL, currency char(3), tolerance numeric(38,12) NOT NULL CHECK (tolerance >= 0),
  PRIMARY KEY (tenant_id, provider, currency));      -- currency NULL = any; default 0.01 when no row
CREATE TABLE invoice_issuer_aliases (tenant_id uuid NOT NULL, provider text NOT NULL, alias text NOT NULL, issuer_entity text NOT NULL,
  PRIMARY KEY (tenant_id, provider, alias));
-- RLS template on all new tables.
```

`result_sha256` = SHA-256 of the JCS-canonical result (groups, variances, categories, and pinned versions, excluding IDs and timestamps). Equal hashes prove determinism (P10-R12).

Raw invoice files: `raw/{tenant}/{connector}/invoices/{period}/{sha256}.{ext}` as `source_objects` rows (`format` = `pdf|csv|xlsx|json|api_json`). API responses are stored as canonical JSON for lineage.

## 4. Categorization evidence (examples)
| Category | Evidence recorded in `details` |
|---|---|
| `tax` | Tax line IDs and Σ tax rows (`ChargeCategory = Tax`) on both sides |
| `credit` | Missing credit line/rows and their sum |
| `late_correction` | `ChargeClass = Correction` row counts and sums, `billing_period_versions.version` after `provider_final` |
| `rounding` | Bound `0.5 × 10^-e × n_lines(g)`, the currency minor-unit exponent `e` |
| `missing_data` | Completeness ratio and the missing scopes/periods |
| `fx` | Invoice currency, export currency, invoice-stated rate if present |

## 5. Security
- Invoice amounts are confidential finance data. Endpoints require `invoices:read` and apply ABAC by provider and billing account.
- PDF uploads are magic-byte checked (`%PDF-`), capped at 25 MiB and stored encrypted under the tenant prefix. They are never parsed or rendered server-side, and are downloaded only through a pre-signed single-object URL with `Content-Disposition: attachment`.
- Provider API calls use connector credentials (ADR-0009). Azure PDF download URLs from the provider are fetched server-side and never exposed to the browser.
- Acknowledgements and tolerance changes are audited (`reconciliation.acknowledge`, `reconciliation.tolerance.update`). Optional four-eyes rule.
- Descriptions on invoice lines are untrusted strings (stored as data and escaped in UI).

## 6. Failure modes
| Failure | Behaviour |
|---|---|
| Invoice API `AccessDenied` | Capability `fail` with remediation; upload path offered in UI |
| Invoice API throttled | `ErrThrottled` → backoff (Phase 06 limiter) |
| Header integrity fails | Invoice `invalid`, visible with reason, excluded from reconciliation |
| No candidate rows (data not ingested yet) | All groups `missing_data`; re-run on `cost.period.normalized.v1` for that period |
| Restatement during a run | Run pins `data_version` D. If D changed before commit, the result is persisted then immediately superseded by the triggered re-run. |
| Analytics unavailable | Job retried with backoff; no partial result committed |
| Group-key mapping missing for a provider/category | Lines fall into group `__unmapped__` and are categorized `unexplained` |

## 7. ADRs
ADR-0007, ADR-0010, ADR-0014, ADR-0016, ADR-0009. No new ADR. Phase 29 may need one for the GL mapping language.
