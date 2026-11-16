# Phase 02 — Architecture, ADRs, extension contracts [LIC: ADR-0015, license map]: Requirements

Status: **NOT STARTED** · Release: v0.1 · Owner: TBD

Priority: **M** = must (phase exit blocker), **S** = should, **C** = could. Acceptance IDs refer to [ACCEPTANCE.md](ACCEPTANCE.md); tests to [TEST_PLAN.md](TEST_PLAN.md).

## Architecture and decision requirements

| ID | Requirement | Traces to | Pri | Verified by | Tests |
|---|---|---|---|---|---|
| P02-R01 | ADR-0001…0014, 0016 and 0017 are each reviewed against the ADR review checklist (context, alternatives, consequences, NFR impact, testability) and set to Accepted, Rejected or Superseded, with deciders and date. | ADR-0001…0017, NFR-* | M | P02-AC01 | TC01, TC02 |
| P02-R02 | ADR-0015 (source-available licensing) is reviewed by qualified counsel before it can be Accepted. Without recorded counsel review it remains "Proposed (requires legal review)", and that state is not a Phase 02 failure if it is recorded with an owner and date. | ADR-0015, OQ-21, AC-11 | M | P02-AC02 | TC03 |
| P02-R03 | Architecture documents (SYSTEM_CONTEXT, DATA_FLOW, DEPLOYMENT_PROFILES, TENANCY, DATABASE_SCHEMA, ANALYTICS_ADAPTERS, INGESTION_PIPELINE, FOCUS_NORMALIZATION, ALLOCATION_ENGINE, FINANCE_RECONCILIATION, FORECASTING_ANOMALIES, RECOMMENDATION_ENGINE, RESOURCE_INVENTORY, LLM_SECURITY, TRUST_BOUNDARIES) are reviewed and marked RATIFIED, or remain DRAFT with listed blockers and owning phase. | FR-* (design), NFR-* | M | P02-AC03 | TC04 |
| P02-R04 | Module boundary rules (SYSTEM_CONTEXT §module dependency rules) and the extended `internal/` module list are ratified as input to Phase 03 import-lint. | ADR-0001, NFR-MNT-001 | M | P02-AC03 | TC05 |
| P02-R05 | Architecture-related open questions are confirmed into ADRs: OQ-05 → ADR-0005, OQ-06 → ADR-0008, OQ-14 → ADR-0012, OQ-02 default reaffirmed in ADR-0006 (re-check at Phase 11), OQ-15 decided (architecture supports multi-tenant SaaS and region pinning; operating a public SaaS is out of scope for v1.0; third-party SaaS/MSP operation requires a commercial license). | OQ-02, 05, 06, 14, 15 | M | P02-AC04 | TC06 |
| P02-R06 | Deployment profiles are ratified with OQ-03 (Lite first) and profile-level RPO/RTO consistent with NFR-AVL-001. | FR-OPS-001, NFR-AVL-001, OQ-03 | S | P02-AC03 | TC04 |
| P02-R07 | ADR numbers 0018 (migration tool) and 0019 (decimal library) are reserved as Proposed stubs for Phase 03. | ADR-0007, DATABASE_SCHEMA conventions | S | P02-AC01 | TC02 |

## Security requirements

| ID | Requirement | Traces to | Pri | Verified by | Tests |
|---|---|---|---|---|---|
| P02-R08 | The threat model is reviewed per trust boundary TB-01…TB-12 with STRIDE; every threat (T-NN) has a mitigation, a verifying phase and a residual-risk rating; abuse cases (cross-tenant composite, confused deputy, malicious uploads, export and AI exfiltration) are covered. The security lead accepts residual risk in writing. | NFR-SEC-001…005, AC-02, AC-06 | M | P02-AC05 | TC07, TC08 |
| P02-R09 | SECURITY_ARCHITECTURE (SEC-*) and AUTHORIZATION_MODEL (AZ-*, permission catalog, built-in roles, ABAC grammar, Cedar policies, break-glass) are reviewed; every control maps to a delivering phase; ASVS 4.0 L2 (L3 for authn/session/audit) mapping is present. | NFR-SEC-002, FR-IAM-004…006, AC-03 | M | P02-AC05 | TC09 |
| P02-R10 | DATABASE_SCHEMA design-review findings F-01…F-09 ([DESIGN.md §4](DESIGN.md#4-design-review-findings-to-resolve-before-phase-04)) are corrected in the document, or explicitly assigned to Phase 04/05 DESIGN with a resolution. In particular: every tenant-owned table follows the composite-key and forced-RLS convention or has a documented exception. | ADR-0003, ADR-0014, NFR-SEC-001, FR-AUD-001 | M | P02-AC06 | TC10, TC11 |

## Contract requirements

| ID | Requirement | Traces to | Pri | Verified by | Tests |
|---|---|---|---|---|---|
| P02-R11 | API conventions are frozen at level `frozen-v0.1`: base path, money-as-string, RFC 9457 errors and code list, cursor pagination, filtering, `Idempotency-Key`, ETag/If-Match, rate-limit headers, LRO Operation resource, versioning/deprecation, freshness `meta`. Changes after the freeze require a CHANGELOG entry and contract-owner approval. | ADR-0011, NFR-CMP-001 | M | P02-AC07 | TC12 |
| P02-R12 | The OpenAPI skeleton lints clean; every operation has `x-phase` and permission documentation; `x-phase` values are consistent with the phase index and phase plans (conflicts in [DESIGN.md §5](DESIGN.md#5-contract-freeze-decisions) resolved). | ADR-0011, API_GUIDELINES §13 | M | P02-AC07 | TC13, TC14 |
| P02-R13 | The event envelope (CloudEvents 1.0 JSON, `tenantid` and `traceparent` extensions, `dev.cloudledger.<type>.vN` naming pending OQ-01, at-least-once, idempotency keys) is frozen at `frozen-v0.1`; the event catalog's phase column is corrected for events produced earlier than listed (Phase 06 pipeline). | ADR-0005, EVENTS.md | M | P02-AC07 | TC15 |
| P02-R14 | Provider SDK interfaces (PROVIDER_SDK.md), capability manifest and compatibility policy are reviewed and frozen at level `draft-v0`: first-party providers may extend additively; freeze to v1 happens in Phase 35. Rules "read-only providers", "no DB access", "classified errors" and "determinism" are ratified. | FR-SDK-001, FR-CON-001, FR-CON-004, ADR-0012, NFR-CMP-001 | M | P02-AC08 | TC16 |

## Licensing requirements [LIC]

| ID | Requirement | Traces to | Pri | Verified by | Tests |
|---|---|---|---|---|---|
| P02-R15 | LICENSE_MAP designations are confirmed: core paths `LicenseRef-CloudLedger-SAL-1.0`; Plugin Interfaces (`sdk/*` interfaces and testkits, `api/openapi`, `schemas/events`, `schemas/focus`, `providers/examples`) Option A or B per OQ-22 on counsel's recommendation. If counsel has not answered, the default (core license everywhere, switch prepared) is recorded with an owner and deadline before Phase 35. | OQ-22, NFR-LIC-002, LQ-5 | M | P02-AC09 | TC17 |
| P02-R16 | PLUGIN_LICENSING rules and the import boundary rule (permissive paths never import core) are reviewed and confirmed as Phase 03 CI input; capability manifests' `license` field stays informational (no runtime enforcement, NFR-LIC-004). | NFR-LIC-004, LICENSE_MAP rule 3, CAPABILITY_MANIFEST rule 1 | M | P02-AC09 | TC18 |
| P02-R17 | All Phase 02 outputs describe CloudLedger as source-available, never as open source or OSI-approved; architecture introduces no license keys, feature gating or usage limits (operational quotas are documented as non-license protections). | ADR-0015, NFR-LIC-004 | M | P02-AC10 | TC19, TC20 |

## Documentation quality

| ID | Requirement | Traces to | Pri | Verified by | Tests |
|---|---|---|---|---|---|
| P02-R18 | Markdown lint, link check, ADR status lint (no ADR left Proposed without a recorded reason) and ID uniqueness pass across `docs/architecture`, `docs/contracts`, `docs/security`, `docs/legal`. | NFR-MNT-001 (docs) | M | P02-AC10 | TC21, TC22, TC23 |
