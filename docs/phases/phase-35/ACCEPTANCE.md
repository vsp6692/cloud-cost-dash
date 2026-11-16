# Phase 35 Acceptance

Status: **NOT STARTED**. No criterion is met; no evidence exists yet.

| ID | Criterion (measurable) | Evidence required | Requirements | Tests |
|---|---|---|---|---|
| P35-AC01 | `sdk/provider/v1.0.0` tagged; API diff job active and proven to block a breaking change | tag, CI run of canary break | P35-R01 | TC01 |
| P35-AC02 | gRPC protocol v1 frozen; in-process and gRPC outputs identical for the example provider | buf report, hash comparison log | P35-R02 | TC02, TC03, TC24 |
| P35-AC03 | All handshake and compatibility negatives refused with typed errors and audit events | test log, audit rows | P35-R03, R04 | TC04, TC05 |
| P35-AC04 | 100% of sandbox escape and credential-misuse attempts in the suite denied; security area owner review signed | test log, review record | P35-R05, R06 | TC06, TC07 |
| P35-AC05 | Faults contained to the faulty plugin; no partial commits; telemetry linked | chaos log, trace screenshots | P35-R07, R20 | TC08, TC23 |
| P35-AC06 | Manifest schema v1 published and strict | schema file, test log | P35-R08 | TC09 |
| P35-AC07 | **[LIC]** `license` required and SPDX-validated; zero code paths gate on license (Semgrep clean) | test logs, Semgrep report | P35-R09, R10 | TC10, TC11, TC16 |
| P35-AC08 | **[LIC]** Admin API and Plugins page show the declared license; actions audited | Playwright report, API contract log | P35-R11, R15 | TC12, TC13 |
| P35-AC09 | CLI flow works from a clean container; reproducible package with SBOM incl. licenses | CI artifact, two sha256 values | P35-R12, R21 | TC14 |
| P35-AC10 | Example provider passes the suite in both modes with zero core diff; AWS/GCP/Azure pass; negative manifest cases fail | suite reports, PR diff stat | P35-R13, R14 | TC15, TC17, TC18 |
| P35-AC11 | **[LIC]** OQ-22 decided by counsel and recorded; headers match LICENSE_MAP; import-lint blocks core imports from permissive paths | OPEN_QUESTIONS decision-log row, `reuse lint` output, depguard canary | P35-R16, R17 | TC19, TC20 |
| P35-AC12 | **[LIC]** In-tree CLA/header gate blocks unsigned/unheadered PRs; out-of-tree rules published in authoring guide and scaffold | CI run, doc link | P35-R18, R19 | TC21, TC22 |

## Exit gate

All M requirements met; all TCs executed with recorded evidence; no open critical/high findings on host/sandbox (including Phase 34 pen-test items in scope); **OQ-22 decided** (a pending OQ-22 blocks exit); go-plugin/MPL-2.0 question resolved (exception recorded or dependency avoided); RF-14 (`providers/examples` licensing) resolved with Licensor sign-off; RF-12 (`license_spdx` NOT NULL for newly installed plugins) addressed.

## Known limitations (planned)

- Egress allow-list is best-effort on Lite without cgroup v2/nftables; documented as reduced isolation.
- Plugin signature verification is optional outside HA values.
- License display reflects the author's declaration only; CloudLedger does not verify it and makes no legal determination.

## Sign-off

Requires two maintainers including the `security` area owner, plus the Licensor designee for P35-AC07, AC08, AC11, AC12.

| Role | Name | Decision | Date | Commit/evidence ref |
|---|---|---|---|---|
| Maintainer | | | | |
| Security area owner | | | | |
| Licensor designee ([LIC]) | | | | |
