# ML Model & Preprocessing Survey Report

## Executive Summary
This survey provides an exhaustive technical analysis of the Machine Learning assets located in `ml model/` (`skin_risk_model.pkl`, `app.py`, `water_health_dataset.csv`) and their integration into `backend/main.py`.

Key findings:
1. **Model Architecture**: The model is a serialized `RandomForestClassifier` (`n_estimators=100`, `criterion='gini'`) trained using **scikit-learn 1.6.1** and persisted via **joblib** (Python pickle protocol 4).
2. **Input Schema**: Expects exactly 4 numeric features with exact case-sensitive column names: `['pH', 'TDS', 'Turbidity', 'Temperature']`.
3. **Target Output**: Predicts 6 distinct categorical skin/hair condition risk classes:
   - `Acidic Irritant Contact Dermatitis`
   - `Bacterial / Fungal Infection Risk`
   - `Eczema / Skin Barrier Damage`
   - `Pseudomonas Folliculitis (Hot Tub Rash)`
   - `Safe (No Skin Risk)`
   - `Severe Xerosis (Dry Skin Risk)`
4. **Potability Calculation**: Defined by deterministic threshold rule: `(6.5 <= pH <= 8.5) and (TDS <= 500) and (Turbidity <= 5.0)`. Confirmed 100% concordance (0 mismatches across all 2000 rows of `water_health_dataset.csv`).
5. **Dependencies**: Requires `scikit-learn==1.6.1` (or `>=1.6.0`), `joblib>=1.2.0`, `pandas>=2.0.0`, and `numpy>=1.24.0` (or `numpy>=2.0.0` on Python 3.13). All packages have verified pre-built wheels for Python 3.13. Note: `backend/venv` currently has no packages installed yet and requires running `pip install -r backend/requirements.txt`.

---

## 1. Asset Inventory & File Details

| File Path | Size | Description / Format |
|---|---|---|
| `ml model/skin_risk_model.pkl` | 887,257 bytes | Binary model artifact serialized with `joblib` (protocol 4) |
| `ml model/app.py` | 3,028 bytes | Reference standalone FastAPI prototype with serial reader |
| `ml model/water_health_dataset.csv` | 105,124 bytes | 2000-sample dataset used to train and evaluate the model |
| `backend/main.py` | 5,273 bytes | Production FastAPI application with endpoints `/api/sensor-data`, `/api/latest-data`, `/api/analysis` |
| `backend/requirements.txt` | 69 bytes | Backend Python dependency specification |

---

## 2. Model Structure & Architecture

### Model Identity & Hyperparameters
Opcode disassembly and binary introspection of `skin_risk_model.pkl` revealed the following parameters:
- **Python Module / Class**: `sklearn.ensemble._forest.RandomForestClassifier`
- **Scikit-learn Version Used at Fit**: `1.6.1` (`_sklearn_version = '1.6.1'`)
- **Number of Estimators**: `100` (`n_estimators = 100`)
- **Criterion**: `'gini'`
- **Splitter**: `'best'`
- **Max Depth**: `None` (trees expand until leaves are pure or contain fewer than min_samples_split)
- **Min Samples Split**: `2`
- **Min Samples Leaf**: `1`
- **Bootstrap**: `True`
- **Number of Input Features (`n_features_in_`)**: `4`
- **Training Samples Fitted**: `1600` (80% split of the 2000 dataset records)

---

## 3. Input Features, Data Types & Preprocessing Pipeline

### Expected Columns
The model expects a 2D tabular structure (e.g. `pandas.DataFrame`) with exactly 4 columns:

| Column Name | Case Sensitivity | Expected Type | Normal Domain | Physical Unit |
|---|---|---|---|---|
| `pH` | **Strict**: lowercase `p`, uppercase `H` | `float` | 4.0 - 10.5 | pH units (0-14) |
| `TDS` | **Strict**: ALL CAPS | `float` / `int` | 40 - 1200 | ppm / mg/L |
| `Turbidity` | **Strict**: TitleCase | `float` | 0.1 - 20.0 | NTU |
| `Temperature` | **Strict**: TitleCase | `float` | 15.0 - 42.0 | °C |

> **⚠️ WARNING**: Scikit-learn validates column names against `feature_names_in_`. Passing lowercase names like `['ph', 'tds', 'turbidity', 'temperature']` will cause a `ValueError: The feature names should match those that were passed during fit`.

### Preprocessing Logic
As observed in `ml model/app.py`:
```python
# Prepare input dataframe for model prediction
input_df = pd.DataFrame(
    [[ph, tds, turbidity, temp]], 
    columns=['pH', 'TDS', 'Turbidity', 'Temperature']
)

# Run ML Model prediction
predicted_risk = model.predict(input_df)[0]
```
No scalers (StandardScaler, MinMaxScaler) or feature encoders are applied. Raw physical sensor measurements are passed directly.

---

## 4. Prediction Output & Class Distribution

### Output Classes
The model's `classes_` array contains 6 categorical labels:
1. `Acidic Irritant Contact Dermatitis`
2. `Bacterial / Fungal Infection Risk`
3. `Eczema / Skin Barrier Damage`
4. `Pseudomonas Folliculitis (Hot Tub Rash)`
5. `Safe (No Skin Risk)`
6. `Severe Xerosis (Dry Skin Risk)`

### Distribution & Clinical Characteristics in `water_health_dataset.csv`
Analysis of all 2,000 ground truth rows reveals distinct physical profile boundaries:

| Skin Risk Class | Count | % | Typical Water Profile |
|---|---|---|---|
| `Eczema / Skin Barrier Damage` | 615 | 30.75% | High alkaline pH (8.51 - 10.50, mean 9.51) |
| `Acidic Irritant Contact Dermatitis` | 483 | 24.15% | High acidity pH (4.02 - 5.49, mean 4.74) |
| `Safe (No Skin Risk)` | 418 | 20.90% | Neutral pH (5.50 - 8.50), low turbidity (<= 10.0 NTU) |
| `Bacterial / Fungal Infection Risk` | 256 | 12.80% | High turbidity (10.03 - 19.97 NTU), moderate temp (15 - 32 °C) |
| `Pseudomonas Folliculitis (Hot Tub Rash)` | 135 | 6.75% | High turbidity (10.03 - 19.91 NTU), high temp (32.1 - 41.9 °C) |
| `Severe Xerosis (Dry Skin Risk)` | 93 | 4.65% | High TDS (603 - 1194 ppm), moderately high pH (8.01 - 8.50) |

---

## 5. Potability Calculation

### Rule Specification
Both `ml model/app.py` (lines 61-63) and `water_health_dataset.csv` employ the exact same potability condition:
```python
is_potable = (6.5 <= ph <= 8.5) and (tds <= 500) and (turbidity <= 5.0)
potability = "Safe for Drinking" if is_potable else "Not Safe for Drinking"
```

### Empirical Verification
- Evaluated against all 2,000 records in `water_health_dataset.csv`:
  - **Mismatches**: 0
  - **Concordance**: 100%
- Dataset Breakdown:
  - `Is_Potable = 1`: 61 records (all 61 have `Skin_Risk == "Safe (No Skin Risk)"`)
  - `Is_Potable = 0`: 1,939 records
- Note: Water may be `Safe (No Skin Risk)` for skin contact while still `Not Safe for Drinking` (e.g. TDS 501-1192 or turbidity 5.1-10.0).

---

## 6. Dependency Analysis & Environment Verification

### Requirements
The existing `backend/requirements.txt` contains:
```
fastapi
uvicorn
pydantic
scikit-learn
pandas
numpy
SQLAlchemy
joblib
```

### Wheel Resolution on Python 3.13 (Windows amd64)
Verification via `pip install --dry-run` confirms clean resolution with pre-compiled wheels:
- `scikit-learn==1.6.1` (matches exact training version; pre-built wheel `scikit_learn-1.6.1-cp313-cp313-win_amd64.whl` available)
- `pandas==3.0.5` (or `pandas>=2.2.0`)
- `numpy==2.5.3` (or `numpy>=2.0.0`)
- `joblib==1.6.0` (or `joblib>=1.2.0`)
- `fastapi==0.141.1`
- `uvicorn==0.52.4`
- `pydantic==2.13.5`
- `SQLAlchemy==2.0.52`

### Critical Environment Note
`backend/venv/` currently contains only `pip 26.0.1`. The packages listed in `requirements.txt` must be installed by running:
```powershell
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```
To avoid scikit-learn version mismatch warnings, pinning `scikit-learn==1.6.1` in `backend/requirements.txt` is strongly recommended.

---

## 7. Current State in `backend/main.py` & Recommendations

### Inspection of `backend/main.py`
In `backend/main.py`:
1. Model loading is already present at lines 12-19:
   ```python
   model_path = os.path.join(os.path.dirname(__file__), "..", "ml model", "skin_risk_model.pkl")
   try:
       model = joblib.load(model_path)
   except Exception as e:
       print(f"Error loading model: {e}")
       model = None
   ```
2. The `/api/analysis` endpoint (lines 101-160) already calls:
   ```python
   input_df = pd.DataFrame([[latest.ph, latest.tds, latest.turbidity, latest.temperature]], 
                           columns=['pH', 'TDS', 'Turbidity', 'Temperature'])
   skin_risk_result = str(model.predict(input_df)[0])
   ```
3. The potability rule is already implemented at lines 148-150:
   ```python
   is_potable = (6.5 <= latest.ph <= 8.5) and (latest.tds <= 500) and (latest.turbidity <= 5.0)
   potability_result = "Safe for Drinking" if is_potable else "Not Safe for Drinking"
   ```
4. **Edge Case to Address**:
   When the database is empty (`latest` is `None`), `/api/analysis` currently returns `"skin_risk": "Unknown", "potability": "Unknown"`.
   Ensure tests seed at least one reading or that the test script performs a `POST /api/sensor-data` before querying `/api/analysis`.

### Recommendations for Frontend (`frontend/src/App.tsx`)
The frontend mapping should map all 6 model classes plus fallbacks to tailored remedies:
- `"Safe (No Skin Risk)"`: "Water parameters are optimal for hair and skin contact. Standard gentle skincare routine recommended."
- `"Acidic Irritant Contact Dermatitis"`: "Water is acidic (pH < 5.5). Install neutralizing filters. Use barrier-repair moisturizers (ceramides/panthenol), avoid harsh soaps."
- `"Eczema / Skin Barrier Damage"`: "Water is alkaline (pH > 8.5). Strips natural skin lipid barrier. Use gentle, low-pH facial cleansers, apply rich emollients immediately after bathing."
- `"Bacterial / Fungal Infection Risk"`: "High turbidity detected. Disinfect or boil water before personal hygiene. Dry thoroughly and consider antibacterial/antifungal washes."
- `"Pseudomonas Folliculitis (Hot Tub Rash)"`: "Elevated temperature (>32°C) combined with high turbidity creates breeding conditions for Pseudomonas. Avoid prolonged submersion; wash immediately with antibacterial cleanser."
- `"Severe Xerosis (Dry Skin Risk)"`: "High mineral TDS content causes water hardness and skin dehydration. Use water softeners, rich hyaluronic/glycerin body lotions, and limit hot showers."
- Fallbacks (`"Unknown"`, `"Initializing..."`): "Awaiting live sensor readings to determine skin risk."
