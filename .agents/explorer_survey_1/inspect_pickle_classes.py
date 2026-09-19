import pickletools

pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"

with open(pkl_path, "rb") as f:
    data = f.read()

ops = list(pickletools.genops(data))
print(f"Total ops: {len(ops)}")
for opcode, arg, pos in ops[40:]:
    if 'UNICODE' in opcode.name or 'GLOBAL' in opcode.name:
        if arg is not None:
            print(f"{pos:6d}: {opcode.name:20s} {repr(arg)}")
