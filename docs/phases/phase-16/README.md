# Phase 16: Dashboard builder and saved views

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.3 (phases 15–18) |
| Depends on | [Phase 14](../phase-14/README.md) (dashboard shell, widgets rendering, freshness badges, switchers), [Phase 15](../phase-15/README.md) (allocated dimensions, hierarchy/tag ABAC), [Phase 13](../phase-13/README.md) (semantic query, cache), [Phase 09](../phase-09/README.md) (safe file writer with formula-injection neutralization), [Phase 05](../phase-05/README.md) (roles, data scopes) |
| Primary PRD requirements | FR-DSH-004, FR-DSH-005, FR-DSH-006, FR-IAM-006, NFR-SEC-001 |
| Primary verification | Permissioned UI tests (Playwright, role × dashboard × scope), export permission tests |

## Goal
Let each tenant build its own dashboards and saved views without code: compose widgets (time series, bar, pie/treemap, table, KPI, heatmap) on a grid, save filters, start from templates, share with users and groups, and assign default dashboards per role. Every widget runs as the **viewer's** semantic query, so a shared dashboard never reveals data outside the viewer's ABAC scope. Widget data can be exported to CSV/XLSX subject to the same permissions.

## Scope
- Dashboard CRUD with versioned layout (12-column responsive grid), dashboard-level filters, time range, cost metric and currency defaults.
- Widget types: `timeseries`, `bar`, `pie`, `treemap`, `table`, `kpi`, `heatmap`. Each widget stores a semantic query and validated options.
- Saved views (named query + filters + visualization) with private/shared/tenant visibility.
- Templates: built-in (shipped as code-owned JSON) and tenant templates (created from a dashboard).
- Sharing: per user, group or tenant-wide; `view` or `edit`. Ownership transfer.
- Per-role default dashboards (tenant-configurable), resolution order user pin > role default > tenant default > built-in.
- Widget export CSV/XLSX: permission `dashboard:export`, ABAC-filtered, formula-injection neutralized via the Phase 09 safe writer, size caps, audit.
- UI: builder (drag/resize, widget config panel with semantic catalog), view mode, share dialog, template gallery, role defaults admin page.

## Out of scope
- Third-party widget plugins and signed bundles (FR-SDK-002, Phase 36). This phase defines the internal widget registry that Phase 36 extends.
- Scheduled report delivery of dashboards (Phase 30) and PDF export (Phase 29).
- AI-generated dashboards (Phase 28).
- Public/anonymous links. No unauthenticated sharing in v1.0.
- Budget and anomaly widgets (Phase 17 adds them to the registry).

## Dependencies
| Kind | Item |
|---|---|
| Phases | 05, 13, 14, 15 (hard); 09 (safe export writer) |
| External | Apache ECharts (Phase 14), `react-grid-layout` (MIT, license check per [LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md)), `excelize` for XLSX (BSD-3, already used by Phase 09) |
| Docs | [DATABASE_SCHEMA.md](../../architecture/DATABASE_SCHEMA.md) §2.4, [ANALYTICS_ADAPTERS.md](../../architecture/ANALYTICS_ADAPTERS.md), [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md), [CAPABILITY_MANIFEST.md](../../contracts/CAPABILITY_MANIFEST.md) (`DashboardWidget` kind), [TENANCY.md](../../architecture/TENANCY.md) |

## Deliverables
1. Migrations: dashboard/widget extensions, `saved_view_shares`, `dashboard_templates`, `role_default_dashboards`, `user_dashboard_prefs` (see [DESIGN.md](DESIGN.md) §3).
2. `internal/dashboards` module: service, widget registry, layout validator, sharing resolver, default resolver, export service.
3. REST endpoints under `/api/v1/dashboards`, `/api/v1/saved-views`, `/api/v1/dashboard-templates`, `/api/v1/dashboard-defaults`, widget export.
4. Web builder and viewer pages, share dialog, template gallery.
5. Built-in templates: FinOps overview, Engineering team, Finance month-to-date, Individual developer, Untagged cost.
6. Permissioned Playwright suite and export security tests.

## Key risks
| Risk | Mitigation |
|---|---|
| Shared dashboard leaks data of the author's scope | Widgets store queries, never results; execution always uses the viewer's principal; cache key includes viewer scope hash (Phase 13) |
| Filter values in saved queries leak (e.g. account IDs out of viewer scope) | Viewer sees filter chips only for values in scope; others render as "restricted filter"; widget still applies author filter ∩ viewer scope |
| Export used for exfiltration or formula injection | Separate permission, row caps, audit, Phase 09 neutralization, export rate-limit bucket |
| Layout JSON abuse (huge payloads, script injection in titles) | JSON Schema with caps; titles rendered as text; CSP |
| Dashboard with 30 widgets overloads analytics | Max 40 widgets, query concurrency per dashboard 6, viewport-lazy loading |

## Files in this phase
[REQUIREMENTS.md](REQUIREMENTS.md) · [DESIGN.md](DESIGN.md) · [IMPLEMENTATION.md](IMPLEMENTATION.md) · [API_CONTRACTS.md](API_CONTRACTS.md) · [TEST_PLAN.md](TEST_PLAN.md) · [TEST_RESULTS.md](TEST_RESULTS.md) · [ACCEPTANCE.md](ACCEPTANCE.md)

## Completion checklist
- [ ] Code: all `P16-T*` tasks merged
- [ ] Tests: every `P16-TC*` executed and recorded in [TEST_RESULTS.md](TEST_RESULTS.md)
- [ ] Docs: DATABASE_SCHEMA.md §2.4, OpenAPI, user guide (builder, sharing, defaults) updated
- [ ] Security review: sharing model, export path, stored-XSS surface reviewed by a security owner
- [ ] CHANGELOG updated under Unreleased (v0.3)
- [ ] Acceptance sign-off recorded in [ACCEPTANCE.md](ACCEPTANCE.md)
- [ ] Stopped at phase boundary (no Phase 17+ work merged under this phase)
