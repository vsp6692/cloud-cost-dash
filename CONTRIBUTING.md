# Contributing to CloudLedger

Thanks for your interest in CloudLedger. Fixes, features, documentation, tests, and new cloud provider connectors and plugins are all welcome.

> **Project status:** pre-alpha. The repository currently contains planning and architecture documentation only. Development tooling (`make`, CI, local dev environment) arrives in Phase 03. Until then, contributions are limited to documentation review.

## 1. Licensing of contributions (please read first)

CloudLedger is **source-available**, not OSI open source. It is distributed under the proposed [CloudLedger Source-Available License](LICENSE.md) (draft, pending legal review), and the Licensor also offers [commercial licenses](COMMERCIAL_LICENSE.md) for redistribution and third-party hosting.

For the Licensor to distribute your work under both, every contributor must:

1. **Sign the [Contributor License Agreement (CLA)](CLA.md).** A bot prompts you on your first pull request. If your employer owns your work, ask them to sign the **Corporate CLA** (provided by the Licensor on request).
2. **Sign off each commit** with the Developer Certificate of Origin: `git commit -s` adds `Signed-off-by: Your Name <email>`.

What this means for you:
- **You keep the copyright** in your contribution.
- You grant the Licensor a perpetual license, **including the right to relicense and sublicense** your contribution under the source-available license and commercial licenses.
- You grant a patent license for your contribution (with defensive termination).
- You confirm the contribution is your original work, or that you have the right to submit it, and you disclose any third-party code and its license.
- Contributing does **not** give you commercial redistribution or hosting rights. Those require a commercial license.

Questions: see the [License FAQ](LICENSE_FAQ.md).

## 2. Connectors and plugins

| You want to… | Rules |
|---|---|
| Add a connector or plugin **to this repository** | CLA required. Licensed under CL-SAL-1.0. Must pass the SDK compatibility suite. Follows the [plugin licensing rules](docs/legal/PLUGIN_LICENSING.md#2-in-tree-contribution-rules). |
| Publish a connector or plugin **in your own repository** | Choose your own license. Build only against the Plugin Interfaces. Don't bundle CloudLedger. Declare `license` in the manifest. Follow the [Trademark Policy](TRADEMARK_POLICY.md) for naming. See [out-of-tree rules](docs/legal/PLUGIN_LICENSING.md#3-out-of-tree-plugin-rules). |

## 3. Third-party code and dependencies
- New dependencies must comply with the [third-party license policy](docs/legal/LICENSE_COMPLIANCE.md). **GPL, AGPL, SSPL, BUSL, non-commercial and unlicensed code are not accepted.**
- Do not paste code from Stack Overflow, other projects or AI tools unless you can confirm its license is allow-listed and you attribute it in the PR description.
- Every new source file needs an SPDX header (see [LICENSE_MAP.md](docs/legal/LICENSE_MAP.md)):
  ```go
  // SPDX-License-Identifier: LicenseRef-CloudLedger-SAL-1.0
  ```
- CI enforces all of the above. A failed `license-compliance`, `reuse`, `cla` or `dco` check blocks merge.

## 4. How we work
- **Phased roadmap.** Work is organized into 40 phases ([docs/phases](docs/phases/README.md)). Pick issues labeled with the current phase, or `good first issue`.
- **Discuss first** for anything larger than a bug fix: open an issue or a design discussion. Architectural changes need an ADR ([docs/architecture/adr](docs/architecture/adr/README.md)).
- **Small, reviewable PRs.** One logical change per PR, with tests and docs.
- **Definition of done** (per PR):
  - [ ] Tests added or updated (unit + integration/contract where relevant, including negative cases)
  - [ ] `make lint test` passes locally (from Phase 03)
  - [ ] Docs updated (API docs, phase docs, CHANGELOG `Unreleased` section)
  - [ ] No secrets, credentials or real customer billing data (use synthetic fixtures only)
  - [ ] Security implications described in the PR template
  - [ ] CLA signed and commits signed off
- **Financial correctness.** Changes to cost calculations require golden-dataset tests and reviewer sign-off from a `finance-correctness` code owner.
- **Security.** Never report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).

## 5. Development setup
Delivered in Phase 03 ([docs/contributors/DEVELOPMENT.md](docs/contributors/DEVELOPMENT.md)). Planned prerequisites: Go (pinned in `go.mod`), Node.js LTS + pnpm, Docker, `make`.

## 6. Coding standards and tests
See [docs/contributors/CODING_STANDARDS.md](docs/contributors/CODING_STANDARDS.md) and [docs/contributors/TESTING_STRATEGY.md](docs/contributors/TESTING_STRATEGY.md).

## 7. Code of Conduct
Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## 8. Governance
Decision-making, maintainer roles and the Licensor's role in licensing and trademarks are described in [GOVERNANCE.md](GOVERNANCE.md).
