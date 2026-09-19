# Backend Code & Environment Survey: AquaPulse

**Author**: explorer_survey_2  
**Date**: 2026-09-07  
**Working Directory**: `C:\Dev\Projects\Web-Projects\aquapulse\.agents\explorer_survey_2`  
**Target Directory**: `backend/`

---

## 1. Executive Summary

A comprehensive, read-only survey of `backend/` was conducted to investigate the current architecture, endpoints, data schemas, dependencies, execution environment, and ML model integration.

### Core Discoveries:
1. **Partial / In-Progress Integration**: `backend/main.py` already includes an initial integration of the ML model (`skin_risk_model.pkl` loaded via `joblib`) and calculates `potability` and `skin_risk` in `GET /api/analysis`.
2. **Current Schema & Contract**: `GET /api/analysis` returns a Pydantic `HealthAnalysis` model containing `health_score`, `quality_class`, `risk_level`, `plant_suitability`, `appliance_impact`, `skin_risk`, and `potability`. The keys match the frontend expectations in `frontend/src/App.tsx`.
3. **Model Path Sensitivity**: The model path in `backend/main.py:13` is currently `os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")`. While this works in a local repository clone, it will fail if `backend/` is deployed standalone (e.g. Render with root directory `backend/`, as documented in `README.md`).
4. **Database Working-Directory Dependency**: Line 21 defines `SQLALCHEMY_DATABASE_URL = "sqlite:///./aquapulse.db"`. This creates or looks for `aquapulse.db` relative to `os.getcwd()`. There are currently two distinct database files in the repository: `C:\Dev\Projects\Web-Projects\aquapulse\aquapulse.db` (root) and `C:\Dev\Projects\Web-Projects\aquapulse\backend\aquapulse.db`.
5. **Virtual Environment Status**: `backend/venv` was created with Python 3.13.14 (`pyvenv.cfg` points to `PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0`). However, `backend/venv/Lib/site-packages` only contains `pip 26.0.1`; none of the packages in `requirements.txt` have been installed into this venv yet.
6. **Requirements & Test Dependencies**: `backend/requirements.txt` lists unpinned dependencies (`fastapi`, `uvicorn`, `pydantic`, `scikit-learn`, `pandas`, `numpy`, `SQLAlchemy`, `joblib`). It lacks `httpx` (required if FastAPI `TestClient` is used for in-process testing) or `pytest`.

---

## 2. Deep Dive: `backend/main.py`

### 2.1 Code Structure Overview

`backend/main.py` has 164 lines organized as follows:
- **Lines 1–10: Imports**:
  - FastAPI framework (`FastAPI`, `HTTPException`, `Depends`, `CORSMiddleware`)
  - Validation (`pydantic.BaseModel`, `typing.List`)
  - Data & ML libraries (`pandas as pd`, `joblib`)
  - Database ORM (`sqlalchemy` create_engine, declarative_base, sessionmaker, Session, Columns)
- **Lines 12–18: Model Initialization**:
  ```python
  model_path = os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")
  try:
      model = joblib.load(model_path)
  except Exception as e:
      print(f"Error loading model: {e}")
      model = None
  ```
- **Lines 20–35: Database Setup & ORM Model**:
  - SQLite database at `"sqlite:///./aquapulse.db"` with `check_same_thread=False`.
  - Table `sensor_data` mapping to `SensorDataDB`.
- **Lines 38–43: Database Dependency**:
  - `get_db()` generator yielding a session and ensuring cleanup in `finally: db.close()`.
- **Lines 45–54: FastAPI Initialization & CORS**:
  - `app = FastAPI(title="AquaPulse API")`
  - CORS middleware allowing all origins (`["*"]`), methods, and headers.
- **Lines 56–71: Pydantic Schemas**:
  - `SensorData` and `HealthAnalysis`.
- **Lines 73–163: API Route Handlers**:
  - `POST /api/sensor-data` (Lines 73–84)
  - `GET /api/latest-data` (Lines 86–99)
  - `GET /api/analysis` (Lines 101–160)
  - `GET /` (Lines 161–163)

---

### 2.2 Endpoint Investigation: `GET /api/analysis`

- **Route Definition**: `backend/main.py:101-102`
  ```python
  @app.get("/api/analysis", response_model=HealthAnalysis)
  def get_analysis(db: Session = Depends(get_db)):
  ```
- **Request Parameters / Payload**:
  - None required from the client.
  - Takes a database session dependency `db: Session = Depends(get_db)`.
- **Database Query**:
  ```python
  latest = db.query(SensorDataDB).order_by(SensorDataDB.timestamp.desc()).first()
  ```
- **Empty Database Fallback**:
  If `not latest` (no rows exist in SQLite table `sensor_data`), the endpoint immediately returns:
  ```python
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
  Note: This satisfies the `HealthAnalysis` Pydantic response model and ensures HTTP 200 is returned even on a cold start.

- **Rule-Based Analysis Logic** (`latest` is present):
  - Initial score: `score = 100`, `risk = "Low Risk"`, `quality = "Excellent"`.
  - pH check: if `latest.ph < 6.5 or latest.ph > 8.5`: `score -= 20`, `quality = "Moderate"`.
  - TDS check: if `latest.tds > 500`: `score -= 20`, `quality = "Poor"`.
  - Turbidity check: if `latest.turbidity > 5.0`: `score -= 30`, `risk = "High Risk"`, `quality = "Unsafe"`.
  - Floor: `if score < 0: score = 0`.

- **ML Prediction Logic** (`latest` is present):
  ```python
  skin_risk_result = "Unknown"
  if model is not None:
      try:
          input_df = pd.DataFrame(
              [[latest.ph, latest.tds, latest.turbidity, latest.temperature]], 
              columns=['pH', 'TDS', 'Turbidity', 'Temperature']
          )
          skin_risk_result = str(model.predict(input_df)[0])
      except Exception as e:
          print(f"Prediction error: {e}")
          skin_risk_result = "Error during prediction"
  ```
  - Feature names passed to the model: `['pH', 'TDS', 'Turbidity', 'Temperature']`.
  - Corresponds exactly to the training features in `ml model/water_health_dataset.csv`.
  - Result is converted to `str`.

- **Potability Logic** (`latest` is present):
  ```python
  is_potable = (6.5 <= latest.ph <= 8.5) and (latest.tds <= 500) and (latest.turbidity <= 5.0)
  potability_result = "Safe for Drinking" if is_potable else "Not Safe for Drinking"
  ```
  - Rules: pH between 6.5 and 8.5, TDS <= 500 ppm, Turbidity <= 5.0 NTU.
  - Returns string: `"Safe for Drinking"` or `"Not Safe for Drinking"`.

- **Auxiliary Rule-Based Recommendations**:
  - `plant_suitability`: `["Tulsi", "Tomato"] if score > 50 else []`
  - `appliance_impact`: `["Safe for RO", "Safe for Geyser"] if latest.tds < 300 else ["May scale RO filters"]`

---

## 3. Inventory of Endpoints, Data Models & Helpers

| Item | Type | Path / Name | Description |
|---|---|---|---|
| **Root Health Check** | Endpoint (`GET`) | `/` | Returns `{"message": "AquaPulse API is online!"}` |
| **Ingest Sensor Data** | Endpoint (`POST`) | `/api/sensor-data` | Accepts `SensorData` body, inserts record into `sensor_data` table, commits and returns `{message, id}` |
| **Get Latest Data** | Endpoint (`GET`) | `/api/latest-data` | Returns latest sensor readings: `{ph, tds, turbidity, temperature, timestamp}`. Returns fallback zeros if table is empty. |
| **Get Health Analysis** | Endpoint (`GET`) | `/api/analysis` | Returns `HealthAnalysis` model: rule score, potability calculation, ML skin risk prediction, suitability & appliance impacts. |
| **SensorDataDB** | SQLAlchemy Model | Table: `sensor_data` | Columns: `id` (Integer PK), `timestamp` (DateTime UTC), `ph` (Float), `tds` (Float), `turbidity` (Float), `temperature` (Float) |
| **SensorData** | Pydantic Model | Schema | `ph: float`, `tds: float`, `turbidity: float`, `temperature: float` |
| **HealthAnalysis** | Pydantic Model | Schema | `health_score: int`, `quality_class: str`, `risk_level: str`, `plant_suitability: List[str]`, `appliance_impact: List[str]`, `skin_risk: str`, `potability: str` |
| **get_db** | Helper / Dependency | `get_db()` | Contextual DB generator yielding SQLAlchemy session and safely closing on completion |

---

## 4. Dependencies & Environment (`requirements.txt`)

### 4.1 Content of `backend/requirements.txt`
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

### 4.2 Observations & Findings:
1. **Unpinned Versions**: All packages are unpinned. This allows `pip` to resolve the latest compatible versions for Python 3.13 on Windows.
2. **Missing Testing Dependencies**:
   - If using `fastapi.testclient.TestClient`, `httpx` is required by Starlette/FastAPI. It is currently missing from `requirements.txt`.
   - Adding `httpx` to `requirements.txt` (or having a dedicated test script use standard library `urllib.request` against a running uvicorn instance) is required for seamless testing.
3. **Virtual Environment Status**:
   - Location: `C:\Dev\Projects\Web-Projects\aquapulse\backend\venv`
   - Python Version: Python 3.13.14
   - Inspection of `backend/venv/Lib/site-packages` shows **only `pip` is currently installed**.
   - Action Required during implementation/testing: The worker must run `pip install -r backend/requirements.txt` (using the venv's python) before running tests or the server.

---

## 5. Execution Environment & Testability

### 5.1 How the Backend Runs
- **Production / Dev Command**:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
  or with reload:
  ```bash
  uvicorn main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **From venv**:
  ```bash
  backend\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
  ```
  (run from within `backend/` directory).

### 5.2 Database Path Sensitivity (Issue Identified)
In `backend/main.py:21`:
```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./aquapulse.db"
```
Because `./aquapulse.db` is relative to the current working directory (`CWD`), running `uvicorn` from `C:\Dev\Projects\Web-Projects\aquapulse` will use `.\aquapulse.db` in the repository root, while running from `C:\Dev\Projects\Web-Projects\aquapulse\backend` will use `backend\aquapulse.db`.
**Recommendation**: Anchor the database path to `backend/main.py`:
```python
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "aquapulse.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
```

### 5.3 How Backend Tests Can Run
The acceptance criteria specify:
> "Backend: A test script can successfully start the FastAPI server and send a request to /api/analysis. The response is HTTP 200 and the JSON payload contains skin_risk and potability keys."

**Recommended Test Architecture**:
A test script (e.g. `backend/test_server.py` or `tests/test_backend.py`) should:
1. Identify the python executable (`sys.executable` or `backend/venv/Scripts/python.exe`).
2. Spawn a subprocess running `uvicorn main:app --host 127.0.0.1 --port 8000` with `cwd=backend`.
3. Wait and poll `http://127.0.0.1:8000/` until the server responds with 200 (timeout: 10–15s).
4. Send a `POST /api/sensor-data` with representative sensor parameters:
   `{"ph": 7.2, "tds": 250.0, "turbidity": 2.0, "temperature": 25.0}`.
5. Send a `GET /api/analysis`.
6. Assert:
   - HTTP Status Code == 200
   - JSON response contains `"skin_risk"` and `"potability"` keys
   - Assert `"potability"` in `["Safe for Drinking", "Not Safe for Drinking"]`
   - Assert `"skin_risk"` is a recognized category (e.g. not `"Unknown"` or `"Error during prediction"`, assuming model is loaded)
7. Terminate the subprocess cleanly (`proc.terminate()`, `proc.wait()`).

---

## 6. ML Model Path Handling & Integration Assessment

### 6.1 Comparison: Prototype (`ml model/app.py`) vs Backend (`backend/main.py`)

| Aspect | `ml model/app.py` | `backend/main.py` |
|---|---|---|
| **Model Loading** | `model = joblib.load('skin_risk_model.pkl')` (assumes cwd is `ml model/`) | `model_path = os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")` |
| **Input Ingestion** | Serial port (`COM3`, ESP32 over USB) via pySerial background thread | HTTP `POST /api/sensor-data` from ESP32 over Wi-Fi, persisted to SQLite |
| **Data Retrieval** | Global dictionary in memory | SQLite `sensor_data` table queried for latest record |
| **Analysis Endpoint** | Embedded in `GET /api/latest-data` | Dedicated `GET /api/analysis` endpoint |
| **Input DataFrame** | `columns=['pH', 'TDS', 'Turbidity', 'Temperature']` | `columns=['pH', 'TDS', 'Turbidity', 'Temperature']` |
| **Potability Rule** | `(6.5 <= ph <= 8.5) and (tds <= 500) and (turbidity <= 5.0)` | Same formula |

### 6.2 Model Path Resolution & Deployment Risk
The current model path in `backend/main.py:13`:
```python
model_path = os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")
```
**Risks**:
1. Space in Directory Name: `"ml model"` contains a space, which can cause issues in certain container/shell environments.
2. Independent Deployment: When `backend/` is deployed (e.g. to Render where the root directory is specified as `backend`), the parent directory `..` might not contain `ml model/`, causing model loading to fail silently (setting `model = None`).
3. Portability:
   To ensure 100% reliability across all runtimes (local root, local backend, Docker, Render), `backend/main.py` should search candidate paths in order:
   ```python
   def get_model_path():
       base_dir = os.path.dirname(os.path.abspath(__file__))
       candidates = [
           os.environ.get("MODEL_PATH"),
           os.path.join(base_dir, "skin_risk_model.pkl"),
           os.path.join(base_dir, "models", "skin_risk_model.pkl"),
           os.path.join(base_dir, "..", "ml model", "skin_risk_model.pkl"),
           os.path.join(os.getcwd(), "ml model", "skin_risk_model.pkl"),
       ]
       for path in candidates:
           if path and os.path.isfile(path):
               return path
       return None
   ```
   Furthermore, copying `skin_risk_model.pkl` into `backend/` makes `backend/` completely self-contained.

### 6.3 Classes & Frontend Mapping Alignment
From `ml model/water_health_dataset.csv`, the model outputs one of 4 discrete class labels:
1. `Bacterial / Fungal Infection Risk`
2. `Eczema / Skin Barrier Damage`
3. `Acidic Irritant Contact Dermatitis`
4. `Safe (No Skin Risk)`

In `frontend/src/App.tsx:48-60`, `getRemedies(risk: string)` matches these 4 exact strings.
The potability rule outputs `"Safe for Drinking"` or `"Not Safe for Drinking"`, which directly matches the frontend condition in `frontend/src/App.tsx:220-229`.
The alignment between ML model outputs, backend schema, and frontend UI is completely consistent.

---

## 7. Summary of Actionable Implementation Items

For the subsequent Worker and Testing agents:
1. **Virtual Environment**: Run `pip install -r backend/requirements.txt` in `backend/venv` (or recommend `httpx` for test harness).
2. **Path Hardening in `backend/main.py`**:
   - Anchor `SQLALCHEMY_DATABASE_URL` to `backend/aquapulse.db` using `os.path.abspath`.
   - Upgrade model path loader to multi-candidate search (including local `backend/` copy).
   - Ensure `skin_risk_model.pkl` is also present inside `backend/` for standalone deployments.
3. **Automated Verification Script**:
   - Provide a self-contained test script (`test_backend.py`) that starts `uvicorn`, executes test requests to `POST /api/sensor-data` and `GET /api/analysis`, validates the HTTP 200 response and JSON payload keys, and cleanly shuts down the server.
