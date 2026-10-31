# Shiftseal

**Every hour counted. Every rupee explained.** Tamper-evident work records for shift workers, office staff, and the people who employ them.

[![CI](https://github.com/SushilRaj0177/shiftseal/actions/workflows/ci.yml/badge.svg)](https://github.com/SushilRaj0177/shiftseal/actions/workflows/ci.yml)

> **Principle:** the AI understands, code decides, and nothing reaches a worker unchecked.

Whether it is a construction site, a campus or an office, someone else usually keeps the record of a person's time: hours, overtime, leave, salary dates. Overtime disappears, approved leave gets withdrawn, salaries arrive late, complaints carry risk, and hazards are reported after someone is hurt. Shiftseal gives each person their own proof, and gives the employer evidence they can stand behind.

How it works: [`ARCHITECTURE.md`](ARCHITECTURE.md) · Designs: [Figma](https://www.figma.com/design/viMV0sdG4YQXTDyAN6qucK) · System model: [FigJam](https://www.figma.com/board/DXbOejYuuG4GDZP0KnsHtc)

**Live demo:** https://shiftseal-872210045960.asia-south1.run.app

## Screenshots

| Welcome | Worker home | Pay, line by line | Report a hazard |
| --- | --- | --- | --- |
| ![Welcome screen with a sealed time card](docs/screenshots/welcome.png) | ![Worker home: today's shift and the last 7 days](docs/screenshots/worker-home.png) | ![Pay: net pay and how it adds up](docs/screenshots/worker-pay.png) | ![Reporting a hazard in three steps](docs/screenshots/worker-report.png) |

| Leave balances | Dark mode | Employer dashboard |
| --- | --- | --- |
| ![Leave balances and requests](docs/screenshots/worker-leave.png) | ![Worker home in dark mode](docs/screenshots/worker-home-dark.png) | ![Employer overview on a desktop](docs/screenshots/employer-dashboard.png) |

---

## For workers

Both apps are in English (India, UK, US), Tamil, Hindi, Spanish (Spain, Mexico), French, German, Portuguese (Brazil, Portugal), Japanese, Chinese (Simplified) and Korean. The rules, the currency and the legal wording come from the workplace's country, not the reader's language: a Tamil speaker working in Tokyo sees Japan's 36-agreement overtime caps and 年次有給休暇, in English where Tamil has no legal term.

- **Sign in with your phone number.** Join your workplace by scanning the poster at the gate or typing the invite code.
- **Check in at the gate.** Scan the code, and your phone signs the record and keeps its own copy. Works without a signal: the check is saved and sent later.
- **See every change.** If a supervisor corrects your hours, you are told immediately, with their reason, and can disagree in one tap.
- **A payslip you can follow.** Every line is marked *law* or *workplace policy*. Ask why your pay changed, by voice or text, in your language. Every number in the answer is checked.
- **Claim missed overtime** in your own words; it is checked against your records and the employer must decide before payday.
- **Report hazards** with a photo; dangerous ones can never be rated low.
- **Speak up anonymously.** Names and places are removed, your words are not kept, and nothing shows until five people have spoken.
- **Confirm what you were paid, and when.** If it is less than the payslip, or a salary arrives after the legal deadline, the owner sees it.
- **Leave and work from home.** See your balances, ask for leave in two taps; every request and decision is sealed into your record. On an approved work-from-home day you check in from home without being flagged.
- **Raise a confidential complaint** about harassment. It goes only to the people the law in your country says must receive it (India's Internal Committee, Japan's 相談窓口, France's référent harcèlement, Germany's AGG Beschwerdestelle, ...), never to your manager or the owner, and you can exclude any of them. The outside bodies you can go to are listed too.

## For employers

- Set up a site or an office in minutes: boundary from your own location, zones, shift times, weekly or monthly pay, weekly offs.
- Pay people by the hour, by the day, or a monthly salary, weekly to monthly as the country allows, with that country's usual deductions (PF and ESI, 健康保険 and 厚生年金, INSS and IRRF, PAYE and National Insurance, ...); extra hours paid at the legal rate, or given back as time off where the law allows it.
- Approve leave and work-from-home days; see who is away today.
- Burnout signals for office staff: late nights, work on days off, months without leave.
- Name the people who receive harassment complaints, as your country requires; the dashboard shows only how many complaints are open or overdue.
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
| | Approved leave withdrawn, pay after the country's legal deadline, nobody named to receive harassment complaints where the law requires it, overdue inquiries, someone over a legal working-time limit |

Nobody can close a flag about themselves, and flags about the employer can only be closed by the owner.

## Stack

- **Client:** React 18, TypeScript, Vite. Plain CSS design tokens mirrored from Figma. WebCrypto for device keys. Installable, with an offline app shell.
- **Server:** Node 20, Express, zod, helmet. Firebase ID tokens verified with `jose`.
- **Google Cloud:** Cloud Run, Firestore (one document per record, chains appended in transactions), Gemini on Vertex AI (no API keys), Firebase Authentication (phone and Google).
- **Rules:** pure, tested functions in `src/shared/rules/`: hours, pay, claims, severity floor, fatigue, anonymity, fact check, evidence flags.

## Setup and running

**You need:** Node.js 20.6 or newer and npm. Nothing else is needed to run it locally: no database, no Firebase project and no API key.

```bash
git clone https://github.com/SushilRaj0177/shiftseal.git
cd shiftseal
npm ci
cp .env.example .env      # local defaults: in-memory store, developer sign-in
npm run build
npm run start:local       # http://localhost:8080
```

Open http://localhost:8080, pick **I manage a workplace** to create one, then open the invite code in a second browser window as a worker. Developer sign-in asks only for a user id; the server refuses to start with it in production.

Without a Gemini key, every AI step (voice, hazard reports, claims, payslip questions) falls back to a safe rule-based answer, so the whole app still works.

### Environment variables

All of them are listed, with comments, in [`.env.example`](.env.example). The server validates them at startup and stops with a clear message if one is wrong.

| Variable | Needed for | What it does |
| --- | --- | --- |
| `NODE_ENV` | always | `development`, `test` or `production` |
| `PORT` | always | HTTP port, default `8080` |
| `STORE` | always | `memory` (local) or `firestore` (production) |
| `AUTH_MODE` | always | `dev` (local sign-in) or `firebase` (phone and Google sign-in) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, `FIREBASE_AUTH_DOMAIN` | `AUTH_MODE=firebase` | Firebase web app settings (public identifiers) |
| `SESSION_SECRET` | production | 32+ random characters for signing sessions and gate codes |
| `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | Firestore, Vertex AI | Google Cloud project and region |
| `GOOGLE_GENAI_USE_VERTEXAI`, `GEMINI_MODEL` | AI features | `true` uses Vertex AI with the service account (no key) |
| `GEMINI_API_KEY` | AI without Vertex | Only when `GOOGLE_GENAI_USE_VERTEXAI=false`; never commit it |
| `ANDROID_PACKAGE`, `ANDROID_CERT_SHA256` | Android app | Turn on Play Integrity checks and app links |

### Checks

```bash
npm test                  # 177 unit, API and end-to-end flow tests
npm run lint
npm run typecheck
npm run format:check
```

CI runs all of them on every push. Deploying to Cloud Run, including the Firebase sign-in setup: [`DEPLOY.md`](DEPLOY.md). Threat model: [`SECURITY.md`](SECURITY.md).

### Android app

The app in `android/` wraps the website and adds a mock-location check, Play Integrity and native Google sign-in. It needs the Android SDK and JDK 17:

```bash
cd android && ./gradlew assembleDebug   # app/build/outputs/apk/debug/app-debug.apk
```

It opens the deployed site (`-PshiftsealUrl=https://...` for another). Publishing on Google Play, step by step: [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md). The icon and its seasonal versions: [`docs/BRAND.md`](docs/BRAND.md). `android/app/debug.keystore` is the standard public Android debug key (password `android`), kept so debug builds have a stable fingerprint; release keys are never in the repository.

## Project structure

```
src/
  client/      React app: worker/, employer/, auth/, ui/, i18n/ (10 languages), styles/
  server/      Express API: routes/, services/, auth/, gemini/, data/ (memory and Firestore stores)
  shared/      Code both sides use: rules/ (hours, pay, claims, flags), countries/ (12 law packs),
               ledger/ (hash-chained records), zod schemas
tests/         client, server and shared tests (Vitest)
android/       Android app (Java, WebView shell)
docs/          architecture decisions and screenshots
```

**Privacy:** [`privacy.html`](public/privacy.html) (served at `/privacy.html`). Anyone can delete their account in Settings.

**Validation and errors:** every API request body is checked against a zod schema (`src/shared/apiSchemas.ts`) and rejected with a clear message when invalid. Errors come back in one shape (`{ error, message }`) without stack traces or secrets. The app shows them in place and keeps check-ins in an offline queue until they reach the server.

## Countries

Each country is a pack in `src/shared/countries/` with sourced rules (statute and article), and its own wording in `src/client/i18n/countries/`. Policy values are labelled as policy, not law.

| Country | Overtime | Legal limits shown | Leave | Harassment complaints go to |
| --- | --- | --- | --- | --- |
| India | after 8 h/day or 48 h/week, 2× | 48 h week | casual, sick, earned (policy) | Internal Committee (POSH Act), 10+ people |
| Japan | after 8 h/40 h, +25%, +50% past 60 h/month; legal rest day +35%; night +25% | 36 agreement: 45 h/month, 360 h/year, under 100 h | 年休 by service (10–20 days) | 相談窓口 (every employer) |
| South Korea | after 8 h/40 h, +50%; holidays +50%/+100%; night +50%; paid weekly rest day | 52 h week | 연차 by service (up to 25) | designated staff, 5+ employees |
| China | after 8 h/40 h, 150%; rest days 200%; public holidays 300% | 36 h overtime a month, 3 h a day | 年休假 by working years (5/10/15) | complaint channel (every employer) |
| France | after 35 h, +25% for 8 h then +50% | 10 h day, 48 h week, 44 h over 12 weeks | 25 days congés payés | référent harcèlement, 11+ |
| Germany | contract (no statutory premium); night supplement | 10 h day, 48 h over 6 months | 20 days minimum | AGG Beschwerdestelle |
| Spain | over 40 h, at least the ordinary rate | 80 overtime h/year, 9 h day | 30 calendar days | protocolo de acoso |
| Mexico | first 9 h a week double, then triple; Sunday premium; 48 h week stepping to 40 by 2030 | 9 overtime h/week, 3/day | vacaciones dignas by service; aguinaldo, PTU | protocol (LFT art. 132 XXXI) |
| Brazil | after 8 h/44 h, +50%; Sunday 100%; night +20% with a 52½-minute hour | 2 overtime h/day | 30 days férias; 13º salário | CIPA reporting channel |
| Portugal | +25% first hour, +37.5% after; more past 100 h/year; rest days +50% | 150 h/year, 2 h/day | 22 working days; subsídios | code of conduct, 7+ |
| UK | contract (no statutory premium) | 48 h average over 17 weeks | 28 days | duty to prevent sexual harassment; ACAS |
| US | after 40 h, 1.5× (California: daily 8 h, 2× after 12, seventh day) | 40 h workweek | PTO and sick time (California, New York rules) | Title VII; EEOC, CRD, NYS DHR |


### Students and young workers

Shops, cafés and convenience stores are a sector of their own. A worker can say in Settings that they study, or study on a student visa, and give their date of birth. Visa caps count **every job they hold**, so hours at another Shiftseal workplace are added in. The employer sees a badge, never the birth date, and is flagged when a check-out goes over a cap or keeps an under-18 at night.

| Country | Student visa cap tracked | Under 18 |
| --- | --- | --- |
| Japan | 28 h in any 7 days, all jobs; 8 h/day in official long breaks | 8 h/day, 40 h/week, no 22:00–5:00 |
| South Korea | 25 weekday h (TOPIK-dependent; weekends and vacations free) | 7 h/day, 35 h/week |
| France | 964 h/year | 8 h/day, 35 h/week, no 22:00–6:00 (20:00 under 16) |
| Germany | 140 full or 280 half days/year | 8 h/day, 40 h/week, no 20:00–6:00 |
| Spain | 30 h/week | 8 h/day, no overtime, no night work |
| UK | 20 h/week in term | 8 h/day, 40 h/week, no 22:00–6:00 |
| US | 20 h/week on campus in term (F-1) | under 16: 18 h school week, no work 19:00–7:00 |
| India, China, Mexico, Brazil, Portugal | described, not metered | hazardous work, overtime and night rules as each law sets |

---

Shiftseal began as a Top 10 entry at Prompt Wars 2026 (UN SDG 8, decent work).
