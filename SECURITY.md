# Security

## Threat model (summary)

| Threat | Mitigation |
|---|---|
| Employer silently edits a worker's hours | SHA-256 hash-chained ledger; edits are append-only events with a mandatory reason; the worker's device keeps a copy and re-verifies the chain |
| Impersonation | Firebase Authentication (phone + SMS code, or Google). The server verifies every ID token's signature, issuer, audience and expiry against Google's keys; roles come from the workplace membership record, never from the client |
| Server-side rewrite of history | Check-ins are signed on the worker's phone (non-extractable P-256 key); the server returns an Ed25519-signed receipt for every event and seals a signed fingerprint of everyone's records at the end of each day |
| Fake check-ins (from home, a photo of the code, a friend's phone) | Rotating gate code (30 s), precise location against the site boundary, one approved phone per worker, replay-proof nonces; doubtful checks are recorded and flagged for review, not silently accepted or refused |
| False claims by either side | Evidence flags: edits that contradict signed on-site records, hour cuts near payday, repeated cuts by one editor, reported underpayment, implausible or duplicate claims, hazards closed without a photo. Nobody can close a flag about themselves; flags about the employer close only by the owner |
| AI states a wrong number to a worker | Every figure in an AI answer must match a value computed by the rules engine (`factcheck.ts`); otherwise a template answer is shown |
| AI downplays a dangerous hazard | Deterministic severity floor: `final = max(ai, floor)` |
| Feedback saved with identifying details | If the anonymiser is unavailable, nothing is saved and the worker is asked to try later |
| Re-identification from anonymous feedback | PII removed before storage, originals never stored or logged, k-anonymity threshold of 5 per group, no individual scoring from feedback |
| Prompt injection via worker input | Input is passed as data with a fixed system instruction; output is schema-constrained JSON validated with zod; the model never decides numbers or actions |
| Injection / malformed input | zod validation on every body, query and param; strict length and upload limits |
| Abuse / cost blow-up | Global and AI-specific rate limits; 15 s timeouts with a single retry |
| Secret leakage | No API keys: Gemini is called through Vertex AI with the Cloud Run service account. One server secret (`SESSION_SECRET`) derives the gate-code and receipt keys; production refuses to start without it |
| Browser attacks | helmet with a strict Content-Security-Policy, `x-powered-by` disabled, no inline scripts |

## Runtime hardening

- The container runs as the non-root `node` user with production dependencies only.
- Logs record only error types and status codes, never request content.
- CI runs lint, type-check, tests, build and `npm audit` on every push.

## Reporting

Please report vulnerabilities privately via GitHub security advisories on this repository.
