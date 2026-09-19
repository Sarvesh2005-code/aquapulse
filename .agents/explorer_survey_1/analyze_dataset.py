import csv

csv_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\water_health_dataset.csv"

rows = []
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

print(f"Total rows in dataset: {len(rows)}")
print("Columns:", list(rows[0].keys()))

# Analyze Skin_Risk counts
from collections import Counter
skin_risks = Counter(r['Skin_Risk'] for r in rows)
potables = Counter(r['Is_Potable'] for r in rows)

print("\nSkin_Risk distribution:")
for k, v in skin_risks.most_common():
    print(f"  {k:45s}: {v}")

print("\nIs_Potable distribution:")
for k, v in potables.most_common():
    print(f"  Is_Potable = {k}: {v}")

# Cross tabulation
cross = Counter((r['Skin_Risk'], r['Is_Potable']) for r in rows)
print("\nCross tab (Skin_Risk, Is_Potable):")
for (k, pot), v in cross.most_common():
    print(f"  [{pot}] {k:42s}: {v}")

# Check min/max ranges for features per Skin_Risk
from collections import defaultdict
stats = defaultdict(lambda: defaultdict(list))
for r in rows:
    sr = r['Skin_Risk']
    for feat in ['pH', 'TDS', 'Turbidity', 'Temperature']:
        stats[sr][feat].append(float(r[feat]))

print("\nFeature Ranges by Skin_Risk:")
for sr, feats in stats.items():
    print(f"\n--- {sr} (n={len(feats['pH'])}) ---")
    for f_name, vals in feats.items():
        print(f"  {f_name:12s}: min={min(vals):.2f}, max={max(vals):.2f}, mean={sum(vals)/len(vals):.2f}")
