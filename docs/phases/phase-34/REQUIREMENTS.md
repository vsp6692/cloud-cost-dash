# Phase 34 Requirements

Status: **NOT STARTED**. M = must; S = should; C = could.

| ID | Requirement | PRD trace | Pri | Verified by |
|---|---|---|---|---|
| P34-R01 | No cross-tenant data access through any API, query, export, AI or cache path. | NFR-SEC-001 | M | P34-AC01 |
| P34-R02 | OWASP ASVS 4.0 Level 2 for the web app and API. Level 3 controls for authn, session and audit. | NFR-SEC-002 | M | P34-AC02 |
| P34-R03 | Secrets never stored in plaintext. Envelope encryption with a KMS-backed KEK, or secret references to external stores. | NFR-SEC-003 | M | P34-AC03 |
| P34-R04 | TLS 1.2+ (1.3 preferred) in transit. AES-256 at rest (storage-provider or app-level for secrets). | NFR-SEC-004 | M | P34-AC04 |
| P34-R05 | SBOM (SPDX/CycloneDX), Cosign-signed images, SLSA provenance level 3 target, pinned dependencies. | NFR-SEC-005 | M | P34-AC05 |
| P34-R06 | Dashboard query p95 ≤ 2 s for 13 months of data at the Standard reference scale (see §8) on ClickHouse. ≤ 5 s on PostgreSQL at Lite scale. | NFR-PERF-001 | M | P34-AC06 |
| P34-R07 | API p95 ≤ 300 ms for metadata endpoints. | NFR-PERF-002 | M | P34-AC07 |
| P34-R08 | ≥ 50 M cost rows/hour per worker on the ClickHouse profile (reference hardware TBD in Phase 01). | NFR-PERF-003 | M | P34-AC08 |
| P34-R09 | Horizontal scaling of API and worker pools. Analytics scales via engine choice. | NFR-SCL-001 | M | P34-AC09 |
