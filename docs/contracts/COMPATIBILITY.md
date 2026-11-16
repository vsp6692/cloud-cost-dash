# Compatibility and Versioning Policy

| Surface | Versioning | Compatibility promise (from v1.0) |
|---|---|---|
| Product releases | SemVer `MAJOR.MINOR.PATCH` | Patch = fixes only. Minor = additive. Major = breaking, with migration guide. |
| REST API | URL major (`/api/v1`) | Additive within v1. v1 supported ≥ 12 months after v2 GA. Deprecations via `Deprecation`/`Sunset` headers ≥ 2 minors ahead. |
| OpenAPI document | follows product version | `info.version` = product version. Diff checked in CI (`oasdiff`) to block breaking changes. |
| Events | type suffix `.vN` | additive within N. Dual-publish on bump. |
| Provider / recommendation / pricing / dashboard SDK | independent SemVer (`sdk/v1`) | Go module major versioning. gRPC protocol version negotiated in the handshake. Plugins built for SDK 1.x work on all CloudLedger 1.x. |
| Capability manifest | `apiVersion: …/v1` | strict schema. New optional fields in minor versions. |
| Database schema | migration sequence | Forward-only, expand/contract. N-1 binary compatible with N schema during rolling upgrades. Downgrade = restore from backup (documented). |
| Analytics schema | adapter migrations + FOCUS mapping versions | Re-normalization jobs for mapping changes. Old mapping versions kept. |
| Configuration keys | documented per release | Renamed keys keep an alias for ≥ 2 minor releases with a startup warning. |
| Helm chart | chart SemVer | `values.yaml` changes documented in chart CHANGELOG. |

Pre-1.0 (v0.x): breaking changes are allowed in minor releases but must be listed in CHANGELOG under **Breaking**.

Supported upgrade paths: from the previous minor (N-1 → N) directly. Skipping minors requires sequential upgrades unless release notes state otherwise.

Licensing note: compatibility promises are technical commitments. They do not change the license terms applicable to each release (stated in that release's `LICENSE.md`).
