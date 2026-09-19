import pickletools

pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"

with open(pkl_path, "rb") as f:
    data = f.read()

ops = list(pickletools.genops(data))
print(f"Total ops: {len(ops)}")
for i, (opcode, arg, pos) in enumerate(ops):
    if pos >= 1000:
        print(f"#{i:3d} {pos:6d}: {opcode.name:25s} {repr(arg)[:100]}")
