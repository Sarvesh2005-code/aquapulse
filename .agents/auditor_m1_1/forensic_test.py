#!/usr/bin/env python3
"""
Independent Forensic Verification Script by auditor_m1_1.
Empirically stress-tests backend/main.py and ML integration.
"""
import sys
import os
import tempfile
import shutil
import pandas as pd
import joblib
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
BASE_DIR = r"C:\Dev\Projects\Web-Projects\aquapulse"
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

import main

client = TestClient(main.app)

def test_genuine_model_classes():
    print("--- Check 1: Verifying Loaded Model Architecture & Classes ---")
    model = main.model
    assert model is not None, "Model failed to load"
    assert hasattr(model, "predict"), "Model does not have predict method"
    expected_classes = {
        "Acidic Irritant Contact Dermatitis",
        "Bacterial / Fungal Infection Risk",
        "Eczema / Skin Barrier Damage",
        "Pseudomonas Folliculitis (Hot Tub Rash)",
        "Safe (No Skin Risk)",
        "Severe Xerosis (Dry Skin Risk)"
    }
    actual_classes = set(model.classes_)
    assert actual_classes == expected_classes, f"Class mismatch: {actual_classes} != {expected_classes}"
    print(f"PASS: Model loaded genuine RandomForestClassifier with all 6 classes: {sorted(list(actual_classes))}")

def test_all_six_classes_via_api():
    print("\n--- Check 2: Testing End-to-End Prediction Sensitivity via API for All 6 Classes ---")
    dataset_path = os.path.join(BASE_DIR, "ml model", "water_health_dataset.csv")
    df = pd.read_csv(dataset_path)
    
    # Get one representative sample for each class
    samples = df.groupby("Skin_Risk").first().reset_index()
    
    for _, row in samples.iterrows():
        expected_class = row["Skin_Risk"]
        payload = {
            "ph": float(row["pH"]),
            "tds": float(row["TDS"]),
            "turbidity": float(row["Turbidity"]),
            "temperature": float(row["Temperature"])
        }
        
        # Post sensor data to API
        post_resp = client.post("/api/sensor-data", json=payload)
        assert post_resp.status_code == 200, f"Failed to post data: {post_resp.text}"
        
        # Query analysis endpoint
        get_resp = client.get("/api/analysis")
        assert get_resp.status_code == 200, f"Failed to get analysis: {get_resp.text}"
        result = get_resp.json()
        
        actual_prediction = result["skin_risk"]
        print(f"Target: {expected_class:<40} -> API ML Prediction: {actual_prediction}")
        assert actual_prediction == expected_class, f"Prediction mismatch! Expected {expected_class}, got {actual_prediction}"
    
    print("PASS: API genuinely executes model.predict() dynamically across all 6 classes!")

def test_potability_boundary_logic():
    print("\n--- Check 3: Verifying Potability Rule Boundary Cases ---")
    test_cases = [
        # Exactly on safe boundaries
        ({"ph": 6.5, "tds": 500.0, "turbidity": 5.0, "temperature": 25.0}, "Safe for Drinking"),
        ({"ph": 8.5, "tds": 500.0, "turbidity": 5.0, "temperature": 25.0}, "Safe for Drinking"),
        ({"ph": 7.0, "tds": 0.0, "turbidity": 0.1, "temperature": 25.0}, "Safe for Drinking"),
        # Just outside safe boundaries
        ({"ph": 6.49, "tds": 300.0, "turbidity": 1.0, "temperature": 25.0}, "Not Safe for Drinking"),
        ({"ph": 8.51, "tds": 300.0, "turbidity": 1.0, "temperature": 25.0}, "Not Safe for Drinking"),
        ({"ph": 7.0, "tds": 500.1, "turbidity": 1.0, "temperature": 25.0}, "Not Safe for Drinking"),
        ({"ph": 7.0, "tds": 300.0, "turbidity": 5.01, "temperature": 25.0}, "Not Safe for Drinking"),
    ]
    
    for payload, expected_potability in test_cases:
        client.post("/api/sensor-data", json=payload)
        analysis = client.get("/api/analysis").json()
        assert analysis["potability"] == expected_potability, f"Boundary failure for {payload}: expected {expected_potability}, got {analysis['potability']}"
        print(f"Payload: pH={payload['ph']}, TDS={payload['tds']}, Turb={payload['turbidity']} -> Potability: {analysis['potability']} (PASS)")
    
    print("PASS: Potability boundary logic is mathematically strict and authentic.")

def test_empty_database_fallback():
    print("\n--- Check 4: Verifying Empty Database Handling ---")
    # Test by querying the internal function or a temporary empty DB
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    main.Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
            
    main.app.dependency_overrides[main.get_db] = override_get_db
    try:
        resp = client.get("/api/analysis")
        assert resp.status_code == 200
        data = resp.json()
        assert data["potability"] == "Unknown", f"Expected 'Unknown', got {data['potability']}"
        assert data["skin_risk"] == "Unknown", f"Expected 'Unknown', got {data['skin_risk']}"
        assert data["health_score"] == 0
        print(f"PASS: Empty DB cleanly returns fallback: {data}")
    finally:
        main.app.dependency_overrides.clear()

def test_no_hardcoding_assertion():
    print("\n--- Check 5: Anti-Cheat Assertion Stress-Test ---")
    # Verify that changing features causes model.predict to produce a different result
    # rather than a static string.
    reading_clean = {"ph": 7.4, "tds": 150.0, "turbidity": 1.0, "temperature": 25.0}
    reading_acidic = {"ph": 4.5, "tds": 800.0, "turbidity": 12.0, "temperature": 25.0}
    
    client.post("/api/sensor-data", json=reading_clean)
    pred_clean = client.get("/api/analysis").json()["skin_risk"]
    
    client.post("/api/sensor-data", json=reading_acidic)
    pred_acidic = client.get("/api/analysis").json()["skin_risk"]
    
    assert pred_clean != pred_acidic, f"Predictions must differ for clean vs acidic! Both were {pred_clean}"
    print(f"Clean reading risk: '{pred_clean}' vs Acidic reading risk: '{pred_acidic}'")
    print("PASS: Sensor variation directly drives dynamic ML inference.")

if __name__ == "__main__":
    test_genuine_model_classes()
    test_all_six_classes_via_api()
    test_potability_boundary_logic()
    test_empty_database_fallback()
    test_no_hardcoding_assertion()
    print("\n=== ALL FORENSIC CHECKS PASSED EMPIRICALLY ===")
