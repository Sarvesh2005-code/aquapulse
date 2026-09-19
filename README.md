# AquaPulse - IoT Water Quality + Skin & Hair Health Intelligence

AquaPulse is an AI and IoT-based smart water monitoring system. It continuously tracks water quality parameters (pH, TDS, Turbidity, Temperature) using an ESP32, and predicts potential skin and hair health risks using a machine learning model.

> **Disclaimer:** The ML predictions and health insights provided by this system are for informational purposes and risk assessment only. They are **NOT** a medical diagnosis. The provided dataset is synthetic and for demonstration/development purposes only.

## System Architecture
* **Hardware:** ESP32 DevKit V1, pH Sensor, TDS Sensor, Turbidity Sensor, DS18B20 Temp Sensor
* **Backend:** FastAPI, Python, SQLAlchemy, SQLite (with `DATABASE_URL` env variable support)
* **Machine Learning:** `scikit-learn` Random Forest Classifier (Synthetic demo dataset)
* **Frontend:** React, TypeScript, Tailwind CSS, Chart.js, Vite

## Setup and Execution Instructions

### 1. Backend & Database setup
1. Open a terminal and navigate to the `backend` directory.
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run tests to ensure everything is working:
   ```bash
   python test_backend.py
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
*Note: SQLite database (`aquapulse.db`) will be automatically created on the first run.*

### 2. Machine Learning Pipeline
To retrain the ML model on the synthetic dataset or a new dataset:
1. Navigate to the `ml` directory:
   ```bash
   cd ../ml
   ```
2. Run the training script:
   ```bash
   python train.py
   ```
This will train the Random Forest model, evaluate it, and save `skin_risk_model.pkl` and `model_metadata.json` for the backend to use.

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Set the API URL in a `.env` file or export it:
   ```bash
   export VITE_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### 4. ESP32 Hardware
Update the `serverName` variable in `firmware/AquaPulse.ino` with your backend URL before flashing the board. The firmware sends numerical sensor values via a POST request to `/api/sensor-data`, which is handled securely by the backend.

## License
MIT
