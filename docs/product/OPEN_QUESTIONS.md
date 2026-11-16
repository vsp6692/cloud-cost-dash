# Open Questions, Assumptions and Proposed Defaults

Status: **DRAFT**. Phase 01 must close every question marked **Blocking** (resolve it or explicitly accept the default). Record each decision here with date and approver, and in an ADR when it is architectural.

| ID | Question | Blocking for | Proposed default | Rationale | Status |
|---|---|---|---|---|---|
| OQ-01 | Final product name and trademark/domain/GitHub org availability | v0.1 public release | Keep "CloudLedger" as working name. Run a trademark search before any public repo or package publication. [TRADEMARK_POLICY.md](../../TRADEMARK_POLICY.md) depends on this. | "CloudLedger" may conflict with existing marks. | Open |
| OQ-02 | Pinned FOCUS specification version | Phase 11 | **FOCUS 1.2** as the normalization baseline, with a version-pinned mapping layer so 1.3+ can be added as a new mapping version (ADR-0006). Re-evaluate at Phase 11 start against the latest ratified release. | 1.2 adds invoice-ID and multi-currency columns needed for reconciliation and has broad provider support. | Open |
| OQ-03 | Initial deployment target(s) | Phase 03 | Lite (Docker Compose) first. Standard (Helm) by v0.2. HA by v0.9. | Fastest path to a usable self-hosted product. | Open |
| OQ-04 | Default analytics engine per profile | Phase 13 | Lite: PostgreSQL (DuckDB optional single-node). Standard/HA: ClickHouse. | Matches README. Lowest ops burden at Lite. | Open |
| OQ-05 | Job orchestration: built-in PostgreSQL queue vs. Temporal | Phase 03/12 | Built-in Postgres-backed durable queue (River-style, `SKIP LOCKED`) behind a `jobs` interface. Temporal adapter optional for HA (ADR-0005). | Avoids mandatory extra infrastructure for Lite. | Open |
| OQ-06 | Authorization engine | Phase 05 | Embedded Cedar policies (`cedar-go`) behind an `authz` interface, plus SQL predicate compilation for data-level ABAC (ADR-0008). | Analyzable policy language, Go-native, no sidecar. | Open |
| OQ-07 | SAML implementation | Phase 31 | Native SAML SP in Go (maintained library, hardened config). Document Keycloak/Dex brokering as an alternative. | Enterprise demand. Reduces need for a broker. | Open |
| OQ-08 | Ingestion latency SLO | Phase 12 | Process within 1 h of export availability (NFR-FRS-001). | Exports land 1–3×/day. Hourly polling is sufficient. | Open |
| OQ-09 | Data retention defaults | Phase 04 | Raw files 25 months; normalized cost 37 months; audit log 7 years (configurable); AI conversations 30 days. | Covers YoY comparisons and typical audit periods. | Open |
| OQ-10 | Invoice jurisdictions and tax handling | Phase 10 | Treat tax as provider-reported charge lines. No tax computation. Support multiple invoice currencies and entities. | CloudLedger is not a tax engine. | Open |
| OQ-11 | FX rate sources | Phase 18 | Provider-supplied exchange rates where present. Otherwise ECB daily reference rates (bundled fetcher) or a tenant-uploaded table. Policy: rate at charge date or month-end, configurable per tenant. | Auditable, free, reproducible. | Open |
| OQ-12 | Release acceptance thresholds | Phase 38 | Zero open critical/high vulns; zero open billing-accuracy defects; all contract suites green; coverage ≥ 85% on core packages; SLO gates of PRD §6. | From README definition of done. | Open |
| OQ-13 | Reference hardware for performance SLOs | Phase 34 | Standard: 3× 8 vCPU/32 GiB app nodes; ClickHouse 16 vCPU/64 GiB/NVMe; Postgres 4 vCPU/16 GiB. | Must be fixed before SLOs are meaningful. | Open |
| OQ-14 | Plugin execution model | Phase 35 | Compile-time Go modules for first-party code. External providers as out-of-process plugins over gRPC (HashiCorp go-plugin style). WASM evaluated for recommendation rules (ADR-0012). | Isolation for third-party code without core changes. | Open |
| OQ-15 | SaaS operation in scope for v1.0? | Phase 02 | Architecture must support it (multi-tenant, region-pinning). Operating a public SaaS is out of scope for v1.0 deliverables. Under the source-available license, third-party SaaS or MSP operation requires a commercial license from the Licensor. | Keeps focus on self-hosted. | Open |
| OQ-16 | LLM default and data egress | Phase 27 | AI disabled by default. When enabled, tenant chooses provider. A local (Ollama-compatible) option is documented. Data minimization by default (aggregates, not raw rows). | Privacy-first. | Open |
| OQ-17 | Telemetry / phone-home | Phase 03 | None by default. Opt-in anonymous usage metrics only. | User trust; self-hosted privacy. | Open |
| OQ-18 | Kubernetes cost allocation approach | Phase 20/22 | Ingest OpenCost-compatible allocation output or Prometheus metrics. No custom in-cluster agent at v1.0. | Reuse a CNCF standard. | Open |
| OQ-19 | Supported Azure agreement types | Phase 08 | EA, MCA (enterprise and individual), MPA (partner, read-only for CSP) where exports exist. Legacy PAYG via subscription-scope exports. | Coverage varies by agreement type. | Open |
| OQ-20 | Governance model (BDFL vs. steering committee) | Phase 37 | Maintainer council with lazy consensus. See GOVERNANCE.md. | Common community model. The Licensor retains final authority over licensing and trademarks. | Open |
| OQ-21 | Licensing model: custom CL-SAL-1.0 vs. PolyForm Internal Use 1.0.0 (+ additional permission) | **Blocking** before public repo or any release (Phase 01 decision, Phase 40 final) | Custom **CL-SAL-1.0** after counsel review. BUSL 1.1 rejected (mandatory conversion), ELv2 rejected (allows resale/embedding). See [LICENSING_EVALUATION.md](../legal/LICENSING_EVALUATION.md). | Ongoing commercial restrictions with free internal use. | Open: **legal review required** |
| OQ-22 | License for Plugin Interfaces (`sdk/*` interfaces, `api/openapi`, `schemas`) | Phase 35 (proposal decided in Phase 02) | Option A: Apache-2.0 for interfaces only, so plugin authors can choose licenses. Core stays CL-SAL. See [LICENSE_MAP.md](../legal/LICENSE_MAP.md). | Ecosystem growth without granting rights to the core. | Open: legal review |
| OQ-23 | Contributor IP: CLA (license + relicensing right) vs. copyright assignment | Phase 03 (before accepting external PRs) | CLA granting a broad license with relicensing and sublicensing rights, plus DCO sign-off. Corporate CLA for employers. | Commercial licensing requires relicensing rights. DCO alone is insufficient. | Open: legal review |
| OQ-24 | Licensor legal entity, contacts, governing law | Blocking before publication | To be supplied by the project owner. | Required in LICENSE.md, CLA.md and COMMERCIAL_LICENSE.md. | Open |

## Decision log

| Date | ID | Decision | Approver |
|---|---|---|---|
| _none yet_ | | | |
