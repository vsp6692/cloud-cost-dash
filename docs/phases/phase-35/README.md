# Phase 35: External Provider Connector SDK **[LIC: plugin licensing, manifest license]**

| Field | Value |
|---|---|
| Status | **NOT STARTED** |
| Release checkpoint | v0.9 (phases 31–37) |
| Depends on | Phases 06, 07, 08, 09 (first-party providers built on the draft `sdk/provider`), Phase 12 (ingestion operations, checkpoints, error classes) |
| Blocks | Phase 36 (other SDKs reuse the plugin host), Phase 37 (contributor docs and catalog), Phase 38 (AC-08 gate) |
| Primary PRD requirements | FR-SDK-001, FR-SDK-003, FR-CON-001, NFR-CMP-001, NFR-LIC-001…004, UJ-12, AC-08, AC-11 |
| Primary verification | The example provider in `providers/examples/` compiles and passes the provider compatibility suite, both in-process and out-of-process, with no core changes |

> **Implementation status:** no code exists. Everything here is a plan. CloudLedger is **source-available**, not open source. Licensing work in this phase is documentation and CI compliance only; it does not change the plugin architecture or feature scope (ADR-0015).

## Goal

Freeze `sdk/provider` as **v1** and make it possible for a third party to build, test and run a provider connector for a cloud or SaaS vendor that CloudLedger does not ship (NG6), **without any change to core code**. Third-party providers run out-of-process over a versioned gRPC protocol inside a sandbox (ADR-0012). A `cloudledger-sdk` CLI scaffolds, validates and tests plugins.

## Scope

1. **SDK freeze**: `sdk/provider` v1.0.0 Go module (interfaces, types, error classes) per [PROVIDER_SDK.md](../../contracts/PROVIDER_SDK.md); API-diff guard (`gorelease`/`apidiff`) in CI from this phase onward.
2. **gRPC protocol**: `sdk/provider/proto/provider/v1/*.proto`, Go server and client adapters so an in-process `Provider` and a remote one are interchangeable behind the same interface.
3. **Plugin host** (`internal/plugins/host`): launch, handshake (magic cookie + protocol version negotiation + mTLS on the Unix socket), health checks, restart with backoff, graceful shutdown, credential brokering.
4. **Sandbox**: separate OS user / container, cgroup CPU+memory+pids limits, fd limits, read-only filesystem, seccomp `RuntimeDefault`, egress allow-list from the manifest, no access to PG, analytics store, object storage or KMS.
5. **Manifest schema**: `schemas/manifest/plugin-manifest.v1.json` (JSON Schema 2020-12) covering all four kinds (Provider here; other kinds' sections stubbed and completed in Phase 36), validator in `sdk/provider/manifest`.
6. **`cloudledger-sdk` CLI** (`cmd/cloudledger-sdk`): `init`, `validate`, `test`, `package`, `run --dev`.
7. **Testkit**: `sdk/provider/testkit` compatibility suite (groups in PROVIDER_SDK.md §4) runnable against in-process and gRPC plugins, plus fixture recorder/replayer with read-only HTTP allow-list.
8. **Example provider**: `providers/examples/examplecloud` (fictional "Example Cloud" with CSV billing artifacts and a JSON inventory API served by a local fixture server) that compiles and passes the suite.
9. **Admin plugin management**: `GET/POST/PATCH /api/v1/admin/plugins`, admin **Plugins** page listing id, version, kind, execution mode, SDK compatibility, checksum, status and the **declared license**.
10. **[LIC] Plugin licensing implementation** per [PLUGIN_LICENSING.md](../../legal/PLUGIN_LICENSING.md):
    - required `metadata.license` SPDX expression in the manifest, validated syntactically against the SPDX license list and `LicenseRef-*` grammar; **informational only, never enforced at runtime** (NFR-LIC-004);
    - license shown on the admin Plugins page and in the manifest validation log;
    - in-tree plugins require a signed CLA and `LicenseRef-CloudLedger-SAL-1.0` SPDX headers (CI);
    - out-of-tree rules documented in `docs/contributors/PLUGIN_AUTHORING.md` and the scaffold's generated README;
    - **OQ-22 decision** applied to `sdk/provider`, `sdk/provider/testkit`, `schemas/manifest` and `providers/examples` per [LICENSE_MAP.md](../../legal/LICENSE_MAP.md), with REUSE/SPDX headers and an **import-lint rule** so permissive paths never import core packages.

## Out of scope

- Recommendation, pricing and dashboard SDKs and WASM evaluation (Phase 36).
- Public plugin catalog operation, certification naming rules, CLA Assistant go-live with the counsel-approved CLA (Phase 37).
- Remote plugin registries, auto-download or auto-update of plugins (not planned for v1.0).
- Any license key, entitlement check or usage metering for plugins or core (prohibited by NFR-LIC-004).
- Moving AWS/GCP/Azure providers out of process (they stay compiled in; they must still pass the suite).
- Windows plugin hosts (linux/amd64 and linux/arm64 only, NFR-PORT-001).

## Deliverables

| # | Deliverable | Path |
|---|---|---|
| D1 | Frozen SDK module v1.0.0 | `sdk/provider/` |
| D2 | gRPC IDL + generated stubs | `sdk/provider/proto/provider/v1/` |
| D3 | Plugin host and sandbox | `internal/plugins/host/`, `internal/plugins/sandbox/` |
| D4 | Manifest JSON Schema and validator | `schemas/manifest/plugin-manifest.v1.json`, `sdk/provider/manifest/` |
| D5 | CLI | `cmd/cloudledger-sdk/` |
| D6 | Compatibility testkit | `sdk/provider/testkit/` |
| D7 | Example provider | `providers/examples/examplecloud/` |
| D8 | Admin API + Plugins page | `internal/plugins/api/`, `apps/web/app/admin/plugins/` |
| D9 | Migration for `plugins_installed` extensions | `database/postgres/migrations/` |
| D10 | [LIC] license headers, import-lint, CI checks, plugin-licensing docs | `.reuse/dep5` or per-file headers, `.golangci.yml` depguard, `docs/contributors/PLUGIN_AUTHORING.md` |
| D11 | Phase documentation, CHANGELOG entry | this directory, `CHANGELOG.md` |

## Key risks

| Risk | Mitigation |
|---|---|
| OQ-22 (permissive vs. CL-SAL + exception for Plugin Interfaces) still undecided by counsel | Phase cannot exit (see ACCEPTANCE exit gate). Headers are applied through one REUSE config so the decision is a one-line change. |
| `hashicorp/go-plugin` is **MPL-2.0**, which is on the *review-required* list in [LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md) | Record an exception in `compliance/license-exceptions.yaml` with maintainer + Licensor approval, **or** implement the handshake natively on `google.golang.org/grpc` (Apache-2.0). Decision task P35-T02. |
| Sandbox escape or credential exfiltration by a malicious plugin | Defense in depth (OS user, cgroups, seccomp, NetworkPolicy, credential broker issues short-lived scoped tokens); covered in Phase 34 pen-test scope. |
| Freezing v1 too early locks in mistakes | Draft SDK already exercised by three first-party providers since Phase 06; API review with external pilot author before freeze. |
| Contradictory license designation for `providers/examples/` (see DESIGN §9) | Resolved explicitly in P35-T13 with Licensor sign-off. |

## Links

[PRD](../../product/PRD.md) · [PROVIDER_SDK.md](../../contracts/PROVIDER_SDK.md) · [CAPABILITY_MANIFEST.md](../../contracts/CAPABILITY_MANIFEST.md) · [COMPATIBILITY.md](../../contracts/COMPATIBILITY.md) · [ADR-0012](../../architecture/adr/0012-plugin-model-compile-time-first-party.md) · [ADR-0015](../../architecture/adr/0015-source-available-licensing.md) · [PLUGIN_LICENSING.md](../../legal/PLUGIN_LICENSING.md) · [LICENSE_MAP.md](../../legal/LICENSE_MAP.md) · [LICENSE_COMPLIANCE.md](../../legal/LICENSE_COMPLIANCE.md) · [OPEN_QUESTIONS (OQ-14, OQ-22)](../../product/OPEN_QUESTIONS.md) · [Provider guides](../../providers/README.md) · [Security docs](../../security/README.md) · [Phase 36](../phase-36/README.md)

## Completion checklist

- [ ] Code: all `P35-T*` tasks merged; SDK tagged `sdk/provider/v1.0.0` (planned)
- [ ] Tests: every `P35-TC*` executed and recorded in [TEST_RESULTS.md](TEST_RESULTS.md) with real commands and evidence
- [ ] Docs: plugin authoring guide, manifest reference, SDK reference, OpenAPI `admin/plugins` section updated
- [ ] Security review: sandbox and plugin host threat model reviewed by the `security` area owner; findings triaged
- [ ] [LIC] OQ-22 decided by counsel and recorded in OPEN_QUESTIONS decision log; headers, import-lint and REUSE green
- [ ] CHANGELOG `Unreleased` entry added
- [ ] Acceptance sign-off in [ACCEPTANCE.md](ACCEPTANCE.md) by two maintainers including the `security` area owner and the Licensor designee for [LIC] criteria
- [ ] Stopped at phase boundary: Phase 36 not started in this phase's changes
