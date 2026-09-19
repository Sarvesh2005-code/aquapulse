import pickletools
import struct

pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"

with open(pkl_path, "rb") as f:
    data = f.read()

print(f"File size: {len(data)} bytes")

# Disassemble with pickletools
disassembly = []
try:
    ops = list(pickletools.genops(data))
    print(f"Total opcode operations: {len(ops)}")
    # Find all GLOBAL opcodes to see what modules and classes are loaded
    globals_found = set()
    for opcode, arg, pos in ops:
        if opcode.name == 'GLOBAL' or opcode.name == 'STACK_GLOBAL':
            globals_found.add(arg)
    print("\nReferenced modules / classes in pickle:")
    for g in sorted(globals_found):
        print(f"  - {g}")
except Exception as e:
    print(f"Error parsing pickle: {e}")
