# ADR 0001: The AI understands, deterministic code decides

**Status:** Accepted

## Context
Workers' pay, overtime and safety outcomes must be correct and explainable. LLM output is probabilistic and can state wrong numbers or misjudge severity.

## Decision
Gemini is used only to turn unstructured voice/text into schema-constrained JSON and to phrase explanations. Every number and decision (hours, overtime, pay, claim support, severity, fatigue, anonymity) is computed by pure, unit-tested functions in `src/shared/rules/`. Any number in an AI explanation must match a computed value (`factcheck.ts`), otherwise a template answer is shown. Severity is `max(ai, floor)`.

## Consequences
- AI errors cannot change a payslip or downgrade a hazard.
- The rules engine is fully testable without network access.
- When Gemini is unavailable, labelled fallbacks keep every feature working.
