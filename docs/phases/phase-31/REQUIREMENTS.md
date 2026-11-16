# Phase 31 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P31-R01 | MSP mode: a parent organization can manage child tenants without seeing their data unless explicitly delegated. (Feature available in the codebase. Operating it for external customers requires a commercial license. Internal multi-tenant use across Affiliates is free.) | FR-TEN-005 | S | P31-AC01 |
| P31-R02 | SAML 2.0 SP support. | FR-IAM-002 | M | P31-AC02 |
| P31-R03 | SCIM 2.0 user and group provisioning. | FR-IAM-003 | S | P31-AC03 |
| P31-R04 | Custom roles composed from granular permissions. | FR-IAM-005 | M | P31-AC04 |
| P31-R05 | IdP group → role/scope mapping. | FR-IAM-008 | M | P31-AC05 |
| P31-R06 | Optional streaming of audit events to a SIEM (webhook, syslog, OTLP logs). | FR-AUD-003 | S | P31-AC06 |
