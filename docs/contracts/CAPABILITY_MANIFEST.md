# Capability Manifest

Every provider, recommendation, pricing and dashboard plugin ships a manifest. JSON Schema: `schemas/manifest/plugin-manifest.v1.json` (delivered in Phase 35; draft below).

## Example (provider)

```yaml
apiVersion: cloudledger.dev/plugin/v1
kind: Provider
metadata:
  id: aws                       # globally unique; third-party: reverse-DNS e.g. com.example.oci
  name: Amazon Web Services
  version: 1.4.0                # SemVer of the plugin
  vendor: CloudLedger Maintainers
  license: LicenseRef-CloudLedger-SAL-1.0   # SPDX expression (required; see docs/legal/PLUGIN_LICENSING.md)
  source: https://example.invalid/cloudledger/providers/aws
  security_contact: security@example.invalid
compatibility:
  sdk: ">=1.0.0 <2.0.0"
  cloudledger: ">=0.2.0"
  focus_versions: ["1.2"]
execution:
  mode: in_process              # in_process (first-party) | grpc (out-of-process)
  egress:                       # required for grpc plugins; enforced where possible
    - "*.amazonaws.com:443"
auth_methods:
  - id: assume_role
    params: [role_arn, external_id]
    keyless: true
  - id: access_key              # discouraged; static secret via secret reference
    keyless: false
scopes:
  - type: aws_organization
    children: [aws_account]
  - type: aws_account
capabilities:
  billing:
    sources: [cur2_data_exports_s3, athena]
    formats: [parquet]
    granularity: [hourly, daily]
    restatements: true
    mapping: { key: aws-cur2-focus, version: 3 }
  invoices: { availability: entitlement_dependent }
  inventory: { sources: [resource_explorer, config_aggregator] }
  metrics: { sources: [cloudwatch], metrics: [cpu_utilization, network_in, network_out, disk_read_ops] }
  provider_recommendations: { sources: [compute_optimizer, trusted_advisor], availability: entitlement_dependent }
  pricing: { sources: [price_list_api] }
  commitments: { types: [ri, savings_plan] }
permissions:
  template_refs:
    cloudformation: templates/aws/cloudledger-readonly.yaml
    terraform: templates/aws/terraform
  required:
    billing: ["s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation", "bcm-data-exports:GetExport", "bcm-data-exports:ListExports"]   # + kms:Decrypt when the bucket uses SSE-KMS; authoritative list in docs/providers/AWS.md
    inventory: ["resource-explorer-2:Search", "config:SelectAggregateResourceConfig"]
```

## Rules
1. `license` is mandatory and must be a valid SPDX expression. It is displayed to admins and is informational only (no runtime enforcement; NFR-LIC-004).
2. A capability listed in the manifest must be implemented. The compatibility suite fails otherwise.
3. `availability: entitlement_dependent` means the capability may legitimately report `unknown` or `fail` at verification. The UI explains why.
4. Manifests are immutable per plugin version. The checksum is recorded in `plugins_installed`.
5. Unknown fields are rejected in `v1` (strict schema). New optional fields arrive with minor SDK versions.

## Other manifest kinds
| kind | Specific sections |
|---|---|
| `RecommendationRule` | `category`, `inputs` (cost, inventory types, metrics, pricing), `targets` (resource types), `overlap_keys`, `default_thresholds`, `risk_model` |
| `PricingSource` | `providers`, `catalog_types` (on-demand, spot, commitment), `refresh` |
| `DashboardWidget` | `widget_type`, `query_shape` (semantic query constraints), `options_schema` (JSON Schema), `bundle` (signed JS bundle, CSP-restricted) |
