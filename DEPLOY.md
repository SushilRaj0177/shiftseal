# Deploying Shiftseal to Google Cloud Run

Shiftseal is packaged as a single container serving both the Vite React client and the Express API + Gemini verification engine.

## Quick Deploy (Google Cloud Shell)

```bash
git clone https://github.com/SushilRaj0177/shiftseal.git && cd shiftseal
gcloud config set project promptwars-512900
gcloud run deploy shiftseal --source . --region asia-south1 --allow-unauthenticated \
  --set-env-vars STORE=firestore,GEMINI_MODEL=gemini-2.5-flash,GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## Updating an Existing Deployment

```bash
cd shiftseal && git pull
gcloud run deploy shiftseal --source . --region asia-south1 --allow-unauthenticated \
  --set-env-vars STORE=firestore,GEMINI_MODEL=gemini-2.5-flash,GEMINI_API_KEY=YOUR_GEMINI_KEY
```

> **Security Note:** Never commit your actual `GEMINI_API_KEY` to this file or any file in the repository. Always replace `YOUR_GEMINI_KEY` in the terminal command or Cloud Run environment variables.
