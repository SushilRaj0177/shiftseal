# Publishing Shiftseal on Google Play

This is the full path from nothing to a public listing, with every answer the Play Console asks for. The code side is done: release signing, a signed bundle job in GitHub Actions, in-app account deletion, a privacy policy and the store images.

## What Google requires, and how long it takes

| Step | Time |
| --- | --- |
| Play Console developer account (one-time US$25, identity check) | a few hours to a few days |
| Internal testing (up to 100 testers you invite by email) | available as soon as the app is set up; usually live within minutes |
| Closed testing | a review of a few hours to a few days |
| Production (public listing) | for **new personal accounts**: only after a closed test with at least 12 testers who stay opted in for 14 days in a row, then a production review |

So the fastest public proof is an **internal or closed testing link**, which anyone you add can install from the Play Store. Start the closed test early so the 14 days run while you wait.

## 1. Create the developer account

1. Go to https://play.google.com/console/signup and sign in with the Google account that should own the app.
2. Choose **Yourself** (personal account) unless you have a registered organisation with a D-U-N-S number.
3. Pay the US$25 fee and complete identity verification. Keep the email you give as the **developer contact email**: Play shows it publicly on the listing.

## 2. Create the app

**Home → Create app**

| Field | Answer |
| --- | --- |
| App name | Shiftseal: Work Hours Record |
| Default language | English (United Kingdom) – en-GB, or English (India) if listed |
| App or game | App |
| Free or paid | Free |
| Declarations | tick both |

## 3. Upload the first build (internal testing)

1. **Testing → Internal testing → Create new release.**
2. When asked about app signing, keep **Use Google-generated key (recommended)**. Google holds the final signing key; you only keep the upload key.
3. Upload `app-release.aab` (version code 1).
4. Release name `1.0 (1)`. Release notes: `First release.`
5. **Testers** tab: create an email list with your team's Gmail addresses, save, then copy the **join link**. That link is the "available on Google Play" link for the README and the demo.

Every later upload needs a higher version code. Build one from GitHub: **Actions → Android → Run workflow**, enter the next version code (2, 3, …), then download `shiftseal-play-bundle`. That job needs two repository secrets, set once under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `UPLOAD_KEYSTORE_BASE64` | the upload key file, base64-encoded: `base64 -w0 shiftseal-upload.jks` (macOS: `base64 -i shiftseal-upload.jks`) |
| `UPLOAD_KEYSTORE_PASSWORD` | the password from `passwords.txt` |

To build locally instead, put the same values in `android/keystore.properties` (git-ignored):

```properties
storeFile=/full/path/to/shiftseal-upload.jks
storePassword=...
keyAlias=shiftseal-upload
keyPassword=...
```

then run `cd android && ./gradlew bundleRelease -PversionCode=2`.

**Keep the upload key and its password safe and private.** If they are lost, Play support can reset the upload key, but it takes days.

## 4. Connect the server to the Play-signed app

After the first upload, open **Test and release → App integrity → App signing**. Copy the **App signing key certificate** SHA-256 and SHA-1.

1. Cloud Shell (replace the fingerprint):
   ```bash
   gcloud run services update shiftseal --region asia-south1 \
     --update-env-vars ANDROID_PACKAGE=dev.sushilraj.shiftseal,ANDROID_CERT_SHA256=AA:BB:...
   ```
   This turns on Play Integrity checks and lets gate QR codes open the app.
2. **Play Integrity:** on the same App integrity page, under Play Integrity API, link the Google Cloud project `promptwars-512900`.
3. **Google sign-in in the app:** Firebase console → Project settings → **Your apps**. If there is no Android app yet, click **Add app → Android**, package name `dev.sushilraj.shiftseal`. Then **Add fingerprint** and paste the app signing **SHA-1**.

## 5. Store listing

**Grow users → Store presence → Main store listing**

**App name** (30): `Shiftseal: Work Hours Record`

**Short description** (80):
`Sealed shift records, fair pay and safe reporting for workers and employers.`

**Full description:**

```
Shiftseal gives every worker their own proof of the hours they worked, and gives employers records they can stand behind.

FOR WORKERS
• Check in by scanning the gate QR code. Each check is signed on your phone and sealed into a record nobody can quietly change.
• See every hour, every overtime rule and every deduction on your pay, line by line, with the law it comes from.
• Ask for leave, claim missed overtime and report hazards by typing or just speaking, in your own language.
• Speak up anonymously: names are removed, and your employer only sees feedback in groups.
• Students and young workers: visa hour caps and under-18 limits are tracked across every job you hold.

FOR EMPLOYERS
• See who is on site, what needs a decision, and every change with its reason.
• Payroll follows the country's rules for overtime, night work, rest days and leave.
• Hazard reports arrive with photos and a deadline to respond.

BUILT FOR 12 COUNTRIES AND 10 LANGUAGES
India, Japan, South Korea, China, France, Germany, Spain, Mexico, Brazil, Portugal, the UK and the US, in English, Tamil, Hindi, Spanish, French, German, Portuguese, Japanese, Chinese and Korean.

Shiftseal never tracks your location in the background. Location is read only at the moment you check in or out.
```

**Graphics** (files are in the `play-assets` folder you were sent):

| Asset | File |
| --- | --- |
| App icon, 512 × 512 | `icon-512.png` |
| Feature graphic, 1024 × 500 | `feature-graphic.png` |
| Phone screenshots, 1080 × 1920 | `play-light-0.png` … `play-light-5.png` |

**Category:** Business. **Tags:** time tracking, attendance, payroll. **Website:** the live site URL. **Privacy policy:** `https://shiftseal-872210045960.asia-south1.run.app/privacy.html`

## 6. App content (Policy → App content)

**Privacy policy:** the URL above.

**App access:** *All or some functionality is restricted.* Add instructions:

```
Sign in with phone number +91 99999 00000 and code 000000 (a Firebase test number).
To see the employer side, choose "I manage a workplace" and create one.
To see the worker side, sign in on a second device with any other phone number and enter the invite code shown under "Invite & gate".
Location can be anywhere; checks outside the site are recorded and flagged, not blocked.
```

**Ads:** No ads.

**Content rating:** start the questionnaire, category **Utility, Productivity, Communication, or Other**. Answer **No** to violence, sexual content, language, controlled substances and gambling. To "Can users interact or exchange content?" answer **Yes** (workers send reports and feedback to their employer). To "Does the app share the user's current physical location with other users?" answer **Yes** (the check-in location is part of the record the employer sees). Expected rating: Everyone / PEGI 3 with "Users interact" and "Shares location".

**Target audience:** 16–17 and 18 and over. The app is for workers and employers, not children.

**News app:** No. **Government app:** No. **Financial features:** My app doesn't provide any financial features. **Health:** none.

**Data safety:**

| Question | Answer |
| --- | --- |
| Does your app collect or share user data? | Yes |
| Is all data encrypted in transit? | Yes |
| Do you provide a way to request deletion? | Yes, in the app (Settings → Delete my account) and at `…/privacy.html#delete` |

Data collected (none of it is *shared*: Google Cloud, Firebase and Vertex AI are service providers, which Play does not count as sharing):

| Data type | Collected | Optional? | Purposes |
| --- | --- | --- | --- |
| Personal info → Name | Yes | Required | App functionality, Account management |
| Personal info → Email address | Yes (Google sign-in) | Optional | Account management |
| Personal info → Phone number | Yes | Optional | Account management |
| Personal info → User IDs | Yes | Required | Account management |
| Personal info → Other info (date of birth, student status) | Yes | Optional | App functionality |
| Financial info → Other financial info (wage rates and pay records) | Yes | Required | App functionality |
| Location → Precise location | Yes | Required | App functionality, Fraud prevention |
| Photos and videos → Photos | Yes | Optional | App functionality |
| Audio → Voice or sound recordings | Yes, **processed ephemerally** | Optional | App functionality |
| App activity → Other user-generated content | Yes | Optional | App functionality |
| Device or other IDs | Yes | Required | Fraud prevention, Security |

**Account deletion URL:** `https://shiftseal-872210045960.asia-south1.run.app/privacy.html#delete`

## 7. Closed testing, then production

1. **Testing → Closed testing → Create track**, add the same bundle, add at least 12 testers (an email list or a Google Group), and send them the join link. Each must install the app and keep it installed.
2. Send the release for review (**Publishing overview → Send for review**).
3. After 14 days with 12+ opted-in testers, **Dashboard → Apply for production** answers a few questions about the test; once approved, promote the release to Production.
