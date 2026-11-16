# Risk Register

Scale: Likelihood (L) and Impact (I) are rated 1–5. Score = L × I. Review at every phase gate. Owners are assigned in Phase 01.

| ID | Risk | Category | L | I | Score | Mitigation | Trigger / early warning | Phase(s) | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Semantic drift between PG/DuckDB/ClickHouse (decimals, NULLs, time) produces different numbers | Technical | 4 | 5 | 20 | single semantic compiler; exact-equality parity suite as release blocker; UTC-only; explicit rounding | parity failures in CI | 13, 38 | TBD | Open |
| R-02 | Provider export schema changes break ingestion silently | Technical | 4 | 4 | 16 | schema fingerprinting; quarantine; versioned mappings; fixture per schema version | unknown fingerprint alerts | 06–08, 11, 12 | TBD | Open |
| R-03 | Savings double-counted across overlapping recommendations | Product/accuracy | 3 | 5 | 15 | overlap resolver with invariant; property-based tests | sum(net) > achievable in tests | 25 | TBD | Open |
| R-04 | Cross-tenant data leak via cache, export, AI or analytics | Security | 2 | 5 | 10 | RLS + compiler predicates + cache keys + attack suite + pen test | any isolation test failure (release blocker) | 04, 05, 13, 27, 34 | TBD | Open |
| R-05 | Backfill of billions of rows overwhelms workers or DB | Scalability | 3 | 4 | 12 | chunked work units; back-pressure; partition writes; quotas | queue lag; memory alarms | 12, 34 | TBD | Open |
| R-06 | Entitlement-dependent provider data (invoices, Trusted Advisor, Azure agreement types) not available to users | External | 5 | 3 | 15 | capability detection; explicit "unavailable" UX; document limitations; never assume | verification `fail/unknown` rates | 06–08, 10, 21 | TBD | Open |
| R-07 | 40-phase scope too large for available contributors; scope creep | Delivery | 4 | 4 | 16 | strict phase gates; release checkpoints; defer "could" requirements | phase cycle time growth | all | TBD | Open |
| R-08 | Reconciliation can't match invoices due to provider rounding/tax/credit timing | Accuracy | 4 | 4 | 16 | variance categories; tolerance policy; golden invoices per provider | uncategorized variance rate | 10, 29 | TBD | Open |
| R-09 | Prompt injection via tag values or resource names manipulates AI | Security | 4 | 4 | 16 | tool-only access; semantic queries; delimiting; output validation; corpus tests | corpus failures | 27, 28, 34 | TBD | Open |
| R-10 | LLM vendor data egress unacceptable to tenants | Privacy | 3 | 3 | 9 | disabled by default; local model option; data minimization | tenant feedback | 27 | TBD | Open |
| R-11 | Custom source-available license is unenforceable, ambiguous or deters adopters | Legal/adoption | 3 | 4 | 12 | counsel review; PolyForm fallback; clear FAQ; free internal use without limits | counsel findings; adopter questions | 01, 37, 39, 40 | Licensor | Open |
| R-12 | Copyleft (GPL/AGPL) dependency enters the distribution, conflicting with the license | Legal | 3 | 4 | 12 | license CI deny-list; release gate; exception process | CI failure | 03, 38 | TBD | Open |
| R-13 | Contributions merged without CLA, preventing commercial relicensing | Legal | 2 | 4 | 8 | CLA bot required check; CLA coverage report at release | missing-signature report | 03, 37, 38 | TBD | Open |
| R-14 | Trademark conflict with the "CloudLedger" name | Legal | 3 | 3 | 9 | clearance search before publication (OQ-01); rename plan | search results | 01, 37 | Licensor | Open |
| R-15 | Cloud API costs incurred by CloudLedger (Cost Explorer per-request fees, BigQuery scans, metrics APIs) surprise users | Cost | 3 | 3 | 9 | cost-aware limits; `maximum_bytes_billed`; documented expected costs; preview estimates | per-tenant API spend metrics | 06–08, 20 | TBD | Open |
| R-16 | Forecast/anomaly models noisy, causing alert fatigue | Product | 3 | 3 | 9 | back-testing; feedback loop; suppression; digests | false-positive feedback rate | 17, 32 | TBD | Open |
| R-17 | Third-party plugin compromises worker or credentials | Security | 2 | 5 | 10 | out-of-process sandbox; scoped creds; egress allow-list; signing | sandbox escape tests | 35, 36, 34 | TBD | Open |
| R-18 | Restatements after period close alter closed numbers | Accuracy | 4 | 3 | 12 | closed snapshots immutable; adjustments booked in next open period | late_correction flags | 12, 30 | TBD | Open |
| R-19 | ClickHouse operational complexity too high for Standard users | Operability | 3 | 3 | 9 | PG option for Standard-small; operator-based install; runbooks | support issues | 13, 33 | TBD | Open |
| R-20 | Upstream library or service license changes (e.g. AGPL tools used in deploy samples) | Legal | 3 | 2 | 6 | treat AGPL tools (Grafana, Loki, MinIO, k6) as operator-installed or build-only; never vendor | license CI | 03, 33, 39 | TBD | Open |
