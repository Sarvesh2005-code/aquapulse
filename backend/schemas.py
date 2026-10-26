from pydantic import BaseModel
from typing import List, Optional
import datetime

class SensorDataCreate(BaseModel):
    ph: float
    tds: Optional[float] = None
    turbidity: Optional[float] = None
    temperature: float
    temp_source: Optional[str] = "sensor"
    ph_status: Optional[str] = "valid"

class SensorDataResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    ph: float
    tds: Optional[float] = None
    turbidity: Optional[float] = None
    temperature: Optional[float] = None
    is_connected: Optional[bool] = None
    seconds_since_last_ping: Optional[float] = None

    class Config:
        orm_mode = True
        from_attributes = True

class HealthAnalysisResponse(BaseModel):
    health_score: int
    quality_class: str
    risk_level: str
    plant_suitability: List[str]
    appliance_impact: List[str]
    skin_risk: str
    hair_risk: Optional[str] = None
    potability: str
    influencing_features: List[str]
    probability: Optional[float] = None
    model_version: Optional[str] = None

class HealthPredictionResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    ph: float
    tds: Optional[float] = None
    turbidity: Optional[float] = None
    temperature: Optional[float] = None
    predicted_condition: str
    probability: Optional[float] = None
    model_version: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

class LogResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    event_type: str
    message: str
    level: str

    class Config:
        orm_mode = True
        from_attributes = True
