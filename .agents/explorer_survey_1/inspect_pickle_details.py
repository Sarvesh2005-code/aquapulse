import pickletools

pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"

with open(pkl_path, "rb") as f:
    data = f.read()

ops = list(pickletools.genops(data))
print("First 40 ops:")
for opcode, arg, pos in ops[:40]:
    print(f"{pos:6d}: {opcode.name:20s} {repr(arg)}")

print("\nAll SHORT_BINUNICODE / BINUNICODE / GLOBAL ops:")
for opcode, arg, pos in ops:
    if 'UNICODE' in opcode.name or 'GLOBAL' in opcode.name:
        if arg is not None:
            print(f"{pos:6d}: {opcode.name:20s} {repr(arg)}")
