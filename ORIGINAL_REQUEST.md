# Original User Request

## 2026-09-07T02:00:35Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

AquaPulse UI/UX changes and backend ML integration. The project checks water quality (potability) and predicts hair/skin disease risks using an AI model.

Working directory: C:\Dev\Projects\Web-Projects\aquapulse
Integrity mode: development

## Requirements

### R1. Backend ML Integration (`backend/main.py`)
Integrate the existing ML model (`skin_risk_model.pkl` and pandas preprocessing logic from `ml model/app.py`) directly into the main FastAPI backend. Update the `/api/analysis` endpoint to return the ML-predicted `skin_risk` and calculated `potability` ("Safe for Drinking" / "Not Safe for Drinking") instead of just the mock rule-based logic. Make sure to update `backend/requirements.txt` with necessary dependencies (e.g., pandas, joblib, scikit-learn).

### R2. Frontend Mapping Logic (`frontend/src/App.tsx`)
Add a frontend mapping mechanism that takes the `skin_risk` returned by the backend and maps it to a list of recommended remedies or actions.

### R3. Frontend UI Changes (`frontend/src/App.tsx`)
On the main Overview dashboard page, add a new "Health Impact & Remedies" card (or update the existing AI Health Analysis card) designed with Tailwind CSS to match the existing styling. The card should prominently display the Water Potability status, the Skin/Hair Disease Risk, and list the Remedies based on the risk.

## Acceptance Criteria

### Backend Verification
- [ ] A test script can successfully start the FastAPI server and send a request to `/api/analysis`.
- [ ] The response is HTTP 200 and the JSON payload contains `skin_risk` and `potability` keys.

### Frontend Verification
- [ ] The frontend compiles successfully without errors (`npm run build` or `vite build`).

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*
