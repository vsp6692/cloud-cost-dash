# ADR-0015: Source-available licensing (replaces Apache-2.0 proposal)

- **Status:** Proposed (requires legal review)
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
The project owner wants CloudLedger to be free for anyone's internal use (including production at any scale), while reserving resale, third-party hosting or managed services, white-labeling, embedding and derivative products for commercial licensing, with **no mandatory future conversion** to open source.

## Decision
Adopt a source-available model. The proposed license is the custom **CloudLedger Source-Available License 1.0** (`LICENSE.md`), with PolyForm Internal Use 1.0.0 + additional permission as the fallback. Contributions are accepted under a **CLA** with relicensing rights, plus DCO sign-off. Plugin Interfaces may be permissively licensed (OQ-22). License compliance (dependency policy, SPDX headers, CLA, notices) is enforced in CI. **All legal texts are drafts until approved by qualified counsel.** This ADR affects licensing and documentation only; architecture, APIs, schemas and the 40-phase scope are unchanged.

## Alternatives considered
- Apache-2.0: rejected because it permits resale and third-party hosting.
- BUSL 1.1: rejected because each version must convert to a GPL-compatible license by its Change Date (≤ 4 years).
- Elastic License 2.0: rejected because it permits commercial redistribution and embedding.
- FSL: rejected because it converts after 2 years.
- SSPL: rejected because it doesn't prohibit hosting and is contentious.

## Consequences
- CloudLedger must not be described as open source or OSI-approved.
- GPL/AGPL/SSPL dependencies cannot be used.
- Some enterprises and contributors may hesitate. Mitigated by a clear FAQ and free internal use without limits.
- Independent competing implementations are not restricted.
- See docs/legal/LICENSING_EVALUATION.md.
