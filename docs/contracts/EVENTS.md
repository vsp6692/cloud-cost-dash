# Domain Events

Envelope: **CloudEvents 1.0** (JSON). Produced through the transactional outbox (ADR-0005). Delivery is at-least-once, so consumers must be idempotent using `id` and the documented idempotency key. JSON Schemas live in [`schemas/events/`](../../schemas/events/).

```json
{
  "specversion": "1.0",
  "id": "01JD5Z…",
  "source": "cloudledger/billing",
  "type": "dev.cloudledger.cost.period.normalized.v1",
  "subject": "connectors/0193…/periods/2026-10",
  "time": "2026-11-15T03:12:00Z",
  "datacontenttype": "application/json",
  "tenantid": "0193…",
  "traceparent": "00-…",
  "data": { }
}
```

`tenantid` and `traceparent` are CloudEvents extension attributes. The type prefix `dev.cloudledger` is a placeholder pending OQ-01.

## Catalog

| Type (`dev.cloudledger.` + …) | Producer | Consumers | Idempotency key | Phase |
|---|---|---|---|---|
| `tenant.created.v1` / `tenant.deleted.v1` | tenants | audit, provisioning | tenant id | 04 |
| `connector.verified.v1` | connectors | UI notifications, scheduler | connector id + verified_at | 06 |
| `ingestion.run.completed.v1` | billing | health, alerts | run id | 12 |
| `ingestion.run.failed.v1` | billing | alerts | run id | 12 |
| `cost.period.normalized.v1` | billing | allocation, aggregates | tenant + connector + period + data_version | 11 |
| `cost.period.restated.v1` | billing | reconciliation, period close, anomalies | same as above | 12 |
| `allocation.published.v1` | allocation | re-allocation jobs | rule_set version | 15 |
| `cost.period.allocated.v1` | allocation | budgets, anomalies, forecasts, recs, dashboards cache | tenant + period + data_version | 15 |
| `budget.threshold.crossed.v1` | forecasting | alerts | budget + period + threshold + basis | 17 |
| `anomaly.detected.v1` | forecasting | alerts | anomaly id | 17 |
| `inventory.snapshot.completed.v1` | inventory | recommendations | connector + snapshot time | 19 |
| `recommendation.created.v1` / `.state_changed.v1` | recommendations | alerts, ticketing | rec id + version | 21, 26 |
| `invoice.imported.v1` | finance | reconciliation | invoice id | 10 |
| `reconciliation.completed.v1` | finance | period close, alerts | result id | 10, 29 |
| `period.closed.v1` | finance | reports, audit anchors | period id | 30 |
| `period.reopened.v1` | finance | reports, audit | period id + reopen seq | 30 |
| `period.adjustment.recorded.v1` | finance | reports, reconciliation | adjustment id | 30 |
| `fx.rate_set.published.v1` | finance | aggregates cache, reports | rate set id | 18 |
| `inventory.resource.changed.v1` | inventory | recommendations (incremental) | resource id + valid_from | 19 |
| `metrics.rollup.completed.v1` | inventory | recommendations | connector + window | 20 |
| `report.run.completed.v1` | finance | delivery | run id | 30 |
| `audit.anchor.written.v1` | audit | SIEM | tenant + seq | 04 |

## Schema evolution
- Additive changes only within a version (`.v1`). Consumers ignore unknown fields.
- Breaking change → new type version (`.v2`), dual-published for at least one minor release.
- Schemas are validated in CI (producer tests serialize, then validate against the JSON Schema).
