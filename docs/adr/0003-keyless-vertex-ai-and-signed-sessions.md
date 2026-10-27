# ADR 0003: Keyless Vertex AI and signed admin sessions

**Status:** Accepted

## Context
API keys in deployments are a common leak vector, and header-based roles can be spoofed.

## Decision
Gemini is called through Vertex AI using the Cloud Run service account (no API key exists). Admin access uses HMAC-SHA256 signed, expiring, workplace-scoped tokens verified with a constant-time comparison. Runtime configuration is validated with zod at startup.

## Consequences
- No secret to rotate or leak in the repository.
- Admin routes reject missing, spoofed, tampered, expired and cross-workplace sessions (covered by tests).
