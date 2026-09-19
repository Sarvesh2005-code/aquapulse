pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"

with open(pkl_path, "rb") as f:
    data = f.read()

print(f"Total file size: {len(data)}")
print(f"Bytes 1055 to 1150: {repr(data[1055:1150])}")

# Search for strings/text in the binary data
import re
ascii_strings = re.findall(rb'[A-Za-z0-9_ /()\-]{4,}', data)
print(f"Found {len(ascii_strings)} strings:")
unique_strings = set(s.decode('latin1', errors='ignore') for s in ascii_strings)
for s in sorted(unique_strings):
    if any(k in s.lower() for k in ['risk', 'safe', 'dermatitis', 'eczema', 'potab', 'infection', 'rash', 'xerosis', 'tree', 'forest']):
        print(f"  - {s}")
