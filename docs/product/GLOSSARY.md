# Glossary

| Term | Definition |
|---|---|
| **Tenant** | The top-level isolation boundary in CloudLedger. All customer data belongs to exactly one tenant. |
| **Workspace / hierarchy node** | A node in a tenant's configurable business hierarchy (BU → cost center → team …). |
| **Connector** | A configured instance of a provider integration for a tenant (e.g. "AWS payer 1234…"). |
| **Capability** | A typed function a connector can perform: `billing`, `invoices`, `inventory`, `metrics`, `recommendations`, `pricing`, `commitments`. |
| **Scope** | A provider-level boundary: AWS org/account, GCP org/folder/billing account/project, Azure billing account/profile/invoice section/management group/subscription/resource group. |
| **Ingestion run** | One execution of a capability sync for a connector scope and time window. Has an ID that appears in lineage. |
| **Source file / source object** | A raw provider artifact (CUR Parquet, BigQuery extract, Azure export CSV/Parquet, uploaded file) retained in object storage. |
| **Billing period** | Provider's billing month. May be restated (re-delivered) until finalized. |
| **Restatement** | Provider re-delivery of an already ingested billing period, superseding the previous data. |
| **FOCUS** | FinOps Open Cost and Usage Specification, the normalized cost schema standard. |
| **ListCost** | Cost at public list price (FOCUS). |
| **ContractedCost** | Cost at negotiated prices, before commitment amortization (FOCUS). |
| **BilledCost** | Amount invoiced for the charge; the basis for invoice reconciliation (FOCUS). |
| **EffectiveCost** | Amortized cost including prorated commitment purchases and discounts (FOCUS). |
| **Amortization** | Spreading an upfront or recurring commitment fee across the usage it covers. |
| **Commitment** | RI, Savings Plan, CUD, Azure Reservation or Savings Plan. |
| **Allocation rule** | A versioned rule mapping cost rows to hierarchy nodes or dimensions, or splitting shared costs. |
| **Unallocated** | Cost not matched by any allocation rule. It is always shown, never hidden. |
| **Showback / chargeback** | Reporting allocated cost to owners (showback), or billing them internally (chargeback). |
| **Reconciliation** | Matching normalized cost to invoices and classifying variances. |
| **Period close** | Locking an accounting period. Produces an immutable snapshot and manifest. |
| **Report manifest** | JSON document listing report inputs, versions, filters and SHA-256 hashes of outputs. |
| **Semantic layer** | CloudLedger's metric and dimension model compiled into engine-specific SQL. |
| **Recommendation** | An evidence-backed proposed change with projected savings, confidence and risk. |
| **Net savings** | Projected savings after removing overlap with other recommendations and commitment effects. |
| **Realized savings** | Measured cost reduction attributable to an implemented recommendation versus its baseline. |
| **Freshness** | Time between now and the latest data point successfully ingested for a scope and capability. |
| **Completeness** | Fraction of expected scopes and periods successfully ingested. |
| **Lineage** | Chain from a normalized or allocated value back to source file, row, mapping version and run. |
| **ABAC** | Attribute-based access control: data visibility determined by attributes (scope, tags, hierarchy). |
| **Secret reference** | Pointer (e.g. `vault://kv/cl/aws-role`) resolved at runtime instead of storing a secret value. |
| **Profile (deployment)** | Lite, Standard, HA Enterprise. |
