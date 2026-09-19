# Handoff Report — explorer_survey_1

## 1. Observation
- **ML Model Asset Location**:
  - `C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl` (887,257 bytes).
  - Serialized using `joblib` (Python pickle protocol 4).
  - Class name in pickle: `sklearn.ensemble._forest.RandomForestClassifier` with `_sklearn_version = '1.6.1'`, `n_estimators = 100`, `criterion = 'gini'`, `n_features_in_ = 4`.
  - Feature names array: `['pH', 'TDS', 'Turbidity', 'Temperature']`.
  - Classes array: 6 unique classes:
    `['Acidic Irritant Contact Dermatitis', 'Bacterial / Fungal Infection Risk', 'Eczema / Skin Barrier Damage', 'Pseudomonas Folliculitis (Hot Tub Rash)', 'Safe (No Skin Risk)', 'Severe Xerosis (Dry Skin Risk)']`.
- **Reference Application (`ml model/app.py`)**:
  - Model loading (line 21): `model = joblib.load('skin_risk_model.pkl')`.
  - Input DataFrame construction (lines 55-56):
    `input_df = pd.DataFrame([[ph, tds, turbidity, temp]], columns=['pH', 'TDS', 'Turbidity', 'Temperature'])`
  - Prediction (line 59): `predicted_risk = model.predict(input_df)[0]`.
  - Potability calculation (lines 62, 71):
    `is_potable = (6.5 <= ph <= 8.5) and (tds <= 500) and (turbidity <= 5.0)`
    `"potability": "Safe for Drinking" if is_potable else "Not Safe for Drinking"`.
- **Training Dataset (`ml model/water_health_dataset.csv`)**:
  - 2,000 rows, 6 columns: `['pH', 'TDS', 'Turbidity', 'Temperature', 'Skin_Risk', 'Is_Potable']`.
  - Validated potability against dataset: 0 mismatches across all 2000 rows between `Is_Potable` and the rule `(6.5 <= pH <= 8.5 and TDS <= 500 and Turbidity <= 5.0)`.
- **Target Integration File (`backend/main.py`)**:
  - Model loading is already present at line 13: `model_path = os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")`.
  - Prediction is drafted at lines 140-142:
    `input_df = pd.DataFrame([[latest.ph, latest.tds, latest.turbidity, latest.temperature]], columns=['pH', 'TDS', 'Turbidity', 'Temperature'])`
    `skin_risk_result = str(model.predict(input_df)[0])`.
  - Potability rule is present at lines 148-149:
    `is_potable = (6.5 <= latest.ph <= 8.5) and (latest.tds <= 500) and (latest.turbidity <= 5.0)`.
  - Fallback when no sensor data exists (`latest` is `None`, lines 105-115) returns `"skin_risk": "Unknown"`, `"potability": "Unknown"`.
- **Environment & Dependencies**:
  - `backend/requirements.txt` specifies: `fastapi`, `uvicorn`, `pydantic`, `scikit-learn`, `pandas`, `numpy`, `SQLAlchemy`, `joblib`.
  - `backend/venv` (Python 3.13.14) currently only contains `pip 26.0.1`; none of the packages are installed yet.
  - Dry-run verification confirmed `scikit-learn==1.6.1` is available as a pre-built wheel `scikit_learn-1.6.1-cp313-cp313-win_amd64.whl`.

## 2. Logic Chain
1. *From Observation 1*: The pickled model specifies `feature_names_in_ = ['pH', 'TDS', 'Turbidity', 'Temperature']`. Scikit-learn validates column names when passing a DataFrame. If names or casing differ (e.g. `'ph'` instead of `'pH'`), a `ValueError` is thrown. Thus, the DataFrame columns must strictly match `['pH', 'TDS', 'Turbidity', 'Temperature']`.
2. *From Observation 1 & 3*: The target classes are confirmed to be exactly the 6 clinical categories found in both the model object and `water_health_dataset.csv`.
3. *From Observation 2 & 3*: The potability rule `(6.5 <= pH <= 8.5) and (TDS <= 500) and (Turbidity <= 5.0)` yields 100% agreement with `Is_Potable` in the dataset, confirming this is the intended ground truth logic for the project.
4. *From Observation 4 & 5*: `backend/main.py` already contains the correct loading, preprocessing, and prediction logic, but when executed with `backend\venv\Scripts\python.exe`, it fails due to `ModuleNotFoundError: No module named 'joblib'` because `backend/venv` has not had `pip install -r backend/requirements.txt` run.
5. *From Observation 5*: Installing `scikit-learn==1.6.1` along with `joblib`, `pandas`, `numpy`, `fastapi`, `uvicorn`, `pydantic`, and `SQLAlchemy` into `backend/venv` will allow `backend/main.py` to run and serve `/api/analysis` without version warnings or runtime errors.

## 3. Caveats
- Serial connection logic (`serial.Serial('COM3')`) from `ml model/app.py` is omitted in `backend/main.py`, which is appropriate since the backend uses HTTP `POST /api/sensor-data` and SQLite storage (`aquapulse.db`).
- In `backend/main.py`, if no records exist in SQLite table `sensor_data`, `/api/analysis` returns `"skin_risk": "Unknown"` and `"potability": "Unknown"`. The backend test script must send a POST to `/api/sensor-data` first, or a fallback default sample must be handled.

## 4. Conclusion
The ML integration in `backend/main.py` is conceptually complete and aligned with `ml model/app.py` and `skin_risk_model.pkl`. The remaining implementation actions required are:
1. Pin `scikit-learn==1.6.1` in `backend/requirements.txt`.
2. Run `pip install -r backend/requirements.txt` in `backend/venv`.
3. Verify `/api/analysis` returns HTTP 200 with `skin_risk` and `potability`.
4. Implement frontend mapping in `frontend/src/App.tsx` for all 6 classes:
   - `Safe (No Skin Risk)`
   - `Acidic Irritant Contact Dermatitis`
   - `Eczema / Skin Barrier Damage`
   - `Bacterial / Fungal Infection Risk`
   - `Pseudomonas Folliculitis (Hot Tub Rash)`
   - `Severe Xerosis (Dry Skin Risk)`

## 5. Verification Method
1. **Model Loading & Feature Verification**:
   Run:
   ```powershell
   backend\venv\Scripts\python.exe -c "import joblib, pandas as pd; m = joblib.load('ml model/skin_risk_model.pkl'); print('Loaded successfully:', type(m)); df = pd.DataFrame([[7.2, 250.0, 1.5, 24.0]], columns=['pH', 'TDS', 'Turbidity', 'Temperature']); print('Prediction:', m.predict(df)[0])"
   ```
   *Expected output*: `Prediction: Safe (No Skin Risk)`.
2. **Backend API Execution**:
   Start server:
   ```powershell
   backend\venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000
   ```
   Post sample sensor data:
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sensor-data" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"ph": 7.4, "tds": 220, "turbidity": 1.2, "temperature": 24.0}'
   ```
   Query analysis:
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/analysis"
   ```
   *Expected output*: HTTP 200 JSON with `"skin_risk": "Safe (No Skin Risk)"` and `"potability": "Safe for Drinking"`.
3. **Invalidation Conditions**:
   - If feature column names are lowercase, `model.predict()` will throw a `ValueError`.
   - If `scikit-learn` is older than 1.6, `joblib.load()` may fail with unpickling incompatibility.
