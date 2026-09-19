# Project: AquaPulse ML Integration & UI/UX Enhancement

## Architecture
- **Data Flow**:
  - Water quality sensors (or automated tests / simulation) submit readings (pH, TDS, Turbidity, Temperature) to FastAPI backend via `POST /api/sensor-data`.
  - Backend persists readings to SQLite (`aquapulse.db`) in `sensor_data` table.
  - Client polls `GET /api/analysis`.
  - Backend retrieves latest sensor reading, calculates rule-based potability (`Safe for Drinking` vs `Not Safe for Drinking`), passes features `['pH', 'TDS', 'Turbidity', 'Temperature']` through `skin_risk_model.pkl` (RandomForestClassifier), and returns `HealthAnalysis` JSON payload.
  - Frontend React application (`frontend/src/App.tsx`) fetches `/api/analysis`, stores `potability` and `skin_risk`, maps `skin_risk` to clinical recommendations across all 6 model classes via `getRemedies()`, and renders the "Health Impact & Remedies" dashboard card styled with Tailwind CSS.
- **Shared Interfaces**:
  - `GET /api/analysis` response schema:
    ```json
    {
      "health_score": 80,
      "quality_class": "Moderate",
      "risk_level": "Low Risk",
      "plant_suitability": ["Tulsi", "Tomato"],
      "appliance_impact": ["Safe for RO", "Safe for Geyser"],
      "skin_risk": "Safe (No Skin Risk)",
      "potability": "Safe for Drinking"
    }
    ```

## Feature Inventory
Every required feature from the survey and original user request is catalogued below:
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Backend ML Model Loading | Load `skin_risk_model.pkl` via joblib with robust multi-path resolution and fallback | M1 | ORIGINAL_REQUEST §1 |
| 2 | Backend Requirements Update | Update `backend/requirements.txt` with `pandas`, `joblib`, `scikit-learn==1.6.1`, `numpy`, `fastapi`, `uvicorn`, `pydantic`, `SQLAlchemy`, `httpx` | M1 | ORIGINAL_REQUEST §1 |
| 3 | Backend Dependency Installation | Install dependencies into `backend/venv` so server and tests run reliably | M1 | ORIGINAL_REQUEST §1 |
| 4 | Backend Analysis Endpoint | Update `GET /api/analysis` in `backend/main.py` to return ML predicted `skin_risk` and calculated `potability` ("Safe for Drinking" / "Not Safe for Drinking") | M1 | ORIGINAL_REQUEST §1 |
| 5 | Backend Path Anchoring | Anchor SQLite database URL to avoid working-directory sensitivity | M1 | Survey Finding |
| 6 | Backend Acceptance Test Harness | Automated script `test_backend.py` starting FastAPI, testing `/api/analysis` HTTP 200 and schema, and shutting down cleanly | M1 / E2E | ORIGINAL_REQUEST §Acceptance |
| 7 | Frontend 6-Class Remedy Mapping | Complete `getRemedies()` mapping in `frontend/src/App.tsx` covering all 6 ML model classes | M2 | ORIGINAL_REQUEST §2 |
| 8 | Frontend Health Impact & Remedies Card | Dashboard card displaying Water Potability status, Skin/Hair Disease Risk, and Remedies list with Tailwind CSS styling | M2 | ORIGINAL_REQUEST §3 |
| 9 | Frontend Build Verification | Verify `npm run build` (`tsc && vite build`) compiles with zero errors | M2 / E2E | ORIGINAL_REQUEST §Acceptance |
| 10 | E2E Integration & Verification | End-to-end testing across backend API, frontend types, and server response contracts | Final M | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend ML Integration | `backend/requirements.txt`, `backend/main.py`, model copying/loading, venv dependency install, `backend/test_backend.py` | None | DONE (All tests passed, reviewers APPROVE, auditor CLEAN) |
| M2 | Frontend Mapping & UI | `frontend/src/App.tsx`, 6-class remedy mapping, Health Impact & Remedies card styling, `npm run build` | None (parallelizable, shares contract) | IN_PROGRESS (worker_m2: fcfa7c14) |
| M3 | Final E2E Verification & Hardening | Full E2E test suite execution (Tiers 1-4) and adversarial coverage hardening (Tier 5) | M1, M2 | PLANNED |

## Interface Contracts
### Backend ↔ Frontend Contract: `GET /api/analysis`
- **Method**: `GET`
- **URL**: `${API_BASE_URL}/api/analysis`
- **Status**: 200 OK
- **Payload Schema**:
  ```typescript
  interface HealthAnalysis {
    health_score: number;
    quality_class: string;
    risk_level: string;
    plant_suitability: string[];
    appliance_impact: string[];
    skin_risk: string; // One of 6 classes, "Unknown", or fallback
    potability: "Safe for Drinking" | "Not Safe for Drinking" | "Unknown";
  }
  ```
- **ML Target Classes**:
  1. `"Acidic Irritant Contact Dermatitis"`
  2. `"Bacterial / Fungal Infection Risk"`
  3. `"Eczema / Skin Barrier Damage"`
  4. `"Pseudomonas Folliculitis (Hot Tub Rash)"`
  5. `"Safe (No Skin Risk)"`
  6. `"Severe Xerosis (Dry Skin Risk)"`
- **Potability Values**:
  - `"Safe for Drinking"`: `(6.5 <= pH <= 8.5) and (TDS <= 500) and (Turbidity <= 5.0)`
  - `"Not Safe for Drinking"`: otherwise
  - `"Unknown"`: empty DB

## Code Layout
- `backend/`:
  - `main.py`: FastAPI server, database models, ML model loading, API routes.
  - `requirements.txt`: Python package requirements.
  - `skin_risk_model.pkl`: Local copy of model for standalone deployment.
  - `test_backend.py`: Acceptance test script for backend.
- `ml model/`:
  - `skin_risk_model.pkl`: Trained scikit-learn RandomForest model.
  - `app.py`: Reference prototype.
  - `water_health_dataset.csv`: Training dataset with 2000 samples.
- `frontend/`:
  - `src/App.tsx`: Main dashboard with Overview metrics, chart, AI analysis, and Health Impact & Remedies card.
  - `package.json`: NPM package configuration and scripts.
