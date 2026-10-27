# Deploying Shiftseal to Google Cloud Run (Vertex AI + Firestore)

Shiftseal runs on Google Cloud Run using Vertex AI (`@google/genai` with `vertexai: true`) and Cloud Firestore.

## 1. Enable Vertex AI & Grant Service Account Permissions

Run in Google Cloud Shell:

```bash
gcloud config set project promptwars-512900
gcloud services enable aiplatform.googleapis.com firestore.googleapis.com
PROJECT_NUMBER=$(gcloud projects describe promptwars-512900 --format="value(projectNumber)")
gcloud projects add-iam-policy-binding promptwars-512900 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding promptwars-512900 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## 2. Deploy to Cloud Run

```bash
git clone https://github.com/SushilRaj0177/shiftseal.git && cd shiftseal
# Or if already cloned: cd shiftseal && git pull --rebase origin main
gcloud run deploy shiftseal --source . --region asia-south1 --allow-unauthenticated \
  --remove-env-vars GEMINI_API_KEY \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=promptwars-512900,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=gemini-3.8-flash,STORE=firestore
```
