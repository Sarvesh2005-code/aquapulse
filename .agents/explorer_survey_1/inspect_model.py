import joblib
import sklearn
import pandas as pd
import numpy as np

print("Python libraries:")
print(f"  scikit-learn: {sklearn.__version__}")
print(f"  pandas: {pd.__version__}")
print(f"  joblib: {joblib.__version__}")
print(f"  numpy: {np.__version__}")

model_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"
model = joblib.load(model_path)

print("\nModel Object Inspection:")
print(f"  Type: {type(model)}")
print(f"  Repr: {model}")

if hasattr(model, "classes_"):
    print(f"\nModel Classes ({len(model.classes_)}):")
    for c in model.classes_:
        print(f"    - {c}")

if hasattr(model, "feature_names_in_"):
    print(f"\nFeature names in: {list(model.feature_names_in_)}")

if hasattr(model, "n_features_in_"):
    print(f"Number of features: {model.n_features_in_}")

# Test sample predictions across known dataset rows
test_samples = pd.DataFrame([
    [6.43, 942.0, 15.62, 30.6],
    [10.18, 202.0, 2.06, 39.6],
    [7.41, 238.0, 5.0, 20.8],
    [5.01, 945.0, 1.93, 36.7],
    [6.86, 637.0, 11.19, 41.6],
    [8.31, 993.0, 3.74, 23.1]
], columns=['pH', 'TDS', 'Turbidity', 'Temperature'])

preds = model.predict(test_samples)
print("\nTest predictions:")
for i, pred in enumerate(preds):
    print(f"  Input: {test_samples.iloc[i].to_dict()} -> Prediction: {pred}")
