# Licensing Rules for Connectors and Plugins

Status: **PROPOSED, pending legal review (LQ-5, OQ-22)**. Applies to provider connectors, recommendation rules, pricing sources and dashboard widgets.

## 1. Two kinds of plugins

| | **In-tree** (contributed to the CloudLedger repository) | **Out-of-tree** (published separately by its author) |
|---|---|---|
| Location | `providers/<name>`, `internal/recommendations/rules/...`, etc. | author's own repository or registry |
| License | CL-SAL-1.0 (the plugin becomes part of CloudLedger) | **author's choice**, subject to §3 |
| CLA | **Required** | Not required |
| Copyright | Contributor keeps copyright; Licensor receives CLA rights | Author |
| Included in commercial licenses | Yes | Only with the author's permission |
| Maintenance | Project maintainers (with CODEOWNERS from contributors) | Author |
| Listing in plugin catalog | Automatic once merged | Optional; requires §4 checks |

## 2. In-tree contribution rules
1. A signed CLA (individual or corporate) is required before merge (CI check `cla/required`).
2. All files carry the SPDX header `LicenseRef-CloudLedger-SAL-1.0`.
3. New dependencies must pass the [third-party license policy](LICENSE_COMPLIANCE.md).
4. No code copied from other projects unless its license is on the allow-list and the source is attributed in the PR and in `THIRD_PARTY_NOTICES`.
5. Provider SDK clients (e.g. a cloud vendor's Go SDK) must be allow-listed licenses (most are Apache-2.0 or MIT).

## 3. Out-of-tree plugin rules
1. Build only against the **Plugin Interfaces** (SDK interfaces, IDL, schemas and testkits; see [LICENSE_MAP.md](LICENSE_MAP.md)). Do not copy CloudLedger core source code into the plugin.
2. Do not bundle or redistribute CloudLedger itself with the plugin. Distributing CloudLedger requires a commercial license.
3. Declare the plugin's license in its capability manifest (`license` field, SPDX expression) and in a `LICENSE` file.
4. Plugin authors may license and, subject to legal confirmation, sell their plugins. Users of the plugin need their own right to use CloudLedger (free for internal use).
5. Naming must follow the [Trademark Policy](../../TRADEMARK_POLICY.md), e.g. "Example Cloud connector for CloudLedger".
6. A plugin that substantially reproduces CloudLedger functionality from CloudLedger source code is a Derivative Product, not a plugin.

## 4. Plugin catalog requirements (Phase 35–37)
To be listed in the community catalog, a plugin must have:
- a valid capability manifest, including `license` (SPDX) and a source repository URL;
- a passing SDK compatibility suite for the declared CloudLedger API version;
- a dependency license report (SBOM with licenses);
- no restricted dependency licenses that would prevent users from running it alongside CloudLedger internally (catalog listing is informational; users remain responsible for their own compliance);
- security disclosures contact.

## 5. Runtime behavior
CloudLedger displays each installed plugin's declared license on the admin **Plugins** page and in the plugin manifest validation log. This is informational only. CloudLedger does **not** enforce licenses through license keys or usage limits (see NFR-LIC-004).
