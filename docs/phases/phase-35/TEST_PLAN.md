# Phase 35 Test Plan

Environments: CI (linux/amd64, linux/arm64), Testcontainers (PostgreSQL), kind cluster for the `pod` sandbox driver, Docker Compose (Lite) for the `exec` driver. Fixtures: `providers/examples/examplecloud/testdata/` (synthetic CSV billing, JSON inventory, throttling and denied responses), malicious test plugins in `tests/security/plugins/` (never shipped). No real cloud credentials are used.

| ID | Type | Description | Fixtures | Expected | Requirements |
|---|---|---|---|---|---|
| P35-TC01 | Contract | `apidiff` against `sdk/provider/v1.0.0` baseline; a deliberate breaking change in a test branch is rejected | baseline tag | CI fails on the break, passes otherwise | P35-R01 |
| P35-TC02 | Contract | `buf lint` + `buf breaking`; round-trip every message type | proto files | no lint errors; no breaking change | P35-R02 |
| P35-TC03 | Integration | Same example provider run in-process and via gRPC produce byte-identical normalized row hashes | examplecloud fixtures | hashes equal | P35-R02, P35-R13 |
| P35-TC04 | Security | Handshake: wrong cookie, protocol out of range, cert mismatch, socket owned by other UID | crafted plugin binaries | launch refused, typed error, audit event | P35-R03 |
| P35-TC05 | Unit | SemVer compatibility checks for `compatibility.sdk` / `compatibility.cloudledger` (edge ranges, prereleases) | table-driven | incompatible → `incompatible` status | P35-R04 |
| P35-TC06 | Security | Sandbox escape attempts: connect to PG/ClickHouse/MinIO/API, write to root FS, exceed memory, fork bomb, egress to non-allow-listed host, read `/proc/1/environ` | `tests/security/plugins/evil-*` | every attempt denied or killed; no data returned; alerts raised | P35-R05 |
| P35-TC07 | Security | Credential broker: TTL ≤ 15 min, scope bound to one connector, cross-tenant connector request denied, no static key exported where federation exists | broker fakes | as stated; audit entries without secrets | P35-R06 |
| P35-TC08 | Failure injection | Crash mid-stream, hang, OOM; 6 crashes in 10 min | fault plugin | stage aborted (no partial commit), retries, then `degraded`; other connectors unaffected | P35-R07 |
| P35-TC09 | Unit | Manifest schema: valid examples, unknown field, missing `egress` for grpc, immutability (changed manifest same version) | `schemas/manifest/testdata/` | validation results match golden | P35-R08 |
| P35-TC10 | Unit | **[LIC]** SPDX validation: `Apache-2.0`, `MIT OR Apache-2.0`, `LicenseRef-Acme-1.0`, `GPL-2.0-only WITH Classpath-exception-2.0` accepted; missing, empty, `Apache2`, `MIT AND` rejected | table-driven | accepted/rejected as listed | P35-R09 |
| P35-TC11 | Integration | **[LIC]** License informational only: install identical plugins differing only in `license` (incl. denied-list values like `AGPL-3.0-only` and `LicenseRef-Proprietary`); behavior, status, limits identical | two packages | identical runtime behavior; license displayed | P35-R10 |
| P35-TC12 | E2E (Playwright) | **[LIC]** Admin Plugins page shows license column and detail; non-admin gets 404; axe-core clean | seeded plugins | license visible; a11y pass | P35-R11, P35-R15 |
| P35-TC13 | Contract | Admin API: list/install/enable/disable, idempotency replay, ETag 412, audit events, OpenAPI conformance | API fixtures | matches OpenAPI; audits written | P35-R15 |
| P35-TC14 | E2E | `cloudledger-sdk init → validate → test → package` in a clean container with only Go + CLI | none | all commands exit 0; package reproducible (two builds same sha256); SBOM has license data | P35-R12, P35-R21 |
| P35-TC15 | Contract | Testkit negative: manifest declares `inventory` not implemented; implements `metrics` not declared | broken examples | suite fails with explicit messages | P35-R13 |
| P35-TC16 | Static | **[LIC]** No code path reads `license_spdx`/`metadata.license` except display, validation and logging (Semgrep rule + grep allow-list); no license-key/phone-home code (NFR-LIC-004) | repo | zero findings | P35-R10 |
| P35-TC17 | Contract | Example provider passes full suite in both modes; PR diff touches no `internal/` or `apps/` file | examplecloud | pass; diff check pass | P35-R14 |
| P35-TC18 | Contract | AWS, GCP, Azure providers pass the frozen suite (in-process) | provider fixtures | pass | P35-R14 |
| P35-TC19 | Static | **[LIC]** `reuse lint`; headers in `sdk/provider/**`, `schemas/manifest/**`, `providers/examples/**` match the OQ-22 decision | repo | zero findings | P35-R16 |
| P35-TC20 | Static | **[LIC]** depguard `plugin-interfaces-no-core`: test file importing `internal/billing` from `sdk/provider` fails lint | canary branch | lint fails on canary, passes on main | P35-R17 |
| P35-TC21 | CI | **[LIC]** PR adding `providers/foo` from an unsigned contributor without SPDX header is blocked by `cla/required` and header check | test repo/PR | blocked | P35-R18 |
| P35-TC22 | Docs | **[LIC]** Scaffold output contains LICENSE, NOTICE and README with out-of-tree rules and trademark-compliant name ("… for CloudLedger"); doc links resolve | `init` output | present and correct | P35-R19 |
| P35-TC23 | Integration | Trace context propagates host→plugin; plugin logs truncated at 8 KiB and redacted | log-spam plugin | spans linked; secrets redacted | P35-R20 |
| P35-TC24 | Performance | gRPC overhead: example provider streaming 5 M rows; throughput ≥ 80% of in-process | synthetic 5 M-row CSV | ratio ≥ 0.8 | P35-R02 |
