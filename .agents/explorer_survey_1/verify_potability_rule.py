import csv

csv_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\water_health_dataset.csv"

rows = []
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

mismatches = 0
for r in rows:
    ph = float(r['pH'])
    tds = float(r['TDS'])
    turb = float(r['Turbidity'])
    temp = float(r['Temperature'])
    pot_data = int(r['Is_Potable'])
    
    # Check rule from ml model/app.py:
    # is_potable = (6.5 <= ph <= 8.5) and (tds <= 500) and (turbidity <= 5.0)
    rule_potable = 1 if (6.5 <= ph <= 8.5 and tds <= 500 and turb <= 5.0) else 0
    if rule_potable != pot_data:
        mismatches += 1

print(f"Dataset potability rule matches app.py rule exactly? Mismatches = {mismatches} out of {len(rows)}")
