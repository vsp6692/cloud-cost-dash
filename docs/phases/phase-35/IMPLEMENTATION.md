# Phase 35 Implementation Plan

All commands below are **planned**; no tooling exists yet. Size: S ≤ 2 days, M ≤ 5 days, L ≤ 10 days.

## Preconditions

- OQ-14 accepted (plugin execution model). OQ-22 decision requested from counsel at phase start; tasks P35-T12/T13 are blocked until it lands.
- Phase 34 pen-test scope document includes "plugin sandbox"; its findings for this area are fed into P35-T05.
- First-party providers (Phases 06–08) compile against the draft SDK.

## Ordered tasks

| ID | Task | Files / dirs | Size | Depends |
|---|---|---|---|---|
| P35-T01 | SDK API review and freeze: reconcile draft interfaces with what AWS/GCP/Azure actually use; remove unused exports; document every exported identifier; add `apidiff` CI job baseline at `sdk/provider/v1.0.0`. | `sdk/provider/*.go`, `sdk/provider/doc.go`, `.github/workflows/sdk-apidiff.yml` | M | — |
| P35-T02 | Dependency decision for plugin transport: native handshake on `google.golang.org/grpc` vs. `hashicorp/go-plugin` (MPL-2.0, review-required). Write a short decision note; if go-plugin, add an exception to `compliance/license-exceptions.yaml` with maintainer + Licensor approval and expiry. | `docs/architecture/adr/` (amendment note to ADR-0012 if needed), `compliance/license-exceptions.yaml` | S | — |
| P35-T03 | Proto IDL and codegen: `provider.proto`, `credentials.proto`, `health.proto`, `handshake.proto`; `buf lint` + `buf breaking` in CI. | `sdk/provider/proto/provider/v1/`, `buf.yaml`, `buf.gen.yaml` | M | T01 |
| P35-T04 | `grpcplugin` adapters: `Serve(provider.Provider)` and `Client` implementing `provider.Provider`; streaming iterators with back-pressure; error class mapping to gRPC status details. | `sdk/provider/grpcplugin/` | L | T03 |
| P35-T05 | Plugin host: launch, handshake, mTLS on UDS, health checks, deadlines, restart/backoff, degraded state, log capture with redaction, OTel propagation. | `internal/plugins/host/` | L | T04 |
| P35-T06 | Sandbox drivers: `exec` (cgroup v2, setuid, seccomp, nftables egress) and `pod` (Kubernetes Job-less long-running pod + NetworkPolicy generator). | `internal/plugins/sandbox/`, `deploy/helm/cloudledger/templates/plugins-*.yaml` | L | T05 |
| P35-T07 | Credential broker: gRPC `CredentialProvider` service backed by existing federation (ADR-0009); TTL ≤ 15 min; audit each issuance (without secret material). | `internal/plugins/credbroker/` | M | T05 |
| P35-T08 | Manifest JSON Schema v1 and validator, including SPDX expression parser (vendored SPDX license list JSON, refreshed by a scheduled job) and capability cross-check helper. | `schemas/manifest/plugin-manifest.v1.json`, `sdk/provider/manifest/` | M | T01 |
| P35-T09 | Registry and migration `0350_plugins_installed_v2`; validation log; checksum and optional Cosign signature verification. | `database/postgres/migrations/0350_*.sql`, `internal/plugins/registry/` | M | T08 |
| P35-T10 | Admin API (`/api/v1/admin/plugins`) and OpenAPI section; admin **Plugins** page (table with id, name, version, kind, mode, SDK range, status, **license**, checksum; detail drawer with validation log). Audit events. | `internal/plugins/api/`, `api/openapi/cloudledger.v1.yaml`, `apps/web/app/admin/plugins/` | M | T09 |
| P35-T11 | Testkit: all groups from PROVIDER_SDK §4, mode switch (`-mode=inproc|grpc`), fixture recorder/replayer, read-only HTTP method/URL allow-list, goleak; run against AWS, GCP, Azure in CI. | `sdk/provider/testkit/`, `tests/contracts/providers/` | L | T04, T08 |
| P35-T12 | `cloudledger-sdk` CLI: `init` (templates incl. LICENSE/NOTICE/README with out-of-tree rules), `validate`, `test`, `package` (reproducible tar, sha256, Syft SPDX SBOM), `run --dev`. | `cmd/cloudledger-sdk/`, `cmd/cloudledger-sdk/templates/` | M | T08, T11 |
| P35-T13 | Example provider "Example Cloud": CSV billing artifacts, JSON inventory API served by `testdata` fixture server, verification probes, FOCUS mapping; `go.mod` depending only on `sdk/provider`. Resolve the `providers/examples` license designation conflict with Licensor. | `providers/examples/examplecloud/` | M | T11, T12 |
| P35-T14 | **[LIC]** Apply OQ-22 decision: `REUSE.toml` annotations / per-file SPDX headers for `sdk/provider/**`, `schemas/manifest/**`, `providers/examples/**`; add `LICENSE` file in `sdk/provider/` if Option A; depguard rule `plugin-interfaces-no-core`; CODEOWNERS `license-boundary` rule. | `REUSE.toml`, `LICENSES/`, `.golangci.yml`, `.github/CODEOWNERS` | S | OQ-22 decided |
| P35-T15 | **[LIC]** In-tree plugin CI: require `cla/required`, `dco`, `reuse lint` on `providers/**`; header check rejects non-CL-SAL headers outside designated permissive paths. | `.github/workflows/license-compliance.yml` | S | T14 |
| P35-T16 | **[LIC]** Docs: `docs/contributors/PLUGIN_AUTHORING.md` (in-tree vs out-of-tree, license field, trademark naming, no core copying, no bundling), manifest reference, SDK reference (`go doc` export), link from CONTRIBUTING §2. Test that no code reads `license_spdx` for decisions (P35-TC16). | `docs/contributors/`, `docs/contracts/CAPABILITY_MANIFEST.md` (link only) | S | T10, T12 |
| P35-T17 | Observability: plugin metrics (`cloudledger_plugin_calls_total{plugin,method,code}`, `cloudledger_plugin_restarts_total`, `cloudledger_plugin_up`), dashboard panel, alert `PluginDegraded` with runbook. | `internal/plugins/host/metrics.go`, `deploy/grafana/`, `docs/operations/RUNBOOKS.md` (entry) | S | T05 |
| P35-T18 | Phase docs, CHANGELOG, TEST_RESULTS, acceptance report. | `docs/phases/phase-35/`, `CHANGELOG.md` | S | all |

## Planned commands

```bash
make lint test                                   # planned
buf lint && buf breaking --against '.git#branch=main'
go test ./sdk/provider/... ./internal/plugins/...
go test ./tests/contracts/providers/... -run TestProviderCompatibility -mode=grpc
cloudledger-sdk init --kind provider --id com.example.examplecloud ./tmp/ec
cloudledger-sdk validate ./providers/examples/examplecloud
cloudledger-sdk test --plugin ./providers/examples/examplecloud --mode both
reuse lint && golangci-lint run --enable depguard
```

## Feature flags

| Flag | Default | Purpose |
|---|---|---|
| `plugins.grpc.enabled` | `false` until exit, then `true` | Allow out-of-process plugins |
| `plugins.requireSignature` | `false` (Lite), `true` (HA values) | Cosign verification of plugin packages |
| `plugins.allowUnsandboxed` | `false` | Dev-only escape hatch; logged as warning |

## Rollout

1. Merge SDK freeze and proto behind no flag (library only).
2. Ship host + sandbox with `plugins.grpc.enabled=false`; run the suite in CI against the example in grpc mode.
3. Enable in staging HA cluster; chaos test plugin crash/hang (reuse Phase 33 chaos harness).
4. Flip default to `true` in the v0.9 release notes.

## Rollback

- Disable `plugins.grpc.enabled`; in-process providers are unaffected. Connectors using a grpc plugin show `unavailable` (data already ingested remains).
- Migration `0350` is additive; rollback means leaving new columns unused (expand/contract; no down migration per COMPATIBILITY.md).
- SDK v1.0.0 tag is never retracted; fixes ship as v1.0.x.

## Definition of done

- All `P35-T*` merged with tests; `P35-TC*` executed and recorded with real commands and evidence.
- Example provider passes in both modes with zero diffs under `internal/` and `apps/` in the example's PR.
- [LIC] OQ-22 decision recorded; `reuse lint`, depguard and CLA checks green; plugin authoring guide published in-repo.
- Security review of host/sandbox complete; no open critical/high findings.
- CHANGELOG updated; ACCEPTANCE signed; work stopped at the phase boundary.
