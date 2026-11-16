# CloudLedger Source-Available License, Version 1.0 (CL-SAL-1.0)

> **⚠️ PROPOSED DRAFT. NOT YET EFFECTIVE. NOT LEGAL ADVICE.**
>
> This text is a proposed licensing framework prepared for review by qualified legal counsel. It has **not** been reviewed or approved and must not be relied on or published as final terms. Until the Licensor publishes a counsel-approved final version, **all rights in CloudLedger are reserved by the Licensor**, and the repository should not be made public under these terms.
>
> Background, alternatives considered (including BUSL 1.1) and open legal questions are in [`docs/legal/LICENSING_EVALUATION.md`](docs/legal/LICENSING_EVALUATION.md).
>
> CloudLedger under this license is **source-available**. It is **not** open-source software as defined by the Open Source Initiative (OSI), and this license is not OSI-approved.

SPDX identifier (proposed): `LicenseRef-CloudLedger-SAL-1.0`

Licensor: **[LICENSOR LEGAL NAME, jurisdiction, registered address: TO BE COMPLETED]** ("**Licensor**")

---

## 1. Purpose

The Licensor makes the CloudLedger source code available so that anyone can inspect, evaluate, test, self-host, modify and use it **free of charge for their own internal purposes, including production use**. Selling, redistributing commercially, or providing CloudLedger to third parties as a product or service requires a separate written commercial license from the Licensor.

## 2. Definitions

- **"Software"** means the CloudLedger source code, object code, container images, documentation and other materials the Licensor makes available under this License, including updates, and excluding any Separately Licensed Components (Section 9).
- **"You"** means the individual or legal entity exercising rights under this License. If you accept this License on behalf of an entity, "You" includes that entity.
- **"Affiliate"** means any entity that controls, is controlled by, or is under common control with You, where "control" means ownership of more than 50% of the voting interests or the power to direct management.
- **"Internal Use"** means use of the Software by You and Your Affiliates to manage, analyze, allocate, report on or optimize **cloud and technology costs that You or Your Affiliates incur or are responsible for**, and to support Your own internal business operations. Internal Use **includes** production use, use in any commercial (for-profit) business, and access by Your and Your Affiliates' employees and by **Authorized Contractors**. Internal Use has no limit on the number of users, cloud accounts, tenants, resources, records or deployments.
- **"Authorized Contractor"** means a contractor, consultant or outsourcing provider who installs, operates, configures or uses the Software **on Your behalf and solely for Your Internal Use**, under an obligation to You to comply with this License. Providing the Software as a service to multiple unrelated customers is not acting as an Authorized Contractor.
- **"Third Party"** means any person or entity other than You, Your Affiliates and Your Authorized Contractors acting as such.
- **"Modification"** means any change, addition, translation or derivative work of the Software, including plugins that incorporate Software source code other than the Plugin Interfaces (Section 9).
- **"Commercial Distribution"** means any of the following, whether or not a fee is charged, except as expressly permitted in Section 3:
  (a) selling, licensing, sublicensing, renting, leasing or otherwise distributing the Software or a Modification to a Third Party;
  (b) **Hosted Service**: making the Software's functionality available to Third Parties as a hosted, managed, SaaS, platform or outsourced service, including managed FinOps or cost-management services delivered to external customers using the Software;
  (c) **White-labeling**: rebranding, renaming or presenting the Software or a Modification under another name or brand for distribution or service to Third Parties;
  (d) **Embedding**: incorporating the Software or a Modification, in whole or in substantial part, into another product or service that is distributed or provided to Third Parties; and
  (e) **Derivative Products**: developing, distributing or providing to Third Parties a product or service that is substantially based on the Software's source code.

## 3. License grant (free use)

Subject to Your compliance with this License, the Licensor grants You a worldwide, non-exclusive, royalty-free, non-transferable, non-sublicensable (except as stated in 3(e)) copyright license to:

(a) **Inspect and evaluate**: download, view, read, build, run and test the Software for any purpose other than Commercial Distribution;

(b) **Internal Use**: install, self-host, run and use the Software for Internal Use, including in production, in any number of instances, without fees or artificial limits;

(c) **Modify**: create Modifications for Your Internal Use;

(d) **Share for contribution and evaluation**: make copies of the Software or Your Modifications available publicly or to others **in source-code form only, free of charge, and with this License and all notices intact**, solely (i) to propose Contributions to the Licensor (for example, a public fork on a code-hosting platform), (ii) to report or reproduce issues, or (iii) for non-commercial study and evaluation by others under this License. This permission does not allow Commercial Distribution; and

(e) **Affiliates and Authorized Contractors**: extend the rights in (a)–(c) to Your Affiliates and Authorized Contractors, who must comply with this License.

## 4. Limitations

Without a separate written commercial license from the Licensor, You must not:

1. engage in any **Commercial Distribution**, including reselling the Software, operating it as a Hosted Service for Third Parties, white-labeling it, embedding it in a product or service provided to Third Parties, or providing Derivative Products;
2. sublicense the Software, or grant any Third Party rights in it, except as permitted in Section 3(d);
3. remove, alter or obscure any licensing, copyright, trademark or attribution notices in the Software; or
4. use the Licensor's trademarks except as permitted by the [Trademark Policy](TRADEMARK_POLICY.md).

**Clarifications** (non-exhaustive; see [LICENSE_FAQ.md](LICENSE_FAQ.md)):
- Using the Software in a for-profit company to manage that company's own cloud costs is **Internal Use**, not Commercial Distribution.
- Internal showback or chargeback between Your own departments or Affiliates is Internal Use.
- Sharing **reports, exports and other output data** produced by the Software (for example, sending a cost report to Your customer, auditor or investor) is permitted. Giving Third Parties **access to the Software's functionality** (for example, logins to a CloudLedger instance You operate for them) is a Hosted Service.

## 5. Contributions

Contributions to the Software are accepted only under the [Contributor License Agreement](CLA.md), which grants the Licensor the rights needed to distribute Contributions under this License and under commercial licenses. Submitting a Contribution does not grant You any additional rights in the Software.

## 6. Patents

The Licensor grants You a royalty-free patent license, for the Licensor's patent claims that are necessarily infringed by the Software as provided by the Licensor, to exercise the rights granted in Section 3. This patent license ends automatically if You (or any Affiliate) initiate patent litigation alleging that the Software infringes a patent.

## 7. Notices

You must keep this License and the copyright, license and attribution notices in all copies of the Software You make, including in Modifications and source shared under Section 3(d). Modified files must carry a prominent notice that You changed them.

## 8. Termination

If You breach this License, Your rights terminate automatically. If this is Your first breach and You cure it within **30 days** of receiving written notice from the Licensor, Your rights are reinstated. Sections 2, 4, 8, 10, 11 and 12 survive termination. *(Counsel to review cure period and reinstatement mechanics.)*

## 9. Separately Licensed Components

Some directories may be designated in [`docs/legal/LICENSE_MAP.md`](docs/legal/LICENSE_MAP.md) as licensed under different terms. These may include SDK interface packages, API specifications and schemas ("**Plugin Interfaces**"), which may be offered under a permissive license so that independent plugins and clients can be built. Third-party dependencies remain under their own licenses, listed in `THIRD_PARTY_NOTICES` (generated at release). *(Final designation pending legal review; see OQ-22.)*

## 10. Independent implementations

This License governs the Software's copyrighted materials only. It does **not** prohibit anyone from independently developing software with similar functionality that does not copy or derive from the Software's source code.

## 11. Disclaimer of warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. THE SOFTWARE PRODUCES FINANCIAL ANALYSES AND ESTIMATES. YOU ARE RESPONSIBLE FOR VERIFYING THEM BEFORE RELYING ON THEM.

## 12. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE LICENSOR WILL NOT BE LIABLE FOR ANY DAMAGES ARISING OUT OF OR RELATED TO THE SOFTWARE OR THIS LICENSE, INCLUDING DIRECT, INDIRECT, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES, EVEN IF ADVISED OF THEIR POSSIBILITY.

## 13. General

- **Commercial licensing**: see [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md).
- **Governing law and venue**: [TO BE DETERMINED BY COUNSEL].
- **New versions**: the Licensor may publish new versions of this License. Each release of the Software states the version that applies to it. *(No automatic conversion to an open-source license is intended; see the evaluation document.)*
- **Severability**: if any provision is unenforceable, the remainder stays in effect to the extent permitted by law.

---

Copyright © [YEAR] [LICENSOR LEGAL NAME]. All rights reserved except as expressly granted above.
