# Phase 05 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P05-R01 | OIDC SSO login (Authorization Code + PKCE). | FR-IAM-001 | M | P05-AC01 |
| P05-R02 | Built-in roles: platform admin, tenant owner, FinOps admin, finance manager, engineering manager, developer, auditor, viewer. | FR-IAM-004 | M | P05-AC02 |
| P05-R03 | Custom roles composed from granular permissions. | FR-IAM-005 | M | P05-AC03 |
| P05-R04 | ABAC: restrict data visibility by attributes (provider, account, project, subscription, hierarchy node, tag or dimension value). | FR-IAM-006 | M | P05-AC04 |
| P05-R05 | API tokens (personal and service) that are scoped, expiring, hashed at rest, and revocable. | FR-IAM-007 | M | P05-AC05 |
| P05-R06 | IdP group → role/scope mapping. | FR-IAM-008 | M | P05-AC06 |
| P05-R07 | Local password authentication only for the Lite bootstrap admin. Disable-able, with MFA (TOTP) when enabled. | FR-IAM-009 | S | P05-AC07 |
| P05-R08 | Session management: idle and absolute timeouts, revocation, device listing. | FR-IAM-010 | M | P05-AC08 |
