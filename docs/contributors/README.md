# Contributor Guide

Status: **DRAFT plan**. The repository currently contains planning and architecture documents only. The development environment, `make` targets, CI and code layout described here are **planned for Phase 03** and do not exist yet. Until then, contributions are limited to documentation review ([CONTRIBUTING.md](../../CONTRIBUTING.md)). Contributor documentation is finalized in Phase 37 (external contributor walkthrough).

CloudLedger is **source-available**, not open source. Contributions are accepted under the [CLA](../../CLA.md) with DCO sign-off. License rules for files, dependencies and plugins are defined in [docs/legal](../legal/README.md); this guide links to them rather than restating them.

## Start here

| Document | Read it when you want to… |
|---|---|
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | understand the CLA, DCO, PR definition of done and how work is organized |
| [REPOSITORY_LAYOUT.md](REPOSITORY_LAYOUT.md) | find where code, tests, schemas and docs will live and which module boundaries apply |
| [DEVELOPMENT.md](DEVELOPMENT.md) | set up local development (planned: Docker Compose, `make` targets, test commands) |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | write Go, TypeScript and SQL that passes review and CI |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | know which tests a change needs and how CI gates merges and releases |
| [docs/phases](../phases/README.md) | pick work in the current phase and see its acceptance criteria |
| [docs/architecture](../architecture/README.md) and [ADRs](../architecture/adr/README.md) | understand the design before changing it |
| [docs/contracts](../contracts/README.md) | change an API, event, SDK or capability manifest |
| [docs/operations](../operations/README.md) | add metrics, config keys, migrations or runbooks |
| [docs/legal/LICENSE_COMPLIANCE.md](../legal/LICENSE_COMPLIANCE.md), [LICENSE_MAP.md](../legal/LICENSE_MAP.md), [PLUGIN_LICENSING.md](../legal/PLUGIN_LICENSING.md) | add a dependency, a new file, or a connector/plugin |

## Contribution paths

| Path | Typical change | Extra requirements |
|---|---|---|
| Documentation | fix or clarify docs | none beyond review |
| Bug fix | code + regression test | test that fails before the fix |
| Feature in a phase | per phase `IMPLEMENTATION.md` task (`PXX-T##`) | tests traced to `PXX-TC##`, phase docs updated |
| Financial logic (`internal/billing`, `finance`, `allocation`, `database/**`) | calculation or schema | golden-dataset tests, `finance-correctness` owner approval ([GOVERNANCE.md](../../GOVERNANCE.md)) |
| Security-sensitive (`identity`, `authz`, `ai`, `deploy/**`) | authn/z, AI, deployment | positive and negative authorization tests, `security` owner approval |
| Provider connector (in-tree) | `providers/<name>` | provider compatibility suite, capability manifest, fixtures ([PLUGIN_LICENSING.md §2](../legal/PLUGIN_LICENSING.md#2-in-tree-contribution-rules)) |
| Architecture change | new pattern, dependency or boundary | ADR first ([adr/template.md](../architecture/adr/template.md)) |

## Ground rules (summary)

1. Synthetic data only. Never commit real billing data, account IDs, credentials or customer names.
2. Tests accompany code, including negative and cross-tenant cases.
3. Money is decimal, never floating point (ADR-0007).
4. Every query is tenant-scoped through the provided context and semantic layer; no hand-written cross-tenant SQL.
5. Never report test results that were not actually run. Phase `TEST_RESULTS.md` entries stay `NOT RUN` until executed.
6. Security issues go to [SECURITY.md](../../SECURITY.md), never to public issues.
