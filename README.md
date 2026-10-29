# FAKELENS: frontend prototype + FastAPI backend

This repository contains the FAKELENS React/Vite frontend and a FastAPI backend. The backend includes registration/login (JWT), heuristic text checks, audit storage, guidelines, settings, assets, review endpoints, and analytics.

## Important: repository layout

`main.py`, `requirements.txt`, and `render.yaml` are in the repository root. The Render service must therefore use a **blank Root Directory**. Do not set it to `backend`.

## Deploy the API to Render

1. Push/commit this repository to GitHub.
2. In Render, create or open a **Python Web Service** connected to this repository.
3. Set **Root Directory** to blank.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
6. Add environment variable `JWT_SECRET` with a long random secret.
7. For a basic demo, `CORS_ORIGINS` can be `*`; for deployment with a frontend, restrict it to the exact frontend origin.
8. Deploy and wait for the service to report **Live**.

The `render.yaml` is aligned with this root-level layout. If a Render service was created manually, verify its settings directly; editing this file does not necessarily change settings on an existing service unless the service is managed/synced from the Blueprint.

## Verify deployment

Open these URLs using your actual Render service domain:

- `/` should return JSON with `name`, `version`, `docs`, and `health`.
- `/api/health` should return JSON containing `"connected": true`.
- `/docs` should open FastAPI's interactive API documentation.

If all three return `Not Found`, confirm Render is connected to the intended GitHub repository and branch, inspect the latest deploy commit and logs, and confirm the Start Command is exactly as above. The code in this repository defines all three routes.

## Run locally on Windows (PowerShell)

Open PowerShell in the folder containing `main.py` and `requirements.txt`, then run these commands one by one (or paste the full block):

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:JWT_SECRET = "use-a-long-random-secret-for-local-testing"
python -m uvicorn main:app --reload
```

If PowerShell blocks virtual-environment activation, use Command Prompt instead:

```bat
py -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
set JWT_SECRET=use-a-long-random-secret-for-local-testing
python -m uvicorn main:app --reload
```

Then open `http://127.0.0.1:8000/docs` or `http://127.0.0.1:8000/api/health`. Keep the terminal open while testing.

## Frontend

The React/Vite frontend runs separately with `npm install` and `npm run dev`. Its API client currently marks the backend as disconnected, so deploying this ZIP does **not by itself connect all frontend screens to the backend**. API/backend deployment and frontend integration are separate tasks.

## Features and limitations

- Authentication: register/login and bearer-token protected endpoints.
- Audits: upload text-friendly files and run transparent keyword/heuristic checks.
- Guidelines, settings, assets, review/comment/event endpoints, and analytics.
- This is an MVP prototype, not a production-hardened service. The audit logic is not an LLM, verified fact-checking, legal review, OCR, or image/logo analysis. PDF/image text extraction is not implemented.
- SQLite and local uploaded files on Render require persistent storage for durability. Without a mounted persistent disk, data can be lost on redeploy/restart.
- New accounts are `creator`; reviewer-only endpoints require a reviewer/manager/admin role assigned securely by an administrator.

Do not use confidential or sensitive uploads until production security, retention, access control, and storage have been reviewed.
