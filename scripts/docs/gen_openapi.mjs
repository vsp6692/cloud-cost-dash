// Generator for api/openapi/cloudledger.v1.yaml. The generated YAML is the committed contract.
// Usage: node scripts/docs/gen_openapi.mjs <repo-root>
// Requires the npm package `yaml`. If it is not installed in the repo, set YAML_MODULE_DIR to a directory
// whose node_modules contains it, e.g. YAML_MODULE_DIR=/tmp/cl-validate.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(process.env.YAML_MODULE_DIR ? path.join(process.env.YAML_MODULE_DIR, 'package.json') : import.meta.url);
const YAML = require('yaml');

const ROOT = process.argv[2] ?? '.';
const OUT = path.join(ROOT, 'api/openapi/cloudledger.v1.yaml');
const SEM = '../../schemas/semantic/query.v1.json';

const S = (n) => ({ $ref: `#/components/schemas/${n}` });
const R = (n) => ({ $ref: `#/components/responses/${n}` });
const PRM = (n) => ({ $ref: `#/components/parameters/${n}` });
const H = (n) => ({ $ref: `#/components/headers/${n}` });
const str = (extra = {}) => ({ type: 'string', ...extra });
const int = (extra = {}) => ({ type: 'integer', ...extra });
const bool = (extra = {}) => ({ type: 'boolean', ...extra });
const arr = (items, extra = {}) => ({ type: 'array', items, ...extra });
const obj = (properties, required, extra = {}) => ({ type: 'object', properties, ...(required?.length ? { required } : {}), ...extra });
const en = (values, extra = {}) => ({ type: 'string', enum: values, ...extra });
const nullable = (schema) => ({ oneOf: [schema, { type: 'null' }] });
const ro = (schema) => ({ ...schema, readOnly: true });
const ID = S('Id'), TS = S('Timestamp'), DATE = S('Date'), MONEY = S('Money'), DEC = S('Decimal'), CUR = S('CurrencyCode');
const ANY_OBJ = { type: 'object', additionalProperties: true };

// ------------------------------------------------------------------ schemas
const schemas = {
  Id: str({ description: 'Opaque identifier (UUIDv7 for entities; prefixed ids such as op_… for operations). Clients must not parse IDs.', minLength: 1, maxLength: 64, examples: ['0193a4f2-7c1e-7b3a-9d2e-5f1c2b3a4d5e'] }),
  Timestamp: str({ format: 'date-time', description: 'RFC 3339 timestamp in UTC (Z suffix).', examples: ['2026-11-15T00:00:00Z'] }),
  Date: str({ format: 'date', description: 'Calendar date YYYY-MM-DD.', examples: ['2026-11-15'] }),
  BillingPeriod: str({ pattern: '^\\d{4}-(0[1-9]|1[0-2])$', description: 'Billing month YYYY-MM.', examples: ['2026-10'] }),
  Decimal: str({ pattern: '^-?(0|[1-9][0-9]{0,25})(\\.[0-9]{1,12})?$', description: 'Fixed-point decimal as a string (numeric(38,12), ADR-0007). Never a JSON number; clients must not parse into floats.', examples: ['1234.567800000000'] }),
  CurrencyCode: str({ pattern: '^[A-Z]{3}$', description: 'ISO 4217 alphabetic currency code.', examples: ['USD'] }),
  Money: obj({ amount: DEC, currency: CUR }, ['amount', 'currency'], { additionalProperties: false, description: 'Monetary amount. amount is ALWAYS a decimal string, never a number.', examples: [{ amount: '1234.567800000000', currency: 'USD' }] }),
  Ratio: str({ pattern: '^(0(\\.[0-9]{1,12})?|1(\\.0{1,12})?)$', description: 'Decimal ratio in [0,1] as a string.' }),
  Labels: { type: 'object', additionalProperties: str(), description: 'String key/value map (tags, labels).' },
  Problem: obj({
    type: str({ format: 'uri', default: 'about:blank', examples: ['https://docs.cloudledger.dev/errors/validation'] }),
    title: str(), status: int({ minimum: 400, maximum: 599 }),
    code: str({ description: 'Stable machine-readable error code (lower_snake_case), e.g. validation_failed, period_closed, idempotency_key_reuse.' }),
    detail: str(), instance: str({ description: 'Request path.' }),
    request_id: str({ description: 'Correlates with server logs and traces. No stack traces are ever returned.' }),
    errors: arr(S('ProblemFieldError')),
  }, ['type', 'title', 'status', 'code', 'request_id'], { description: 'RFC 9457 Problem Details plus CloudLedger extensions (code, request_id, errors). The docs domain is a placeholder pending OQ-01.' }),
  ProblemFieldError: obj({ pointer: str({ description: 'RFC 6901 JSON Pointer into the request body.' }), parameter: str({ description: 'Query/header parameter name, when the error is not in the body.' }), code: str(), message: str() }, ['code', 'message']),
  CursorPage: obj({ data: arr({}), next_cursor: nullable(str({ description: 'Opaque, HMAC-signed cursor bound to tenant and filters.' })) }, ['data', 'next_cursor'], { description: 'Cursor pagination envelope. List responses specialise `data`.' }),
  ResourceLink: obj({ type: str(), id: ID, href: str() }, ['type', 'id']),
  Operation: obj({
    id: ro(ID), kind: en(['connector_verify', 'connector_sync', 'connector_backfill', 'import', 'reallocation', 'report_run', 'export', 'period_close', 'period_reopen', 'reconciliation', 'invoice_import', 'tenant_deletion', 'audit_verify', 'forecast'], { description: 'Open enum: clients must tolerate unknown values.' }),
    status: en(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
    progress: { type: 'number', minimum: 0, maximum: 1 },
    result_ref: nullable(S('ResourceLink')), error: nullable(S('Problem')),
    created_at: TS, updated_at: TS, finished_at: nullable(TS),
    links: obj({ self: str() }, ['self']),
  }, ['id', 'kind', 'status', 'links'], { description: 'Long-running operation (API_GUIDELINES §9). Poll GET /api/v1/operations/{id} or subscribe to webhooks.' }),
  AnalyticsMeta: obj({
    data_version: int(), completeness: { type: 'number', minimum: 0, maximum: 1 }, query_id: str(), currency: CUR, fx_rate_set_id: nullable(ID),
    freshness: arr(obj({ provider: str(), connector_id: ID, latest_charge_period_end: TS, lag_hours: { type: 'number' } }, ['provider', 'connector_id'])),
  }, ['data_version', 'freshness', 'query_id'], { description: 'Freshness metadata included on every analytics response (API_GUIDELINES §12).' }),
  FilterExpression: { $ref: `${SEM}#/$defs/filter` },
  SemanticQuery: { $ref: SEM },

  // Health
  HealthStatus: obj({ status: en(['ok', 'degraded', 'unavailable']), checks: { type: 'object', additionalProperties: obj({ status: en(['ok', 'degraded', 'unavailable']), detail: str() }) } }, ['status']),
  VersionInfo: obj({
    version: str({ examples: ['0.1.0'] }), commit: str(), build_date: TS, api_version: str({ examples: ['v1'] }), focus_version: str({ examples: ['1.2'] }),
    analytics_engine: en(['postgres', 'duckdb', 'clickhouse']), deployment_profile: str(),
    license: obj({ name: str(), spdx: str() }, ['name', 'spdx'], { description: 'Informational only; no runtime license enforcement (NFR-LIC-004).' }),
  }, ['version', 'api_version']),

  // Me / sessions
  User: obj({ id: ro(ID), email: str({ format: 'email' }), display_name: nullable(str()), status: en(['active', 'disabled']), is_platform_admin: ro(bool()) }, ['id', 'email', 'status']),
  TenantSummary: obj({ id: ID, slug: str(), display_name: str(), role_keys: arr(str()) }, ['id', 'slug', 'display_name']),
  Me: obj({
    user: S('User'), tenant: nullable(S('TenantSummary')), tenants: arr(S('TenantSummary')),
    permissions: arr(str(), { description: 'Effective permissions in the current tenant.' }),
    data_scope_ids: arr(ID), session_expires_at: nullable(TS),
  }, ['user', 'tenants', 'permissions']),
  Session: obj({ id: ro(ID), tenant_id: nullable(ID), current: bool(), created_at: TS, idle_expires_at: TS, absolute_expires_at: TS, revoked_at: nullable(TS), user_agent: nullable(str()), ip: nullable(str()) }, ['id', 'created_at', 'idle_expires_at', 'absolute_expires_at']),
};

// resource(name, props, required, {input, inputRequired, readOnlyProps, patch})
function resource(name, { props, required = [], input, inputRequired = [], readonly = {}, patch = true, mutable = true, description }) {
  const base = mutable
    ? { id: ro(ID), created_at: ro(TS), updated_at: ro(TS), version: ro(int({ description: 'Optimistic-concurrency version; exposed as ETag W/"<version>".' })) }
    : { id: ro(ID), created_at: ro(TS) };
  schemas[name] = obj({ ...base, ...readonly, ...props }, ['id', ...required], description ? { description } : {});
  if (input) {
    const inProps = Object.fromEntries(input.map((k) => [k, props[k]]));
    schemas[`${name}Input`] = obj(inProps, inputRequired, { additionalProperties: false });
    if (patch) schemas[`${name}Patch`] = obj(inProps, [], { additionalProperties: false, minProperties: 1, description: `JSON Merge Patch (RFC 7396) of ${name}Input; every field optional.` });
  }
}

resource('Tenant', {
  props: { slug: str({ pattern: '^[a-z0-9][a-z0-9-]{1,62}$' }), display_name: str({ maxLength: 200 }), kind: en(['individual', 'organization']), parent_tenant_id: nullable(ID), status: ro(en(['provisioning', 'active', 'suspended', 'pending_deletion', 'deleted'])), data_region: nullable(str()) },
  required: ['slug', 'display_name', 'kind', 'status'],
  input: ['slug', 'display_name', 'kind', 'parent_tenant_id', 'data_region'], inputRequired: ['slug', 'display_name', 'kind'], patch: false,
});
schemas.TenantCreate = { allOf: [S('TenantInput'), obj({ initial_admin_email: str({ format: 'email' }) }, ['initial_admin_email'])] };
schemas.TenantAdminPatch = obj({ display_name: str(), status: en(['active', 'suspended']), data_region: nullable(str()) }, [], { additionalProperties: false, minProperties: 1 });
schemas.TenantSettings = obj({
  reporting_currency: CUR, fx_policy: en(['charge_date', 'month_end', 'month_average', 'provider']),
  accounting_calendar: obj({ type: en(['gregorian', '4-4-5', '4-5-4', '5-4-4']), fiscal_year_start_month: int({ minimum: 1, maximum: 12 }) }, ['type']),
  timezone: str({ description: 'IANA time zone for presentation only; storage and queries are UTC.' }),
  retention: obj({ raw_months: int(), cost_months: int(), ai_conversation_days: int(), audit_years: int(), closed_period_years: int() }),
  ai_settings: obj({ enabled: bool(), model_ref: nullable(str()), allow_external_providers: bool(), max_rows_per_tool_call: int({ maximum: 1000 }) }, ['enabled']),
  updated_at: ro(TS), version: ro(int()),
}, ['reporting_currency', 'fx_policy', 'accounting_calendar', 'timezone']);
schemas.TenantSettingsPatch = obj(Object.fromEntries(['reporting_currency', 'fx_policy', 'accounting_calendar', 'timezone', 'retention', 'ai_settings'].map((k) => [k, schemas.TenantSettings.properties[k]])), [], { additionalProperties: false, minProperties: 1, description: 'JSON Merge Patch of TenantSettings.' });

resource('Member', {
  props: { user_id: ro(ID), email: str({ format: 'email' }), display_name: nullable(str()), status: en(['invited', 'active', 'suspended']), source: ro(en(['manual', 'jit', 'scim'])), group_ids: ro(arr(ID)), role_binding_ids: ro(arr(ID)) },
  required: ['user_id', 'email', 'status', 'source'],
  input: ['email', 'display_name'], inputRequired: ['email'], patch: false,
});
schemas.MemberPatch = obj({ status: en(['active', 'suspended']), display_name: str() }, [], { additionalProperties: false, minProperties: 1 });
resource('Role', {
  props: { key: str({ pattern: '^[a-z][a-z0-9_]{1,62}$' }), name: str(), description: nullable(str()), builtin: ro(bool()), permissions: arr(str({ examples: ['cost:read', 'connector:write', 'period:close'] }), { uniqueItems: true }) },
  required: ['key', 'name', 'builtin', 'permissions'],
  input: ['key', 'name', 'description', 'permissions'], inputRequired: ['key', 'name', 'permissions'],
  description: 'Built-in roles are global and read-only.',
});
resource('DataScope', {
  props: { name: str(), description: nullable(str()), predicate: S('FilterExpression') },
  required: ['name', 'predicate'], input: ['name', 'description', 'predicate'], inputRequired: ['name', 'predicate'],
  description: 'ABAC predicate (validated AST, same grammar as semantic query filters) appended to every query of a bound principal (ADR-0008).',
});
resource('RoleBinding', {
  props: { subject_type: en(['membership', 'group', 'service_account']), subject_id: ID, role_id: ID, data_scope_id: nullable(ID), expires_at: nullable(TS) },
  required: ['subject_type', 'subject_id', 'role_id'], input: ['subject_type', 'subject_id', 'role_id', 'data_scope_id', 'expires_at'], inputRequired: ['subject_type', 'subject_id', 'role_id'], patch: false, mutable: false,
});
resource('ApiToken', {
  props: { name: str(), owner_type: en(['user', 'service_account']), owner_id: ID, prefix: ro(str({ description: 'Public prefix (clt_<prefix>_…).' })), scopes: arr(str(), { minItems: 1 }), expires_at: TS, last_used_at: ro(nullable(TS)), revoked_at: ro(nullable(TS)) },
  required: ['name', 'owner_type', 'owner_id', 'prefix', 'scopes', 'expires_at'],
  input: ['name', 'owner_type', 'owner_id', 'scopes', 'expires_at'], inputRequired: ['name', 'scopes', 'expires_at'], patch: false, mutable: false,
});
schemas.ApiTokenCreated = { allOf: [S('ApiToken'), obj({ token: str({ description: 'Full secret `clt_<prefix>_<secret>`. Returned exactly once; only a hash is stored.', writeOnly: false }) }, ['token'])] };

// Hierarchy
resource('HierarchyVersion', {
  props: { name: str(), effective_from: DATE, status: ro(en(['draft', 'published', 'retired'])), node_count: ro(int()) },
  required: ['effective_from', 'status'], input: ['name', 'effective_from'], inputRequired: ['effective_from'],
});
schemas.HierarchyVersionCreate = { allOf: [S('HierarchyVersionInput'), obj({ copy_from_version_id: nullable(ID) })] };
resource('HierarchyNode', {
  props: { version_id: ID, parent_id: nullable(ID), key: str({ pattern: '^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$' }), name: str(), node_type: str({ examples: ['business_unit', 'cost_center', 'team'] }), path: ro(str({ description: 'Materialized path (ltree).' })), attributes: ANY_OBJ },
  required: ['version_id', 'key', 'name', 'node_type', 'path'], input: ['version_id', 'parent_id', 'key', 'name', 'node_type', 'attributes'], inputRequired: ['version_id', 'key', 'name', 'node_type'],
});

// Connectors
const CAP_STATUS = en(['pass', 'fail', 'unknown', 'not_applicable']);
schemas.ConnectorAuth = obj({ method: str({ examples: ['assume_role', 'workload_identity_federation', 'service_principal_federated'] }), params: { type: 'object', additionalProperties: str(), description: 'Non-secret parameters only (role ARN, WIF pool, tenant id…). Secrets go via credential_ref.' } }, ['method']);
resource('Connector', {
  props: {
    provider: str({ examples: ['aws', 'gcp', 'azure', 'generic'] }), provider_version: ro(str()), name: str({ maxLength: 200 }),
    root_scope: obj({ type: str({ examples: ['aws_organization'] }) }, ['type'], { additionalProperties: true }),
    auth: S('ConnectorAuth'), credential_ref: nullable(str({ description: 'Secret reference (e.g. vault://…, k8s://…); raw secrets are never accepted or returned (ADR-0009).' })),
    config: ANY_OBJ, status: ro(en(['pending_verification', 'active', 'degraded', 'error', 'disabled'])),
    capabilities: ro(arr(S('ConnectorCapability'))),
  },
  required: ['provider', 'name', 'root_scope', 'auth', 'status'],
  input: ['provider', 'name', 'root_scope', 'auth', 'credential_ref', 'config'], inputRequired: ['provider', 'name', 'root_scope', 'auth'], patch: false,
});
schemas.ConnectorPatch = obj({ name: str(), auth: S('ConnectorAuth'), credential_ref: nullable(str()), config: ANY_OBJ, enabled: bool() }, [], { additionalProperties: false, minProperties: 1 });
schemas.ConnectorCapability = obj({ capability: str({ examples: ['billing', 'invoices', 'inventory', 'metrics', 'provider_recommendations', 'pricing', 'commitments'] }), declared: bool(), verified_status: CAP_STATUS, availability: en(['available', 'entitlement_dependent']), permission_report: arr(obj({ permission: str(), status: CAP_STATUS, message: str() })), verified_at: nullable(TS) }, ['capability', 'declared', 'verified_status']);
schemas.ConnectorHealth = obj({
  connector_id: ID, status: en(['pending_verification', 'active', 'degraded', 'error', 'disabled']),
  capabilities: arr(S('ConnectorCapability')),
  freshness: arr(obj({ capability: str(), scope_key: str(), latest_charge_period_end: nullable(TS), lag_hours: nullable({ type: 'number' }), last_success_at: nullable(TS) })),
  last_runs: arr(S('IngestionRun')), open_issues: arr(obj({ code: str(), severity: en(['info', 'warning', 'error']), message: str(), since: TS }, ['code', 'severity', 'message'])),
}, ['connector_id', 'status', 'capabilities']);
schemas.CloudScope = obj({ id: ro(ID), connector_id: ID, provider: str(), scope_type: str({ examples: ['aws_account', 'gcp_project', 'azure_subscription'] }), native_id: str(), name: nullable(str()), parent_scope_id: nullable(ID), tags: S('Labels'), status: str(), first_seen_at: TS, last_seen_at: TS }, ['id', 'connector_id', 'scope_type', 'native_id']);
schemas.SyncRequest = obj({ capabilities: arr(str()), scope_keys: arr(str()) }, [], { additionalProperties: false });
schemas.BackfillRequest = obj({ from: S('BillingPeriod'), to: S('BillingPeriod'), capabilities: arr(str()), scope_keys: arr(str()), force: bool({ default: false, description: 'Re-ingest even if source objects are unchanged.' }) }, ['from', 'to'], { additionalProperties: false });
schemas.OnboardingTemplate = obj({
  provider: str(), external_id: nullable(str({ description: 'Tenant-specific external ID / audience to embed in trust policies.' })),
  auth_methods: arr(obj({ id: str(), keyless: bool(), params: arr(str()) })),
  artifacts: arr(obj({ kind: en(['cloudformation', 'terraform', 'gcloud_script', 'bicep', 'arm', 'shell']), name: str(), media_type: str(), content: str(), url: str({ format: 'uri' }) }, ['kind', 'name'])),
  required_permissions: { type: 'object', additionalProperties: arr(str()) },
  docs_url: str({ format: 'uri' }),
}, ['provider', 'artifacts']);

// Imports & mappings
resource('Mapping', {
  props: { key: str(), mapping_version: ro(int({ description: 'Mapping definition version (distinct from the ETag version).' })), focus_version: str({ examples: ['1.2'] }), definition: obj({ columns: arr(obj({ target: str(), source: str(), transform: str() }, ['target'])) }, [], { additionalProperties: true }), status: en(['draft', 'active', 'retired']), builtin: ro(bool()) },
  required: ['key', 'focus_version', 'definition', 'status'], input: ['key', 'focus_version', 'definition', 'status'], inputRequired: ['key', 'focus_version', 'definition'],
});
resource('Import', {
  props: {
    file_name: str(), content_type: str({ examples: ['text/csv', 'application/vnd.apache.parquet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] }),
    size_bytes: int({ minimum: 1 }), sha256: str({ pattern: '^[0-9a-f]{64}$' }), mapping_id: ID, connector_id: nullable(ID), billing_period: nullable(S('BillingPeriod')),
    status: ro(en(['awaiting_upload', 'uploaded', 'parsing', 'validating', 'succeeded', 'failed', 'quarantined'])),
    upload: ro(nullable(obj({ url: str({ format: 'uri' }), method: en(['PUT', 'POST']), headers: S('Labels'), expires_at: TS }, ['url', 'method', 'expires_at'], { description: 'Pre-signed upload target (only while status=awaiting_upload).' }))),
    ingestion_run_id: ro(nullable(ID)), error: ro(nullable(S('Problem'))),
  },
  required: ['file_name', 'status', 'mapping_id'], input: ['file_name', 'content_type', 'size_bytes', 'sha256', 'mapping_id', 'connector_id', 'billing_period'], inputRequired: ['file_name', 'content_type', 'size_bytes', 'sha256', 'mapping_id'], patch: false,
});

// Ingestion
schemas.IngestionRun = obj({
  id: ro(ID), connector_id: ID, capability: str(), scope_key: str(), window_start: nullable(TS), window_end: nullable(TS), billing_period: nullable(S('BillingPeriod')),
  trigger: en(['schedule', 'backfill', 'manual', 'restatement', 'replay']),
  status: en(['queued', 'discovering', 'downloading', 'normalizing', 'validating', 'swapping', 'succeeded', 'failed', 'failed_validation', 'quarantined', 'cancelled']),
  mapping_version: nullable(str()), stats: obj({ source_objects: int(), rows_in: int(), rows_out: int(), rows_rejected: int(), bytes: int() }, [], { additionalProperties: true }),
  data_quality: nullable(obj({ checks: arr(obj({ name: str(), status: en(['pass', 'warn', 'fail']), detail: str() })), rejected_rows: int(), rejected_sample_available: bool() })),
  error: nullable(S('Problem')), started_at: nullable(TS), finished_at: nullable(TS), created_at: TS,
}, ['id', 'connector_id', 'capability', 'trigger', 'status']);
schemas.PeriodDiff = obj({
  connector_id: ID, billing_period: S('BillingPeriod'), from_version: int(), to_version: int(),
  totals: arr(obj({ billing_account_id: str(), charge_category: str(), currency: CUR, before: MONEY, after: MONEY, delta: MONEY, row_count_before: int(), row_count_after: int() }, ['currency', 'before', 'after', 'delta'])),
  affects_closed_period: bool(),
}, ['connector_id', 'billing_period', 'from_version', 'to_version', 'totals']);

// Query
schemas.QueryColumn = obj({ name: str(), kind: en(['dimension', 'metric', 'time']), type: en(['string', 'decimal', 'integer', 'date', 'timestamp', 'boolean']), currency: nullable(CUR), scale: nullable(int()) }, ['name', 'kind', 'type']);
schemas.QueryResult = obj({
  columns: arr(S('QueryColumn')),
  rows: arr(arr({ type: ['string', 'integer', 'boolean', 'null'] }), { description: 'Row-major cells aligned to columns. Decimal/money cells are strings.' }),
  truncated: bool(), meta: S('AnalyticsMeta'),
}, ['columns', 'rows', 'truncated', 'meta']);
schemas.SemanticCatalog = obj({
  metrics: arr(obj({ key: str(), name: str(), description: str(), aggregation: en(['sum', 'avg', 'min', 'max', 'ratio', 'derived']), scale: int(), currency_behavior: en(['convertible', 'non_monetary', 'billing_only']), unit: nullable(str()) }, ['key', 'name', 'aggregation'])),
  dimensions: arr(obj({ key: str(), name: str(), source: en(['focus', 'tag', 'hierarchy', 'custom', 'derived']), type: en(['string', 'date', 'timestamp', 'boolean']), groupable: bool(), filterable: bool() }, ['key', 'name', 'source'])),
  limits: obj({ max_dimensions: int(), max_limit: int(), max_limit_ai: int(), max_time_span: { type: 'object', additionalProperties: str() } }),
  data_version: int(),
}, ['metrics', 'dimensions', 'limits']);

// Dashboards
resource('Dashboard', {
  props: { name: str({ maxLength: 200 }), description: nullable(str()), owner_id: ro(ID), visibility: en(['private', 'shared', 'tenant']), layout: obj({ columns: int({ default: 12 }), items: arr(obj({ widget_id: ID, x: int(), y: int(), w: int(), h: int() })) }), template_key: nullable(str()), shares: arr(obj({ subject_type: en(['membership', 'group']), subject_id: ID, permission: en(['view', 'edit']) }, ['subject_type', 'subject_id', 'permission'])), default_filters: nullable(S('FilterExpression')) },
  required: ['name', 'owner_id', 'visibility', 'layout'], input: ['name', 'description', 'visibility', 'layout', 'template_key', 'shares', 'default_filters'], inputRequired: ['name'],
});
resource('Widget', {
  props: { dashboard_id: ro(ID), type: str({ examples: ['kpi', 'timeseries', 'bar', 'table', 'treemap', 'budget_burn'] }), title: str(), query: S('SemanticQuery'), options: ANY_OBJ },
  required: ['dashboard_id', 'type', 'query'], input: ['type', 'title', 'query', 'options'], inputRequired: ['type', 'query'],
});
resource('SavedView', {
  props: { name: str(), owner_id: ro(ID), visibility: en(['private', 'tenant']), query: S('SemanticQuery') },
  required: ['name', 'owner_id', 'query'], input: ['name', 'visibility', 'query'], inputRequired: ['name', 'query'],
});
schemas.DashboardTemplate = obj({ key: str(), name: str(), description: str(), personas: arr(str()), widgets: arr(obj({ type: str(), title: str(), query: S('SemanticQuery'), options: ANY_OBJ })), required_capabilities: arr(str()) }, ['key', 'name']);

// Allocation
schemas.AllocationRule = obj({ id: ro(ID), position: int({ minimum: 0 }), kind: en(['tag_key_normalize', 'tag_value_map', 'inheritance', 'dimension_assign', 'hierarchy_assign', 'shared_split']), name: str(), condition: S('FilterExpression'), action: obj({}, [], { additionalProperties: true, description: 'Kind-specific validated action AST (e.g. split basis, weights as decimal strings, target node).' }) }, ['position', 'kind', 'condition', 'action']);
resource('AllocationRuleSet', {
  props: { name: str(), rule_set_version: ro(int()), status: ro(en(['draft', 'published', 'superseded'])), effective_from: DATE, rules: arr(S('AllocationRule')), published_by: ro(nullable(ID)), published_at: ro(nullable(TS)), checksum: ro(nullable(str({ pattern: '^[0-9a-f]{64}$' }))) },
  required: ['status', 'effective_from', 'rules'], input: ['name', 'effective_from', 'rules'], inputRequired: ['effective_from', 'rules'],
  description: 'Only drafts are mutable. Publishing creates an immutable version and triggers re-allocation.',
});
schemas.AllocationPreviewRequest = obj({ billing_period: S('BillingPeriod'), sample_limit: int({ minimum: 0, maximum: 1000, default: 100 }), compare_to: en(['live', 'none'], { default: 'live' }) }, ['billing_period'], { additionalProperties: false });
schemas.AllocationPreview = obj({
  billing_period: S('BillingPeriod'), data_version: int(), allocated: arr(obj({ target: str(), before: MONEY, after: MONEY, delta: MONEY })),
  unallocated: arr(MONEY), residual: arr(MONEY), rule_hits: arr(obj({ rule_id: ID, rows: int(), amount: MONEY })),
  samples: arr(ANY_OBJ), warnings: arr(str()),
}, ['billing_period', 'allocated', 'unallocated']);
schemas.PublishRequest = obj({ reallocate_from: nullable(S('BillingPeriod')), note: str() }, [], { additionalProperties: false });
resource('CustomDimension', {
  props: { key: str({ pattern: '^[a-z][a-z0-9_]{0,62}$' }), name: str(), allowed_values: nullable(arr(str())), default_value: nullable(str()) },
  required: ['key', 'name'], input: ['key', 'name', 'allowed_values', 'default_value'], inputRequired: ['key', 'name'],
});

// Budgets, forecasts, anomalies
schemas.BudgetAlertRule = obj({ id: ro(ID), basis: en(['actual', 'forecast']), threshold_pct: DEC, channel_ids: arr(ID) }, ['basis', 'threshold_pct', 'channel_ids']);
resource('Budget', {
  props: {
    name: str(), scope: S('FilterExpression'), cost_metric: str({ examples: ['effective_cost', 'allocated_effective_cost'] }), currency: CUR,
    period_type: en(['month', 'quarter', 'year', 'custom']), amounts: arr(obj({ period_start: DATE, period_end: DATE, amount: MONEY }, ['period_start', 'amount'])),
    owner_id: nullable(ID), alert_rules: arr(S('BudgetAlertRule')),
    current: ro(nullable(obj({ period_start: DATE, actual: MONEY, forecast: nullable(MONEY), budget: MONEY, consumed_ratio: DEC, data_version: int() }))),
  },
  required: ['name', 'scope', 'cost_metric', 'currency', 'period_type', 'amounts'], input: ['name', 'scope', 'cost_metric', 'currency', 'period_type', 'amounts', 'owner_id', 'alert_rules'], inputRequired: ['name', 'scope', 'cost_metric', 'currency', 'period_type', 'amounts'],
});
schemas.ForecastPoint = obj({ date: DATE, value: DEC, lower: DEC, upper: DEC }, ['date', 'value']);
schemas.Forecast = obj({ id: ro(ID), scope: S('FilterExpression'), metric: str(), currency: CUR, horizon_days: int(), model: str(), model_version: str(), generated_at: TS, data_version: int(), series: arr(S('ForecastPoint')), total: MONEY, backtest: nullable(obj({ mape: DEC, window_days: int() })) }, ['id', 'metric', 'currency', 'model', 'generated_at', 'series']);
schemas.ForecastRequest = obj({ scope: S('FilterExpression'), metric: str({ default: 'effective_cost' }), currency: { oneOf: [CUR, en(['reporting'])] }, horizon_days: int({ minimum: 1, maximum: 731, default: 90 }), model: str({ description: 'Optional model override; default chosen by the forecasting module.' }) }, [], { additionalProperties: false });
schemas.Anomaly = obj({
  id: ro(ID), scope: ANY_OBJ, detected_at: TS, usage_date: DATE, expected: MONEY, actual: MONEY, delta: MONEY, score: DEC,
  contributors: arr(obj({ dimension: str(), value: str(), delta: MONEY }, ['dimension', 'value', 'delta'])),
  status: en(['open', 'acknowledged', 'resolved', 'false_positive', 'suppressed']), detector_version: str(), note: nullable(str()), version: ro(int()), updated_at: ro(TS),
}, ['id', 'detected_at', 'usage_date', 'expected', 'actual', 'score', 'status']);
schemas.AnomalyPatch = obj({ status: en(['acknowledged', 'resolved', 'false_positive', 'suppressed']), note: str(), suppress_until: TS }, [], { additionalProperties: false, minProperties: 1 });

// Alerts
resource('AlertChannel', {
  props: { name: str(), type: en(['email', 'slack', 'teams', 'webhook', 'jira', 'servicenow', 'github']), config: obj({}, [], { additionalProperties: true, description: 'Type-specific non-secret configuration.' }), secret_ref: nullable(str({ description: 'Secret reference for webhook signing keys / tokens. Never a raw secret.' })), verified_at: ro(nullable(TS)), event_types: arr(str()) },
  required: ['name', 'type', 'config'], input: ['name', 'type', 'config', 'secret_ref', 'event_types'], inputRequired: ['name', 'type', 'config'],
});
schemas.Notification = obj({ id: ro(ID), channel_id: ID, dedup_key: str(), event_type: str(), event_id: nullable(str()), status: en(['pending', 'sent', 'failed', 'dead_lettered', 'suppressed']), attempts: int(), last_error: nullable(str()), sent_at: nullable(TS), created_at: TS }, ['id', 'channel_id', 'event_type', 'status', 'attempts']);

// Finance
schemas.FxRateSet = obj({ id: ro(ID), source: str({ examples: ['ecb', 'manual', 'provider'] }), version: int(), retrieved_at: TS, checksum: str(), tenant_owned: bool(), coverage: obj({ from: DATE, to: DATE, currencies: arr(CUR) }) }, ['id', 'source', 'version', 'retrieved_at']);
schemas.FxRate = obj({ rate_date: DATE, base: CUR, quote: CUR, rate: str({ pattern: '^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?$', description: 'numeric(38,18) decimal string.' }) }, ['rate_date', 'base', 'quote', 'rate']);
schemas.FxRateSetCreate = obj({ source: str({ default: 'manual' }), rates: arr(S('FxRate'), { minItems: 1, maxItems: 100000 }) }, ['rates'], { additionalProperties: false });
schemas.Commitment = obj({ id: ro(ID), provider: str(), native_id: str(), type: str({ examples: ['aws_ri', 'aws_sp_compute', 'aws_sp_ec2', 'gcp_cud_resource', 'gcp_cud_spend', 'azure_reservation', 'azure_savings_plan'] }), scope: ANY_OBJ, term_months: int(), payment_option: nullable(str()), start_at: TS, end_at: TS, commitment_amount: nullable(MONEY), attributes: ANY_OBJ, utilization: ro(nullable(obj({ window_days: int(), utilization: S('Ratio'), coverage: S('Ratio'), unused: MONEY }))) }, ['id', 'provider', 'native_id', 'type', 'term_months', 'start_at', 'end_at']);
schemas.CommitmentUtilizationPoint = obj({ date: DATE, used: MONEY, unused: MONEY, covered_cost: MONEY, utilization: S('Ratio') }, ['date', 'used', 'unused']);
resource('UnitMetric', {
  props: { key: str({ pattern: '^[a-z][a-z0-9_]{0,62}$' }), name: str(), unit: str({ examples: ['requests', 'customers', 'orders'] }), source: en(['api', 'upload', 'query']) },
  required: ['key', 'name', 'unit'], input: ['key', 'name', 'unit', 'source'], inputRequired: ['key', 'name', 'unit'],
});
schemas.UnitMetricValue = obj({ ts: DATE, dimension_key: str({ default: '' }), value: DEC, source: str() }, ['ts', 'value']);
schemas.UnitMetricValuesUpsert = obj({ values: arr(S('UnitMetricValue'), { minItems: 1, maxItems: 10000 }) }, ['values'], { additionalProperties: false });
schemas.Invoice = obj({
  id: ro(ID), provider: str(), invoice_number: str(), issuer_entity: nullable(str()), billing_account: str(), invoice_date: DATE, period_start: DATE, period_end: DATE,
  subtotal: MONEY, tax: MONEY, total: MONEY, source: en(['api', 'upload', 'export']), source_object_id: nullable(ID), status: en(['imported', 'reconciled', 'variance', 'acknowledged', 'superseded']), created_at: ro(TS),
}, ['id', 'provider', 'invoice_number', 'billing_account', 'invoice_date', 'period_start', 'period_end', 'subtotal', 'tax', 'total', 'source', 'status']);
schemas.InvoiceLine = obj({ id: ro(ID), invoice_id: ID, line_no: int(), description: nullable(str()), category: nullable(str()), account_ref: nullable(str()), service: nullable(str()), amount: MONEY, tax: nullable(MONEY) }, ['id', 'invoice_id', 'line_no', 'amount']);
schemas.InvoiceImportRequest = obj({ provider: str(), connector_id: nullable(ID), import_id: nullable(ID), invoice: nullable(obj({ invoice_number: str(), billing_account: str(), invoice_date: DATE, period_start: DATE, period_end: DATE, subtotal: MONEY, tax: MONEY, total: MONEY, lines: arr(obj({ line_no: int(), description: str(), category: str(), account_ref: str(), service: str(), amount: MONEY, tax: MONEY }, ['line_no', 'amount'])) }, ['invoice_number', 'billing_account', 'invoice_date', 'period_start', 'period_end', 'total'])) }, ['provider'], { additionalProperties: false, description: 'Either fetch from the provider (connector_id), reference an uploaded file (import_id), or post structured invoice data.' });
schemas.ReconciliationVariance = obj({ id: ro(ID), category: en(['tax', 'credit', 'rounding', 'timing', 'late_correction', 'fx', 'marketplace', 'support', 'missing_data', 'unexplained']), amount: MONEY, details: ANY_OBJ, acknowledged_by: nullable(ID), acknowledged_at: nullable(TS), note: nullable(str()) }, ['id', 'category', 'amount']);
schemas.Reconciliation = obj({ id: ro(ID), invoice_id: ID, data_version: int(), run_at: TS, invoice_total: MONEY, computed_total: MONEY, difference: MONEY, tolerance: MONEY, status: en(['matched', 'within_tolerance', 'variance', 'acknowledged']), variances: arr(S('ReconciliationVariance')) }, ['id', 'invoice_id', 'data_version', 'run_at', 'invoice_total', 'computed_total', 'tolerance', 'status']);
schemas.ReconciliationRequest = obj({ invoice_id: ID, tolerance: nullable(MONEY) }, ['invoice_id'], { additionalProperties: false });
schemas.VarianceAcknowledge = obj({ note: str({ minLength: 1, maxLength: 2000 }) }, ['note'], { additionalProperties: false });
schemas.PeriodSnapshot = obj({ id: ro(ID), data_version: int(), rule_set_version: int(), fx_rate_set_id: nullable(ID), manifest_sha256: str(), worm_locked_until: nullable(DATE) }, ['id', 'data_version', 'rule_set_version', 'manifest_sha256']);
schemas.AccountingPeriod = obj({ id: ro(ID), period_key: str({ examples: ['2026-10', 'FY2026-P10'] }), start_date: DATE, end_date: DATE, status: en(['open', 'closing', 'closed', 'reopened']), closed_by: nullable(ID), closed_at: nullable(TS), snapshot: nullable(S('PeriodSnapshot')), checklist: arr(obj({ item: str(), status: en(['pass', 'warn', 'fail', 'acknowledged']), detail: str() })), version: ro(int()) }, ['id', 'period_key', 'start_date', 'end_date', 'status']);
schemas.PeriodCloseRequest = obj({ expected_data_version: int({ description: 'Close fails with 409 if the live data version differs (prevents closing on unseen restatements).' }), acknowledge_warnings: bool({ default: false }), note: str() }, [], { additionalProperties: false });
schemas.PeriodReopenRequest = obj({ reason: str({ minLength: 1 }) }, ['reason'], { additionalProperties: false });

// Reports & exports
const FORMAT = en(['csv', 'xlsx', 'pdf', 'parquet', 'json']);
resource('Report', {
  props: { name: str(), description: nullable(str()), query: S('SemanticQuery'), formats: arr(FORMAT, { minItems: 1, uniqueItems: true }), schedule: nullable(str({ description: 'Cron expression (UTC) or null for on-demand.' })), recipients: arr(obj({ type: en(['email', 'alert_channel']), target: str() }, ['type', 'target'])) },
  required: ['name', 'query', 'formats'], input: ['name', 'description', 'query', 'formats', 'schedule', 'recipients'], inputRequired: ['name', 'query', 'formats'],
});
schemas.Artifact = obj({ format: FORMAT, url: str({ format: 'uri', description: 'Short-lived signed download URL.' }), sha256: str(), size_bytes: int(), expires_at: TS }, ['format', 'sha256']);
schemas.ReportRun = obj({ id: ro(ID), definition_id: nullable(ID), period_id: nullable(ID), requested_by: nullable(ID), status: en(['queued', 'running', 'succeeded', 'failed', 'cancelled']), started_at: nullable(TS), finished_at: nullable(TS), artifacts: arr(S('Artifact')), manifest: nullable(obj({ sha256: str(), signed_by: nullable(str()), data_version: int(), rule_set_version: int(), fx_rate_set_id: nullable(ID) })), created_at: TS }, ['id', 'status']);
schemas.ReportRunRequest = obj({ definition_id: ID, period_id: nullable(ID), formats: arr(FORMAT), parameters: ANY_OBJ }, ['definition_id'], { additionalProperties: false });
schemas.Export = obj({ id: ro(ID), kind: en(['query', 'cost_focus', 'allocated_cost', 'recommendations', 'audit_events', 'ledger']), format: FORMAT, query: nullable(S('SemanticQuery')), status: en(['queued', 'running', 'succeeded', 'failed', 'expired']), artifact: nullable(S('Artifact')), created_at: TS }, ['id', 'kind', 'format', 'status']);
schemas.ExportRequest = obj({ kind: en(['query', 'cost_focus', 'allocated_cost', 'recommendations', 'audit_events', 'ledger']), format: FORMAT, query: S('SemanticQuery'), billing_period: S('BillingPeriod'), ledger_mapping_id: ID }, ['kind', 'format'], { additionalProperties: false, description: 'CSV/XLSX exports neutralize spreadsheet formula injection (FR-IMP-004).' });

// Inventory
schemas.Resource = obj({ id: ro(ID), provider: str(), connector_id: ID, native_id: str(), resource_type: str(), region: nullable(str()), name: nullable(str()), tags: S('Labels'), relationships: arr(obj({ type: str(), target_native_id: str() })), attributes: ANY_OBJ, valid_from: TS, valid_to: nullable(TS), last_seen_at: TS, monthly_cost: nullable(MONEY) }, ['id', 'provider', 'native_id', 'resource_type']);
schemas.MetricPoint = obj({ ts: TS, min: { type: 'number' }, avg: { type: 'number' }, p50: { type: 'number' }, p95: { type: 'number' }, p99: { type: 'number' }, max: { type: 'number' }, sample_count: int() }, ['ts']);
schemas.ResourceMetrics = obj({ resource_id: ID, grain: en(['hour', 'day']), series: arr(obj({ metric: str(), unit: str(), coverage: { type: 'number', minimum: 0, maximum: 1 }, points: arr(S('MetricPoint')) }, ['metric', 'points'])) }, ['resource_id', 'grain', 'series'], { description: 'Utilization metrics are not money and are JSON numbers.' });

// Recommendations
const REC_STATE = en(['open', 'acknowledged', 'in_review', 'approved', 'rejected', 'implemented', 'verified', 'snoozed', 'dismissed', 'expired', 'superseded']);
schemas.Recommendation = obj({
  id: ro(ID), rule_id: str(), rule_version: str(), source: en(['native', 'provider']), category: str(), provider: str(), target_type: str(), target_native_id: str(), scope: ANY_OBJ,
  title: str(), action: obj({ type: str() }, ['type'], { additionalProperties: true, description: 'Proposed change, IaC snippet references and rollback guidance. CloudLedger never mutates cloud resources (NG1).' }),
  gross_monthly_savings: MONEY, net_monthly_savings: MONEY, overlap_group: nullable(str()), confidence: S('Ratio'), confidence_factors: ANY_OBJ, risk: en(['low', 'medium', 'high']), effort: str(),
  inputs_freshness: ANY_OBJ, state: REC_STATE, snoozed_until: nullable(TS), assignee_id: nullable(ID), external_ref: nullable(str()), first_seen_at: TS, last_evaluated_at: TS, version: ro(int()),
}, ['id', 'rule_id', 'category', 'provider', 'target_type', 'target_native_id', 'title', 'gross_monthly_savings', 'net_monthly_savings', 'confidence', 'risk', 'state', 'version']);
schemas.RecommendationTransition = obj({ to_state: REC_STATE, comment: str({ maxLength: 4000 }), snoozed_until: TS, assignee_id: ID, external_ref: str({ description: 'Ticket reference (Jira, ServiceNow, GitHub).' }) }, ['to_state'], { additionalProperties: false, description: 'Invalid transitions return 409 conflict with code invalid_transition.' });
schemas.RecommendationEvidence = obj({ id: ro(ID), recommendation_id: ID, evaluated_at: TS, kind: str({ examples: ['utilization', 'cost_trend', 'pricing_comparison', 'provider_native'] }), data: ANY_OBJ, data_refs: arr(obj({ type: str(), ref: str(), data_version: int() })) }, ['id', 'recommendation_id', 'evaluated_at', 'kind', 'data']);
schemas.RealizedSavings = obj({ id: ro(ID), recommendation_id: ID, baseline_window: obj({ from: DATE, to: DATE }, ['from', 'to']), measure_window: obj({ from: DATE, to: DATE }, ['from', 'to']), method: str(), baseline_cost: MONEY, observed_cost: MONEY, realized_monthly: MONEY, confidence: S('Ratio'), notes: nullable(ANY_OBJ) }, ['id', 'recommendation_id', 'baseline_window', 'measure_window', 'method', 'baseline_cost', 'observed_cost', 'realized_monthly']);

// AI
schemas.AiConversation = obj({ id: ro(ID), title: nullable(str()), model_ref: ro(str()), created_at: ro(TS), expires_at: ro(TS) }, ['id', 'model_ref', 'created_at', 'expires_at']);
schemas.AiConversationInput = obj({ title: str({ maxLength: 200 }) }, [], { additionalProperties: false });
schemas.AiCitation = obj({ kind: en(['query', 'recommendation', 'resource', 'report', 'doc']), ref: str(), query: nullable(S('SemanticQuery')), data_version: nullable(int()), label: str() }, ['kind', 'ref']);
schemas.AiToolCall = obj({ id: ro(ID), tool: str(), arguments: ANY_OBJ, authz_decision: en(['allow', 'deny']), duration_ms: int(), result_ref: nullable(ANY_OBJ) }, ['id', 'tool', 'authz_decision']);
schemas.AiMessage = obj({ id: ro(ID), conversation_id: ID, role: en(['user', 'assistant', 'tool', 'system']), content: str(), citations: arr(S('AiCitation')), tool_calls: arr(S('AiToolCall')), tokens_in: nullable(int()), tokens_out: nullable(int()), created_at: TS }, ['id', 'conversation_id', 'role', 'content', 'created_at']);
schemas.AiMessageInput = obj({ content: str({ minLength: 1, maxLength: 16000 }), stream: bool({ default: true, description: 'When true and Accept includes text/event-stream, the response is an SSE stream.' }) }, ['content'], { additionalProperties: false });
schemas.AiStreamEvent = obj({
  event: en(['message.started', 'message.delta', 'tool_call.started', 'tool_call.completed', 'citation', 'message.completed', 'error']),
  data: obj({ message_id: ID, delta: str(), tool_call: S('AiToolCall'), citation: S('AiCitation'), message: S('AiMessage'), error: S('Problem') }, [], { additionalProperties: true }),
}, ['event', 'data'], { description: 'Logical shape of one SSE frame: `event: <event>` / `data: <JSON of data>`; `id:` carries a monotonically increasing sequence for Last-Event-ID resume.' });

// Audit
schemas.AuditEvent = obj({ seq: int({ minimum: 1 }), id: ID, occurred_at: TS, actor_type: en(['user', 'api_token', 'service_account', 'system', 'scim', 'platform_admin']), actor_id: nullable(ID), actor_ip: nullable(str()), user_agent: nullable(str()), action: str({ examples: ['connector.create', 'period.close', 'authz.denied'] }), target_type: nullable(str()), target_id: nullable(str()), outcome: en(['success', 'denied', 'error']), request_id: nullable(str()), trace_id: nullable(str()), details: ANY_OBJ, prev_hash: str({ pattern: '^[0-9a-f]{64}$' }), hash: str({ pattern: '^[0-9a-f]{64}$' }) }, ['seq', 'id', 'occurred_at', 'actor_type', 'action', 'outcome', 'prev_hash', 'hash']);
schemas.AuditVerifyRequest = obj({ from_seq: int({ minimum: 1 }), to_seq: int({ minimum: 1 }), check_anchors: bool({ default: true }) }, [], { additionalProperties: false });
schemas.AuditVerification = obj({ valid: bool(), from_seq: int(), to_seq: int(), checked: int(), first_invalid_seq: nullable(int()), anchors: arr(obj({ seq: int(), anchor_type: str(), anchor_ref: str(), valid: bool() })), verified_at: TS }, ['valid', 'from_seq', 'to_seq', 'checked', 'verified_at']);

// Plugins (admin)
schemas.InstalledPlugin = obj({ id: ro(ID), plugin_key: str(), version: str(), kind: en(['Provider', 'RecommendationRule', 'PricingSource', 'DashboardWidget']), license_spdx: str({ description: 'Informational only (NFR-LIC-004).' }), checksum: str(), enabled: bool(), installed_at: TS, execution_mode: en(['in_process', 'grpc']), manifest: { $ref: '../../schemas/manifest/plugin-manifest.v1.json' } }, ['id', 'plugin_key', 'version', 'kind', 'license_spdx', 'enabled']);
schemas.PluginRegistration = obj({ manifest: { $ref: '../../schemas/manifest/plugin-manifest.v1.json' }, endpoint: str({ description: 'gRPC endpoint for out-of-process plugins (mTLS).' }), enabled: bool({ default: false }) }, ['manifest'], { additionalProperties: false });
schemas.PluginPatch = obj({ enabled: bool() }, ['enabled'], { additionalProperties: false });

// ------------------------------------------------------------------ components: params / headers / responses
const parameters = {
  TenantHeader: { name: 'X-CloudLedger-Tenant', in: 'header', required: false, description: 'Tenant ID for principals with access to multiple tenants. Defaults to the principal\'s tenant. Cross-tenant access yields 404.', schema: ID },
  Limit: { name: 'limit', in: 'query', required: false, description: 'Page size (default 50, max 500).', schema: int({ minimum: 1, maximum: 500, default: 50 }) },
  Cursor: { name: 'cursor', in: 'query', required: false, description: 'Opaque cursor from a previous next_cursor.', schema: str({ maxLength: 2048 }) },
  Sort: { name: 'sort', in: 'query', required: false, description: 'Comma-separated documented sort fields; prefix with - for descending (e.g. -created_at).', schema: str({ pattern: '^-?[a-z_]+(,-?[a-z_]+)*$' }) },
  IdempotencyKey: { name: 'Idempotency-Key', in: 'header', required: false, description: 'Recommended on all POSTs; stored 24 h per (tenant, principal, key). Same key + different body → 409 idempotency_key_reuse.', schema: str({ minLength: 1, maxLength: 255 }) },
  IdempotencyKeyRequired: { name: 'Idempotency-Key', in: 'header', required: true, description: 'REQUIRED for financial operations (period close, report run, invoice import).', schema: str({ minLength: 1, maxLength: 255 }) },
  IfMatch: { name: 'If-Match', in: 'header', required: true, description: 'ETag from a previous read (W/"<version>"). Mismatch → 412.', schema: str() },
  Id: { name: 'id', in: 'path', required: true, schema: ID },
  WidgetId: { name: 'widget_id', in: 'path', required: true, schema: ID },
  VarianceId: { name: 'variance_id', in: 'path', required: true, schema: ID },
  TemplateKey: { name: 'key', in: 'path', required: true, schema: str() },
  Provider: { name: 'provider', in: 'path', required: true, schema: str({ examples: ['aws', 'gcp', 'azure'] }) },
  BillingPeriodPath: { name: 'period', in: 'path', required: true, schema: S('BillingPeriod') },
  From: { name: 'from', in: 'query', required: false, schema: TS },
  To: { name: 'to', in: 'query', required: false, schema: TS },
};
const rlHeaders = { 'RateLimit-Limit': H('RateLimitLimit'), 'RateLimit-Remaining': H('RateLimitRemaining'), 'RateLimit-Reset': H('RateLimitReset') };
const headers = {
  ETag: { description: 'Weak entity tag W/"<version>".', schema: str({ examples: ['W/"7"'] }) },
  Location: { description: 'URL of the created resource.', schema: str() },
  RetryAfter: { description: 'Seconds to wait before retrying.', schema: int({ minimum: 0 }) },
  RateLimitLimit: { description: 'IETF RateLimit header draft: quota for the current window (bucket: query, ai, export or default).', schema: int() },
  RateLimitRemaining: { description: 'Remaining quota in the current window.', schema: int() },
  RateLimitReset: { description: 'Seconds until the quota resets.', schema: int() },
  // Deprecation/Sunset are reserved for deprecated endpoints (none yet; COMPATIBILITY.md).
  IdempotentReplayed: { description: 'true when the response is a stored replay for the same Idempotency-Key.', schema: en(['true']) },
  RequestId: { description: 'Request correlation id (also in Problem.request_id).', schema: str() },
  Deprecation: { description: 'Deprecation header (RFC 9745) on deprecated endpoints.', schema: str() },
  Sunset: { description: 'Sunset header (RFC 8594) on deprecated endpoints.', schema: str() },
};
const problem = (desc, code, extraHeaders) => ({ description: `${desc} (e.g. code=${code}).`, headers: { 'X-Request-Id': H('RequestId'), ...(extraHeaders ?? {}) }, content: { 'application/problem+json': { schema: S('Problem') } } });
const responses = {
  BadRequest: problem('Malformed request', 'bad_request, malformed_json'),
  Unauthorized: problem('Missing or invalid credentials', 'unauthenticated, token_expired'),
  Forbidden: problem('Authenticated but not permitted; only when the resource\'s existence is already known to the caller', 'forbidden'),
  NotFound: problem('Not found. Also returned for cross-tenant access (no existence oracle)', 'not_found'),
  Conflict: problem('State conflict', 'conflict, idempotency_key_reuse, period_closed, invalid_transition'),
  PreconditionFailed: problem('If-Match did not match the current ETag', 'precondition_failed'),
  PayloadTooLarge: problem('Payload too large', 'payload_too_large'),
  UnprocessableEntity: problem('Validation failed', 'validation_failed, unsupported_query'),
  TooManyRequests: problem('Rate limited', 'rate_limited, query_budget_exceeded', { 'Retry-After': H('RetryAfter'), ...rlHeaders }),
  InternalError: problem('Internal error; no stack traces, only request_id', 'internal'),
  ServiceUnavailable: problem('Temporarily unavailable', 'unavailable, analytics_unavailable', { 'Retry-After': H('RetryAfter') }),
  Accepted: { description: 'Accepted; a long-running Operation was started.', headers: { Location: H('Location') }, content: { 'application/json': { schema: S('Operation') } } },
  NoContent: { description: 'No content.' },
};

// ------------------------------------------------------------------ paths
const paths = {};
const STD = { '400': R('BadRequest'), '401': R('Unauthorized'), '403': R('Forbidden'), '429': R('TooManyRequests'), '500': R('InternalError'), '503': R('ServiceUnavailable') };
function add(p, method, { id, tag, phase, summary, description, params = [], body, bodyRequired = true, ok, errors = [], security, extra = {} }) {
  paths[p] ??= {};
  const responses = { ...ok };
  for (const e of errors) responses[e] = R({ 400: 'BadRequest', 404: 'NotFound', 409: 'Conflict', 412: 'PreconditionFailed', 413: 'PayloadTooLarge', 422: 'UnprocessableEntity' }[e]);
  Object.assign(responses, STD);
  const sorted = Object.fromEntries(Object.entries(responses).sort(([a], [b]) => a.localeCompare(b)));
  paths[p][method] = {
    operationId: id, summary, ...(description ? { description } : {}), tags: [tag], 'x-phase': phase,
    parameters: [...(security && security.length === 0 ? [] : [PRM('TenantHeader')]), ...params],
    ...(body ? { requestBody: body.content ? { required: bodyRequired, ...body } : { required: bodyRequired, content: { 'application/json': { schema: body } } } } : {}),
    responses: sorted, ...(security ? { security } : {}), ...extra,
  };
  if (!paths[p][method].parameters.length) delete paths[p][method].parameters;
}
const json = (schema, description = 'OK', hdrs) => ({ description, ...(hdrs ? { headers: hdrs } : {}), content: { 'application/json': { schema } } });
const page = (item) => ({ allOf: [S('CursorPage'), obj({ data: arr(S(item)) }, ['data'])] });
const ETAG = { ETag: H('ETag') };
const LIST_P = [PRM('Limit'), PRM('Cursor')];
const filt = (name, schema, description) => ({ name: `filter[${name}]`, in: 'query', required: false, ...(description ? { description } : {}), schema: schema ?? str({ description: 'Comma-separated values.' }) });
const q = (name, schema, required = false, description) => ({ name, in: 'query', required, ...(description ? { description } : {}), schema });

function list(p, tag, phase, id, item, summary, filters = [], extraParams = []) {
  add(p, 'get', { id, tag, phase, summary, params: [...LIST_P, PRM('Sort'), ...filters, ...extraParams], ok: { '200': json(page(item)) }, errors: [422] });
}
function create(p, tag, phase, id, inSchema, outSchema, summary, { idem = 'IdempotencyKey', description } = {}) {
  add(p, 'post', { id, tag, phase, summary, description, params: [PRM(idem)], body: S(inSchema), ok: { '201': json(S(outSchema), 'Created', { ETag: H('ETag'), Location: H('Location'), 'Idempotent-Replayed': H('IdempotentReplayed') }) }, errors: [409, 422] });
}
function get(p, tag, phase, id, outSchema, summary, params = [PRM('Id')], etag = true) {
  add(p, 'get', { id, tag, phase, summary, params, ok: { '200': json(S(outSchema), 'OK', etag ? ETAG : undefined) }, errors: [404] });
}
function patch(p, tag, phase, id, patchSchema, outSchema, summary, params = [PRM('Id')]) {
  add(p, 'patch', { id, tag, phase, summary, params: [...params, PRM('IfMatch')], body: { content: { 'application/merge-patch+json': { schema: S(patchSchema) } } }, ok: { '200': json(S(outSchema), 'OK', ETAG) }, errors: [404, 409, 412, 422] });
}
function del(p, tag, phase, id, summary, params = [PRM('Id')], { ifMatch = true, accepted = false, description } = {}) {
  add(p, 'delete', { id, tag, phase, summary, description, params: [...params, ...(ifMatch ? [PRM('IfMatch')] : [])], ok: accepted ? { '202': R('Accepted') } : { '204': R('NoContent') }, errors: [404, 409, ...(ifMatch ? [412] : [])] });
}
function action(p, tag, phase, id, summary, { body, bodyRequired = true, ok, idem = 'IdempotencyKey', ifMatch = false, errors = [404, 409, 422], description, params = [PRM('Id')] } = {}) {
  add(p, 'post', { id, tag, phase, summary, description, params: [...params, PRM(idem), ...(ifMatch ? [PRM('IfMatch')] : [])], body, bodyRequired, ok: ok ?? { '202': R('Accepted') }, errors: ifMatch ? [...errors, 412] : errors });
}
function crud(base, tag, phase, singular, plural, { filters = [], patchSchema, noPatch, noDelete, inSchema, deleteAccepted } = {}) {
  list(base, tag, phase, `list${plural}`, singular, `List ${plural.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`, filters);
  create(base, tag, phase, `create${singular}`, inSchema ?? `${singular}Input`, singular, `Create ${singular.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`);
  get(`${base}/{id}`, tag, phase, `get${singular}`, singular, `Get ${singular.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`);
  if (!noPatch) patch(`${base}/{id}`, tag, phase, `update${singular}`, patchSchema ?? `${singular}Patch`, singular, `Update ${singular.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`);
  if (!noDelete) del(`${base}/{id}`, tag, phase, `delete${singular}`, `Delete ${singular.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`, [PRM('Id')], { accepted: deleteAccepted });
}
const V = '/api/v1';

// Health (03)
add('/healthz', 'get', { id: 'getLiveness', tag: 'Health', phase: '03', summary: 'Liveness probe', security: [], ok: { '200': json(S('HealthStatus')) } });
add('/readyz', 'get', { id: 'getReadiness', tag: 'Health', phase: '03', summary: 'Readiness probe (DB, queue, analytics engine)', security: [], ok: { '200': json(S('HealthStatus')) } });
add(`${V}/version`, 'get', { id: 'getVersion', tag: 'Health', phase: '03', summary: 'Build and API version', security: [], ok: { '200': json(S('VersionInfo')) } });
for (const p of ['/healthz', '/readyz']) for (const k of ['400', '401', '403', '429']) delete paths[p].get.responses[k];
for (const k of ['401', '403']) delete paths[`${V}/version`].get.responses[k];

// Auth/session (05)
get(`${V}/me`, 'Auth', '05', 'getMe', 'Me', 'Current principal, tenants and effective permissions', [], false);
add(`${V}/auth/logout`, 'post', { id: 'logout', tag: 'Auth', phase: '05', summary: 'Revoke the current session', description: 'Called by the BFF; clears the server-side session. The browser cookie is cleared by the BFF.', security: [{ bffSession: [] }, { bearerAuth: [] }], ok: { '204': R('NoContent') } });
list(`${V}/sessions`, 'Auth', '05', 'listSessions', 'Session', 'List my active sessions');
del(`${V}/sessions`, 'Auth', '05', 'revokeOtherSessions', 'Revoke all of my sessions except the current one', [], { ifMatch: false });
del(`${V}/sessions/{id}`, 'Auth', '05', 'revokeSession', 'Revoke one of my sessions', [PRM('Id')], { ifMatch: false });

// Tenants admin (04)
const adminNote = 'Platform administrators only (users.is_platform_admin). Tenant IDs appear in URLs only on admin routes.';
list(`${V}/admin/tenants`, 'Tenants (admin)', '04', 'adminListTenants', 'Tenant', 'List tenants', [filt('status'), filt('kind')]);
create(`${V}/admin/tenants`, 'Tenants (admin)', '04', 'adminCreateTenant', 'TenantCreate', 'Tenant', 'Create a tenant', { description: adminNote });
get(`${V}/admin/tenants/{id}`, 'Tenants (admin)', '04', 'adminGetTenant', 'Tenant', 'Get a tenant');
patch(`${V}/admin/tenants/{id}`, 'Tenants (admin)', '04', 'adminUpdateTenant', 'TenantAdminPatch', 'Tenant', 'Update or suspend a tenant');
del(`${V}/admin/tenants/{id}`, 'Tenants (admin)', '04', 'adminDeleteTenant', 'Schedule tenant deletion (pending_deletion → purge)', [PRM('Id')], { accepted: true });

// Settings (04)
get(`${V}/settings`, 'Settings', '04', 'getSettings', 'TenantSettings', 'Get tenant settings', []);
patch(`${V}/settings`, 'Settings', '04', 'updateSettings', 'TenantSettingsPatch', 'TenantSettings', 'Update tenant settings', []);

// IAM (05)
crud(`${V}/members`, 'Access', '05', 'Member', 'Members', { filters: [filt('status'), filt('source')], inSchema: 'MemberInput' });
crud(`${V}/roles`, 'Access', '05', 'Role', 'Roles', { filters: [filt('builtin', en(['true', 'false']))] });
crud(`${V}/data-scopes`, 'Access', '05', 'DataScope', 'DataScopes');
crud(`${V}/role-bindings`, 'Access', '05', 'RoleBinding', 'RoleBindings', { noPatch: true, filters: [filt('subject_type'), filt('subject_id'), filt('role_id')] });
list(`${V}/api-tokens`, 'Access', '05', 'listApiTokens', 'ApiToken', 'List API tokens (secrets never returned)', [filt('owner_id'), filt('revoked', en(['true', 'false']))]);
create(`${V}/api-tokens`, 'Access', '05', 'createApiToken', 'ApiTokenInput', 'ApiTokenCreated', 'Create an API token (secret returned once)');
get(`${V}/api-tokens/{id}`, 'Access', '05', 'getApiToken', 'ApiToken', 'Get API token metadata');
del(`${V}/api-tokens/{id}`, 'Access', '05', 'revokeApiToken', 'Revoke an API token', [PRM('Id')], { ifMatch: false });

// Hierarchy (04/11)
list(`${V}/hierarchy/versions`, 'Hierarchy', '04', 'listHierarchyVersions', 'HierarchyVersion', 'List hierarchy versions', [filt('status')]);
create(`${V}/hierarchy/versions`, 'Hierarchy', '04', 'createHierarchyVersion', 'HierarchyVersionCreate', 'HierarchyVersion', 'Create a draft hierarchy version');
get(`${V}/hierarchy/versions/{id}`, 'Hierarchy', '04', 'getHierarchyVersion', 'HierarchyVersion', 'Get a hierarchy version');
patch(`${V}/hierarchy/versions/{id}`, 'Hierarchy', '04', 'updateHierarchyVersion', 'HierarchyVersionPatch', 'HierarchyVersion', 'Update a draft hierarchy version');
action(`${V}/hierarchy/versions/{id}:publish`, 'Hierarchy', '11', 'publishHierarchyVersion', 'Publish a draft hierarchy version', { ifMatch: true, ok: { '200': json(S('HierarchyVersion'), 'OK', ETAG) } });
crud(`${V}/hierarchy/nodes`, 'Hierarchy', '04', 'HierarchyNode', 'HierarchyNodes', { filters: [filt('version_id', ID), filt('parent_id', ID), filt('node_type')] });

// Connectors (06–08, 12)
get(`${V}/connectors/templates/{provider}`, 'Connectors', '06', 'getOnboardingTemplate', 'OnboardingTemplate', 'Get least-privilege onboarding templates for a provider', [PRM('Provider')], false);
crud(`${V}/connectors`, 'Connectors', '06', 'Connector', 'Connectors', { filters: [filt('provider'), filt('status')], deleteAccepted: false });
action(`${V}/connectors/{id}:verify`, 'Connectors', '06', 'verifyConnector', 'Verify credentials and per-capability permissions', { description: 'Starts an asynchronous verification; results appear in GET /connectors/{id}/health and emit connector.verified.v1.', body: undefined });
action(`${V}/connectors/{id}:sync`, 'Connectors', '12', 'syncConnector', 'Trigger an immediate sync', { body: S('SyncRequest'), bodyRequired: false });
action(`${V}/connectors/{id}:backfill`, 'Connectors', '12', 'backfillConnector', 'Backfill billing periods', { body: S('BackfillRequest') });
get(`${V}/connectors/{id}/health`, 'Connectors', '12', 'getConnectorHealth', 'ConnectorHealth', 'Connector health, capability status and freshness', [PRM('Id')], false);
list(`${V}/connectors/{id}/scopes`, 'Connectors', '07', 'listConnectorScopes', 'CloudScope', 'List discovered cloud scopes (accounts, projects, subscriptions)', [filt('scope_type'), filt('status')], [PRM('Id')]);
paths[`${V}/connectors/{id}/scopes`].get.responses['404'] = R('NotFound');

// Imports & mappings (09)
list(`${V}/imports`, 'Imports', '09', 'listImports', 'Import', 'List file imports', [filt('status'), filt('mapping_id', ID)]);
add(`${V}/imports`, 'post', {
  id: 'createImport', tag: 'Imports', phase: '09', summary: 'Create a file import (pre-signed upload or multipart)',
  description: 'JSON body: returns 201 with a pre-signed `upload` target; after uploading call :start. multipart/form-data: the file is streamed directly and parsing starts (202 Operation). Safe parsing limits apply (FR-IMP-004).',
  params: [PRM('IdempotencyKey')],
  body: { content: { 'application/json': { schema: S('ImportInput') }, 'multipart/form-data': { schema: obj({ file: str({ contentMediaType: 'application/octet-stream' }), mapping_id: ID, connector_id: ID, billing_period: S('BillingPeriod') }, ['file', 'mapping_id']) } } },
  ok: { '201': json(S('Import'), 'Created (pre-signed upload)', { Location: H('Location') }), '202': R('Accepted') }, errors: [409, 413, 422],
});
get(`${V}/imports/{id}`, 'Imports', '09', 'getImport', 'Import', 'Get an import');
action(`${V}/imports/{id}:start`, 'Imports', '09', 'startImport', 'Start processing after a pre-signed upload completed');
crud(`${V}/mappings`, 'Imports', '09', 'Mapping', 'Mappings', { filters: [filt('key'), filt('status')], noDelete: true });
action(`${V}/mappings/{id}:validate`, 'Imports', '09', 'validateMapping', 'Dry-run a mapping against a sample import', { body: obj({ import_id: ID, sample_rows: int({ maximum: 1000, default: 100 }) }, ['import_id']), ok: { '200': json(obj({ valid: bool(), errors: arr(S('ProblemFieldError')), sample: arr(ANY_OBJ) }, ['valid'])) } });

// Ingestion (12)
list(`${V}/ingestion/runs`, 'Ingestion', '12', 'listIngestionRuns', 'IngestionRun', 'List ingestion runs', [filt('connector_id', ID), filt('status'), filt('trigger'), filt('billing_period', S('BillingPeriod'))]);
get(`${V}/ingestion/runs/{id}`, 'Ingestion', '12', 'getIngestionRun', 'IngestionRun', 'Get an ingestion run', [PRM('Id')], false);
action(`${V}/ingestion/runs/{id}:cancel`, 'Ingestion', '12', 'cancelIngestionRun', 'Cancel a queued or running ingestion run', { ok: { '200': json(S('IngestionRun')) } });
add(`${V}/ingestion/periods/{period}/diff`, 'get', { id: 'getPeriodDiff', tag: 'Ingestion', phase: '12', summary: 'Diff control totals between two versions of a billing period (restatements)', params: [PRM('BillingPeriodPath'), q('connector_id', ID, true), q('from_version', int({ minimum: 1 }), false, 'Defaults to the previous live version.'), q('to_version', int({ minimum: 1 }), false, 'Defaults to the current live version.')], ok: { '200': json(S('PeriodDiff')) }, errors: [404, 422] });

// Query (13)
add(`${V}/query`, 'post', {
  id: 'runQuery', tag: 'Query', phase: '13', summary: 'Execute a semantic query',
  description: 'The compiler always prepends tenant and ABAC predicates. Referencing a dimension the principal cannot see → 422/403. Uses the `query` rate-limit bucket.',
  body: S('SemanticQuery'), ok: { '200': json(S('QueryResult'), 'OK', rlHeaders) }, errors: [422],
});
add(`${V}/semantic/catalog`, 'get', { id: 'getSemanticCatalog', tag: 'Query', phase: '13', summary: 'Metrics, dimensions and limits visible to the principal', ok: { '200': json(S('SemanticCatalog')) } });

// Dashboards (14, 16)
crud(`${V}/dashboards`, 'Dashboards', '14', 'Dashboard', 'Dashboards', { filters: [filt('visibility'), filt('owner_id', ID)] });
list(`${V}/dashboards/{id}/widgets`, 'Dashboards', '14', 'listWidgets', 'Widget', 'List widgets of a dashboard', [], [PRM('Id')]);
create(`${V}/dashboards/{id}/widgets`, 'Dashboards', '14', 'createWidget', 'WidgetInput', 'Widget', 'Add a widget');
paths[`${V}/dashboards/{id}/widgets`].post.parameters.splice(1, 0, PRM('Id'));
const W = [PRM('Id'), PRM('WidgetId')];
get(`${V}/dashboards/{id}/widgets/{widget_id}`, 'Dashboards', '14', 'getWidget', 'Widget', 'Get a widget', W);
patch(`${V}/dashboards/{id}/widgets/{widget_id}`, 'Dashboards', '14', 'updateWidget', 'WidgetPatch', 'Widget', 'Update a widget', W);
del(`${V}/dashboards/{id}/widgets/{widget_id}`, 'Dashboards', '14', 'deleteWidget', 'Remove a widget', W);
crud(`${V}/saved-views`, 'Dashboards', '14', 'SavedView', 'SavedViews');
list(`${V}/dashboard-templates`, 'Dashboards', '16', 'listDashboardTemplates', 'DashboardTemplate', 'List dashboard templates');
get(`${V}/dashboard-templates/{key}`, 'Dashboards', '16', 'getDashboardTemplate', 'DashboardTemplate', 'Get a dashboard template', [PRM('TemplateKey')], false);

// Allocation (15)
crud(`${V}/allocation/rule-sets`, 'Allocation', '15', 'AllocationRuleSet', 'AllocationRuleSets', { filters: [filt('status')] });
action(`${V}/allocation/rule-sets/{id}:preview`, 'Allocation', '15', 'previewAllocationRuleSet', 'Preview allocation results for a period (no writes)', { body: S('AllocationPreviewRequest'), ok: { '200': json(S('AllocationPreview')), '202': R('Accepted') }, description: 'Returns 200 for small previews; may return 202 with an Operation for large periods.' });
action(`${V}/allocation/rule-sets/{id}:publish`, 'Allocation', '15', 'publishAllocationRuleSet', 'Publish a draft rule set and trigger re-allocation', { body: S('PublishRequest'), bodyRequired: false, ifMatch: true });
crud(`${V}/custom-dimensions`, 'Allocation', '15', 'CustomDimension', 'CustomDimensions');

// Budgets / forecasts / anomalies (17)
crud(`${V}/budgets`, 'Budgets & anomalies', '17', 'Budget', 'Budgets', { filters: [filt('owner_id', ID)] });
list(`${V}/forecasts`, 'Budgets & anomalies', '17', 'listForecasts', 'Forecast', 'List cached forecasts');
action(`${V}/forecasts`, 'Budgets & anomalies', '17', 'createForecast', 'Compute a forecast for a scope', { params: [], body: S('ForecastRequest'), ok: { '200': json(S('Forecast')), '202': R('Accepted') }, errors: [422] });
get(`${V}/forecasts/{id}`, 'Budgets & anomalies', '17', 'getForecast', 'Forecast', 'Get a forecast', [PRM('Id')], false);
list(`${V}/anomalies`, 'Budgets & anomalies', '17', 'listAnomalies', 'Anomaly', 'List anomalies', [filt('status'), PRM('From'), PRM('To')]);
get(`${V}/anomalies/{id}`, 'Budgets & anomalies', '17', 'getAnomaly', 'Anomaly', 'Get an anomaly');
patch(`${V}/anomalies/{id}`, 'Budgets & anomalies', '17', 'updateAnomaly', 'AnomalyPatch', 'Anomaly', 'Acknowledge, resolve or suppress an anomaly');

// Alerts (17, 32)
crud(`${V}/alert-channels`, 'Alerts', '17', 'AlertChannel', 'AlertChannels', { filters: [filt('type')] });
action(`${V}/alert-channels/{id}:test`, 'Alerts', '17', 'testAlertChannel', 'Send a test notification', { ok: { '200': json(S('Notification')) } });
list(`${V}/notifications`, 'Alerts', '32', 'listNotifications', 'Notification', 'List notification deliveries', [filt('channel_id', ID), filt('status'), filt('event_type')]);
get(`${V}/notifications/{id}`, 'Alerts', '32', 'getNotification', 'Notification', 'Get a notification delivery', [PRM('Id')], false);

// Finance (10, 18, 29, 30)
list(`${V}/fx/rate-sets`, 'Finance', '18', 'listFxRateSets', 'FxRateSet', 'List FX rate sets', [filt('source')]);
create(`${V}/fx/rate-sets`, 'Finance', '18', 'createFxRateSet', 'FxRateSetCreate', 'FxRateSet', 'Upload a tenant-specific FX rate set');
get(`${V}/fx/rate-sets/{id}`, 'Finance', '18', 'getFxRateSet', 'FxRateSet', 'Get an FX rate set', [PRM('Id')], false);
list(`${V}/fx/rate-sets/{id}/rates`, 'Finance', '18', 'listFxRates', 'FxRate', 'List rates in a rate set', [filt('base'), filt('quote'), PRM('From'), PRM('To')], [PRM('Id')]);
list(`${V}/commitments`, 'Finance', '18', 'listCommitments', 'Commitment', 'List commitments (RIs, savings plans, CUDs)', [filt('provider'), filt('type'), filt('active', en(['true', 'false']))]);
get(`${V}/commitments/{id}`, 'Finance', '18', 'getCommitment', 'Commitment', 'Get a commitment', [PRM('Id')], false);
list(`${V}/commitments/{id}/utilization`, 'Finance', '18', 'listCommitmentUtilization', 'CommitmentUtilizationPoint', 'Daily commitment utilization', [PRM('From'), PRM('To')], [PRM('Id')]);
crud(`${V}/unit-metrics`, 'Finance', '18', 'UnitMetric', 'UnitMetrics');
list(`${V}/unit-metrics/{id}/values`, 'Finance', '18', 'listUnitMetricValues', 'UnitMetricValue', 'List unit metric values', [PRM('From'), PRM('To'), filt('dimension_key')], [PRM('Id')]);
action(`${V}/unit-metrics/{id}/values`, 'Finance', '18', 'upsertUnitMetricValues', 'Upsert unit metric values (bulk)', { body: S('UnitMetricValuesUpsert'), ok: { '200': json(obj({ upserted: int() }, ['upserted'])) }, errors: [404, 413, 422] });
list(`${V}/invoices`, 'Finance', '10', 'listInvoices', 'Invoice', 'List invoices', [filt('provider'), filt('billing_account'), filt('status'), PRM('From'), PRM('To')]);
action(`${V}/invoices`, 'Finance', '10', 'importInvoice', 'Import an invoice (provider fetch, uploaded file, or structured data)', { params: [], idem: 'IdempotencyKeyRequired', body: S('InvoiceImportRequest'), ok: { '201': json(S('Invoice'), 'Created', { Location: H('Location') }), '202': R('Accepted') }, errors: [409, 413, 422] });
get(`${V}/invoices/{id}`, 'Finance', '10', 'getInvoice', 'Invoice', 'Get an invoice', [PRM('Id')], false);
list(`${V}/invoices/{id}/lines`, 'Finance', '10', 'listInvoiceLines', 'InvoiceLine', 'List invoice lines', [], [PRM('Id')]);
list(`${V}/reconciliations`, 'Finance', '10', 'listReconciliations', 'Reconciliation', 'List reconciliation results', [filt('invoice_id', ID), filt('status')]);
action(`${V}/reconciliations`, 'Finance', '10', 'runReconciliation', 'Reconcile an invoice against computed cost', { params: [], body: S('ReconciliationRequest'), errors: [409, 422] });
get(`${V}/reconciliations/{id}`, 'Finance', '10', 'getReconciliation', 'Reconciliation', 'Get a reconciliation result', [PRM('Id')], true);
action(`${V}/reconciliations/{id}/variances/{variance_id}:acknowledge`, 'Finance', '29', 'acknowledgeVariance', 'Acknowledge a reconciliation variance with a note', { params: [PRM('Id'), PRM('VarianceId')], body: S('VarianceAcknowledge'), ifMatch: true, ok: { '200': json(S('Reconciliation'), 'OK', ETAG) } });
list(`${V}/periods`, 'Finance', '30', 'listPeriods', 'AccountingPeriod', 'List accounting periods', [filt('status')]);
get(`${V}/periods/{id}`, 'Finance', '30', 'getPeriod', 'AccountingPeriod', 'Get an accounting period with close checklist');
action(`${V}/periods/{id}:close`, 'Finance', '30', 'closePeriod', 'Close an accounting period (immutable snapshot, WORM)', { idem: 'IdempotencyKeyRequired', ifMatch: true, body: S('PeriodCloseRequest'), bodyRequired: false, description: 'Creates a period snapshot and emits period.closed.v1. Later restatements are booked as adjustments in an open period.' });
action(`${V}/periods/{id}:reopen`, 'Finance', '30', 'reopenPeriod', 'Reopen a closed period (privileged, audited)', { idem: 'IdempotencyKeyRequired', ifMatch: true, body: S('PeriodReopenRequest') });

// Reports & exports (29, 30)
crud(`${V}/reports`, 'Reports', '29', 'Report', 'Reports');
list(`${V}/report-runs`, 'Reports', '30', 'listReportRuns', 'ReportRun', 'List report runs', [filt('definition_id', ID), filt('status')]);
action(`${V}/report-runs`, 'Reports', '30', 'createReportRun', 'Run a report', { params: [], idem: 'IdempotencyKeyRequired', body: S('ReportRunRequest'), errors: [409, 422] });
get(`${V}/report-runs/{id}`, 'Reports', '30', 'getReportRun', 'ReportRun', 'Get a report run with artifacts and signed manifest', [PRM('Id')], false);
list(`${V}/exports`, 'Reports', '29', 'listExports', 'Export', 'List exports', [filt('kind'), filt('status')]);
action(`${V}/exports`, 'Reports', '29', 'createExport', 'Start an export', { params: [], body: S('ExportRequest'), errors: [409, 422], description: 'Uses the `export` rate-limit bucket.' });
get(`${V}/exports/{id}`, 'Reports', '29', 'getExport', 'Export', 'Get an export', [PRM('Id')], false);

// Inventory (19, 20)
list(`${V}/resources`, 'Inventory', '19', 'listResources', 'Resource', 'List resources (current versions)', [filt('provider'), filt('connector_id', ID), filt('resource_type'), filt('region'), q('tag', str({ description: 'key=value' }))]);
get(`${V}/resources/{id}`, 'Inventory', '19', 'getResource', 'Resource', 'Get a resource', [PRM('Id')], false);
add(`${V}/resources/{id}/metrics`, 'get', { id: 'getResourceMetrics', tag: 'Inventory', phase: '20', summary: 'Utilization metrics for a resource', params: [PRM('Id'), q('metric', str({ description: 'Comma-separated metric keys, e.g. cpu_utilization,network_in.' })), q('from', TS, true), q('to', TS, true), q('grain', en(['hour', 'day'], { default: 'day' }))], ok: { '200': json(S('ResourceMetrics')) }, errors: [404, 422] });

// Recommendations (21–26)
list(`${V}/recommendations`, 'Recommendations', '21', 'listRecommendations', 'Recommendation', 'List recommendations', [filt('state'), filt('category'), filt('provider'), filt('risk'), filt('source'), q('min_net_monthly_savings', DEC)]);
get(`${V}/recommendations/{id}`, 'Recommendations', '21', 'getRecommendation', 'Recommendation', 'Get a recommendation');
action(`${V}/recommendations/{id}:transition`, 'Recommendations', '26', 'transitionRecommendation', 'Change recommendation lifecycle state', { body: S('RecommendationTransition'), ifMatch: true, ok: { '200': json(S('Recommendation'), 'OK', ETAG) } });
list(`${V}/recommendations/{id}/evidence`, 'Recommendations', '22', 'listRecommendationEvidence', 'RecommendationEvidence', 'List evidence backing a recommendation', [], [PRM('Id')]);
list(`${V}/recommendations/{id}/realized-savings`, 'Recommendations', '26', 'listRealizedSavings', 'RealizedSavings', 'List measured realized savings', [], [PRM('Id')]);

// AI (27, 28)
list(`${V}/ai/conversations`, 'AI', '27', 'listAiConversations', 'AiConversation', 'List my AI conversations');
create(`${V}/ai/conversations`, 'AI', '27', 'createAiConversation', 'AiConversationInput', 'AiConversation', 'Start a conversation');
get(`${V}/ai/conversations/{id}`, 'AI', '27', 'getAiConversation', 'AiConversation', 'Get a conversation', [PRM('Id')], false);
del(`${V}/ai/conversations/{id}`, 'AI', '27', 'deleteAiConversation', 'Delete a conversation', [PRM('Id')], { ifMatch: false });
list(`${V}/ai/conversations/{id}/messages`, 'AI', '27', 'listAiMessages', 'AiMessage', 'List messages', [], [PRM('Id')]);
add(`${V}/ai/conversations/{id}/messages`, 'post', {
  id: 'sendAiMessage', tag: 'AI', phase: '28', summary: 'Send a message; the assistant reply may stream via SSE',
  description: 'With `Accept: text/event-stream` and stream=true the reply is streamed as Server-Sent Events (see AiStreamEvent). Otherwise a single JSON AiMessage is returned. The assistant accesses data only through authorized tools with the user\'s permissions (FR-AI-002). Uses the `ai` rate-limit bucket. Returns 409 when AI is disabled for the tenant.',
  params: [PRM('Id'), PRM('IdempotencyKey')], body: S('AiMessageInput'),
  ok: { '200': { description: 'Assistant reply (JSON) or SSE stream.', headers: rlHeaders, content: { 'application/json': { schema: S('AiMessage') }, 'text/event-stream': { schema: str({ description: 'SSE stream; each frame carries an AiStreamEvent (`event:` name, JSON `data:`).' }), 'x-sse-event-schema': S('AiStreamEvent') } } } },
  errors: [404, 409, 422],
});

// Audit (04, 30)
list(`${V}/audit-events`, 'Audit', '04', 'listAuditEvents', 'AuditEvent', 'List audit events (hash-chained, append-only)', [filt('action'), filt('actor_id', ID), filt('target_type'), filt('target_id'), filt('outcome'), PRM('From'), PRM('To')]);
action(`${V}/audit-events:verify`, 'Audit', '30', 'verifyAuditChain', 'Verify the audit hash chain and anchors', { params: [], body: S('AuditVerifyRequest'), bodyRequired: false, ok: { '200': json(S('AuditVerification')), '202': R('Accepted') }, errors: [422] });

// Plugins admin (35)
list(`${V}/admin/plugins`, 'Plugins (admin)', '35', 'adminListPlugins', 'InstalledPlugin', 'List installed plugins (with SPDX license, informational)', [filt('kind'), filt('enabled', en(['true', 'false']))]);
create(`${V}/admin/plugins`, 'Plugins (admin)', '35', 'adminRegisterPlugin', 'PluginRegistration', 'InstalledPlugin', 'Register an out-of-process (gRPC) plugin from its manifest');
get(`${V}/admin/plugins/{id}`, 'Plugins (admin)', '35', 'adminGetPlugin', 'InstalledPlugin', 'Get an installed plugin');
patch(`${V}/admin/plugins/{id}`, 'Plugins (admin)', '35', 'adminUpdatePlugin', 'PluginPatch', 'InstalledPlugin', 'Enable or disable a plugin');

// Operations (12)
get(`${V}/operations/{id}`, 'Operations', '12', 'getOperation', 'Operation', 'Get a long-running operation', [PRM('Id')], false);
action(`${V}/operations/{id}:cancel`, 'Operations', '12', 'cancelOperation', 'Request cancellation of an operation', { ok: { '200': json(S('Operation')) } });

// ------------------------------------------------------------------ document
const tagDescriptions = {
  Health: 'Liveness, readiness and version (unauthenticated).',
  Auth: 'Current principal and sessions.',
  'Tenants (admin)': 'Platform-admin tenant management.',
  Settings: 'Tenant settings.',
  Access: 'Members, roles, data scopes (ABAC), role bindings and API tokens.',
  SCIM: 'SCIM 2.0 provisioning (Phase 31) is served at `/scim/v2/Users` and `/scim/v2/Groups` and follows RFC 7643/7644. It uses a per-IdP SCIM bearer token (securityScheme `scimBearer`) and is intentionally not re-specified here.',
  Hierarchy: 'Versioned business hierarchy (cost centers, teams…).',
  Connectors: 'Cloud provider connectors, verification, sync, backfill, health and scopes.',
  Imports: 'Generic file imports and column mappings.',
  Ingestion: 'Ingestion runs and restatement diffs.',
  Query: 'Semantic analytics query and catalog.',
  Dashboards: 'Dashboards, widgets, saved views and templates.',
  Allocation: 'Allocation rule sets and custom dimensions.',
  'Budgets & anomalies': 'Budgets, forecasts and anomalies.',
  Alerts: 'Alert channels and notification deliveries.',
  Finance: 'FX, commitments, unit metrics, invoices, reconciliation and period close.',
  Reports: 'Report definitions, runs and exports.',
  Inventory: 'Resource inventory and utilization metrics.',
  Recommendations: 'Evidence-backed recommendations and realized savings.',
  AI: 'Governed AI assistant (tool-only data access).',
  Audit: 'Hash-chained audit log.',
  'Plugins (admin)': 'Installed plugins and their manifests.',
  Operations: 'Long-running operations.',
};
const doc = {
  openapi: '3.1.0',
  info: {
    title: 'CloudLedger API',
    version: '0.0.0-draft',
    summary: 'REST API for CloudLedger, a source-available multi-cloud FinOps platform.',
    description: [
      '**DRAFT.** No implementation exists yet. This contract is refined phase by phase; every operation carries `x-phase` (the delivery phase from docs/phases).',
      '',
      'Conventions are defined in docs/contracts/API_GUIDELINES.md and are authoritative: base path `/api/v1`, snake_case JSON, UUIDv7 opaque IDs, RFC 3339 UTC timestamps,',
      '**money as `{amount: "<decimal string>", currency: "<ISO 4217>"}` (never a JSON number)**, RFC 9457 problem details, cursor pagination, `Idempotency-Key` on POST,',
      '`ETag`/`If-Match` optimistic concurrency, IETF RateLimit headers and `202 Accepted` + Operation for long-running work.',
      '',
      'The semantic query schema is shared with `schemas/semantic/query.v1.json` and plugin manifests with `schemas/manifest/plugin-manifest.v1.json` (resolved via relative `$ref`; bundle before codegen).',
      '',
      'SCIM 2.0 (`/scim/v2/Users`, `/scim/v2/Groups`, Phase 31) follows RFC 7644 and is not re-specified here.',
      '',
      '**Licensing:** CloudLedger is source-available (not open source). This specification is currently marked with the proposed CloudLedger Source-Available License 1.0. ',
      'Per OQ-22 / docs/legal/LICENSE_MAP.md, Option A (recommended, pending legal review) would license `api/openapi/` under Apache-2.0 to enable independently written clients; Option B keeps CL-SAL-1.0.',
      'The `docs.cloudledger.dev` and `dev.cloudledger` names are placeholders pending OQ-01.',
    ].join('\n'),
    license: { name: 'CloudLedger Source-Available License 1.0 (proposed draft)', identifier: 'LicenseRef-CloudLedger-SAL-1.0' },
  },
  servers: [{ url: 'https://cloudledger.example.invalid', description: 'Placeholder. Paths include the /api/v1 prefix; /healthz and /readyz are at the root.' }],
  security: [{ bearerAuth: [] }],
  tags: Object.entries(tagDescriptions).map(([name, description]) => ({ name, description, ...(name === 'SCIM' ? { externalDocs: { url: 'https://www.rfc-editor.org/rfc/rfc7644', description: 'RFC 7644 SCIM Protocol' } } : {}) })),
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT or API token', description: 'Either a short-lived (5–15 min) JWT access token issued to the BFF for a user session, or an automation API token `clt_<prefix>_<secret>` (scoped, expiring).' },
      bffSession: { type: 'apiKey', in: 'cookie', name: '__Host-cl_session', description: 'Browser ↔ Next.js BFF session cookie (HttpOnly, Secure, SameSite=Lax). Documented for completeness: the BFF exchanges it server-side for a bearer access token; API clients must use bearerAuth. No CORS by default (same-origin BFF).' },
      scimBearer: { type: 'http', scheme: 'bearer', description: 'Per-IdP SCIM token used only on /scim/v2/* (RFC 7644; not specified in this document).' },
    },
    parameters, headers, responses, schemas,
  },
};

const header = `# CloudLedger API — OpenAPI 3.1 contract (DRAFT, version 0.0.0-draft)
# Source of truth for the REST API (ADR-0011). Conventions: docs/contracts/API_GUIDELINES.md.
# Licensing: proposed CloudLedger Source-Available License 1.0 (LicenseRef-CloudLedger-SAL-1.0);
# OQ-22 Option A would relicense api/openapi/ under Apache-2.0. See docs/legal/LICENSE_MAP.md.
# CloudLedger is source-available, not open source.
`;
fs.writeFileSync(OUT, header + YAML.stringify(doc, { lineWidth: 0, aliasDuplicateObjects: false }));
let ops = 0; for (const p of Object.values(paths)) ops += Object.keys(p).length;
console.log(JSON.stringify({ paths: Object.keys(paths).length, operations: ops }));
