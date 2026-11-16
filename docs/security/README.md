# CloudLedger Security Documentation

> **Status: DRAFT design.** Nothing described in this folder is implemented. No application code exists yet. All controls are design targets to be ratified in Phase 02 and delivered by the phases cited next to each control. CloudLedger is **source-available** (see [`docs/legal/`](../legal/README.md)); it is not open source.

## Document map

| Document | Purpose | Primary IDs |
|---|---|---|
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | Authentication, sessions, API tokens, authorization overview, tenant isolation, encryption, federation, web security, logging, audit chain, rate limiting, plugin sandboxing, container hardening, ASVS mapping, privacy | `SEC-<AREA>-NN` |
| [THREAT_MODEL.md](THREAT_MODEL.md) | STRIDE per trust boundary and component, abuse cases, residual risk, verification | `T-NN` |
| [AUTHORIZATION_MODEL.md](AUTHORIZATION_MODEL.md) | Permission catalog, built-in roles, permission matrix, custom roles, ABAC predicate language, SQL compilation, Cedar policies, break-glass, test matrix | `AZ-NN`, `perm` strings |
| [SECRETS_AND_KEYS.md](SECRETS_AND_KEYS.md) | KEK/DEK hierarchy, KMS/Vault/file backends per profile, rotation, secret reference URIs, crypto-shredding | `KEY-NN` |
| [SUPPLY_CHAIN.md](SUPPLY_CHAIN.md) | SBOM, signing, SLSA provenance, CI scanners, dependency updates; links to license compliance | `SC-NN` |
| [../architecture/TRUST_BOUNDARIES.md](../architecture/TRUST_BOUNDARIES.md) | Trust zones, boundaries and data classification with handling rules | `TZ-N`, `TB-NN`, `DC-N` |
| [../architecture/LLM_SECURITY.md](../architecture/LLM_SECURITY.md) | LLM gateway, tool catalog, NL-to-semantic-query, prompt-injection defenses, AI evaluation suite | `LLM-NN` |
| [../../SECURITY.md](../../SECURITY.md) | Vulnerability reporting policy | — |

## Security principles

These principles are binding for every phase. A design or code change that violates one requires an ADR.

| ID | Principle | What it means in practice | Primary sources |
|---|---|---|---|
| SP-01 | **Tenant isolation is enforced in depth** | Every path (API, SQL, analytics, object storage, cache, job, AI, logs) carries a tenant context; at least two independent layers enforce it (application filter + RLS / row policy / prefix). Cross-tenant lookups return 404. | ADR-0003, [TENANCY.md](../architecture/TENANCY.md), NFR-SEC-001 |
| SP-02 | **Default deny** | Authorization decisions are deny unless a policy permits. Unknown permissions, unmapped endpoints and empty data scopes deny. | ADR-0008 |
| SP-03 | **Least privilege everywhere** | Read-only cloud integrations; non-owner DB roles without `BYPASSRLS`; per-run-mode service accounts; tokens scoped to a subset of the owner's permissions; plugins receive only connector-scoped short-lived credentials. | FR-CON-004, ADR-0009, ADR-0012 |
| SP-04 | **No standing platform-admin data access** | Platform admins manage tenants but cannot read tenant data without a time-boxed, justified, audited break-glass grant. | TENANCY §1, AUTHORIZATION_MODEL §9 |
| SP-05 | **Keyless first, secrets by reference** | Cloud access uses federation; any unavoidable static secret is a reference to an external store or an envelope-encrypted value. Plaintext secrets are never persisted or logged. | ADR-0009, NFR-SEC-003 |
| SP-06 | **Untrusted data stays data** | Billing rows, tags, resource names, file contents, webhook responses and LLM output are untrusted. They are never interpreted as code, SQL, templates, URLs to fetch, or instructions. | ADR-0013, INGESTION_PIPELINE §6 |
| SP-07 | **AI has no more power than its user** | The model calls only allow-listed read-only tools, executed with the requesting user's permissions and data scope; it never produces executed SQL; the only write (report draft) requires explicit user confirmation outside the model. | ADR-0013, FR-AI-002/003/007 |
| SP-08 | **Tamper evidence for security and financial actions** | Security-relevant and financial actions are written to a hash-chained, append-only audit log in the same transaction as the change, with external WORM anchors. | ADR-0014, FR-AUD-001 |
| SP-09 | **Secure by default, configurable by operators** | Defaults are the safe choice (AI off, SSRF protection on, TLS on externally, local password off outside Lite bootstrap). Weakening a default is explicit, logged and visible in the admin UI. | — |
| SP-10 | **Verifiable supply chain** | Every release artifact is built in CI, signed, carries an SBOM and provenance, and passes license policy. | NFR-SEC-005, NFR-LIC-001/002 |
| SP-11 | **Privacy by minimization** | Personal data is limited to identity attributes needed for login and audit; PII in billing data (tags, names) is treated as confidential; data subject export/erasure is supported; AI egress is minimized by policy. | NFR-PRIV-001, FR-AI-008 |
| SP-12 | **Security is tested, not asserted** | Every control lists a verifying test or phase. Test results are recorded in phase `TEST_RESULTS.md` as `NOT RUN` until executed. | CLAUDE_MASTER_PROMPT quality bar |

## ID conventions

| Prefix | Meaning | Defined in |
|---|---|---|
| `SP-NN` | Security principle | this file |
| `SEC-<AREA>-NN` | Security architecture control (areas: `AUTHN`, `SESS`, `TOK`, `S2S`, `ISO`, `TLS`, `ENC`, `FED`, `WEB`, `SSRF`, `UPL`, `LOG`, `AUD`, `RATE`, `PLG`, `K8S`, `PRIV`) | SECURITY_ARCHITECTURE.md |
| `T-NN` | Threat | THREAT_MODEL.md |
| `AZ-NN` | Authorization rule | AUTHORIZATION_MODEL.md |
| `KEY-NN` | Key-management or secret-handling control | SECRETS_AND_KEYS.md |
| `SC-NN` | Supply-chain control | SUPPLY_CHAIN.md |
| `TZ-N`, `TB-NN`, `DC-N` | Trust zone, trust boundary, data class | TRUST_BOUNDARIES.md |
| `LLM-NN` | LLM/AI security control | LLM_SECURITY.md |

Phase documents (`docs/phases/phase-XX/REQUIREMENTS.md`, `TEST_PLAN.md`) should trace their security requirements and test cases to these IDs.

## Phase map (security deliverables)

| Phase | Security deliverables |
|---|---|
| 02 | Ratify this design and the ADRs; DPIA input to Phase 01 output |
| 03 | CI security scanners, secret scanning, pinned actions, SBOM baseline, license CI (SC-*) |
| 04 | RLS, DB roles, tenant context, audit hash chain, isolation tests (SEC-ISO-*, SEC-AUD-*) |
| 05 | OIDC via BFF, sessions, API tokens, RBAC/ABAC, Cedar, authorization matrix (SEC-AUTHN/SESS/TOK, AZ-*) |
| 06–08 | Cloud federation and confused-deputy protections (SEC-FED-*) |
| 09 | File upload hardening (SEC-UPL-*) |
| 13 | Analytics predicate injection, ClickHouse row policies, engine isolation tests |
| 16, 29 | Dashboard sharing and export authorization, formula-injection neutralization |
| 17, 32 | Webhook signing and SSRF protections (SEC-SSRF-*) |
| 27–28 | LLM gateway and AI evaluation suite (LLM-*) |
| 30 | Audit search/export, WORM anchors, period-close immutability |
| 31 | SAML, SCIM, back-channel logout, SIEM streaming, custom policies |
| 33 | Key rotation runbooks, backup encryption, crypto-shredding verification |
| 34 | ASVS L2 assessment, external penetration test |
| 35–36 | Plugin sandboxing and plugin signature verification (SEC-PLG-*) |
| 38 | Release gate: signed artifacts, SBOM, provenance, zero open critical/high findings |

## Open security questions

| ID | Question | Proposed default |
|---|---|---|
| SQ-01 | ASVS version: PRD NFR-SEC-002 cites ASVS 4.0; ASVS 5.0.0 was published in 2025. | Map to 4.0.3 now (this doc); re-map to 5.0 at Phase 34 start. |
| SQ-02 | Two-person approval for break-glass in self-hosted single-tenant deployments. | Required in multi-tenant deployments; optional (default on) when a deployment has one tenant. |
| SQ-03 | Audit-log retention vs. tenant purge (7-year audit retention vs. crypto-shredding on deletion). | Audit rows are retained with PII fields crypto-shredded; see SECRETS_AND_KEYS §7. Needs legal confirmation. |
| SQ-04 | Whether CloudLedger operates its own OIDC workload-identity issuer for GCP/Azure federation. | Yes for SaaS/HA (SECURITY_ARCHITECTURE §7); optional for self-hosted. |
