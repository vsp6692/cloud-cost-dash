# ADR-0002: Next.js web app as BFF with server-side sessions

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
The UI needs rich dashboards (ECharts), SSR for performance, and secure token handling.

## Decision
`apps/web` uses Next.js (App Router), TypeScript, Tailwind, shadcn/ui and Apache ECharts. The Next.js server acts as a Backend-for-Frontend: it holds the OIDC session in an encrypted, HttpOnly, SameSite=Lax cookie and calls the Go API with a short-lived access token server-side. No tokens are stored in browser JS-accessible storage. The API is still fully usable directly (API tokens) for automation.

## Alternatives considered
- SPA with tokens in the browser: rejected because of XSS token-theft risk.
- Go-rendered templates: rejected because the dashboard builder needs rich interactivity.

## Consequences
- Two runtimes (Go + Node).
- CSRF protection required on BFF mutation routes.
- Typed API client generated from OpenAPI.
