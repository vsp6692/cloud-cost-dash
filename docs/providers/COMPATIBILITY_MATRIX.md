# Provider Compatibility Matrix

Status: **DRAFT**. Nothing in this matrix is implemented. It records the **intended** availability of each capability per provider and scope type, and the phase that will deliver it. Availability levels are defined in [README §3.1](README.md#31-availability-levels):

- **A** = available (works with the documented permissions)
- **E** = entitlement-dependent (support plan, agreement type, opt-in, billing role)
- **S** = customer setup required (export, index, aggregator, agent)
- **P** = partial view (data limited to the scope; purchases or org-level charges missing)
- **—** = not supported / not applicable
- **?** = to be verified in the delivering phase

Cells show level and delivering phase. Entries marked **?** must be confirmed against current provider documentation before the phase exits; see the provider documents for details.

## 1. AWS ([AWS.md](AWS.md))

| Capability | Standalone account | Organization (management/payer) | Member (linked) account | Delegated admin account | Phase |
|---|---|---|---|---|---|
| Scope discovery | A | A | P (self only) | A? (via Organizations delegation policy) | 06 |
| Billing: CUR 2.0 Data Exports (Parquet, S3) | S | S (all members) | S, P (own usage, member-period only)? | — (billing not delegable)? | 06 |
| Billing: Athena path | S | S | S, P | S | 06 |
| Billing: FOCUS 1.2 with AWS columns export (cross-check) | S | S | S, P | — | 06 (ingest), 11 (compare) |
| Cost preview: Cost Explorer (charged) | E (CE enabled) | E | E, P | — | 06 |
| Invoices: Invoicing API (summaries) | E? | E? | E? | — | 10 |
| Inventory: Resource Explorer | S (index) | S (org view needs delegated admin)? | S | S | 19 |
| Inventory: Config aggregator | S (recording) | S | S | S | 19 |
| Metrics: CloudWatch | A (per account) | via member roles | A | via member roles | 20 |
| Recommendations: Compute Optimizer | E (opt-in) | E (org opt-in) | E | E | 21 |
| Recommendations: Trusted Advisor | E (Business/Enterprise On-Ramp/Enterprise Support) | E | E | E? | 21 |
| Recommendations: Cost Optimization Hub (candidate) | E (opt-in) | E | E | E | 21? |
| Pricing: Price List API | A | A | A | A | 21 |
| Commitments: RIs / Savings Plans inventory | A | A (org SPs; member RIs?) | A, P | — | 18, 25 |
| Commitments: utilization (from CUR) | S | S | S, P | — | 18 |
| GovCloud / China partitions | — | — | — | — | not in v1.0 |

## 2. Google Cloud ([GCP.md](GCP.md))

| Capability | Billing account | Organization | Folder | Project | Phase |
|---|---|---|---|---|---|
| Scope discovery | A (linked projects) | A | A | A | 07 |
| Billing: detailed BigQuery export | S (enable; limited/no backfill) | — (billing account only) | — | P (rows filtered by project, if granted)? | 07 |
| Billing: standard BigQuery export | S | — | — | P? | 07 |
| Billing: GCS path (customer-exported files) | S | — | — | — | 07 |
| Pricing export (contract prices) | S | — | — | — | 07 (ingest), 21 |
| Pricing: Cloud Billing Catalog (list prices) | A | A | A | A | 21 |
| Invoices | — (upload only)? | — | — | — | 10 |
| Inventory: Cloud Asset Inventory | — | A | A | A | 19 |
| Metrics: Cloud Monitoring | — | via metrics scope | via metrics scope | A | 20 |
| Recommendations: Recommender | A (CUD recommenders) | A | A | A | 21 |
| Commitments: resource-based CUDs | — | — | — | A | 18, 25 |
| Commitments: spend-based CUDs | S (from export)? | — | — | — | 18, 25 |
| Reseller / sub-accounts | — | — | — | — | not in v1.0 |

## 3. Azure ([AZURE.md](AZURE.md))

Billing scopes by agreement type:

| Capability | EA enrollment / dept / account | MCA billing account / profile / invoice section | MPA partner / customer | MOSP (PAYG) | Phase |
|---|---|---|---|---|---|
| Agreement detection and billing discovery | A | A | A (partner) | P (subscription only) | 08 |
| Billing: ActualCost + AmortizedCost exports | S | S | S (partner)? | — (use subscription scope) | 08 |
| Billing: FocusCost export | S? | S | S? | — | 08, 11 |
| Billing: Cost Details API | A? | A | ? | ? | 08 |
| Cost preview: Query API | A | A | A? | — | 08 |
| Invoices | E? (EA API differs) | E (billing reader) | E (partner) | — (subscription level) | 10 |
| Price sheet (negotiated prices) | E | E | E? | — | 21 |
| Reservations / savings plans inventory | E (Reservations Reader) | E | E? | E | 18, 25 |
| Commitment utilization (from amortized export) | S | S | S? | — | 18 |

Resource scopes (all agreement types):

| Capability | Management group | Subscription | Resource group | Phase |
|---|---|---|---|---|
| Billing exports | S, P (purchases may be excluded)? | S, P | S, P | 08 |
| Query API preview | A, P | A, P | A, P | 08 |
| Inventory: Resource Graph | A | A | A | 19 |
| Metrics: Azure Monitor | A (via subscriptions) | A | A | 20 |
| Recommendations: Advisor | A (via subscriptions) | A | A? | 21 |
| Pricing: Retail Prices API (retail only) | A (no auth) | A | A | 21 |
| CSP customer (subscription) costs | — | P (retail rates, partner must enable) | P | 08 |
| Sovereign clouds (Government, China) | — | — | — | not in v1.0 |

## 4. Generic imports ([GENERIC_IMPORTS.md](GENERIC_IMPORTS.md))

| Capability | UI/API upload | Object-store polling (S3, GCS, Blob, MinIO) | Phase |
|---|---|---|---|
| Billing (CSV, JSON, NDJSON, XLSX, Parquet) | A | S | 09 |
| Invoices (PDF metadata + structured CSV) | A | S | 10 |
| Inventory / metrics | — (SDK plugins only) | — | 35 (SDK) |

## 5. Kubernetes ([RESOURCE_INVENTORY.md §7](../architecture/RESOURCE_INVENTORY.md))

| Capability | OpenCost-compatible allocation input | Prometheus metrics | Custom in-cluster agent | Phase |
|---|---|---|---|---|
| Workload cost allocation (requests, limits, usage) | S | S | — (OQ-18) | 20, 22 |
| Utilization metrics | S | S | — | 20 |

## 6. Cross-provider summary

| Capability | AWS | GCP | Azure | Generic |
|---|---|---|---|---|
| Keyless auth | AssumeRole + ExternalId / web identity | SA impersonation / WIF | Federated credentials / managed identity | per object store |
| Primary billing source | CUR 2.0 (Parquet, S3) | BigQuery detailed export | Cost Management exports (Blob) | files |
| Native FOCUS export | Yes (FOCUS 1.2 with AWS columns) | FOCUS BigQuery view (query)? | Yes (FocusCost; 1.2 preview)? | n/a |
| Restatement signal | new manifest / etag per period | new `export_time` rows per invoice month | new export run per period | changed object |
| Line-item ID | `identity_line_item_id` | none (composite key) | not guaranteed? | template natural key |
| Invoice API | summaries (Invoicing API)? | none for direct customers? | MCA/MPA yes; EA differs? | upload |
| Charged APIs to watch | Cost Explorer, CloudWatch `GetMetricData`, Athena | BigQuery scans, Storage Read API | none significant (throttling is the constraint) | — |
