# AquaPulse - Smart Drinking Water Monitor

AquaPulse is an AI and IoT-based smart drinking water health monitoring system. It continuously tracks water quality parameters, predicts health risk levels, and provides actionable recommendations.

## System Architecture
* **Hardware:** ESP32 DevKit V1, pH Sensor, TDS Sensor, Turbidity Sensor, DS18B20 Temp Sensor.
* **Backend:** FastAPI, Python, SQLAlchemy, SQLite (Cloud Deployment via Render)
* **Frontend:** React, TypeScript, Tailwind CSS, Chart.js, Vite (Cloud Deployment via Vercel)

## Deployment Instructions

### Backend (Render)
1. Create a Web Service on Render.
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. Create a New Project on Vercel.
2. Root Directory: `frontend`
3. Framework Preset: Vite
4. Add Environment Variable: `VITE_API_URL` = `<Your_Render_Backend_URL>`

### ESP32
Update the `serverName` variable in `firmware/AquaPulse.ino` with your live Render backend URL before flashing the board.

## License
MIT
