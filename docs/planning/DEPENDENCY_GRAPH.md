# Phase Dependency Graph

Source of truth for dependencies: [docs/phases/README.md](../phases/README.md). An edge `A --> B` means B cannot start its implementation until A is **ACCEPTED** (design work may overlap).

```mermaid
flowchart TD
  classDef r01 fill:#e8f1ff,stroke:#3b6db3
  classDef r02 fill:#eafaf0,stroke:#2f8a4f
  classDef r03 fill:#fff6e5,stroke:#b37a00
  classDef r05 fill:#f6ecff,stroke:#7a3bb3
  classDef r07 fill:#ffecec,stroke:#b33b3b
  classDef r09 fill:#eef7f7,stroke:#2f7a7a
  classDef r10 fill:#f2f2f2,stroke:#555

  P01[01 PRD + licensing decision] --> P02[02 Architecture/ADRs]
  P02 --> P03[03 Monorepo/CI/license CI]
  P03 --> P04[04 Tenancy/audit]
  P04 --> P05[05 SSO/RBAC/ABAC]
  P04 & P05 --> P06[06 AWS + ingestion framework]
  P06 --> P07[07 GCP]
  P06 --> P08[08 Azure]
  P06 --> P09[09 Generic imports]
  P06 & P07 & P08 & P09 --> P10[10 Invoices/reconciliation]
  P06 & P07 & P08 & P09 --> P11[11 FOCUS normalization]
  P11 --> P12[12 Backfill/sync/health]
  P11 --> P13[13 Analytics adapters]
  P05 & P13 --> P14[14 Dashboards]

  P11 & P13 --> P15[15 Allocation]
  P14 & P15 --> P16[16 Dashboard builder]
  P13 & P15 --> P17[17 Budgets/forecast/anomalies]
  P11 & P13 --> P18[18 FX/commitments/unit econ]

  P06 & P07 & P08 & P13 --> P19[19 Inventory]
  P19 --> P20[20 Telemetry]
  P13 & P19 & P20 --> P21[21 Rec SDK]
  P21 --> P22[22 Compute/K8s/serverless]
  P21 --> P23[23 Storage/DB/backup]
  P21 --> P24[24 Network]
  P18 & P22 & P23 & P24 --> P25[25 Commitments/overlap]
  P21 & P25 --> P26[26 Lifecycle/realized]

  P05 & P13 --> P27[27 LLM gateway]
  P27 & P16 --> P28[28 Conversational analytics]
  P10 & P15 & P18 --> P29[29 Finance exports]
  P29 & P04 --> P30[30 Period close]

  P05 --> P31[31 SAML/SCIM/MSP]
  P17 & P26 --> P32[32 Advanced alerts]
  P12 & P13 & P30 --> P33[33 HA/DR]
  P33 --> P34[34 Scale/pentest]
  P06 & P07 & P08 & P09 & P12 --> P35[35 Provider SDK]
  P21 & P16 & P35 --> P36[36 Other SDKs]
  P35 & P36 --> P37[37 Contributor/governance]
  P37 & P34 & P32 & P31 & P30 & P28 & P26 --> P38[38 Release certification]
  P38 --> P39[39 Public docs]
  P39 --> P40[40 v1.0]

  class P01,P02,P03,P04,P05 r01
  class P06,P07,P08,P09,P10,P11,P12,P13,P14 r02
  class P15,P16,P17,P18 r03
  class P19,P20,P21,P22,P23,P24,P25,P26 r05
  class P27,P28,P29,P30 r07
  class P31,P32,P33,P34,P35,P36,P37 r09
  class P38,P39,P40 r10
```

Colors: v0.1 blue · v0.2 green · v0.3 amber · v0.5 purple · v0.7 red · v0.9 teal · v1.0 grey.

## Critical path
`01 → 02 → 03 → 04 → 05 → 06 → 11 → 13 → 15 → 18 → 25 → 26 → 32 → 38 → 39 → 40` (plus `19 → 20 → 21 → 22/23/24 → 25`).

Phases 06–09, 19–24 and 31/35 contain parallelizable work streams once their prerequisites are accepted.

## Parallelization opportunities (with multiple contributors)
| After accepting | Can run in parallel |
|---|---|
| 06 | 07, 08, 09 |
| 11 | 12, 13 |
| 13 | 14, 15, 18, 19, 27 |
| 21 | 22, 23, 24 |
| 05 | 31 (design early; implementation planned for v0.9) |

## Licensing dependencies (documentation/compliance only)
`01 (decision + counsel) → 02 (ADR-0015, license map) → 03 (license CI) → 35/36 (plugin licensing) → 37 (CLA/trademark/governance) → 38 (license release gate) → 39 (publish approved texts) → 40 (final license in effect)`. Public repository publication is gated by [LICENSING_EVALUATION.md §6](../legal/LICENSING_EVALUATION.md#6-publication-gate).
