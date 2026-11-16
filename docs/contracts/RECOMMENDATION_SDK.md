# Recommendation SDK Contract (`sdk/recommendation`)

Status: **DRAFT interface**. The interfaces are first used internally in Phase 21 (first-party rules) and frozen as `v1` with the external compatibility suite in Phase 36. Engine design: [RECOMMENDATION_ENGINE.md](../architecture/RECOMMENDATION_ENGINE.md). Requirements: FR-REC-001, FR-REC-002, FR-SDK-002, AC-05, AC-08. Licensing of SDK interfaces: see [LICENSE_MAP.md](../legal/LICENSE_MAP.md) (OQ-22) and [PLUGIN_LICENSING.md](../legal/PLUGIN_LICENSING.md). CloudLedger itself is source-available; plugin authors choose their plugin's license as allowed there.

## 1. Design rules

1. **Rules are pure functions** of their `Inputs`. No network, no filesystem, no clock (`Inputs.EvaluationTime()` only), no randomness, no global state.
2. **Read-only.** The SDK exposes no API that mutates cloud resources or CloudLedger state. Rules return candidates; the core persists them. There is no auto-remediation (NG1).
3. **Money is decimal.** `Money` and `Decimal` types wrap the core decimal library; `float32/float64` are forbidden in money paths (lint enforced in the testkit, ADR-0007). Savings are monthly (730 h) in the currency declared by the inputs.
4. **Evidence or nothing.** Every candidate carries evidence sufficient to re-derive it. Insufficient data → no candidate plus a `DataGap` (never a fabricated recommendation).
5. **Determinism.** Same `Inputs` → identical `[]Candidate` (byte-identical after canonical serialization), independent of input iteration order, GOMAXPROCS or platform (§4).
6. **Bounded resources.** Rules honor `ctx` cancellation and declared limits (default per evaluation partition: 2 s CPU per 10 000 targets, 256 MiB).
7. Errors are classified: `ErrInputUnavailable{Input}`, `ErrInvalidThresholds`, `ErrInternal`. A rule error never fails other rules.

## 2. Go interfaces

```go
package recommendation // sdk/recommendation

// Rule is implemented by every recommendation rule plugin.
type Rule interface {
    Manifest() Manifest                                         // static; mirrors the RecommendationRule manifest
    Evaluate(ctx context.Context, in Inputs) (Result, error)    // pure, deterministic
}

type Result struct {
    Candidates []Candidate
    DataGaps   []DataGap   // targets skipped for insufficient/old data (reported, not recommended)
}

// Inputs is a read-only, pre-scoped view. Every accessor is tenant- and
// partition-scoped by the core; rules cannot widen scope.
type Inputs interface {
    EvaluationTime() time.Time            // fixed for the run (UTC)
    Partition() Partition                 // provider, scope ref, currency
    Thresholds() Thresholds               // manifest defaults merged with tenant overrides (validated)
    DataVersion() int64

    Targets(ctx context.Context, f TargetFilter) iter.Seq2[Resource, error]          // inventory (SCD2 as of EvaluationTime)
    Metrics(ctx context.Context, q MetricQuery) (MetricSummary, error)               // percentiles + coverage
    Cost(ctx context.Context, q CostQuery) (CostSummary, error)                       // semantic-layer backed; returns QueryRef
    Price(ctx context.Context, q PriceQuery) (PricePoint, error)                     // tenant effective or catalog, with certainty
    Commitments(ctx context.Context, q CommitmentQuery) ([]CommitmentContext, error) // coverage/utilization for targets/pools
    Freshness(input InputKind) Freshness
}

type Candidate struct {
    Target          TargetRef       // provider, native id, type, scope
    ActionClass     ActionClass     // eliminate|reshape|schedule|purchase_option|pricing|informational
    Action          Action          // typed, canonical (e.g. {"type":"resize","to":"m5.xlarge"})
    OverlapKeys     []string        // must be a subset of manifest overlap_keys patterns
    GrossMonthly    Money           // ≥ 0; 0 for informational/governance
    SavingsRange    *MoneyRange     // optional (informational rules)
    Confidence      ConfidenceFactors // base, coverage, lookback, freshness, pricing, volatility (Decimal 0..1)
    Risk            RiskAssessment  // level + modifiers applied
    Effort          Effort          // low|medium|high
    Steps           []string        // implementation guidance (plain text / Markdown subset)
    Rollback        []string        // rollback guidance (required unless ActionClass=informational)
    IaCSnippets     []IaCSnippet    // optional: terraform|cloudformation|bicep|gcloud; never executed by CloudLedger
    Evidence        []Evidence      // ≥ 1
}

type DataGap struct {
    Target  TargetRef
    Input   InputKind      // metrics|cost|inventory|pricing|commitments
    Reason  string         // e.g. "memory metric coverage 0.31 < 0.50"
}
```

`Money` is `{Amount Decimal; Currency string}` and serializes as `{"amount":"140.160000000000","currency":"USD"}`.

The core computes `fingerprint`, final `confidence`, `net` savings and overlap resolution. Rules supply factors and gross savings only.

## 3. Evidence schema

JSON Schema: `schemas/recommendation/evidence.v1.json` (Phase 21). Each evidence item:

```json
{
  "kind": "metric_summary",
  "title": "CPU utilization, 14 days",
  "data": {
    "metric": "cpu_utilization", "unit": "percent", "window": {"from": "2026-11-01T00:00:00Z", "to": "2026-11-15T00:00:00Z"},
    "granularity": "PT1H", "p50": "8.1000", "p95": "22.4000", "p99": "31.0000", "max": "44.2000",
    "samples": 1300, "expected_samples": 1344, "coverage": "0.9673"
  },
  "refs": [
    {"type": "metrics_rollup", "resource": "arn:aws:ec2:…:instance/i-0abc", "data_version": 4812},
    {"type": "semantic_query", "query_sha256": "…"}
  ]
}
```

| `kind` | Required `data` fields |
|---|---|
| `metric_summary` | metric, unit, window, granularity, percentiles used by the rule, samples, expected_samples, coverage |
| `cost_summary` | window, metric (`effective_cost` …), amount (decimal string), currency, query ref |
| `inventory_attributes` | attribute map relevant to the rule, snapshot time |
| `price_point` | sku/type, region, unit price, currency, source (`observed`/`catalog`/`estimate`), catalog version, certainty |
| `commitment_context` | commitment ids, coverage of target, flexibility group, utilization |
| `calculation` | formula id, inputs (decimal strings), result. Lets reviewers recompute gross savings |
| `provider_corroboration` | provider, native id, native savings and currency (added by the core) |

Untrusted strings (tag values, resource names) in evidence are data only. The UI and AI assistant render them escaped and delimited.

## 4. Determinism requirements

- Output candidates sorted by `(Target.NativeID, ActionClass, canonical(Action))`. Evidence is sorted by `(kind, title)`.
- No map iteration without sorting keys; no goroutine fan-out whose results are merged in completion order.
- Decimal arithmetic only for money and ratios that affect output. Percentile computation uses the core-provided summaries (rules do not compute percentiles from raw floats).
- `EvaluationTime` is the only time source. Durations are computed from it.
- Canonical serialization (RFC 8785 JSON) of the `Result` is hashed by the testkit. Equal inputs must give equal hashes across runs, across `GOMAXPROCS=1/8`, and on `linux/amd64` and `linux/arm64`.

## 5. Manifest (`kind: RecommendationRule`)

Extends [CAPABILITY_MANIFEST.md](CAPABILITY_MANIFEST.md) (strict schema; unknown fields rejected in v1).

```yaml
apiVersion: cloudledger.dev/plugin/v1
kind: RecommendationRule
metadata:
  id: com.example.rules.idle-vm        # first-party: REC-IDLE-001
  name: Idle virtual machine
  version: 1.2.0
  vendor: Example Corp
  license: Apache-2.0                  # SPDX; informational (NFR-LIC-004)
  source: https://example.invalid/rules/idle-vm
  security_contact: security@example.invalid
compatibility:
  sdk: ">=1.0.0 <2.0.0"
  cloudledger: ">=0.5.0"
execution:
  mode: grpc                           # in_process (first-party) | grpc | wasm (if adopted, ADR-0012 / Phase 36)
category: idle                          # one of the FR-REC-003 categories
providers: [aws, gcp, azure]
targets: [aws:ec2:instance, gcp:compute:instance, azure:compute:virtualMachine]
inputs:
  cost: { metrics: [effective_cost], window_days: 30 }
  inventory: { types: [vm] }
  metrics:
    required: [cpu_utilization, network_in, network_out]
    optional: [memory_utilization]
    min_days: 7
    preferred_days: 14
  pricing: { required: false }
  commitments: { required: true }
action_classes: [eliminate]
overlap_keys: ["resource:{target}"]
default_thresholds:
  cpu_p95_max_pct: "5"
  network_bytes_per_day_max: "5000000"
  lookback_days: 14
  min_metric_coverage: "0.8"
risk_model:
  default: medium
  modifiers: [production_tag, stateful, has_dependencies]
confidence:
  base: "0.90"
```

Validation rules: thresholds are typed by a JSON Schema the rule exports via `Manifest().ThresholdsSchema`; numeric thresholds are decimal strings; `overlap_keys` patterns use only `{target}`, `{pool}` and `{nodepool}` placeholders; the declared `inputs` are the only inputs the core will provide (an undeclared accessor call returns `ErrInputUnavailable`).

## 6. Testkit and compatibility suite (`sdk/recommendation/testkit`)

Every rule (first- or third-party) must pass:

| Group | Assertion |
|---|---|
| Manifest | validates against the JSON Schema; category, providers, targets and inputs are consistent; thresholds schema valid |
| Fixtures | each fixture `tests/fixtures/recommendations/<rule>/<case>/{inputs.json, expected.json}` produces exactly `expected.json` (canonical compare). Required cases: positive, negative (just above threshold), boundary (exactly at threshold), missing optional metric (lower confidence), missing required metric (→ DataGap, no candidate), stale input (→ DataGap), production tag (risk modifier) |
| Determinism | 20 runs with shuffled iteration order and varying GOMAXPROCS → identical hash; amd64/arm64 CI matrix |
| Money | no float in money paths (static check); gross ≥ 0; currency equals partition currency |
| Evidence | ≥ 1 item; schema-valid; `calculation` evidence recomputes `GrossMonthly` exactly |
| Overlap | overlap keys within manifest patterns; the core resolver run on the rule's fixture plus a shared "busy resource" fixture satisfies INV-1…INV-4 |
| Isolation | no network or filesystem access (sandboxed run; grpc plugins with egress denied) |
| Limits | completes within declared limits on the 10 000-target synthetic fixture; honors cancellation within 2 s |
| No mutation | the SDK exposes no mutating API. For grpc plugins, the sandbox denies all egress unless declared (and recommendation rules declare none by default) |

Run: `go test ./... -run TestRecommendationCompatibility -rule=<path>` or `cloudledger-sdk test --plugin ./myrule` (Phase 36). AC-08 requires an example external recommendation plugin to pass this suite with no core changes.

## 7. Versioning

- `sdk/recommendation` follows SemVer independently (`sdk/v1`); see [COMPATIBILITY.md](COMPATIBILITY.md).
- A rule's `metadata.version` is stored as `recommendations.rule_version`. A change to thresholds defaults, formulas or action shape requires at least a minor version bump. A change to the action shape for the same target changes the fingerprint (old recommendations become `superseded`).
