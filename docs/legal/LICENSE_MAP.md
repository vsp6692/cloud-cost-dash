# License Map (which license applies where)

Status: **PROPOSED, pending legal review (OQ-22)**.

| Path | Proposed license | SPDX | Rationale |
|---|---|---|---|
| Everything not listed below (core: `apps/`, `internal/`, `providers/aws`, `providers/gcp`, `providers/azure`, `database/`, `deploy/`, `tests/`, `scripts/`, `docs/`) | CloudLedger Source-Available License 1.0 | `LicenseRef-CloudLedger-SAL-1.0` | Core product; commercial restrictions apply. |
| `sdk/provider`, `sdk/recommendation`, `sdk/pricing`, `sdk/dashboard`: **interface and type definitions, protobuf/gRPC IDL, manifest JSON Schemas only** | **Option A (recommended):** Apache-2.0 · **Option B:** CL-SAL-1.0 + Plugin Interface exception | `Apache-2.0` or `LicenseRef-CloudLedger-SAL-1.0 WITH LicenseRef-CloudLedger-Plugin-Exception` | Lets plugin authors choose their own license and supports an ecosystem, without granting rights to the core. |
| `sdk/*/testkit` (compatibility suites) | Same as the SDK interfaces | — | Plugin authors must be able to run the suites. |
| `api/openapi/` (API specification) | Option A: Apache-2.0 · Option B: CL-SAL-1.0 | — | Enables independently written API clients and integrations. |
| `schemas/events`, `schemas/focus`, `schemas/semantic`, `schemas/manifest` | Option A: Apache-2.0 · Option B: CL-SAL-1.0 | — | Interoperability. FOCUS itself is published by the FinOps Foundation under its own terms. |
| `providers/examples/` | Same as SDK | — | Templates intended to be copied by plugin authors. |
| Documentation media (logos) | All rights reserved; use per [TRADEMARK_POLICY.md](../../TRADEMARK_POLICY.md) | — | Brand protection. |
| Third-party code (vendored, if any) | Original license, recorded in `THIRD_PARTY_NOTICES` | various | Must pass [compliance policy](LICENSE_COMPLIANCE.md). |

Rules:
1. Every source file carries an SPDX header matching this map, enforced in CI (`reuse lint` or a custom header check).
2. Code must not move from a permissive path into a core path, or vice versa, without a maintainer and Licensor review label (`license-boundary`).
3. Permissive-path packages must not import core packages (enforced by import-lint). This keeps the interface boundary clean.
