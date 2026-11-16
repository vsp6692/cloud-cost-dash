# Phase 35 API Contracts

All contracts are **planned**. Source of truth after implementation: [`api/openapi/cloudledger.v1.yaml`](../../../api/openapi/cloudledger.v1.yaml), `sdk/provider` (Go), `sdk/provider/proto/provider/v1/*.proto`, [`schemas/manifest/plugin-manifest.v1.json`](../../../schemas/manifest/plugin-manifest.v1.json).

## 1. REST: admin plugin management (platform admin only)

Conventions per [API_GUIDELINES.md](../../contracts/API_GUIDELINES.md): RFC 9457 errors, cursor pagination, `Idempotency-Key` on POST, `If-Match` on PATCH. Plugins are deployment-scoped (no tenant header; RF-12).

| Method | Path | Purpose | Notes |
|---|---|---|---|
| `GET` | `/api/v1/admin/plugins` | List installed plugins | `filter[kind]`, `filter[status]`; returns `license` for every item |
| `GET` | `/api/v1/admin/plugins/{id}` | Plugin detail incl. manifest and validation log | |
| `POST` | `/api/v1/admin/plugins` | Install from uploaded package (multipart) or server-local path | `202` + Operation; validates schema, SPDX syntax, checksum, optional Cosign signature, SemVer compatibility |
| `PATCH` | `/api/v1/admin/plugins/{id}` | `{"enabled": true|false}` | audited `plugin.enabled` / `plugin.disabled` |
| `GET` | `/api/v1/admin/plugins/{id}/validation-log` | Paginated validation entries | |

Example item:
```json
{"id":"0193…","plugin_key":"com.example.examplecloud","name":"Example Cloud connector for CloudLedger",
 "version":"0.1.0","kind":"Provider","execution_mode":"grpc","sdk_range":">=1.0.0 <2.0.0",
 "protocol_version":1,"status":"running","status_reason":null,
 "license":"Apache-2.0","license_note":"Declared by the plugin author. Informational only.",
 "checksum":"sha256:…","signature_verified":false,"installed_at":"2026-11-16T00:00:00Z","etag":"W/\"3\""}
```

Errors: `422 manifest_invalid` (pointer to failing field, e.g. `/metadata/license`), `422 license_expression_invalid`, `409 plugin_version_exists`, `422 incompatible_sdk`, `422 signature_required`. There is **no** error code or status derived from the license value (NFR-LIC-004).

## 2. Events (CloudEvents, [EVENTS.md](../../contracts/EVENTS.md))

| Type (`dev.cloudledger.` + …) | Producer | Idempotency key |
|---|---|---|
| `plugin.installed.v1` | plugins | plugin key + version |
| `plugin.state_changed.v1` (`running`, `degraded`, `disabled`, `incompatible`) | plugins | plugin id + seq |

Audit actions: `plugin.install`, `plugin.enable`, `plugin.disable`, `plugin.launch_failed`, `plugin.credential_issued` (no secret material).

## 3. Go SDK (`sdk/provider`, v1.0.0 frozen)

Interfaces exactly as in [PROVIDER_SDK.md §2](../../contracts/PROVIDER_SDK.md) (`Provider`, `Connector`, `BillingSource`, `InvoiceSource`, `InventorySource`, `MetricsSource`, `RecommendationSource`, `PricingSource`, `CommitmentSource`) plus error classes. Additions in this phase:

```go
package grpcplugin // sdk/provider/grpcplugin
func Serve(p provider.Provider, opts ...ServeOption) error          // plugin main()
func NewClient(ctx context.Context, conn HostConn) (provider.Provider, error) // host side

package manifest // sdk/provider/manifest
func Parse(b []byte) (Manifest, error)
func Validate(m Manifest) []Issue               // schema + SPDX syntax + semantic checks
func ValidateSPDX(expr string) error             // syntax only; never policy

package testkit // sdk/provider/testkit
func Run(t *testing.T, target Target, opts ...Option) // groups per PROVIDER_SDK §4
```

RF-11 (`PreviewSource` for Cost Explorer / Azure Query) is decided before the freeze; if accepted it is an optional interface in v1.0.0.

## 4. gRPC protocol `cloudledger.provider.v1`

Services: `Handshake.Negotiate`, `Provider.{Manifest,Configure}`, `Connector.{Verify,DiscoverScopes,Capabilities}`, `Billing.{ListArtifacts,OpenArtifact (server stream of 1 MiB chunks + sha256 trailer),Mapping}`, `Inventory.ListResources (stream)`, `Metrics.QueryMetrics (stream)`, `Pricing.ListPrices (stream)`, `Invoices.ListInvoices`, `Commitments.ListCommitments`, `Recommendations.ListRecommendations (stream)`, host-provided `CredentialProvider.Get`, `Health.Check`.
Error classes map to `google.rpc.Status` details (`ErrorInfo.reason` = `THROTTLED|PERMISSION|AUTH|TRANSIENT|NOT_READY|DATA_SCHEMA|NOT_SUPPORTED`, `RetryInfo` for throttling). Compatibility: `buf breaking` against the v1 baseline in CI.

## 5. Manifest schema

`plugin-manifest.v1.json` (`apiVersion: cloudledger.dev/plugin/v1`): `metadata.license` **required**, `type: string`, SPDX expression validated by the validator (JSON Schema checks presence and length only). `execution.egress` required when `mode: grpc`. Strict (`additionalProperties: false`). Kinds `RecommendationRule`, `PricingSource`, `DashboardWidget` are reserved and completed in Phase 36.

## 6. CLI (`cloudledger-sdk`)

`init --kind provider --id <reverse-dns> [--license <spdx>]`, `validate <dir>`, `test --plugin <dir> --mode inproc|grpc|both`, `package <dir> -o <file>`, `run --dev <dir>`. Exit codes: 0 ok, 1 validation/test failure, 2 usage error.

## 7. Frozen / verified contracts

Frozen at exit: `sdk/provider` v1, proto `provider/v1`, manifest `v1` (Provider kind). Verified unchanged: [COMPATIBILITY.md](../../contracts/COMPATIBILITY.md) promises; public REST v1 additive only (`oasdiff` CI).
