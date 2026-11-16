# Licensing Model Evaluation

Status: **PROPOSAL FOR LEGAL REVIEW** · Decision record: [ADR-0015](../architecture/adr/0015-source-available-licensing.md) · Supersedes the earlier Apache-2.0 proposal.

> Not legal advice. The facts about third-party licenses below summarize their published terms as understood at drafting time. Counsel must verify them against the current official texts.

## 1. Requirements (from project owner)

| ID | Requirement |
|---|---|
| L-1 | Anyone may download, inspect, test and self-host. |
| L-2 | Internal use free for individuals, startups and enterprises, **including production**, with **no artificial user, account or resource limits**. |
| L-3 | Modification for internal requirements permitted. |
| L-4 | Community contributions (fixes, features, provider integrations) accepted. |
| L-5 | Restricted without commercial license: resale; hosted SaaS or managed service for third parties (**paid or free**); white-labeling; embedding in commercially distributed products; derivative products substantially based on the source; commercial redistribution, sublicensing, or providing functionality as a service to external customers. |
| L-6 | Licensor retains exclusive control of commercial licensing (written authorization). |
| L-7 | **Restrictions continue indefinitely**: no mandatory future conversion to an open-source license. |
| L-8 | Must not be described as OSI-approved open source. Must not purport to prevent independent competing implementations. |

## 2. Options compared

✅ meets · ⚠️ partially / needs additions · ❌ does not meet

| Criterion | **BUSL 1.1** | **Custom CL-SAL (proposed)** | Elastic License 2.0 | PolyForm Internal Use 1.0.0 | PolyForm Shield 1.0.0 | FSL 1.1 | SSPL 1.0 |
|---|---|---|---|---|---|---|---|
| L-1 inspect/self-host | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| L-2 free internal production use | ⚠️ only via an "Additional Use Grant" (BUSL bars production use by default) | ✅ explicit | ✅ | ✅ | ✅ | ✅ (non-competing) | ✅ |
| L-3 internal modification | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| L-4 public forks for contribution | ⚠️ | ✅ explicit §3(d) | ✅ | ⚠️ no explicit distribution grant | ✅ | ✅ | ✅ |
| L-5 no SaaS for third parties | ✅ via grant wording | ✅ | ✅ (managed-service clause) | ✅ (internal only) | ⚠️ only if "competing" | ⚠️ only if "competing" | ⚠️ allowed if entire service stack is released under SSPL |
| L-5 no resale / OEM / white-label | ✅ via grant wording | ✅ | ❌ redistribution allowed | ✅ | ⚠️ only if competing | ⚠️ | ❌ |
| L-7 no mandatory conversion | ❌ **Change Date ≤ 4 years per version, then converts to a GPL-compatible "Change License"** | ✅ | ✅ | ✅ | ✅ | ❌ converts to Apache/MIT after 2 years | ✅ |
| Legal familiarity for enterprise reviewers | High | **Low (new text)** | High | Medium | Medium | Medium | Medium (controversial) |
| Drafting / enforcement risk | Low | **Higher: needs careful drafting** | Low | Low | Medium ("compete" is ambiguous) | Low | High |
| Name and text constraints | "Business Source License" name restricted. Only parameters may change. | none | text reusable | modified versions must not be called PolyForm (verify terms) | same | same | — |

## 3. Analysis

### BUSL 1.1
BUSL lets a licensor set an "Additional Use Grant", which could permit internal production use while forbidding hosting and resale. However, BUSL **requires** each version to convert to the Change License (GPL v2.0-or-later compatible) on its Change Date, at most four years after that version's first public release. This **directly conflicts with L-7**: every release would become open source after at most four years, so ongoing commercial restrictions could only be maintained by continually shipping new versions. BUSL's terms also restrict modifying the license beyond its parameters. **Rejected as primary option.**

### Elastic License 2.0
Well understood, short and widely adopted, with a strong managed-service restriction. It **permits redistribution** (including commercial resale and embedding), subject only to the managed-service, license-key and notice limits. It **fails L-5** for resale, OEM and white-label. **Rejected.**

### PolyForm Internal Use 1.0.0
The closest standard fit: it limits use to internal business purposes, so resale, hosting for others and embedding are all excluded. Gaps: no explicit permission for public contribution forks or non-commercial sharing; "internal business" must be reconciled with Authorized Contractors and Affiliates; it is less recognized than ELv2. **Recommended fallback** (possibly with a separate "additional permission" document for contribution forks) if counsel prefers a standard text over a custom one.

### Custom CloudLedger Source-Available License (CL-SAL-1.0)
Drafted in [LICENSE.md](../../LICENSE.md) to map one-to-one onto L-1…L-8. It defines "Internal Use", "Authorized Contractor", "Affiliate", "Commercial Distribution" and "Hosted Service", grants explicit contribution-fork rights, includes a patent grant with defensive termination and a first-breach cure period, has no change date, and explicitly preserves independent implementation (L-8). The trade-off is that enterprise legal teams must review an unfamiliar license, and the drafting has to be precise.

## 4. Recommendation

1. **Primary:** adopt **CL-SAL-1.0** after counsel review and revision, structured to stay close to well-understood source-available licenses (PolyForm and ELv2 style) to reduce novelty.
2. **Fallback:** **PolyForm Internal Use 1.0.0**, unmodified, plus a Licensor-issued "additional permission" for contribution forks, Affiliates and Authorized Contractors, if counsel judges a standard text lower-risk.
3. **Not recommended:** BUSL 1.1 (mandatory conversion), ELv2 (permits resale and embedding), FSL (conversion), SSPL (does not forbid hosting; reputationally contentious), Shield (ambiguous "compete" test).

## 5. Questions for legal counsel

| # | Question |
|---|---|
| LQ-1 | Is a custom license or PolyForm Internal Use + additional permission preferable for enforceability and adoption? |
| LQ-2 | Licensor entity, governing law, venue and jurisdictional enforceability of field-of-use restrictions (incl. EU/India/US). |
| LQ-3 | Precise definitions of "Hosted Service", "substantially based on" and "Third Party", including the treatment of limited, incidental third-party access (e.g. a customer viewing a shared dashboard). |
| LQ-4 | Affiliate control threshold and treatment of joint ventures and portfolio companies. |
| LQ-5 | Plugin boundary: can out-of-tree plugins that use only the Plugin Interfaces be independently licensed and sold? Should the interfaces be under a permissive license (OQ-22)? |
| LQ-6 | CLA: license with relicensing right vs. copyright assignment; Corporate CLA; moral rights jurisdictions. |
| LQ-7 | Patent clause scope and defensive termination. |
| LQ-8 | Termination and cure mechanics; reinstatement. |
| LQ-9 | Export control and sanctions language, if any. |
| LQ-10 | Compatibility review of third-party dependency licenses (especially weak copyleft such as MPL-2.0 and LGPL) with distribution under CL-SAL. |
| LQ-11 | Trademark clearance for the final product name. |
| LQ-12 | Whether container images, Helm charts and binaries need additional EULA-style notices. |

## 6. Publication gate

The repository must not be made public, and no release may be published under CL-SAL, until:
- [ ] counsel has approved LICENSE.md, CLA.md, Corporate CLA, COMMERCIAL_LICENSE.md, TRADEMARK_POLICY.md and LICENSE_FAQ.md;
- [ ] Licensor legal name, contacts and governing law are completed;
- [ ] the LICENSE_MAP designation (OQ-22) is decided;
- [ ] the CLA tooling is configured;
- [ ] license compliance CI is green (see [LICENSE_COMPLIANCE.md](LICENSE_COMPLIANCE.md)).
