# Provider SDK Contract (`sdk/provider`)

Status: **DRAFT interface**. Implemented and frozen as `v1` in Phase 35. First-party providers (Phases 06–08, 19–21) implement it from the start. Licensing of the SDK interfaces: see [LICENSE_MAP.md](../legal/LICENSE_MAP.md) (OQ-22) and [PLUGIN_LICENSING.md](../legal/PLUGIN_LICENSING.md).

## 1. Design rules
1. Providers are **read-only**. The SDK gives no API for mutating customer cloud resources.
2. Providers never touch CloudLedger databases. They return typed records or streams. The core persists them.
3. Providers receive credentials through a `CredentialProvider` scoped to their connector, never raw secrets in config.
4. All methods take `context.Context` and must honor cancellation and deadlines.
5. Errors must be classified with SDK error types (`ErrTransient`, `ErrThrottled{RetryAfter}`, `ErrAuth`, `ErrPermission{Capability, Missing []string}`, `ErrNotReady`, `ErrDataSchema`, `ErrNotSupported`).
6. Determinism: given the same upstream artifacts, outputs are identical (ordering may differ; the core sorts).

## 2. Go interfaces

```go
package provider // sdk/provider

type Provider interface {
    Manifest() Manifest                                  // static capability manifest
    Configure(ctx context.Context, cfg ConnectorConfig, creds CredentialProvider) (Connector, error)
}

type Connector interface {
    // Verification: per-capability permission probes. Must not mutate anything.
    Verify(ctx context.Context) (VerificationReport, error)
    // Scope discovery: org/accounts, billing accounts/projects, subscriptions/RGs …
    DiscoverScopes(ctx context.Context) (iter.Seq2[Scope, error])
    // Optional capabilities: type-assert or use Capabilities().
    Capabilities() CapabilitySet
}

type BillingSource interface { // capability: billing
    ListArtifacts(ctx context.Context, scope ScopeRef, since Checkpoint) ([]BillingArtifact, Checkpoint, error)
    OpenArtifact(ctx context.Context, a BillingArtifact) (ArtifactReader, error) // streaming, checksummed
    Mapping() MappingRef // provider → FOCUS mapping (key + version) bundled with the provider
}

type InvoiceSource interface { // capability: invoices
    ListInvoices(ctx context.Context, scope ScopeRef, period Period) ([]Invoice, error)
}

type InventorySource interface { // capability: inventory
    ListResources(ctx context.Context, scope ScopeRef, since Checkpoint) (iter.Seq2[Resource, error], Checkpoint, error)
}

type MetricsSource interface { // capability: metrics
    SupportedMetrics() []MetricDescriptor
    QueryMetrics(ctx context.Context, req MetricsRequest) (iter.Seq2[MetricSeries, error], error)
}

type RecommendationSource interface { // capability: provider_recommendations
    ListRecommendations(ctx context.Context, scope ScopeRef) (iter.Seq2[NativeRecommendation, error], error)
}

type PricingSource interface { // capability: pricing
    ListPrices(ctx context.Context, req PriceQuery) (iter.Seq2[Price, error], error)
}

type CommitmentSource interface { // capability: commitments
    ListCommitments(ctx context.Context, scope ScopeRef) ([]Commitment, error)
}
```

Key types (abbreviated):

```go
type BillingArtifact struct {
    ID            string    // stable: provider URI + version
    BillingPeriod Period
    Version       string    // e.g. CUR assembly id, Azure run id
    Format        string    // parquet|csv|csv.gz|json
    SizeBytes     int64
    SchemaHint    string
    Final         bool      // provider indicates the period is finalized
}

type VerificationReport struct {
    Capabilities map[Capability]CapabilityResult
}
type CapabilityResult struct {
    Status      string   // pass|fail|unknown|not_applicable
    Checks      []Check  // each: name, permission/API, result, remediation text, docs URL
}
```

## 3. Out-of-process plugins (third party)
- Transport: gRPC over a Unix socket (local) with a handshake (magic cookie + protocol version), following the go-plugin pattern ([ADR-0012](../architecture/adr/0012-plugin-model-compile-time-first-party.md)).
- IDL: `sdk/provider/proto/provider/v1/*.proto`, mirroring the Go interfaces. Streams are used for large iterators.
- Sandboxing: separate OS user or container, CPU, memory and file-descriptor limits, egress allow-list declared in the manifest, no DB or network access to CloudLedger internals.

## 4. Compatibility suite (`sdk/provider/testkit`)
Every provider (first- or third-party) must pass:

| Test group | Assertion |
|---|---|
| Manifest | validates against the JSON Schema; declared capabilities are implemented (and vice versa) |
| Verify | returns a result for each declared capability; no mutating calls (recorded HTTP fixtures checked against a read-only allow-list) |
| Discovery | stable scope IDs across runs; parent links valid |
| Billing | the fixture artifact maps to FOCUS rows that pass the conformance validator; control totals equal the fixture's expected totals |
| Idempotency | same artifacts → identical row set (hash) |
| Errors | throttling fixture → `ErrThrottled` with RetryAfter; denied fixture → `ErrPermission` with missing permissions |
| Cancellation | context cancel stops within 2 s with no goroutine leaks |
| Determinism | concurrent runs yield identical output |

Running: `go test ./... -run TestProviderCompatibility -provider=<path>` or `cloudledger-sdk test --plugin ./myplugin` (Phase 35).
