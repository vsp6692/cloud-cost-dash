# Phase 14 Requirements

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P14-R01 | Provide global, provider, account/project/subscription, service, region and resource dashboards, each composed of built-in widgets bound to semantic queries. | FR-DSH-001 | M | P14-AC01 |
| P14-R02 | Drill-down between levels preserves active filters, cost type, currency, include flags and date range; all state is in the URL and a copied URL reproduces the view for any user with equal scope. | FR-DSH-001 | M | P14-AC01 |
| P14-R03 | Cost-type switcher (billed, effective/amortized, list, contracted) changes every widget's metric; the active cost type is labeled on every widget. | FR-DSH-002, FR-NRM-003 | M | P14-AC02 |
| P14-R04 | Currency selector: billing currency per row (multi-currency scopes shown split by currency, never summed across currencies); reporting currency selectable only when no conversion is required (until Phase 18). | FR-DSH-002, FR-FIN-001 (partial) | M | P14-AC02 |
| P14-R05 | Include/exclude taxes and credits toggles map to the semantic `include` flags; defaults: tax excluded, credits included (tenant-configurable later). | FR-DSH-002 | M | P14-AC02 |
| P14-R06 | Every widget shows a freshness indicator (latest charge period end, lag hours, per provider) and a completeness indicator; states `fresh`, `delayed`, `stale`, `no_data`, `partial` with documented thresholds; page banner when any connector is in `error`/`degraded`. | FR-DSH-003, FR-CON-005 | M | P14-AC03 |
| P14-R07 | Every displayed monetary value equals the API value for the identical semantic query (decimal string compare after documented half-even presentation rounding). No client-side aggregation of money. | NFR-ACC-001, NFR-ACC-003, AC-01 | M | P14-AC04 |
| P14-R08 | Onboarding wizard with per-connector status, permission verification results (pass/fail/unknown + remediation text + docs link), discovered scopes, optional hierarchy mapping, backfill horizon selection, sync progress and next steps. Resumable after reload. | FR-TEN-006, FR-CON-002, UJ-01, UJ-02 | M | P14-AC05 |
| P14-R09 | UJ-01 passes as Playwright E2E against fixture-backed connectors, including failure paths: missing permission, export not yet delivered, wrong ExternalId, no data yet. | UJ-01, AC-09 | M | P14-AC05 |
| P14-R10 | UJ-02 passes as Playwright E2E: AWS org + GCP billing account + Azure billing account, child discovery, hierarchy mapping, 13-month backfill progress; failure paths: partial permissions on some children, throttling, large backfill. | UJ-02, AC-09 | M | P14-AC05 |
| P14-R11 | Pages and widgets render only data permitted by the viewer's RBAC/ABAC scope (enforced server-side by Phase 13); navigation to out-of-scope entities shows a not-found state without revealing existence. | FR-IAM-006, NFR-SEC-001 | M | P14-AC06 |
| P14-R12 | Untrusted strings (tags, resource names, account names) are rendered as text in DOM, charts and tooltips; no HTML/script execution; CSP enforced. | NFR-SEC-002 | M | P14-AC06 |
| P14-R13 | WCAG 2.2 AA: axe-core zero serious/critical violations on all pages and wizard steps; full keyboard operation; every chart has a data-table alternative; color is never the only signal. | NFR-A11Y-001 | M | P14-AC07 |
| P14-R14 | All UI strings externalized; locale-aware number, currency and date formatting via `Intl` on decimal strings. | NFR-I18N-001 | M | P14-AC07 |
| P14-R15 | Per-widget error isolation: one failing query shows an inline error with retry and request ID; other widgets still render. Typed API errors (429, 503, 422) mapped to user messages. | NFR-AVL-001 | M | P14-AC08 |
| P14-R16 | Performance: global dashboard first meaningful paint ≤ 3 s and all widgets loaded ≤ 5 s p95 on the Lite fixture with PG (warm cache), measured in CI (non-gating budget, gating at Phase 34). | NFR-PERF-001 | S | P14-AC09 |
| P14-R17 | `GET /api/v1/dashboard-templates` returns built-in read-only templates (versioned); each template query validates against the semantic schema in CI. | FR-DSH-001, FR-DSH-004 (foundation) | M | P14-AC01 |
| P14-R18 | No access tokens in browser storage; all API calls go via the BFF with server-side session (ADR-0002). | NFR-SEC-002 | M | P14-AC06 |
