# Security

## Threat model (summary)

| Threat | Mitigation |
|---|---|
| Employer silently edits a worker's hours | SHA-256 hash-chained ledger; edits are append-only events with a mandatory reason; the worker's device keeps a copy and re-verifies the chain |
| Spoofed admin access | HMAC-SHA256 signed, expiring (8 h), workplace-scoped sessions verified with `timingSafeEqual`; role headers are never trusted |
| AI states a wrong number to a worker | Every figure in an AI answer must match a value computed by the rules engine (`factcheck.ts`); otherwise a template answer is shown |
| AI downplays a dangerous hazard | Deterministic severity floor: `final = max(ai, floor)` |
| Re-identification from anonymous feedback | PII removed before storage, originals never stored or logged, k-anonymity threshold of 5 per group, no individual scoring from feedback |
| Prompt injection via worker input | Input is passed as data with a fixed system instruction; output is schema-constrained JSON validated with zod; the model never decides numbers or actions |
| Injection / malformed input | zod validation on every body, query and param; strict length and upload limits |
| Abuse / cost blow-up | Global and AI-specific rate limits; 15 s timeouts with a single retry |
| Secret leakage | No API keys: Gemini is called through Vertex AI with the Cloud Run service account; `.env` is git-ignored |
| Browser attacks | helmet with a strict Content-Security-Policy, `x-powered-by` disabled, no inline scripts |

## Runtime hardening

- The container runs as the non-root `node` user with production dependencies only.
- Logs record only error types and status codes, never request content.
- CI runs lint, type-check, tests, build and `npm audit` on every push.

## Reporting

Please report vulnerabilities privately via GitHub security advisories on this repository.
