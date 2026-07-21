from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import datetime
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# --- Database Setup (SQLite) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./aquapulse.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SensorDataDB(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ph = Column(Float)
    tds = Column(Float)
    turbidity = Column(Float)
    temperature = Column(Float)

Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FastAPI App ---
app = FastAPI(title="AquaPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev and Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class SensorData(BaseModel):
    ph: float
    tds: float
    turbidity: float
    temperature: float

class HealthAnalysis(BaseModel):
    health_score: int
    quality_class: str
    risk_level: str
    plant_suitability: List[str]
    appliance_impact: List[str]

# --- Endpoints ---
@app.post("/api/sensor-data")
def receive_sensor_data(data: SensorData, db: Session = Depends(get_db)):
    db_entry = SensorDataDB(
        ph=data.ph,
        tds=data.tds,
        turbidity=data.turbidity,
        temperature=data.temperature
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return {"message": "Data saved to database successfully", "id": db_entry.id}

@app.get("/api/latest-data")
def get_latest_data(db: Session = Depends(get_db)):
    latest = db.query(SensorDataDB).order_by(SensorDataDB.timestamp.desc()).first()
    if not latest:
        # Return fallback zeros if db is empty so dashboard doesn't crash
        return {"ph": 0.0, "tds": 0.0, "turbidity": 0.0, "temperature": 0.0, "timestamp": datetime.datetime.utcnow().isoformat()}
    
    return {
        "ph": latest.ph,
        "tds": latest.tds,
        "turbidity": latest.turbidity,
        "temperature": latest.temperature,
        "timestamp": latest.timestamp.isoformat()
    }

@app.get("/api/analysis", response_model=HealthAnalysis)
def get_analysis(db: Session = Depends(get_db)):
    latest = db.query(SensorDataDB).order_by(SensorDataDB.timestamp.desc()).first()
    
    if not latest:
        # Default analysis if no data
        return {
            "health_score": 0,
            "quality_class": "Unknown",
            "risk_level": "Unknown",
            "plant_suitability": [],
            "appliance_impact": []
        }
    
    # --- Rule-Based Analysis (To be replaced by ML model) ---
    score = 100
    risk = "Low Risk"
    quality = "Excellent"
    
    if latest.ph < 6.5 or latest.ph > 8.5:
        score -= 20
        quality = "Moderate"
    if latest.tds > 500:
        score -= 20
        quality = "Poor"
    if latest.turbidity > 5.0:
        score -= 30
        risk = "High Risk"
        quality = "Unsafe"
        
    if score < 0: score = 0
    
    return {
        "health_score": score,
        "quality_class": quality,
        "risk_level": risk,
        "plant_suitability": ["Tulsi", "Tomato"] if score > 50 else [],
        "appliance_impact": ["Safe for RO", "Safe for Geyser"] if latest.tds < 300 else ["May scale RO filters"]
    }
    
@app.get("/")
def root():
    return {"message": "AquaPulse API is online!"}
