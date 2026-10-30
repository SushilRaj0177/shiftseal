# Shiftseal

**Every hour counted. Every rupee explained.** Tamper-evident work records for shift workers, office staff, and the people who employ them.

[![CI](https://github.com/SushilRaj0177/shiftseal/actions/workflows/ci.yml/badge.svg)](https://github.com/SushilRaj0177/shiftseal/actions/workflows/ci.yml)

> **Principle:** the AI understands, code decides, and nothing reaches a worker unchecked.

Whether it is a construction site, a campus or an office, someone else usually keeps the record of a person's time: hours, overtime, leave, salary dates. Overtime disappears, approved leave gets withdrawn, salaries arrive late, complaints carry risk, and hazards are reported after someone is hurt. Shiftseal gives each person their own proof, and gives the employer evidence they can stand behind.

How it works: [`ARCHITECTURE.md`](ARCHITECTURE.md) · Designs: [Figma](https://www.figma.com/design/viMV0sdG4YQXTDyAN6qucK) · System model: [FigJam](https://www.figma.com/board/DXbOejYuuG4GDZP0KnsHtc)

---

## For workers

- **Sign in with your phone number.** Join your workplace by scanning the poster at the gate or typing the invite code.
- **Check in at the gate.** Scan the code, and your phone signs the record and keeps its own copy. Works without a signal: the check is saved and sent later.
- **See every change.** If a supervisor corrects your hours, you are told immediately, with their reason, and can disagree in one tap.
- **A payslip you can follow.** Every line is marked *law* or *workplace policy*. Ask why your pay changed, by voice, in Tamil, Hindi or English. Every number in the answer is checked.
- **Claim missed overtime** in your own words; it is checked against your records and the employer must decide before payday.
- **Report hazards** with a photo; dangerous ones can never be rated low.
- **Speak up anonymously.** Names and places are removed, your words are not kept, and nothing shows until five people have spoken.
- **Confirm what you were paid, and when.** If it is less than the payslip, or a salary arrives after the legal deadline, the owner sees it.
- **Leave and work from home.** See your balances, ask for leave in two taps; every request and decision is sealed into your record. On an approved work-from-home day you check in from home without being flagged.
- **Raise a confidential complaint** about harassment. It goes only to the Internal Committee (POSH Act), never to your manager or the owner, and you can exclude committee members.

## For employers

- Set up a site or an office in minutes: boundary from your own location, zones, shift times, weekly or monthly pay, weekly offs.
- Pay people by the hour, by the day, or a monthly salary with PF, ESI, professional tax and TDS lines; extra hours paid as overtime or given back as comp-off.
- Approve leave and work-from-home days; see who is away today.
- Burnout signals for office staff: late nights, work on days off, months without leave.
- Name an Internal Committee; the dashboard shows only how many complaints are open or overdue.
- A gate screen whose code changes every 30 seconds, or a printable poster.
- A dashboard of what needs action: hazards with deadlines, claims before payday, new phones to approve, wages to set, near-miss hotspots, fatigue and attrition signals, team feedback.
- Corrections with a required reason. The original stays in the record.

## Catching false claims, on both sides

Every check-in carries evidence: a precise location against the site boundary, the rotating gate code, a signature from the worker's approved phone, and (in the Android app) Google's device check. Doubtful records are **kept and flagged for a person to review**, never silently accepted or thrown away.

| Questions the worker's record | Questions the employer's record |
|---|---|
| Away from site, fake (mock) location, imprecise location | An edit that contradicts a signed, on-site checkout |
| Old or foreign gate code, no gate code | Hours cut within two days of payday |
| Unapproved phone, phone clock wrong | One person repeatedly cutting hours |
| Overtime on a day with no check-in, more hours than fit in a day, duplicate claims, no co-worker on site that late | Payment lower than the payslip, as confirmed by the worker |
| Hazard reported away from the zone or without a photo | Hazard marked fixed without a photo, or disputed by the reporter |
| | Approved leave withdrawn, salary paid after the 7th, no Internal Committee at 10+ people, complaint inquiry past 90 days |

Nobody can close a flag about themselves, and flags about the employer can only be closed by the owner.

## Stack

- **Client:** React 18, TypeScript, Vite. Plain CSS design tokens mirrored from Figma. WebCrypto for device keys. Installable, with an offline app shell.
- **Server:** Node 20, Express, zod, helmet. Firebase ID tokens verified with `jose`.
- **Google Cloud:** Cloud Run, Firestore (one document per record, chains appended in transactions), Gemini on Vertex AI (no API keys), Firebase Authentication (phone and Google).
- **Rules:** pure, tested functions in `src/shared/rules/`: hours, pay, claims, severity floor, fatigue, anonymity, fact check, evidence flags.

## Develop

```bash
npm ci
npm test               # unit, API and end-to-end flow tests
npm run lint && npm run typecheck
npm run build
AUTH_MODE=dev STORE=memory npm start   # http://localhost:8080 with developer sign-in
```

Deploying, including the Firebase sign-in setup: [`DEPLOY.md`](DEPLOY.md). Threat model: [`SECURITY.md`](SECURITY.md).

---

Shiftseal began as a Top 10 entry at Prompt Wars 2026 (UN SDG 8, decent work). Labour defaults follow India's labour codes (8 h a day, 48 h a week, overtime at twice the rate); every threshold is configurable per state and sector, and policy values are labelled as policy, not law.
