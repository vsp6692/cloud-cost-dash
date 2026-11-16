# Phase 20 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P20-R01 | Inventory via Resource Explorer and/or AWS Config aggregators. Metrics via CloudWatch. Recommendations via Compute Optimizer and Trusted Advisor (entitlement dependent). | FR-AWS-006 | M | P20-AC01 |
| P20-R02 | Inventory via Cloud Asset Inventory, metrics via Cloud Monitoring, recommendations via Recommender API. | FR-GCP-005 | M | P20-AC02 |
| P20-R03 | Inventory via Resource Graph, metrics via Azure Monitor, recommendations via Advisor, pricing via Retail Prices API. | FR-AZR-005 | M | P20-AC03 |
| P20-R04 | Collect utilization metrics (CPU, memory where available, network, disk IOPS and throughput, requests) at configurable granularity. | FR-TEL-001 | M | P20-AC04 |
| P20-R05 | Track metric coverage. Missing or partial data lowers recommendation confidence and is surfaced explicitly. | FR-TEL-002 | M | P20-AC05 |
| P20-R06 | Kubernetes cost and utilization (requests, limits, usage) via an optional in-cluster agent or Prometheus integration (OpenCost-compatible input). | FR-TEL-003 | S | P20-AC06 |
