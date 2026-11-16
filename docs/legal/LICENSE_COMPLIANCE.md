# License Compliance and Third-Party Dependency Policy

Status: **PROPOSED**. CI implementation is delivered in **Phase 03**, release gating in **Phase 38**. Allow and deny lists need counsel review (LQ-10).

## 1. Why this matters
CloudLedger is distributed (source, binaries, container images, Helm charts) under a **source-available** license with field-of-use restrictions. Strong copyleft licenses (GPL, AGPL) forbid adding further restrictions to code that incorporates them, so combining such code into the CloudLedger distribution would conflict with CL-SAL-1.0. Dependencies must therefore be permissive, or reviewed case by case.

## 2. Third-party license policy

| Category | Licenses (SPDX) | Policy |
|---|---|---|
| **Allowed** | MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0, ISC, 0BSD, Zlib, CC0-1.0, Unlicense, BSL-1.0 (Boost), PSF-2.0, Python-2.0 | auto-approved |
| **Review required** | MPL-2.0, EPL-2.0, CDDL-1.0/1.1, LGPL-2.1/3.0 (dynamic linking only; Go static linking normally makes LGPL unsuitable), CC-BY-4.0 (docs/data), OFL-1.1 (fonts), any dual-licensed package | maintainer + Licensor approval recorded in `compliance/license-exceptions.yaml`, with reason and expiry |
| **Denied** | GPL-2.0, GPL-3.0, AGPL-3.0, SSPL-1.0, BUSL-1.1, Elastic-2.0, Commons Clause add-ons, CC-BY-NC-*, CC-BY-SA-* (code), any license with field-of-use restrictions, **unknown or no license** | build fails |
| **Container base images** | OS packages under GPL in base images (e.g. glibc, busybox) | allowed as **mere aggregation** if unmodified and source offers are honored. Prefer distroless or static images. Documented in the image SBOM. |
| **Build-only tools** | any license | allowed if not shipped in artifacts (tool not linked or bundled) |

## 3. CI checks (GitHub Actions)

| Check | Tool (proposed) | Trigger | Fails when |
|---|---|---|---|
| Go dependency licenses | `google/go-licenses` (`check --allowed_licenses=...`) | PR, main, release | a dependency is denied or unknown |
| npm/pnpm dependency licenses | `license-checker-rseidelsohn` (or `pnpm licenses list --json` + policy script) | PR, main, release | same |
| Container image licenses | Trivy (`--scanners license`) | image build | denied license in a non-aggregated layer |
| Deep scan (release) | ScanCode Toolkit or OSS Review Toolkit (ORT) | release candidate | copied third-party code without attribution, license conflicts |
| File headers / SPDX | `reuse lint` (REUSE spec) or a custom header checker | PR | missing or incorrect SPDX header per [LICENSE_MAP.md](LICENSE_MAP.md) |
| CLA | CLA Assistant (GitHub app or `contributor-assistant/github-action`) | PR | any commit author has not signed |
| DCO sign-off | DCO app | PR | missing `Signed-off-by` |
| Third-party notices | generated from SBOM (Syft → `THIRD_PARTY_NOTICES.md`) | release | generation fails or notices differ from the SBOM |
| SBOM with license data | Syft (SPDX + CycloneDX), attached and Cosign-attested | release | missing |
| Policy change guard | CODEOWNERS on `LICENSE*`, `CLA.md`, `COMMERCIAL_LICENSE.md`, `TRADEMARK_POLICY.md`, `docs/legal/**`, `compliance/**` | PR | changes without Licensor-designated approver |

Example (illustrative; finalized in Phase 03):

```yaml
# .github/workflows/license-compliance.yml
name: license-compliance
on: [pull_request, push]
jobs:
  licenses:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<pinned-sha>
      - uses: actions/setup-go@<pinned-sha>
      - run: go install github.com/google/go-licenses@<pinned-version>
      - run: go-licenses check ./... --allowed_licenses="$(cat compliance/allowed-licenses.txt | paste -sd, -)"
      - run: pnpm install --frozen-lockfile && node scripts/compliance/check-npm-licenses.mjs
      - run: pipx run reuse lint
```

## 4. Repository artifacts
- `compliance/allowed-licenses.txt`, `compliance/denied-licenses.txt`, `compliance/license-exceptions.yaml` (Phase 03)
- `THIRD_PARTY_NOTICES.md` (generated per release; never hand-edited)
- `NOTICE` (Licensor copyright and required attributions)
- SPDX headers in every source file, for example:
  ```go
  // SPDX-License-Identifier: LicenseRef-CloudLedger-SAL-1.0
  // Copyright (c) [YEAR] [LICENSOR LEGAL NAME]
  ```

## 5. Release gate (Phase 38)
A release is blocked if any of the following holds:
- a denied license is present;
- an exception is unapproved or expired;
- notices are missing;
- the SBOM lacks license data;
- the CLA coverage report shows an unsigned contributor in the release diff;
- the legal publication gate in [LICENSING_EVALUATION.md §6](LICENSING_EVALUATION.md#6-publication-gate) is not satisfied.
