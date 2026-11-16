// Generator for CloudLedger draft JSON Schemas (schemas/semantic, schemas/events, schemas/manifest).
// Usage: node scripts/docs/gen_schemas.mjs <repo-root>. The generated JSON files are the committed contracts.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) throw new Error('usage: node gen-schemas.mjs <repo-root>');
const BASE = 'https://schemas.cloudledger.dev'; // placeholder domain pending OQ-01
const write = (rel, obj) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
};

// ---------------------------------------------------------------- semantic query
const IDENT = '[a-z][a-z0-9_]{0,62}';
const semantic = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `${BASE}/semantic/query.v1.json`,
  title: 'CloudLedger semantic query v1',
  description:
    'DRAFT. Engine-neutral analytics query (docs/architecture/ANALYTICS_ADAPTERS.md §1). This schema covers structural validation only; ' +
    'registry checks (metric/dimension existence, principal visibility), ABAC predicate injection and the limits listed in x-cloudledger-limits ' +
    'are enforced by the semantic compiler. The schema domain is a placeholder pending OQ-01.',
  type: 'object',
  additionalProperties: false,
  required: ['metrics', 'time'],
  'x-cloudledger-limits': {
    max_dimensions: 6,
    max_metrics: 12,
    max_limit: 10000,
    max_limit_ai: 1000,
    max_filter_depth: 8,
    max_filter_predicates: 200,
    max_time_span_per_grain: {
      hour: 'P31D',
      day: 'P400D',
      week: 'P3Y',
      month: 'P5Y',
      quarter: 'P10Y',
      year: 'P10Y',
      none: 'P5Y',
    },
    note:
      'max_dimensions, max_limit and max_limit_ai come from ANALYTICS_ADAPTERS.md. max_metrics, filter depth/predicate counts and the per-grain ' +
      'time spans are PROPOSED draft values to be confirmed in Phase 13. Depth and span limits cannot be expressed in JSON Schema and are enforced by the compiler (422 unsupported_query).',
  },
  properties: {
    metrics: {
      description: 'Metric keys from the metrics registry, e.g. effective_cost, billed_cost, unit_cost:<metric_key>.',
      type: 'array',
      minItems: 1,
      maxItems: 12,
      uniqueItems: true,
      items: { $ref: '#/$defs/metric_ref' },
    },
    dimensions: {
      description: 'Group-by dimensions (max 6).',
      type: 'array',
      maxItems: 6,
      uniqueItems: true,
      default: [],
      items: { $ref: '#/$defs/dimension_ref' },
    },
    filters: { $ref: '#/$defs/filter' },
    time: { $ref: '#/$defs/time' },
    currency: {
      description: '"reporting" (tenant reporting currency via the tenant FX policy), "billing" (no conversion; results are split by billing currency) or an explicit ISO 4217 code.',
      default: 'reporting',
      anyOf: [{ enum: ['reporting', 'billing'] }, { $ref: '#/$defs/currency_code' }],
    },
    include: {
      description: 'Charge-category inclusion switches.',
      type: 'object',
      additionalProperties: false,
      properties: {
        tax: { type: 'boolean', default: false },
        credits: { type: 'boolean', default: true },
        refunds: { type: 'boolean', default: true },
        marketplace: { type: 'boolean', default: true },
        commitment_purchases: { type: 'boolean', default: false, description: 'Include upfront commitment purchase charges (normally amortized via effective_cost).' },
      },
    },
    order_by: {
      type: 'array',
      maxItems: 6,
      items: { $ref: '#/$defs/order_by_item' },
    },
    limit: {
      description: 'Maximum number of rows (1–10 000; capped at 1 000 for AI tool calls).',
      type: 'integer',
      minimum: 1,
      maximum: 10000,
      default: 1000,
    },
  },
  $defs: {
    metric_ref: {
      type: 'string',
      pattern: `^${IDENT}(:[a-z0-9][a-z0-9_.-]{0,126})?$`,
      examples: ['effective_cost', 'savings_vs_list', 'unit_cost:requests'],
    },
    dimension_ref: {
      type: 'string',
      description: 'FOCUS dimension (snake_case), tag:<normalized_key>, hierarchy:<node_type>, dim:<custom_dimension> or another registered dimension.',
      pattern: `^(tag:[^\\u0000-\\u001f]{1,256}|hierarchy:${IDENT}|dim:${IDENT}|${IDENT})$`,
      examples: ['provider', 'service_name', 'tag:env', 'hierarchy:cost_center', 'dim:product'],
    },
    currency_code: { type: 'string', pattern: '^[A-Z]{3}$', description: 'ISO 4217 alphabetic code.' },
    scalar: {
      description: 'Filter operand. Money and other decimals are passed as strings.',
      type: ['string', 'boolean', 'integer'],
    },
    filter: {
      description: 'Recursive boolean filter AST. Max depth 8 and max 200 predicates (compiler-enforced).',
      oneOf: [
        { $ref: '#/$defs/and_node' },
        { $ref: '#/$defs/or_node' },
        { $ref: '#/$defs/not_node' },
        { $ref: '#/$defs/predicate' },
      ],
    },
    and_node: {
      type: 'object', additionalProperties: false, required: ['and'],
      properties: { and: { type: 'array', minItems: 1, maxItems: 100, items: { $ref: '#/$defs/filter' } } },
    },
    or_node: {
      type: 'object', additionalProperties: false, required: ['or'],
      properties: { or: { type: 'array', minItems: 1, maxItems: 100, items: { $ref: '#/$defs/filter' } } },
    },
    not_node: {
      type: 'object', additionalProperties: false, required: ['not'],
      properties: { not: { $ref: '#/$defs/filter' } },
    },
    predicate: {
      type: 'object',
      additionalProperties: false,
      required: ['dim', 'op'],
      properties: {
        dim: { $ref: '#/$defs/dimension_ref' },
        op: { enum: ['eq', 'neq', 'in', 'not_in', 'contains', 'starts_with', 'exists', 'not_exists', 'gt', 'gte', 'lt', 'lte'] },
        value: { $ref: '#/$defs/scalar' },
        values: { type: 'array', minItems: 1, maxItems: 1000, items: { $ref: '#/$defs/scalar' } },
      },
      allOf: [
        {
          if: { properties: { op: { enum: ['in', 'not_in'] } } },
          then: { required: ['values'], not: { required: ['value'] } },
        },
        {
          if: { properties: { op: { enum: ['exists', 'not_exists'] } } },
          then: { allOf: [{ not: { required: ['value'] } }, { not: { required: ['values'] } }] },
        },
        {
          if: { properties: { op: { enum: ['eq', 'neq', 'contains', 'starts_with', 'gt', 'gte', 'lt', 'lte'] } } },
          then: { required: ['value'], not: { required: ['values'] } },
        },
      ],
    },
    time: {
      type: 'object',
      additionalProperties: false,
      required: ['from', 'to'],
      description: 'Half-open UTC interval [from, to). Dates (YYYY-MM-DD) or RFC 3339 UTC timestamps (required for grain=hour).',
      properties: {
        field: { enum: ['charge_period_start', 'billing_period_start'], default: 'charge_period_start' },
        from: { $ref: '#/$defs/time_point' },
        to: { $ref: '#/$defs/time_point' },
        grain: { enum: ['hour', 'day', 'week', 'month', 'quarter', 'year', 'none'], default: 'none' },
        calendar: { enum: ['gregorian', 'fiscal'], default: 'gregorian', description: 'fiscal uses the tenant accounting calendar (e.g. 4-4-5) for week/month/quarter/year buckets.' },
      },
    },
    time_point: {
      anyOf: [
        { type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        { type: 'string', format: 'date-time', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$' },
      ],
    },
    order_by_item: {
      oneOf: [
        {
          type: 'object', additionalProperties: false, required: ['metric'],
          properties: { metric: { $ref: '#/$defs/metric_ref' }, dir: { enum: ['asc', 'desc'], default: 'desc' } },
        },
        {
          type: 'object', additionalProperties: false, required: ['dimension'],
          properties: {
            dimension: { anyOf: [{ $ref: '#/$defs/dimension_ref' }, { const: 'time' }] },
            dir: { enum: ['asc', 'desc'], default: 'asc' },
          },
        },
      ],
    },
  },
  examples: [
    {
      metrics: ['effective_cost', 'billed_cost'],
      dimensions: ['provider', 'service_name', 'hierarchy:cost_center'],
      filters: {
        and: [
          { dim: 'provider', op: 'in', values: ['aws', 'gcp'] },
          { dim: 'tag:env', op: 'eq', value: 'prod' },
        ],
      },
      time: { field: 'charge_period_start', from: '2026-01-01', to: '2026-04-01', grain: 'month' },
      currency: 'reporting',
      include: { tax: false, credits: true },
      order_by: [{ metric: 'effective_cost', dir: 'desc' }],
      limit: 100,
    },
  ],
};
write('schemas/semantic/query.v1.json', semantic);

// ---------------------------------------------------------------- events
const ENV = 'cloudevent-envelope.v1.json';
const d = (name) => ({ $ref: `${ENV}#/$defs/${name}` });
const envelope = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `${BASE}/events/${ENV}`,
  title: 'CloudLedger CloudEvents 1.0 envelope (JSON format)',
  description:
    'DRAFT. Envelope for all CloudLedger domain events (docs/contracts/EVENTS.md). tenantid and traceparent are CloudEvents extension attributes. ' +
    'The type prefix dev.cloudledger and the schema domain are placeholders pending OQ-01. Consumers must ignore unknown data fields (additive evolution).',
  type: 'object',
  required: ['specversion', 'id', 'source', 'type', 'time', 'datacontenttype', 'tenantid', 'data'],
  properties: {
    specversion: { const: '1.0' },
    id: { type: 'string', minLength: 1, maxLength: 128, description: 'Unique event id (UUIDv7). Consumers deduplicate on id plus the documented idempotency key.' },
    source: { type: 'string', pattern: '^cloudledger/[a-z][a-z0-9_-]*$', examples: ['cloudledger/billing'] },
    type: { type: 'string', pattern: '^dev\\.cloudledger\\.[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)*\\.v[0-9]+$' },
    subject: { type: 'string', maxLength: 512 },
    time: d('timestamp'),
    datacontenttype: { const: 'application/json' },
    dataschema: { type: 'string', format: 'uri' },
    tenantid: d('id'),
    traceparent: { type: 'string', pattern: '^[0-9a-f]{2}-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$', description: 'W3C Trace Context traceparent.' },
    tracestate: { type: 'string' },
    data: { type: 'object' },
  },
  $defs: {
    id: { type: 'string', minLength: 1, maxLength: 64, description: 'Opaque identifier (UUIDv7).' },
    timestamp: { type: 'string', format: 'date-time', pattern: 'Z$', description: 'RFC 3339 UTC timestamp.' },
    date: { type: 'string', format: 'date' },
    billing_period: { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$', description: 'Billing month YYYY-MM.' },
    decimal: { type: 'string', pattern: '^-?(0|[1-9][0-9]{0,25})(\\.[0-9]{1,12})?$', description: 'Fixed-point decimal string (numeric(38,12)). Never a JSON number.' },
    currency: { type: 'string', pattern: '^[A-Z]{3}$', description: 'ISO 4217 code.' },
    money: {
      type: 'object',
      required: ['amount', 'currency'],
      additionalProperties: false,
      properties: { amount: { $ref: '#/$defs/decimal' }, currency: { $ref: '#/$defs/currency' } },
    },
    provider: { type: 'string', minLength: 1, maxLength: 128, description: 'aws | gcp | azure | generic | <plugin id>' },
    problem: {
      type: 'object',
      required: ['code'],
      properties: { code: { type: 'string' }, title: { type: 'string' }, detail: { type: 'string' } },
    },
  },
};
write(`schemas/events/${ENV}`, envelope);

const events = [
  ['tenant.created', 'tenants', '04', 'tenant id', {
    required: ['tenant_id', 'slug', 'kind', 'created_at'],
    properties: { tenant_id: d('id'), slug: { type: 'string' }, display_name: { type: 'string' }, kind: { enum: ['individual', 'organization'] }, parent_tenant_id: { anyOf: [d('id'), { type: 'null' }] }, data_region: { type: ['string', 'null'] }, created_at: d('timestamp') },
  }],
  ['tenant.deleted', 'tenants', '04', 'tenant id', {
    required: ['tenant_id', 'deleted_at', 'mode'],
    properties: { tenant_id: d('id'), mode: { enum: ['pending_deletion', 'purged'] }, deleted_at: d('timestamp'), purge_after: d('timestamp') },
  }],
  ['connector.verified', 'connectors', '06', 'connector id + verified_at', {
    required: ['connector_id', 'provider', 'verified_at', 'status', 'capabilities'],
    properties: {
      connector_id: d('id'), provider: d('provider'), verified_at: d('timestamp'),
      status: { enum: ['active', 'degraded', 'error'] },
      capabilities: { type: 'array', items: { type: 'object', required: ['capability', 'verified_status'], properties: { capability: { type: 'string' }, verified_status: { enum: ['pass', 'fail', 'unknown', 'not_applicable'] } } } },
    },
  }],
  ['ingestion.run.completed', 'billing', '12', 'run id', {
    required: ['run_id', 'connector_id', 'capability', 'trigger', 'status', 'finished_at'],
    properties: {
      run_id: d('id'), connector_id: d('id'), capability: { type: 'string' }, scope_key: { type: 'string' }, billing_period: d('billing_period'),
      trigger: { enum: ['schedule', 'backfill', 'manual', 'restatement', 'replay'] }, status: { const: 'succeeded' },
      mapping_version: { type: 'string' }, data_version: { type: 'integer' },
      stats: { type: 'object', properties: { rows_in: { type: 'integer' }, rows_out: { type: 'integer' }, rows_rejected: { type: 'integer' }, bytes: { type: 'integer' } } },
      started_at: d('timestamp'), finished_at: d('timestamp'),
    },
  }],
  ['ingestion.run.failed', 'billing', '12', 'run id', {
    required: ['run_id', 'connector_id', 'capability', 'status', 'error', 'finished_at'],
    properties: {
      run_id: d('id'), connector_id: d('id'), capability: { type: 'string' }, scope_key: { type: 'string' }, billing_period: d('billing_period'),
      trigger: { enum: ['schedule', 'backfill', 'manual', 'restatement', 'replay'] },
      status: { enum: ['failed', 'failed_validation', 'quarantined'] }, error: d('problem'), retryable: { type: 'boolean' }, finished_at: d('timestamp'),
    },
  }],
  ['cost.period.normalized', 'billing', '11', 'tenant + connector + period + data_version', {
    required: ['connector_id', 'billing_period', 'data_version', 'period_version', 'ingestion_run_id', 'totals'],
    properties: {
      connector_id: d('id'), provider: d('provider'), billing_period: d('billing_period'), data_version: { type: 'integer', minimum: 1 },
      period_version: { type: 'integer', minimum: 1 }, ingestion_run_id: d('id'), mapping_version: { type: 'string' }, focus_version: { type: 'string' },
      provider_final: { type: 'boolean' },
      totals: { type: 'array', description: 'Validated control totals by (account, currency, charge_category).', items: { $ref: '#/$defs/control_total' } },
    },
    $defs: { control_total: { type: 'object', required: ['billing_account_id', 'charge_category', 'billed_cost', 'effective_cost'], properties: { billing_account_id: { type: 'string' }, charge_category: { type: 'string' }, billed_cost: d('money'), effective_cost: d('money'), row_count: { type: 'integer' } } } },
  }],
  ['cost.period.restated', 'billing', '12', 'tenant + connector + period + data_version', {
    required: ['connector_id', 'billing_period', 'data_version', 'previous_period_version', 'period_version', 'ingestion_run_id', 'delta'],
    properties: {
      connector_id: d('id'), provider: d('provider'), billing_period: d('billing_period'), data_version: { type: 'integer', minimum: 1 },
      previous_period_version: { type: 'integer' }, period_version: { type: 'integer' }, ingestion_run_id: d('id'),
      affects_closed_period: { type: 'boolean' },
      delta: { type: 'array', items: { type: 'object', required: ['currency', 'billed_cost_delta', 'effective_cost_delta'], properties: { billing_account_id: { type: 'string' }, currency: d('currency'), billed_cost_delta: d('decimal'), effective_cost_delta: d('decimal') } } },
    },
  }],
  ['allocation.published', 'allocation', '15', 'rule_set version', {
    required: ['rule_set_id', 'version', 'effective_from', 'published_at', 'checksum'],
    properties: { rule_set_id: d('id'), version: { type: 'integer' }, effective_from: d('date'), published_by: d('id'), published_at: d('timestamp'), checksum: { type: 'string', pattern: '^[0-9a-f]{64}$' }, reallocate_periods: { type: 'array', items: d('billing_period') } },
  }],
  ['cost.period.allocated', 'allocation', '15', 'tenant + period + data_version', {
    required: ['billing_period', 'data_version', 'rule_set_version'],
    properties: { billing_period: d('billing_period'), data_version: { type: 'integer' }, rule_set_version: { type: 'integer' }, unallocated: { type: 'array', items: d('money') }, completed_at: d('timestamp') },
  }],
  ['budget.threshold.crossed', 'forecasting', '17', 'budget + period + threshold + basis', {
    required: ['budget_id', 'period_start', 'threshold_pct', 'basis', 'budget_amount', 'observed_amount'],
    properties: { budget_id: d('id'), budget_name: { type: 'string' }, period_start: d('date'), period_end: d('date'), threshold_pct: d('decimal'), basis: { enum: ['actual', 'forecast'] }, budget_amount: d('money'), observed_amount: d('money'), data_version: { type: 'integer' } },
  }],
  ['anomaly.detected', 'forecasting', '17', 'anomaly id', {
    required: ['anomaly_id', 'usage_date', 'expected', 'actual', 'score', 'scope'],
    properties: {
      anomaly_id: d('id'), usage_date: d('date'), scope: { type: 'object' }, expected: d('money'), actual: d('money'), score: d('decimal'), detector_version: { type: 'string' },
      contributors: { type: 'array', items: { type: 'object', required: ['dimension', 'value', 'delta'], properties: { dimension: { type: 'string' }, value: { type: 'string' }, delta: d('money') } } },
    },
  }],
  ['inventory.snapshot.completed', 'inventory', '19', 'connector + snapshot time', {
    required: ['connector_id', 'snapshot_at', 'resource_count'],
    properties: { connector_id: d('id'), provider: d('provider'), snapshot_at: d('timestamp'), resource_count: { type: 'integer' }, resource_types: { type: 'array', items: { type: 'string' } }, partial: { type: 'boolean' } },
  }],
  ['recommendation.created', 'recommendations', '21', 'rec id + version', {
    required: ['recommendation_id', 'version', 'rule_id', 'category', 'target_type', 'target_native_id', 'net_monthly_savings', 'risk', 'confidence'],
    properties: { recommendation_id: d('id'), version: { type: 'integer' }, rule_id: { type: 'string' }, rule_version: { type: 'string' }, source: { enum: ['native', 'provider'] }, category: { type: 'string' }, provider: d('provider'), target_type: { type: 'string' }, target_native_id: { type: 'string' }, title: { type: 'string' }, gross_monthly_savings: d('money'), net_monthly_savings: d('money'), risk: { enum: ['low', 'medium', 'high'] }, confidence: d('decimal') },
  }],
  ['recommendation.state_changed', 'recommendations', '26', 'rec id + version', {
    required: ['recommendation_id', 'version', 'from_state', 'to_state', 'occurred_at'],
    properties: { recommendation_id: d('id'), version: { type: 'integer' }, from_state: { $ref: '#/$defs/state' }, to_state: { $ref: '#/$defs/state' }, actor_id: { anyOf: [d('id'), { type: 'null' }] }, comment: { type: 'string' }, external_ref: { type: 'string' }, occurred_at: d('timestamp') },
    $defs: { state: { enum: ['open', 'acknowledged', 'in_review', 'approved', 'rejected', 'implemented', 'verified', 'snoozed', 'dismissed', 'expired', 'superseded'] } },
  }],
  ['invoice.imported', 'finance', '10', 'invoice id', {
    required: ['invoice_id', 'provider', 'invoice_number', 'billing_account', 'period_start', 'period_end', 'total'],
    properties: { invoice_id: d('id'), provider: d('provider'), invoice_number: { type: 'string' }, billing_account: { type: 'string' }, invoice_date: d('date'), period_start: d('date'), period_end: d('date'), subtotal: d('money'), tax: d('money'), total: d('money'), source: { enum: ['api', 'upload', 'export'] } },
  }],
  ['reconciliation.completed', 'finance', '10', 'result id', {
    required: ['result_id', 'invoice_id', 'status', 'invoice_total', 'computed_total', 'data_version'],
    properties: { result_id: d('id'), invoice_id: d('id'), status: { enum: ['matched', 'within_tolerance', 'variance', 'acknowledged'] }, invoice_total: d('money'), computed_total: d('money'), difference: d('money'), tolerance: d('money'), data_version: { type: 'integer' }, variance_categories: { type: 'array', items: { type: 'string' } } },
  }],
  ['period.closed', 'finance', '30', 'period id', {
    required: ['period_id', 'period_key', 'closed_at', 'snapshot'],
    properties: {
      period_id: d('id'), period_key: { type: 'string' }, start_date: d('date'), end_date: d('date'), closed_by: d('id'), closed_at: d('timestamp'),
      snapshot: { type: 'object', required: ['snapshot_id', 'data_version', 'rule_set_version', 'manifest_sha256'], properties: { snapshot_id: d('id'), data_version: { type: 'integer' }, rule_set_version: { type: 'integer' }, fx_rate_set_id: d('id'), manifest_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, worm_locked_until: d('date') } },
    },
  }],
  ['report.run.completed', 'finance', '30', 'run id', {
    required: ['run_id', 'status', 'artifacts', 'manifest_sha256'],
    properties: { run_id: d('id'), definition_id: { anyOf: [d('id'), { type: 'null' }] }, period_id: d('id'), status: { enum: ['succeeded', 'failed'] }, manifest_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, artifacts: { type: 'array', items: { type: 'object', required: ['format', 'sha256'], properties: { format: { type: 'string' }, sha256: { type: 'string' }, size_bytes: { type: 'integer' } } } } },
  }],
  ['audit.anchor.written', 'audit', '04', 'tenant + seq', {
    required: ['seq', 'hash', 'anchored_at', 'anchor_type'],
    properties: { seq: { type: 'integer', minimum: 1 }, hash: { type: 'string', pattern: '^[0-9a-f]{64}$' }, anchored_at: d('timestamp'), anchor_type: { enum: ['internal', 'object_lock', 'rfc3161_tsa', 'external'] }, anchor_ref: { type: 'string' } },
  }],
];

const sourceOf = { tenants: 'cloudledger/tenants', connectors: 'cloudledger/connectors', billing: 'cloudledger/billing', allocation: 'cloudledger/allocation', forecasting: 'cloudledger/forecasting', inventory: 'cloudledger/inventory', recommendations: 'cloudledger/recommendations', finance: 'cloudledger/finance', audit: 'cloudledger/audit' };
const eventFiles = [];
for (const [name, producer, phase, idem, data] of events) {
  const file = `${name}.v1.json`;
  eventFiles.push(file);
  const { $defs, ...dataSchema } = data;
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${BASE}/events/${file}`,
    title: `dev.cloudledger.${name}.v1`,
    description: `DRAFT. Producer: ${producer}. Idempotency key: ${idem}. Phase ${phase}. See docs/contracts/EVENTS.md.`,
    'x-phase': phase,
    'x-idempotency-key': idem,
    allOf: [{ $ref: ENV }],
    properties: {
      type: { const: `dev.cloudledger.${name}.v1` },
      source: { const: sourceOf[producer] },
      data: { type: 'object', additionalProperties: true, ...dataSchema },
    },
  };
  if ($defs) schema.$defs = $defs;
  write(`schemas/events/${file}`, schema);
}

// ---------------------------------------------------------------- plugin manifest
const SPDX = '^\\(*\\s*[A-Za-z0-9][A-Za-z0-9.+:-]*\\s*\\)*(\\s+(AND|OR|WITH)\\s+\\(*\\s*[A-Za-z0-9][A-Za-z0-9.+:-]*\\s*\\)*)*$';
const SEMVER = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-[0-9A-Za-z.-]+)?(\\+[0-9A-Za-z.-]+)?$';
const strs = { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true };
const avail = { enum: ['available', 'entitlement_dependent'], default: 'available' };
const cap = (extra = {}) => ({ type: 'object', additionalProperties: false, properties: { availability: avail, ...extra } });
const kindSections = {
  Provider: ['auth_methods', 'scopes', 'capabilities', 'permissions'],
  RecommendationRule: ['category', 'inputs', 'targets', 'overlap_keys', 'default_thresholds', 'risk_model'],
  PricingSource: ['providers', 'catalog_types', 'refresh'],
  DashboardWidget: ['widget_type', 'query_shape', 'options_schema', 'bundle'],
};
const kindRequired = {
  Provider: ['auth_methods', 'scopes', 'capabilities'],
  RecommendationRule: ['category', 'inputs', 'targets'],
  PricingSource: ['providers', 'catalog_types'],
  DashboardWidget: ['widget_type', 'query_shape', 'bundle'],
};
const allSections = Object.values(kindSections).flat();
const manifest = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `${BASE}/manifest/plugin-manifest.v1.json`,
  title: 'CloudLedger plugin capability manifest v1',
  description:
    'DRAFT (final in Phase 35). See docs/contracts/CAPABILITY_MANIFEST.md. Strict: unknown fields are rejected in v1. metadata.license is a required SPDX ' +
    'expression; it is informational only and never enforced at runtime (NFR-LIC-004). The license pattern is a syntactic approximation; CI validates with a full SPDX expression parser.',
  type: 'object',
  additionalProperties: false,
  required: ['apiVersion', 'kind', 'metadata', 'compatibility', 'execution'],
  properties: {
    apiVersion: { const: 'cloudledger.dev/plugin/v1' },
    kind: { enum: Object.keys(kindSections) },
    metadata: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'name', 'version', 'vendor', 'license'],
      properties: {
        id: { type: 'string', pattern: '^([a-z0-9][a-z0-9-]{0,62}|[a-z][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)+)$', description: 'Globally unique. First-party: short id (aws). Third-party: reverse-DNS (com.example.oci).' },
        name: { type: 'string', minLength: 1, maxLength: 128 },
        version: { type: 'string', pattern: SEMVER, description: 'SemVer of the plugin.' },
        vendor: { type: 'string', minLength: 1, maxLength: 128 },
        license: { type: 'string', minLength: 1, maxLength: 512, pattern: SPDX, description: 'SPDX license expression (see docs/legal/PLUGIN_LICENSING.md).', examples: ['LicenseRef-CloudLedger-SAL-1.0', 'Apache-2.0', 'MIT OR Apache-2.0'] },
        description: { type: 'string', maxLength: 2000 },
        source: { type: 'string', format: 'uri' },
        homepage: { type: 'string', format: 'uri' },
        security_contact: { type: 'string', minLength: 3 },
      },
    },
    compatibility: {
      type: 'object',
      additionalProperties: false,
      required: ['sdk', 'cloudledger'],
      properties: {
        sdk: { type: 'string', description: 'SemVer range of the plugin SDK, e.g. ">=1.0.0 <2.0.0".' },
        cloudledger: { type: 'string', description: 'SemVer range of CloudLedger.' },
        focus_versions: { type: 'array', items: { type: 'string', pattern: '^\\d+\\.\\d+$' }, uniqueItems: true },
      },
    },
    execution: {
      type: 'object',
      additionalProperties: false,
      required: ['mode'],
      properties: {
        mode: { enum: ['in_process', 'grpc'], description: 'in_process: first-party, compiled in. grpc: out-of-process.' },
        egress: { type: 'array', items: { type: 'string', pattern: '^[A-Za-z0-9*.-]+:[0-9]{1,5}$' }, uniqueItems: true },
      },
      if: { properties: { mode: { const: 'grpc' } } },
      then: { required: ['egress'] },
    },
    // Provider
    auth_methods: {
      type: 'array', minItems: 1,
      items: { type: 'object', additionalProperties: false, required: ['id', 'keyless'], properties: { id: { type: 'string', pattern: '^[a-z][a-z0-9_]*$' }, params: strs, keyless: { type: 'boolean' }, discouraged: { type: 'boolean' } } },
    },
    scopes: {
      type: 'array', minItems: 1,
      items: { type: 'object', additionalProperties: false, required: ['type'], properties: { type: { type: 'string', pattern: '^[a-z][a-z0-9_]*$' }, children: strs } },
    },
    capabilities: {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      properties: {
        billing: cap({ sources: strs, formats: strs, granularity: { type: 'array', items: { enum: ['hourly', 'daily', 'monthly'] } }, restatements: { type: 'boolean' }, mapping: { type: 'object', additionalProperties: false, required: ['key', 'version'], properties: { key: { type: 'string' }, version: { type: 'integer', minimum: 1 } } } }),
        invoices: cap({ sources: strs }),
        inventory: cap({ sources: strs }),
        metrics: cap({ sources: strs, metrics: strs }),
        provider_recommendations: cap({ sources: strs }),
        pricing: cap({ sources: strs }),
        commitments: cap({ sources: strs, types: strs }),
      },
    },
    permissions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        template_refs: { type: 'object', additionalProperties: { type: 'string' } },
        required: { type: 'object', additionalProperties: strs },
      },
    },
    // RecommendationRule
    category: { type: 'string', pattern: '^[a-z][a-z0-9_]*$', examples: ['rightsizing', 'idle_resource', 'commitment', 'storage_tiering'] },
    inputs: {
      type: 'object', additionalProperties: false,
      properties: { cost: { type: 'boolean' }, inventory_types: strs, metrics: strs, pricing: { type: 'boolean' } },
    },
    targets: { ...strs, minItems: 1, description: 'Resource types the rule evaluates.' },
    overlap_keys: { ...strs, description: 'Keys used to group mutually exclusive recommendations so savings are not double-counted.' },
    default_thresholds: { type: 'object', additionalProperties: { type: ['string', 'integer', 'boolean'] }, description: 'Decimal thresholds are strings.' },
    risk_model: { type: 'object', additionalProperties: false, properties: { default_risk: { enum: ['low', 'medium', 'high'] }, factors: strs } },
    // PricingSource
    providers: { ...strs, minItems: 1 },
    catalog_types: { type: 'array', minItems: 1, uniqueItems: true, items: { enum: ['on_demand', 'spot', 'commitment'] } },
    refresh: { type: 'object', additionalProperties: false, properties: { interval: { type: 'string', pattern: '^P', description: 'ISO 8601 duration.' }, incremental: { type: 'boolean' } } },
    // DashboardWidget
    widget_type: { type: 'string', pattern: '^[a-z][a-z0-9_.-]*$' },
    query_shape: {
      type: 'object', additionalProperties: false,
      properties: {
        min_metrics: { type: 'integer', minimum: 0 }, max_metrics: { type: 'integer', minimum: 1 },
        max_dimensions: { type: 'integer', minimum: 0, maximum: 6 }, requires_time: { type: 'boolean' },
        allowed_grains: { type: 'array', items: { enum: ['hour', 'day', 'week', 'month', 'quarter', 'year', 'none'] } },
      },
    },
    options_schema: { type: 'object', description: 'JSON Schema (2020-12) for widget options.' },
    bundle: {
      type: 'object', additionalProperties: false, required: ['path', 'sha256', 'signature'],
      properties: { path: { type: 'string' }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, signature: { type: 'string', minLength: 1 }, csp: { type: 'object', additionalProperties: strs } },
    },
  },
  allOf: Object.keys(kindSections).map((k) => ({
    if: { properties: { kind: { const: k } }, required: ['kind'] },
    then: {
      required: kindRequired[k],
      properties: Object.fromEntries(allSections.filter((s) => !kindSections[k].includes(s)).map((s) => [s, false])),
    },
  })),
};
write('schemas/manifest/plugin-manifest.v1.json', manifest);

console.log(JSON.stringify({ eventFiles: eventFiles.length }));
