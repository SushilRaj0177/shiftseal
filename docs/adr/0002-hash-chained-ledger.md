# ADR 0002: Hash-chained, append-only shift ledger

**Status:** Accepted

## Context
The core worker grievance is uncounted overtime caused by silent edits to employer-held registers.

## Decision
Each check-in/check-out is an event chained with `sha256(prevHash + canonicalJSON(event))`. Corrections are new `EDIT` events with a mandatory reason; events are never mutated or deleted. The worker's device stores its own copy and re-verifies the chain with Web Crypto.

## Consequences
- Tampering is detectable at the exact broken entry.
- Workers are notified of every correction and can dispute it.
- A full blockchain was rejected: the hash chain gives tamper evidence without its cost and operational complexity.
