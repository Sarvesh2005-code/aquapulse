# E2E Test Infra: AquaPulse

## Test Philosophy
- Requirement-driven, opaque-box testing.
- Derives test scenarios from ORIGINAL_REQUEST.md.
- Tiers 1-4 methodology: Feature coverage, boundaries, pairwise combinations, and real-world application scenarios.

## Feature Inventory & Test Coverage
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|--------|:------:|:------:|:------:|:------:|
| 1 | Backend ML Model Loading & Prediction | ORIGINAL_REQUEST §1 | ✓ (>=5) | ✓ (>=5) | ✓ | ✓ |
| 2 | Potability Calculation Rule | ORIGINAL_REQUEST §1 | ✓ (>=5) | ✓ (>=5) | ✓ | ✓ |
| 3 | Backend /api/analysis HTTP 200 & Schema | ORIGINAL_REQUEST §Acceptance | ✓ (>=5) | ✓ (>=5) | ✓ | ✓ |
| 4 | Frontend 6-Class Remedy Mapping | ORIGINAL_REQUEST §2 | ✓ (6 classes) | ✓ (fallback) | ✓ | ✓ |
| 5 | Frontend Health Impact Card UI & Potability Badge | ORIGINAL_REQUEST §3 | ✓ | ✓ | ✓ | ✓ |
| 6 | Frontend Build Integrity (npm run build) | ORIGINAL_REQUEST §Acceptance | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- **Backend Test Runner**: `backend/venv/Scripts/python.exe backend/test_backend.py` (or Python script)
  - Boots FastAPI via uvicorn subprocess on port 8000.
  - Tests root endpoint (`/`).
  - Tests sensor data insertion (`POST /api/sensor-data`).
  - Tests analysis endpoint (`GET /api/analysis`) for:
    - HTTP status 200 OK.
    - JSON payload has `skin_risk` and `potability`.
    - `potability` is either `"Safe for Drinking"` or `"Not Safe for Drinking"`.
    - `skin_risk` is one of the valid 6 model classes.
    - Edge cases: pH boundary (6.49 vs 6.5, 8.5 vs 8.51), TDS boundary (500 vs 501), Turbidity boundary (5.0 vs 5.1).
  - Gracefully terminates uvicorn server with exit code 0.
- **Frontend Test Runner**: `npm run build` in `frontend/`
  - Runs `tsc && vite build`.
  - Asserts zero compilation errors and generated `dist/`.
- **E2E Integration Scenario**: Full simulation of backend startup, ingestion of diverse water profiles, analysis response verification, and frontend mapping evaluation.
