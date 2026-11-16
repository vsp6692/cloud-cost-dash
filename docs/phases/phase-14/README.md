# Phase 14: Global and Provider Dashboards

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.2 (completes the v0.2 scope: phases 06–14) |
| Depends on | Phase 05 (sessions, RBAC/ABAC), Phase 13 (semantic query API, catalog, `meta`); functionally also 06–08 (connectors, verification) and 12 (health API) for the onboarding wizard and UJ-02 |
| Primary PRD requirements | FR-DSH-001, FR-DSH-002, FR-DSH-003, FR-TEN-006, NFR-A11Y-001, NFR-I18N-001, NFR-PERF-001 (UI side), UJ-01, UJ-02 |
| Primary verification | Playwright E2E (UJ-01, UJ-02) against fixture-backed connectors; UI totals equal API totals; axe-core zero serious/critical violations |
| ADRs | [ADR-0002](../../architecture/adr/0002-next-js-web-app-as-bff.md), [ADR-0004](../../architecture/adr/0004-pluggable-analytics-engines-behind-a-semantic.md), [ADR-0007](../../architecture/adr/0007-fixed-point-decimal-money-end-to.md), [ADR-0008](../../architecture/adr/0008-authorization-rbac-abac-via-cedar-policies.md) |

## Goal
Deliver the first user-facing analytics experience: built-in, read-only dashboards at global, provider, account/project/subscription, service, region and resource level, with cost-type, currency and tax/credit switchers, freshness and completeness indicators on every widget, and a guided onboarding wizard that walks a new tenant from connector creation to first dashboard. Every number shown must equal the API's number for the same semantic query.

## Scope
- Next.js pages under `apps/web/app/(app)/dashboards/…`: global, provider, scope (AWS account / GCP project / Azure subscription), service, region, resource.
- Built-in dashboard definitions as versioned, code-shipped templates (`apps/web/dashboards/templates/*.json`, validated against the semantic schema) served read-only via `GET /api/v1/dashboard-templates`.
- Widget primitives (time series, bar, treemap, table, KPI) using Apache ECharts and shadcn/ui; every chart has an accessible data-table alternative.
- Global controls: cost-type switcher (billed, effective/amortized, list, contracted), currency selector, include/exclude tax and credits, date range and grain, filter bar (provider, scope, service, region, tag). State is URL-encoded (shareable deep links).
- Drill-down navigation global → provider → scope → service → resource, carrying filters.
- Freshness badge (per widget, from `meta.freshness`) and completeness badge (from `meta.completeness`), plus page-level data status banner.
- Onboarding wizard UI (FR-TEN-006): pick provider → template download (CloudFormation/Terraform/Bicep/gcloud) → enter non-secret params → verify (per-capability pass/fail/unknown with remediation) → discovered scopes → map to hierarchy (optional) → choose backfill horizon → first sync progress → land on global dashboard.
- Decimal-safe money formatting in the browser (string decimals, no `Number` parsing).
- Playwright E2E for UJ-01 and UJ-02; axe-core on every page.

## Out of scope
- User-created dashboards, layout editing, saved views, sharing, per-role defaults, widget export (Phase 16).
- Allocation views/hierarchy dimensions beyond what Phase 11 provides (Phase 15).
- FX conversion: currency selector offers billing currencies; "reporting currency" enabled only for single-currency scopes until Phase 18.
- Budgets and anomaly overlays (Phase 17); recommendations (Phase 21+); AI assistant (Phase 27).
- Heatmap widget (Phase 16).
- Localization beyond English (strings externalized only; NFR-I18N-001).

## Dependencies
| Kind | Dependency |
|---|---|
| Phase | 13: `POST /api/v1/query`, `GET /api/v1/semantic/catalog`, `meta` freshness/completeness |
| Phase | 05: BFF session, `/api/v1/me` (permissions, active tenant), tenant switcher |
| Phase | 06–08: `/api/v1/connectors`, `:verify`, `/scopes`, `/connectors/templates/{provider}` |
| Phase | 12: `/connectors/{id}/health`, `:backfill`, `/api/v1/operations/{id}` |
| External | Next.js (App Router), React, Tailwind, shadcn/ui, Apache ECharts, Playwright, `@axe-core/playwright`; license check (NFR-LIC-001) |

## Deliverables
1. Six dashboard pages and the onboarding wizard.
2. Built-in template set and `GET /api/v1/dashboard-templates`.
3. `apps/web/lib/money` decimal formatter with unit tests.
4. Playwright suites `tests/e2e/uj01-first-setup.spec.ts`, `tests/e2e/uj02-org-onboarding.spec.ts`, `tests/e2e/dashboards-totals.spec.ts`, `tests/e2e/a11y.spec.ts`.
5. Fixture-backed connector mode (`CLOUDLEDGER_FIXTURE_PROVIDERS=1`) used only in test builds.
6. User docs: dashboards guide and onboarding guide under `docs/` (user section).

## Key risks
| Risk | Mitigation |
|---|---|
| UI totals drift from API (float parsing, client-side summing) | no client-side aggregation; KPI totals come from a dedicated query; decimal formatter on strings; E2E compares to API |
| XSS via tag values or resource names in chart tooltips (ECharts renders HTML) | custom tooltip formatter escaping all data; CSP without `unsafe-inline` scripts; injection fixture in E2E |
| Slow pages at Standard scale | parallel widget queries, cache (Phase 13), skeletons, per-widget error isolation; p95 budget tracked |
| Onboarding wizard depends on provider-specific variability (entitlements) | wizard renders capability results generically from verification report; `unknown` explained, not blocking |
| a11y of charts | data-table toggle, ARIA descriptions, keyboard focus, color-blind-safe palette |

## Documents
[REQUIREMENTS](REQUIREMENTS.md) · [DESIGN](DESIGN.md) · [IMPLEMENTATION](IMPLEMENTATION.md) · [API_CONTRACTS](API_CONTRACTS.md) · [TEST_PLAN](TEST_PLAN.md) · [TEST_RESULTS](TEST_RESULTS.md) · [ACCEPTANCE](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: pages, widgets, controls, wizard, templates endpoint merged
- [ ] Tests: P14-TC01…TC30 executed; real results in TEST_RESULTS.md
- [ ] Docs: user guides, OpenAPI (`dashboard-templates`), screenshots refreshed
- [ ] Security review: XSS, CSP, BFF token handling, tenant switcher, ABAC on drill-down
- [ ] CHANGELOG entry under Unreleased
- [ ] Acceptance sign-off (ACCEPTANCE.md); v0.2 checkpoint review scheduled
- [ ] Stopped at phase boundary (no Phase 15/16 work started)
