# Security Policy

> **Status:** pre-alpha. No releases exist yet. This policy applies from the first published release.

## Reporting a vulnerability
**Do not open public issues for security problems.**

- Preferred: GitHub **Private Vulnerability Reporting** (Security → Report a vulnerability) on the official repository.
- Alternative: **[security contact: TO BE COMPLETED]** (PGP key to be published).

Please include affected version/commit, deployment profile, reproduction steps, impact, and whether the issue involves **cross-tenant data access**, **credential exposure**, **financial data integrity** or **AI/LLM authorization bypass**. These categories are treated as at least High severity.

## Our commitments
| Step | Target |
|---|---|
| Acknowledge report | 3 business days |
| Initial triage and severity (CVSS 4.0) | 7 business days |
| Fix for Critical | 30 days |
| Fix for High | 60 days |
| Coordinated disclosure | after fix release, or 90 days, whichever comes first, by mutual agreement |

We will credit reporters who wish to be credited. A bug-bounty program is not currently offered.

## Supported versions
Before v1.0, only the latest pre-release is supported. From v1.0, the latest minor and the previous minor receive security fixes (see the support policy produced in Phase 40).

## Scope
In scope: CloudLedger source code, official container images, Helm charts and deployment templates in this repository.
Out of scope: third-party plugins not maintained in this repository, customer deployment misconfiguration, and vulnerabilities in upstream dependencies already publicly disclosed (report those upstream; we track them via Dependabot or Renovate and Trivy).

## Security design
See [docs/security/](docs/security/README.md) for the security architecture, threat model and authorization model.

## Safe harbor
We will not pursue legal action against good-faith research that follows this policy, avoids privacy violations and service disruption, and does not access other tenants' data beyond what is needed to demonstrate the issue. *(Safe-harbor wording to be reviewed by counsel.)*
