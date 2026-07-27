import serial
import joblib
import pandas as pd
import json
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow your frontend dashboard to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load your trained model
model = joblib.load('skin_risk_model.pkl')

# Global variable to store latest live sensor & AI data
latest_data = {
    "ph": 7.0,
    "tds": 150,
    "turbidity": 1.0,
    "temperature": 25.0,
    "skin_risk": "Initializing...",
    "potability": "Checking..."
}

# 2. Background thread to read from ESP32 Serial Port
def read_serial_data():
    global latest_data
    # Change 'COM3' to your friend's actual ESP32 port (e.g., 'COM4' or '/dev/ttyUSB0')
    port = 'COM3' 
    baudrate = 115200
    
    try:
        ser = serial.Serial(port, baudrate, timeout=1)
        print(f"✅ Connected to ESP32 on {port}")
        
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                if line.startswith("{"):
                    data = json.loads(line)
                    ph = data.get("ph", 7.0)
                    tds = data.get("tds", 150)
                    turbidity = data.get("turbidity", 1.0)
                    temp = data.get("temperature", 25.0)
                    
                    # Prepare input dataframe for model prediction
                    input_df = pd.DataFrame([[ph, tds, turbidity, temp]], 
                                            columns=['pH', 'TDS', 'Turbidity', 'Temperature'])
                    
                    # Run ML Model prediction
                    predicted_risk = model.predict(input_df)[0]
                    
                    # Potability check rule
                    is_potable = (6.5 <= ph <= 8.5) and (tds <= 500) and (turbidity <= 5.0)
                    
                    # Update global payload
                    latest_data = {
                        "ph": ph,
                        "tds": tds,
                        "turbidity": turbidity,
                        "temperature": temp,
                        "skin_risk": predicted_risk,
                        "potability": "Safe for Drinking" if is_potable else "Not Safe for Drinking"
                    }
                    print("Data Updated:", latest_data)
    except Exception as e:
        print(f"⚠️ Serial connection error (running in simulation mode): {e}")

# Start serial reading in a background thread so it doesn't block the API
threading.Thread(target=read_serial_data, daemon=True).start()

# 3. API Endpoint matching your dashboard URL
@app.get("/api/latest-data")
def get_latest_data():
    return latest_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
