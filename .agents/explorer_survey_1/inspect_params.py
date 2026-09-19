# Parse pickle structure using Python standard library
import pickletools

pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"
with open(pkl_path, "rb") as f:
    data = f.read()

ops = list(pickletools.genops(data))

print("=== Key attributes found in pickle stream ===")
current_key = None
attrs = {}
for i in range(len(ops)):
    opcode, arg, pos = ops[i]
    if opcode.name == 'SHORT_BINUNICODE' and isinstance(arg, str):
        # check if previous or next is value
        pass

# Let's inspect string pairs or sequences in ops
for i in range(len(ops)-1):
    op1, arg1, pos1 = ops[i]
    op2, arg2, pos2 = ops[i+1]
    if op1.name == 'SHORT_BINUNICODE' and arg1 in [
        'n_estimators', 'max_depth', 'min_samples_split', 'min_samples_leaf',
        'criterion', 'splitter', 'bootstrap', 'random_state', '_sklearn_version',
        'n_features_in_'
    ]:
        print(f"Attribute '{arg1}': next opcode is {op2.name} with arg {repr(arg2)}")
