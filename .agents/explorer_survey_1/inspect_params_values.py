import pickletools

pkl_path = r"C:\Dev\Projects\Web-Projects\aquapulse\ml model\skin_risk_model.pkl"
with open(pkl_path, "rb") as f:
    data = f.read()

ops = [op for op in pickletools.genops(data) if op[0].name != 'MEMOIZE']

target_keys = [
    'n_estimators', 'max_depth', 'min_samples_split', 'min_samples_leaf',
    'criterion', 'splitter', 'bootstrap', 'random_state', '_sklearn_version',
    'n_features_in_', 'max_features', 'oob_score', 'warm_start'
]

for i in range(len(ops)-1):
    op1, arg1, pos1 = ops[i]
    if op1.name == 'SHORT_BINUNICODE' and arg1 in target_keys:
        op2, arg2, pos2 = ops[i+1]
        print(f"{arg1:20s}: {op2.name:15s} = {repr(arg2)}")
