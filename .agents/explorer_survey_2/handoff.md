# Handoff Report — explorer_survey_2: Backend Survey & ML Integration Assessment

## 1. Observation

### 1.1 `backend/main.py` Analysis
- **Model Loading (`backend/main.py:12-18`)**:
  ```python
  model_path = os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")
  try:
      model = joblib.load(model_path)
  except Exception as e:
      print(f"Error loading model: {e}")
      model = None
  ```
- **Database Configuration (`backend/main.py:21`)**:
  ```python
  SQLALCHEMY_DATABASE_URL = "sqlite:///./aquapulse.db"
  ```
  `aquapulse.db` exists in both `C:\Dev\Projects\Web-Projects\aquapulse\aquapulse.db` and `C:\Dev\Projects\Web-Projects\aquapulse\backend\aquapulse.db` (both 12,288 bytes).
- **Pydantic Schemas (`backend/main.py:57-71`)**:
  ```python
  class SensorData(BaseModel):
      ph: float
      tds: float
      turbidity: float
      temperature: float

  class HealthAnalysis(BaseModel):
      health_score: int
      quality_class: str
      risk_level: str
      plant_suitability: List[str]
      appliance_impact: List[str]
      skin_risk: str
      potability: str
  ```
- **Endpoint `GET /api/analysis` (`backend/main.py:101-160`)**:
  - Signature: `def get_analysis(db: Session = Depends(get_db)):`
  - Fallback when no data exists in SQLite:
    ```python
    if not latest:
        return {
            "health_score": 0,
            "quality_class": "Unknown",
            "risk_level": "Unknown",
            "plant_suitability": [],
            "appliance_impact": [],
            "skin_risk": "Unknown",
            "potability": "Unknown"
        }
    ```
  - ML Inference when record exists:
    ```python
    input_df = pd.DataFrame([[latest.ph, latest.tds, latest.turbidity, latest.temperature]], 
                            columns=['pH', 'TDS', 'Turbidity', 'Temperature'])
    skin_risk_result = str(model.predict(input_df)[0])
    ```
  - Potability calculation:
    ```python
    is_potable = (6.5 <= latest.ph <= 8.5) and (latest.tds <= 500) and (latest.turbidity <= 5.0)
    potability_result = "Safe for Drinking" if is_potable else "Not Safe for Drinking"
    ```
- **Existing Endpoints**:
  - `GET /`: `{"message": "AquaPulse API is online!"}`
  - `POST /api/sensor-data`: accepts `SensorData`, inserts into `sensor_data` table, returns `{"message": "Data saved to database successfully", "id": db_entry.id}`.
  - `GET /api/latest-data`: returns latest `{ph, tds, turbidity, temperature, timestamp}` (or zeros if empty).
  - `GET /api/analysis`: returns `HealthAnalysis` model.

### 1.2 `backend/requirements.txt`
```text
fastapi
uvicorn
pydantic
scikit-learn
pandas
numpy
SQLAlchemy
joblib
```
All dependencies are unpinned. `httpx` and `pytest` are absent.

### 1.3 Execution & Virtual Environment Status
- Virtual environment is located at `C:\Dev\Projects\Web-Projects\aquapulse\backend\venv`.
- `pyvenv.cfg:1` specifies Python version `3.13.13` (runtime reports `Python 3.13.14`).
- Inspection of `backend\venv\Lib\site-packages` revealed only `pip` and `pip-26.0.1.dist-info`. The packages from `requirements.txt` are not yet installed in `backend/venv`.

### 1.4 ML Model & Dataset Assets
- Model file located at `C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl` (887,257 bytes).
- Prototype script located at `C:\Dev\Projects\Web-Projects\aquapulse\ml model\app.py` (3,028 bytes) which used serial port `COM3` and `joblib.load('skin_risk_model.pkl')`.
- Dataset located at `C:\Dev\Projects\Web-Projects\aquapulse\ml model\water_health_dataset.csv` with feature columns `pH,TDS,Turbidity,Temperature` and target classes:
  - `Bacterial / Fungal Infection Risk`
  - `Eczema / Skin Barrier Damage`
  - `Acidic Irritant Contact Dermatitis`
  - `Safe (No Skin Risk)`

---

## 2. Logic Chain

1. **Alignment with Requirements**:
   - Observation 1.1 shows that `backend/main.py` already includes model loading, input dataframe creation (`pH, TDS, Turbidity, Temperature`), ML prediction call `model.predict(input_df)`, potability determination (`Safe for Drinking` vs `Not Safe for Drinking`), and returns these fields inside `HealthAnalysis`.
   - Observation 1.4 confirms that the model features and target classes in `main.py` match `ml model/water_health_dataset.csv` and `frontend/src/App.tsx`.
2. **Fragility in Path Handling**:
   - Observation 1.1 reveals `model_path` uses `..` and a space-containing folder name (`"ml model"`). If `backend` is deployed as a standalone root directory (e.g. Render build root: `backend` as per `README.md:14`), the parent folder `ml model` will not exist in the build container, causing `model` to become `None`.
   - Observation 1.1 reveals `sqlite:///./aquapulse.db` creates or accesses the DB relative to `os.getcwd()`, leading to duplicate DB instances (root vs backend). Anchoring to `os.path.dirname(__file__)` resolves this cleanly.
3. **Environment Readiness**:
   - Observation 1.3 proves that `backend/venv` is unpopulated. Any execution of `uvicorn main:app` currently fails with `ModuleNotFoundError` until `pip install -r requirements.txt` is run.
4. **Testability**:
   - Observation 1.2 notes the absence of `httpx`. The acceptance criteria require a test script that starts the FastAPI server and checks `GET /api/analysis` for HTTP 200 and keys `skin_risk` and `potability`. A subprocess-based runner with standard library `urllib.request` or `requests`/`httpx` can execute this reliably.

---

## 3. Caveats

- `backend/venv` was inspected via filesystem listing and `pyvenv.cfg`. Running `pip install` was not performed because this task is strictly a read-only investigation.
- The binary contents of `skin_risk_model.pkl` could not be executed via Python because dependencies (`scikit-learn`, `joblib`) are not yet installed in `backend/venv`.
- Alternative interpretation: While `main.py` already contains the required endpoint code, it needs path hardening (for model file and sqlite db) and environment installation to satisfy end-to-end execution.

---

## 4. Conclusion

The FastAPI backend in `backend/main.py` already implements the required schema and logic for ML-driven skin risk prediction and potability calculation matching `ml model/` and `frontend/`. 
However, before it can pass verification and deploy reliably:
1. Dependencies must be installed in `backend/venv` via `pip install -r backend/requirements.txt`.
2. Model loading in `backend/main.py` should be hardened with multi-path fallback (supporting a local copy in `backend/` as well as `../ml model/`).
3. Database URL in `backend/main.py` should be anchored with an absolute path to avoid CWD-dependent database duplication.
4. An automated test script (`test_backend.py`) should be created to launch the server, query `/api/analysis`, assert status 200 and key presence, and exit cleanly.

---

## 5. Verification Method

1. **Verify Files Inspected**:
   - `backend/main.py`: Lines 12-18 (model loading), 57-71 (schemas), 101-160 (`/api/analysis` endpoint).
   - `backend/requirements.txt`: Lines 1-8.
   - `backend/venv/pyvenv.cfg`: Python 3.13 configuration.
   - `survey_backend.md`: Comprehensive survey report at `C:\Dev\Projects\Web-Projects\aquapulse\.agents\explorer_survey_2\survey_backend.md`.
2. **Independent Test Execution (For Worker Agent)**:
   - Install dependencies: `backend\venv\Scripts\pip.exe install -r backend\requirements.txt`
   - Start backend: `backend\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000` (cwd: `backend`)
   - Test endpoint: Send HTTP GET to `http://127.0.0.1:8000/api/analysis`
   - Invalidation Condition: If response status != 200 or response JSON is missing `skin_risk` or `potability`.
