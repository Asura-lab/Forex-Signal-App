# Consent Lifecycle and Evidence Trail

Last updated: 2026-04-04

## Scope

This document defines how consent is captured, validated, and audited for Terms of Service and Privacy Policy acceptance.

## Collection Point

Consent is captured during registration through the `consent` payload.

Required fields:

- `accepted` (must be `true`)
- `terms_version`
- `privacy_version`
- `locale` (`mn` or `en`)
- `accepted_at` (ISO-8601)

## Server-side Validation

Backend rejects registration when:

- consent is missing or `accepted=false`
- policy versions are missing or outdated
- locale is unsupported

## Evidence Captured

When consent passes validation, backend stores:

- accepted terms version
- accepted privacy version
- locale
- acceptance timestamp
- evidence metadata:
  - source IP
  - user-agent (truncated)
  - recorded timestamp

## Auditability and Retention

- Consent record is stored with user profile data.
- Policy version fields are retained for post-incident and compliance audits.
- Token/session lifecycle is independent but linked to the same account identity.

## Operational Controls

- Local dotenv secret loading is disabled by security policy.
- Runtime policy versions are environment-driven.
- Registration returns current policy versions for client coherence.

## Frontend Coherence Requirements

Signup flow must always submit consent with matching policy versions and locale.

- Mobile screen: `SignUpScreen`
- API layer: `registerUser(..., consent)`
