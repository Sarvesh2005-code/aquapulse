from fastapi import FastAPI, HTTPException, Depends
from typing import List, Optional
import datetime
import os
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import our custom modules
from database import engine, Base, get_db
from models import SensorDataDB, HealthPredictionDB, SystemLogDB
from schemas import (
    SensorDataCreate,
    SensorDataResponse,
    HealthAnalysisResponse,
    HealthPredictionResponse,
    LogResponse
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Load Model with Multi-Candidate Fallback ---
def load_skin_risk_model():
    candidate_paths = [
        os.environ.get("MODEL_PATH"),
        os.path.join(BASE_DIR, "skin_risk_model.pkl"),
        os.path.join(BASE_DIR, "..", "ml model", "skin_risk_model.pkl"),
        os.path.join(os.getcwd(), "backend", "skin_risk_model.pkl"),
        os.path.join(os.getcwd(), "ml model", "skin_risk_model.pkl"),
        os.path.join(BASE_DIR, "models", "skin_risk_model.pkl"),
    ]
    for path in candidate_paths:
        if path and os.path.isfile(path):
            try:
                loaded_model = joblib.load(path)
                print(f"Successfully loaded skin risk model from: {path}")
                return loaded_model, "v1.0"
            except Exception as e:
                print(f"Error loading model from {path}: {e}")
    print("Warning: No valid skin risk model found across candidate paths.")
    return None, None

model, MODEL_VERSION = load_skin_risk_model()

# --- Initialize DB ---
Base.metadata.create_all(bind=engine)

# --- FastAPI App ---
app = FastAPI(title="AquaPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev and Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_event(db: Session, event_type: str, message: str, level: str = "INFO"):
    log_entry = SystemLogDB(event_type=event_type, message=message, level=level)
    db.add(log_entry)
    db.commit()

# --- Endpoints ---
@app.post("/api/sensor-data")
def receive_sensor_data(data: SensorDataCreate, db: Session = Depends(get_db)):
    if data.ph_status == "invalid":
        log_event(db, "SENSOR_WARNING", "Invalid pH reading rejected", "WARNING")
        raise HTTPException(status_code=400, detail="Invalid pH reading")
        
    db_entry = SensorDataDB(
        ph=data.ph,
        tds=data.tds,
        turbidity=data.turbidity,
        temperature=data.temperature if data.temp_source == "sensor" else None
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    log_event(db, "SENSOR_DATA", f"Received data ID {db_entry.id}")
    return {"message": "Data saved to database successfully", "id": db_entry.id}

@app.get("/api/sensor-data/latest", response_model=SensorDataResponse)
def get_latest_data(db: Session = Depends(get_db)):
    latest = db.query(SensorDataDB).order_by(SensorDataDB.timestamp.desc()).first()
    if not latest:
        # Return fallback zeros if db is empty so dashboard doesn't crash
        return SensorDataResponse(
            id=0,
            ph=0.0, 
            tds=0.0, 
            turbidity=0.0, 
            temperature=None, 
            timestamp=datetime.datetime.utcnow()
        )
    return latest

@app.get("/api/sensor-data/history", response_model=List[SensorDataResponse])
def get_sensor_history(limit: int = 100, start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SensorDataDB)
    if start_date:
        query = query.filter(SensorDataDB.timestamp >= datetime.datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(SensorDataDB.timestamp <= datetime.datetime.fromisoformat(end_date))
    history = query.order_by(SensorDataDB.timestamp.desc()).limit(limit).all()
    return history[::-1]

@app.get("/api/water-quality/trends")
def get_water_quality_trends(days: int = 7, db: Session = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    data = db.query(SensorDataDB).filter(SensorDataDB.timestamp >= cutoff).order_by(SensorDataDB.timestamp.asc()).all()
    if len(data) > 100:
        step = len(data) // 100
        data = data[::step]
    return data

@app.post("/api/health/predict", response_model=HealthAnalysisResponse)
def predict_health(db: Session = Depends(get_db)):
    # Uses latest sensor data to predict and save to health_predictions table
    latest = db.query(SensorDataDB).order_by(SensorDataDB.timestamp.desc()).first()
    
    if not latest:
        return {
            "health_score": 0,
            "quality_class": "Unknown",
            "risk_level": "Unknown",
            "plant_suitability": [],
            "appliance_impact": [],
            "skin_risk": "Unknown",
            "potability": "Unknown",
            "influencing_features": [],
            "probability": 0.0,
            "model_version": MODEL_VERSION
        }
    
    # --- Rule-Based Analysis ---
    score = 100
    risk = "Low Risk"
    quality = "Excellent"
    
    if latest.ph < 6.5 or latest.ph > 8.5:
        score -= 20
        quality = "Moderate"
    if latest.tds is not None and latest.tds > 500:
        score -= 20
        quality = "Poor"
    if latest.turbidity is not None and latest.turbidity > 5.0:
        score -= 30
        risk = "High Risk"
        quality = "Unsafe"
        
    if score < 0: score = 0
    
    # Check ML Prediction
    skin_risk_result = "Unknown"
    probability = 0.0
    if model:
        try:
            # Need to provide valid feature names used during training
            safe_tds = latest.tds if latest.tds is not None else 120.0
            safe_turb = latest.turbidity if latest.turbidity is not None else 1.5
            input_df = pd.DataFrame([[latest.ph, safe_tds, safe_turb, latest.temperature if latest.temperature is not None else 25.0]], 
                                    columns=['pH', 'TDS', 'Turbidity', 'Temperature'])
            skin_risk_result = str(model.predict(input_df)[0])
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(input_df)[0]
                probability = max(probs)
        except Exception as e:
            print(f"Prediction error: {e}")
            skin_risk_result = "Error during prediction"
            log_event(db, "ML_ERROR", f"Prediction error: {e}", "ERROR")
            
    # Potability Rule
    safe_tds = latest.tds if latest.tds is not None else 120.0
    safe_turb = latest.turbidity if latest.turbidity is not None else 1.5
    is_potable = (6.5 <= latest.ph <= 8.5) and (safe_tds <= 500) and (safe_turb <= 5.0)
    potability_result = "Safe for Drinking" if is_potable else "Not Safe for Drinking"
    
    # Save Prediction to DB
    pred_db = HealthPredictionDB(
        sensor_id=latest.id,
        ph=latest.ph,
        tds=latest.tds,
        turbidity=latest.turbidity,
        temperature=latest.temperature,
        predicted_condition=skin_risk_result,
        probability=probability,
        model_version=MODEL_VERSION
    )
    db.add(pred_db)
    db.commit()
    db.refresh(pred_db)
    # Calculate influencing features
    influencing_features = []
    if "Safe" in skin_risk_result or skin_risk_result == "Unknown":
        influencing_features.append("All parameters are within normal, safe ranges for skin.")
    else:
        if latest.ph < 6.5:
            influencing_features.append("Low pH (acidic) is a primary factor contributing to skin irritation.")
        elif latest.ph > 8.5:
            influencing_features.append("High pH (alkaline) is contributing to skin barrier damage.")
        if latest.tds > 500:
            influencing_features.append("High TDS (hard water) is contributing to dry skin and barrier damage.")
        if latest.turbidity > 5.0:
            influencing_features.append("High turbidity indicates potential microbial/bacterial presence.")
        if latest.temperature is not None and latest.temperature > 35:
            influencing_features.append("High temperature can strip skin oils and exacerbate conditions.")
        if not influencing_features:
            influencing_features.append("Combination of sub-optimal parameters contributes to the risk.")
            
    return {
        "health_score": score,
        "quality_class": quality,
        "risk_level": risk,
        "plant_suitability": ["Tulsi", "Tomato"] if score > 50 else [],
        "appliance_impact": ["Safe for RO", "Safe for Geyser"] if latest.tds < 300 else ["May scale RO filters"],
        "skin_risk": skin_risk_result,
        "potability": potability_result,
        "influencing_features": influencing_features,
        "probability": probability,
        "model_version": MODEL_VERSION
    }

@app.get("/api/analysis", response_model=HealthAnalysisResponse)
def get_analysis_deprecated(db: Session = Depends(get_db)):
    """Keep this for backward compatibility if frontend uses it temporarily, though we should migrate frontend."""
    return predict_health(db)

@app.get("/api/health/history", response_model=List[HealthPredictionResponse])
def get_health_history(limit: int = 50, start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(HealthPredictionDB)
    if start_date:
        query = query.filter(HealthPredictionDB.timestamp >= datetime.datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(HealthPredictionDB.timestamp <= datetime.datetime.fromisoformat(end_date))
    return query.order_by(HealthPredictionDB.timestamp.desc()).limit(limit).all()

@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_readings = db.query(SensorDataDB).count()
    total_predictions = db.query(HealthPredictionDB).count()
    latest_pred = db.query(HealthPredictionDB).order_by(HealthPredictionDB.timestamp.desc()).first()
    
    return {
        "total_readings": total_readings,
        "total_predictions": total_predictions,
        "latest_skin_risk": latest_pred.predicted_condition if latest_pred else "Unknown",
        "system_status": "Online"
    }

@app.get("/api/logs", response_model=List[LogResponse])
def get_logs(limit: int = 50, start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SystemLogDB)
    if start_date:
        query = query.filter(SystemLogDB.timestamp >= datetime.datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(SystemLogDB.timestamp <= datetime.datetime.fromisoformat(end_date))
    return query.order_by(SystemLogDB.timestamp.desc()).limit(limit).all()

@app.get("/")
def root():
    return {"message": "AquaPulse API is online!"}
