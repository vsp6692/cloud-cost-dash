# Phase 21 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P21-R01 | Inventory via Resource Explorer and/or AWS Config aggregators. Metrics via CloudWatch. Recommendations via Compute Optimizer and Trusted Advisor (entitlement dependent). | FR-AWS-006 | M | P21-AC01 |
| P21-R02 | Inventory via Cloud Asset Inventory, metrics via Cloud Monitoring, recommendations via Recommender API. | FR-GCP-005 | M | P21-AC02 |
| P21-R03 | Inventory via Resource Graph, metrics via Azure Monitor, recommendations via Advisor, pricing via Retail Prices API. | FR-AZR-005 | M | P21-AC03 |
| P21-R04 | Recommendation SDK: rule plugins declare inputs, evaluation and evidence output, with deterministic results for identical inputs. | FR-REC-001 | M | P21-AC04 |
| P21-R05 | Each recommendation has evidence, confidence (with factors), risk level, projected monthly savings (gross and net), effort, implementation steps, rollback guidance and the data freshness of the inputs. | FR-REC-002 | M | P21-AC05 |
| P21-R06 | Ingest provider-native recommendations (Compute Optimizer, Trusted Advisor, Recommender, Advisor) with provenance and dedup against native rules. | FR-REC-005 | M | P21-AC06 |
