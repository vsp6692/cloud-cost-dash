# CloudLedger License FAQ

> **Draft for legal review. Not legal advice.** This FAQ explains the intent of the proposed [CloudLedger Source-Available License (CL-SAL-1.0)](LICENSE.md). If this FAQ and the license text conflict, the license text controls. Consult your own counsel for your specific situation.

## General

**Is CloudLedger open source?**
No. CloudLedger is **source-available**. The source code is public and free to use internally, but the license restricts commercial redistribution and hosting for third parties. It is not an OSI-approved open-source license, and the project does not describe itself as open source.

**Why not Apache 2.0 or another open-source license?**
The project owner wants to keep CloudLedger free for any organization's internal use while preventing third parties from reselling it or offering it as a competing hosted service without a commercial agreement. OSI-approved licenses cannot impose that restriction. See [docs/legal/LICENSING_EVALUATION.md](docs/legal/LICENSING_EVALUATION.md).

**Will CloudLedger convert to an open-source license later?**
No automatic conversion is planned. The proposed license deliberately has no "change date" (unlike BUSL 1.1). The Licensor may choose to relicense in the future, but is not obligated to.

**Is the license final?**
No. It is a proposed draft pending review by qualified legal counsel.

## Internal use (free)

**Can my company use CloudLedger in production for free?**
Yes. Using CloudLedger to manage your own (and your affiliates') cloud costs is free, including in production, at any scale. There are no limits on users, accounts, resources or deployments, and there are no license keys.

**We are a for-profit enterprise. Is that "commercial use"?**
Using CloudLedger to run your own business is **internal commercial use**, and it is allowed for free. What requires a commercial license is **commercial redistribution** or **providing CloudLedger to third parties** (reselling, hosting for others, white-labeling, embedding, derivative products).

**Can we modify the code?**
Yes, for your internal use. We encourage you to contribute improvements back under the [CLA](CLA.md).

**Can our subsidiaries use our deployment?**
Yes. Affiliates (entities under common control) are covered by internal use.

**Can we hire a consultant or contractor to install and run it for us?**
Yes. A contractor acting on your behalf, for your internal use only, is an Authorized Contractor. The contractor may not use that deployment to serve other clients.

**We're a holding company with portfolio companies. Is that internal?**
Only entities that meet the license's "Affiliate" control test (> 50%) are internal. Minority-owned portfolio companies are Third Parties. Ask for guidance or a commercial license.

**Can we share CloudLedger reports with customers, auditors or investors?**
Yes. Output data (reports, exports, charts) can be shared. Giving third parties **logins or access to the CloudLedger application** you operate is a hosted service and requires a commercial license.

**Can we let our customers see their share of our cloud costs in CloudLedger?**
Sending them exported reports is fine. Giving them access to your CloudLedger instance is providing the software's functionality to third parties and requires a commercial license. *(Counsel to confirm the treatment of limited, incidental third-party access.)*

## Restricted uses (commercial license required)

**We're an MSP or FinOps consultancy. Can we run CloudLedger for our customers?**
Not without a commercial license. Managing multiple customers' cloud costs on CloudLedger you operate is a hosted or managed service. (A consultant working inside a single client's own deployment, on the client's behalf, is fine.)

**Can we offer a free hosted CloudLedger to the public?**
No. Hosted services for third parties are restricted **whether paid or free**.

**Can we sell a product that includes CloudLedger?**
Not without an OEM or reseller license.

**Can we fork CloudLedger, rename it and sell or host it?**
No. That is white-labeling or a derivative product. Trademarks are also covered by the [Trademark Policy](TRADEMARK_POLICY.md).

**Can we publish a fork on GitHub?**
Yes, in source form, free of charge, with the license and notices intact, for contributing, reporting issues, or non-commercial study and evaluation. A public fork may not be used to offer commercial distribution or hosted services.

**Does the license prevent anyone from building a competing FinOps tool?**
No. The license covers CloudLedger's copyrighted materials. Anyone may independently build software with similar functionality that does not copy or derive from CloudLedger's source code.

## Contributors, connectors and plugins

**Why do I need to sign a CLA?**
The CLA lets the Licensor distribute your contribution under both the source-available license and commercial licenses. You keep copyright in your contribution. See [CLA.md](CLA.md).

**I built a connector for another cloud provider. What license applies?**
- **Contributed to the main repository**: it becomes part of CloudLedger under CL-SAL-1.0, contributed under the CLA.
- **Published separately (out of tree)**: you choose your plugin's license, subject to the rules in [docs/legal/PLUGIN_LICENSING.md](docs/legal/PLUGIN_LICENSING.md). Your plugin must not include CloudLedger core source code beyond the designated Plugin Interfaces. Users of your plugin still need their own right to use CloudLedger (internal use is free).

**Can I sell a plugin I wrote?**
The proposed framework intends to allow independently written plugins that interact only through the Plugin Interfaces to be licensed and sold by their authors, as long as they do not redistribute CloudLedger itself. *(Pending legal confirmation; see OQ-22.)*

## Compliance

**How does the project make sure its own dependencies are compatible?**
CI scans every Go and npm dependency and container image for license compatibility, enforces file license headers, verifies CLA signatures and generates third-party notices. See [docs/legal/LICENSE_COMPLIANCE.md](docs/legal/LICENSE_COMPLIANCE.md).

**Who do I contact?**
Licensing questions: **[licensing contact: TO BE COMPLETED]**.
