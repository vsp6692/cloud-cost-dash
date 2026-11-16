# ADR-0009: Keyless cloud federation and secret references

- **Status:** Proposed
- **Date:** 2026-11-15
- **Deciders:** maintainer council (to be ratified in Phase 02)

## Context
Static long-lived cloud keys are a major breach risk.

## Decision
Default to AWS IAM role assumption with ExternalId (or web identity when running in AWS), GCP Workload Identity Federation or service-account impersonation, and Azure workload identity federated credentials. Where static secrets are unavoidable, store only **secret references** (Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Kubernetes) or envelope-encrypted values (AES-256-GCM DEK, KMS- or file-based KEK).

## Alternatives considered
- Store encrypted keys only: rejected as the default.

## Consequences
- Onboarding templates must create federation trust.
- A credential verifier reports capability-level permissions.
