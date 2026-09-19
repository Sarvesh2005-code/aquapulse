from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
import datetime
from database import Base

class SensorDataDB(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    ph = Column(Float)
    tds = Column(Float)
    turbidity = Column(Float)
    temperature = Column(Float)

class HealthPredictionDB(Base):
    __tablename__ = "health_predictions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    sensor_id = Column(Integer)  # Reference to SensorDataDB id, could be a foreign key
    ph = Column(Float)
    tds = Column(Float)
    turbidity = Column(Float)
    temperature = Column(Float)
    predicted_condition = Column(String)
    probability = Column(Float, nullable=True)
    model_version = Column(String, nullable=True)

class SystemLogDB(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String, index=True)  # e.g., 'SYSTEM', 'ESP32_CONNECT', 'ERROR'
    message = Column(String)
    level = Column(String) # 'INFO', 'WARNING', 'ERROR'
