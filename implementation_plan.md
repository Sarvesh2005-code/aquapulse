# AquaPulse — Complete Product Upgrade & Implementation Plan

## Phase 1: Repository and architecture audit
- **Audit Findings:** The existing system comprises a FastAPI backend (`backend/`), an ESP32 firmware (`firmware/AquaPulse.ino`), a React/Vite frontend (`frontend/`), and a synthetic ML model (`ml/`).
- **Goal:** Analyze current data flow and identify areas of improvement in how sensor values are mapped, stored, and sent to the client.
- **Risks:** Potentially breaking existing API endpoints that the current frontend relies on.

## Phase 2: ESP32 firmware and sensor reliability improvements
- **Files to modify:** `firmware/AquaPulse.ino`
- **Changes:**
  - Add connection robustness (Wi-Fi reconnect logic).
  - Add sensor presence detection (e.g., verifying DS18B20 connection).
  - Implement basic data smoothing algorithms (moving average filter) to reduce noise before sending data.
- **Risks:** Hardware-specific bugs could emerge if timing issues arise.

## Phase 3: pH calibration and ADC handling
- **Files to modify:** `firmware/AquaPulse.ino`
- **Changes:**
  - Audit ESP32 ADC configuration (e.g. attenuation settings).
  - Introduce calibration constants instead of hardcoded generic pH formulas.
  - Apply multi-point calibration logic (or at least provide the framework to calculate slope and intercept from 2 points).
- **Testing:** Inject known voltage values (if possible) or visually inspect logs to ensure output scales appropriately.

## Phase 4: Database implementation
- **Files to modify:** `backend/models.py`, `backend/schemas.py`, `backend/database.py`
- **Changes:**
  - Expand SQLite models to robustly store historical sensor readings, device status, and health predictions.
  - Implement `sensor_readings`, `health_predictions`, and `system_logs` tables.
- **Testing:** Perform CRUD tests to guarantee no data loss across reboots.

## Phase 5: FastAPI/backend improvements
- **Files to modify:** `backend/main.py`, `backend/schemas.py`
- **Changes:**
  - Implement endpoints: `/api/sensor-data/latest`, `/api/sensor-data/history`, `/api/dashboard/summary`, `/api/health/insights`.
  - Add Pydantic validation for all incoming and outgoing payloads.
  - Reject invalid sensor readings. Provide a simulated fallback ONLY if explicitly requested, but never store as real data.

## Phase 6: ML pipeline and inference
- **Files to modify:** `ml/train.py`, `backend/main.py`
- **Changes:**
  - Refine ML feature engineering (pH, TDS, turbidity, temp, trends).
  - Improve inference structure in FastAPI backend. Map numeric risk levels to understandable human categories (e.g. "Probability: 68%").
  - Label demo data properly so the system doesn't make medical diagnostic claims.

## Phase 7: Frontend redesign using Apple-inspired design principles
- **Files to modify:** `frontend/tailwind.config.js`, global CSS files.
- **Changes:**
  - Establish a clean, minimal, and premium aesthetic. Use rounded cards, generous spacing, clear typography, and subtle shadows.
  - Restrain use of color. Replace aggressive tech dashboards with a calm, consumer health app feel.

## Phase 8: Overview, Water Quality, Health, History and Settings pages
- **Files to modify/create:** `frontend/src/App.tsx`, `frontend/src/components/*`
- **Changes:**
  - **Overview:** Large primary status indicator, simple sensor cards, and health summary.
  - **Water Quality:** Detailed historical charts with plain text explanations of trends.
  - **Health:** Non-medical actionable insights related to skin and hair based on water parameters.
  - **History:** Simple timeline/table of past data.
  - **Settings:** Device status, API status, calibration constants.
- **Testing:** Verify responsive layout across mobile and desktop.

## Phase 9: ESP32 → backend → database → ML → UI integration
- **Goal:** Ensure data flows reliably end-to-end.
- **Testing:** Run the full stack locally. Mock ESP32 requests with edge case data (e.g. invalid pH or 127°C temperature) to ensure proper UI handling and database integrity.

## Phase 10: Testing, validation and documentation
- **Goal:** Provide unit testing for critical backend logic and document setup.
- **Files:** `README.md`, `backend/test_backend.py`
- **Changes:** Add comprehensive testing of data filtering rules. Ensure the UI falls back gracefully when endpoints fail.
