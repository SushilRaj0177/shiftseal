# Deploying Shiftseal

Shiftseal runs on Google Cloud Run, with Firestore for data, Vertex AI (Gemini) for language understanding, and Firebase Authentication for sign-in. The same Google Cloud project hosts all four.

## 1. One-time Google Cloud setup

In Cloud Shell:

```bash
gcloud config set project promptwars-512900
gcloud services enable aiplatform.googleapis.com firestore.googleapis.com identitytoolkit.googleapis.com
PROJECT_NUMBER=$(gcloud projects describe promptwars-512900 --format="value(projectNumber)")
for ROLE in roles/aiplatform.user roles/datastore.user; do
  gcloud projects add-iam-policy-binding promptwars-512900 \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="$ROLE"
done
```

## 2. One-time Firebase setup (sign-in)

1. Open https://console.firebase.google.com, choose **Add project**, and pick the existing Google Cloud project `promptwars-512900`.
2. **Build > Authentication > Get started.** Under **Sign-in method**, enable **Phone** and **Google**.
3. Phone sign-in sends real SMS, which needs the project on the **Blaze** (pay as you go) plan. Firebase lists the current free allowance and price per SMS on its pricing page. Set a budget alert in Cloud Billing.
4. **Authentication > Settings > Authorized domains:** add `shiftseal-872210045960.asia-south1.run.app` (and any custom domain).
5. **Project settings > General > Your apps > Add app > Web.** Copy `apiKey` and `authDomain` from the config it shows. These identify the project and are safe to serve to browsers; access is controlled by Firebase and our server.

## 3. Deploy

```bash
cd ~/shiftseal && git fetch origin main && git reset --hard origin/main
gcloud run deploy shiftseal --source . --region asia-south1 --allow-unauthenticated \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=promptwars-512900,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=gemini-3.8-flash,STORE=firestore,FIREBASE_PROJECT_ID=promptwars-512900,FIREBASE_WEB_API_KEY=<apiKey>,FIREBASE_AUTH_DOMAIN=<authDomain>
```

`SESSION_SECRET` (already set on the service) must stay the same across deploys: it signs workers' receipts and the gate codes. The server refuses to start in production without it, or in developer sign-in mode.

## Running locally

```bash
npm ci
npm run build
AUTH_MODE=dev STORE=memory npm start   # http://localhost:8080, developer sign-in, data in memory
```
