# Governance

Status: **DRAFT**, to be finalized in Phase 37.

## Roles

| Role | Responsibilities | How to become one |
|---|---|---|
| **Licensor / Project Owner** ([LICENSOR LEGAL NAME]) | Owns the copyright licensing program, commercial licenses, trademarks and the CLA. Final authority over `LICENSE*`, `CLA.md`, `COMMERCIAL_LICENSE.md`, `TRADEMARK_POLICY.md`, `docs/legal/**` and `compliance/**`. Appoints the initial maintainers. | — |
| **Maintainer council** | Technical direction, roadmap and phase gates, release approval, ADR acceptance, maintainer elections | nominated by a maintainer, approved by 2/3 of the council |
| **Maintainer** | Review and merge, triage, release duties within owned areas (CODEOWNERS) | sustained high-quality contributions + nomination |
| **Area owner** | Domain expertise (e.g. `finance-correctness`, `security`, `providers/aws`) required for approval on sensitive paths | appointed by maintainers |
| **Contributor** | Anyone with a merged contribution under the CLA | — |

## Decision making
- **Lazy consensus** for routine changes: a PR merges after the required approvals if no maintainer objects within 72 hours (24 hours for fixes).
- **ADRs** for architectural decisions: accepted by majority of the maintainer council after a 7-day comment period.
- **Phase gate approvals**: a phase is complete only when its `ACCEPTANCE.md` is signed off by two maintainers, including the relevant area owner.
- **Licensing and trademark decisions** are reserved to the Licensor. The community may propose changes via issues.
- **Conflict resolution**: escalate to the maintainer council. Council vote by simple majority, with the Licensor holding a tie-break vote.

## Required approvals by path (planned CODEOWNERS)
| Path | Approvals |
|---|---|
| `internal/billing`, `internal/finance`, `internal/allocation`, `database/**` | 2, including `finance-correctness` owner |
| `internal/identity`, `internal/authz`, `internal/ai`, `deploy/**` | 2, including `security` owner |
| `LICENSE*`, `CLA.md`, `COMMERCIAL_LICENSE.md`, `TRADEMARK_POLICY.md`, `docs/legal/**`, `compliance/**` | Licensor designee |
| everything else | 1 maintainer |

## Releases
SemVer releases are cut by a maintainer following the release certification of Phase 38. All release artifacts are signed.

## Changes to this document
Changes require a 2/3 maintainer council vote and Licensor approval.
