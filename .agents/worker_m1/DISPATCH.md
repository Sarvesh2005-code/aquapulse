# Dispatch — worker_m1

## Task
Implement Milestone 1: Backend ML Integration, Dependency Setup, and Automated Backend Test.

## Working Directory
`C:\Dev\Projects\Web-Projects\aquapulse\.agents\worker_m1`

## Mandatory Documents to Read
- `C:\Dev\Projects\Web-Projects\aquapulse\.agents\ORIGINAL_REQUEST.md`
- `C:\Dev\Projects\Web-Projects\aquapulse\.agents\orchestrator_1\PROJECT.md`
- `C:\Dev\Projects\Web-Projects\aquapulse\.agents\explorer_survey_1\survey_ml.md`
- `C:\Dev\Projects\Web-Projects\aquapulse\.agents\explorer_survey_2\survey_backend.md`

## Exclusive Write Ownership
You exclusively own and may modify:
- `backend/requirements.txt`
- `backend/main.py`
- `backend/test_backend.py`
- `backend/skin_risk_model.pkl`
Do NOT modify files outside `backend/` or `.agents/worker_m1/`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Requirements
1. `backend/requirements.txt`:
   Ensure `fastapi`, `uvicorn`, `pydantic`, `scikit-learn==1.6.1`, `pandas`, `numpy`, `SQLAlchemy`, `joblib`, `httpx` are listed.
2. Copy `ml model/skin_risk_model.pkl` to `backend/skin_risk_model.pkl` for self-contained deployment.
3. In `backend/main.py`:
   - Implement robust multi-candidate model path search (env var, `backend/skin_risk_model.pkl`, `../ml model/skin_risk_model.pkl`, `ml model/skin_risk_model.pkl`).
   - Anchor `SQLALCHEMY_DATABASE_URL` using `os.path.dirname(os.path.abspath(__file__))` so the SQLite database path does not vary with current working directory.
   - Ensure `GET /api/analysis` returns `skin_risk` (predicted by model) and `potability` ("Safe for Drinking" / "Not Safe for Drinking") as specified in PROJECT.md.
4. Dependency Installation:
   Run `backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt` to install all dependencies into the virtual environment.
5. Automated Test Script:
   Create `backend/test_backend.py` that starts uvicorn, posts sensor data, queries `GET /api/analysis`, verifies HTTP 200 and schema with `skin_risk` and `potability`, and cleanly shuts down the server.
6. Run Verification:
   Execute `backend\venv\Scripts\python.exe backend\test_backend.py` and ensure exit code 0.
7. Output:
   Write comprehensive report and test outputs to `C:\Dev\Projects\Web-Projects\aquapulse\.agents\worker_m1\handoff.md` and send a completion message to the orchestrator.
