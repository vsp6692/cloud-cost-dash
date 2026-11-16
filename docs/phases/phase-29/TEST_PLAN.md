# Phase 29 — Test Plan

Environments: unit (Go), integration (Testcontainers: PostgreSQL 16, ClickHouse, MinIO; DuckDB in-process), E2E (Playwright against fixture-backed stack), performance (k6 + large synthetic dataset). Fixtures: `tests/fixtures/finance/`. All money comparisons are exact decimal string compares.

| ID | Type | Description | Fixtures | Expected | Requirements |
|---|---|---|---|---|---|
| P29-TC01 | Unit | Matcher builds line groups by invoice_id and by (period, account, currency, category) fallback | `invoices/aws_invoice_id.json`, `azure_no_invoice_id.json` | Groups equal expected keys | P29-R01 |
| P29-TC02 | Golden | Each provider golden invoice reconciles; variances per category equal expected | `invoices/golden_{aws,gcp,azure}/` | Exact amounts, zero `unexplained` | P29-R01, R02 |
| P29-TC03 | Property | Random diffs and categorizer inputs: Σ variances == invoice − computed | generated | Invariant holds for 10 000 cases | P29-R02 |
| P29-TC04 | Unit | Status thresholds: diff 0, 0.01, 0.010000000001 with tolerance 0.01 | synthetic | `matched`, `within_tolerance`, `variance` | P29-R03 |
| P29-TC05 | Edge | Unexplained residual never dropped when categorizers consume nothing | `invoices/unexplained.json` | single `unexplained` variance = diff | P29-R02 |
| P29-TC06 | Integration | Acknowledge with reason; audit row written; ack immutable (UPDATE rejected by trigger) | PG | 200; audit `variance.acknowledge`; trigger error on UPDATE | P29-R04 |
| P29-TC07 | Negative | Acknowledge with reason < 10 chars or missing → 422; without permission → 403 | — | errors as specified | P29-R04 |
| P29-TC08 | Security | SoD on: initiator acknowledges own run → 403 `sod_violation`, audited `denied` | tenant setting | denied + audited | P29-R05 |
| P29-TC09 | Integration | Restatement event triggers re-run; changed variances → `stale`; unchanged keep ack | `restatement/period_2026-09` | expected ack_status per variance | P29-R06 |
| P29-TC10 | Integration | Duplicate restatement events → single re-run (unique key) | — | one result per data_version | P29-R06 |
| P29-TC11 | Golden | Chargeback export Σ rows (incl. unallocated) == source total per period and currency | `allocation/golden_shared_split` | exact equality | P29-R07 |
| P29-TC12 | Unit | GL rule precedence, default suspense account, validation of missing offset/rounding accounts | `gl_mappings/*.yaml` | first match wins; invalid set rejected | P29-R08 |
| P29-TC13 | Integration | Publish without preview → 409 `mapping_not_previewed`; preview diff vs. current | — | as specified | P29-R08 |
| P29-TC14 | Property | Journal balances per (entity, currency, period) for random amounts incl. negatives and 12-dp values | generated | debits == credits; residual ≤ n × half minor unit | P29-R09 |
| P29-TC15 | Edge | Zero-decimal currency (JPY) and 3-decimal (KWD) rounding | synthetic | minor unit respected, balanced | P29-R09 |
| P29-TC16 | Contract | Each format writer round-trips: CSV parse, XLSX read, Parquet schema decimal(38,12), NDJSON lines; money exact | golden export | identical values | P29-R10 |
| P29-TC17 | Security | Formula injection corpus (`=cmd|' /C calc'!A0`, `+1+1`, `-2+3`, `@SUM(1)`, `\t=1`, `\r=1`, unicode full-width `＝`) in tag values/names → neutralized in CSV and XLSX | `security/formula_corpus.txt` | every payload prefixed with `'`; negative money typed cells unaffected | P29-R11 |
| P29-TC18 | Fuzz | `FuzzNeutralize` — output never starts with trigger char; idempotent | — | no failures in 5 min | P29-R11 |
| P29-TC19 | Integration | Validator detects tampered row (one amount +0.000000000001) → `failed_validation`, no URL | fault injection writer | status failed_validation | P29-R12 |
| P29-TC20 | Failure | Restatement during export (data_version bump) → `failed_validation`, never mixed | injected swap | as specified | P29-R12 |
| P29-TC21 | Unit | Manifest canonical JSON stable across runs; SHA-256 matches file bytes | golden | identical hash | P29-R13 |
| P29-TC22 | Performance | 100 M-row cost_detail NDJSON + Parquet export on ClickHouse profile; RSS ≤ 256 MiB | synthetic 100 M | completes; memory bound held; duration recorded | P29-R14 |
| P29-TC23 | Security | Pre-signed URL TTL ≤ 15 min, single object, GET only; expired URL → 403 from store; issuance audited | MinIO | as specified | P29-R14 |
| P29-TC24 | Cross-tenant | Tenant B requests tenant A export / manifest / download-url → 404; object key outside prefix not signable | two tenants | 404, no URL | P29-R15 |
| P29-TC25 | Security | Engineering manager with ABAC scope exports chargeback → only in-scope nodes, manifest `partial:true`; journal without `allow_partial_scope` → 422 | ABAC fixture | as specified | P29-R15 |
| P29-TC26 | Failure | Membership revoked mid-export → export fails, no URL issued | — | `failed`, audited | P29-R15 |
| P29-TC27 | Contract | Idempotency: same key + body replays operation; different body → 409; 429 with Retry-After in export bucket | — | per API_GUIDELINES §6/§8 | P29-R16 |
| P29-TC28 | Failure | MinIO 503 during multipart upload → retry; crash mid-job → lease expiry, clean restart, no orphan files | toxiproxy | succeeded on retry; staging prefix cleaned | P29-R14 |
| P29-TC29 | E2E | UJ-08: import invoice → auto match → variance report → acknowledge; variance beyond tolerance shown as blocking | Playwright + fixtures | journey passes; axe-core clean | P29-R17 |
| P29-TC30 | E2E | UJ-04 chargeback step: export chargeback CSV per cost center, totals equal dashboard | Playwright | totals match | P29-R17, R07 |
| P29-TC31 | Static | No float types in `internal/finance/**` (lint rule) | — | lint clean | P29-R09, NFR-ACC-003 |

Negative, edge, cross-tenant, failure and security cases: TC05, 07, 08, 15, 17–20, 23–28.
