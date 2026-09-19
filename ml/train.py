import os
import pandas as pd
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "ml model", "synthetic_demo_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "..", "backend", "skin_risk_model.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model_metadata.json")

def load_data(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    return pd.read_csv(filepath)

def preprocess_data(df):
    # For now, no missing values assumed, simple preprocessing
    X = df[['pH', 'TDS', 'Turbidity', 'Temperature']]
    y = df['Skin_Risk']
    return X, y

def train_model(X_train, y_train):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    # Average micro because it's multi-class
    prec = precision_score(y_test, y_pred, average='weighted')
    rec = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    
    metrics = {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1
    }
    
    print("--- Model Evaluation ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("Confusion Matrix:\n", cm)
    print("Classification Report:\n", report)
    
    return metrics

def main():
    print("Loading data...")
    df = load_data(DATA_PATH)
    
    print("Preprocessing...")
    X, y = preprocess_data(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training model...")
    model = train_model(X_train, y_train)
    
    print("Evaluating...")
    metrics = evaluate_model(model, X_test, y_test)
    
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    
    metadata = {
        "version": "v1.0.0",
        "training_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dataset": "synthetic_demo_dataset.csv (NOTE: Synthetic data for development only. Not for medical use.)",
        "metrics": metrics,
        "features": list(X.columns)
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=4)
    print("Training pipeline complete.")

if __name__ == "__main__":
    main()
