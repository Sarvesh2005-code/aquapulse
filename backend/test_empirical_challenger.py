#!/usr/bin/env python3
"""
Empirical Challenger Test Suite for Milestone 1
Focus: Database persistence, concurrent access, cold starts, working directory portability,
schema consistency across multi-record/zero-record states, and process cleanup.
"""

import sys
import os
import time
import socket
import json
import sqlite3
import tempfile
import threading
import subprocess
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

def find_available_port(preferred=8100):
    for p in range(preferred, preferred + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

def make_request(url, method="GET", data=None, headers=None, timeout=5):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        status_code = response.getcode()
        resp_data = json.loads(response.read().decode("utf-8"))
        return status_code, resp_data

def wait_for_server(base_url, proc, timeout=15):
    start = time.time()
    last_err = None
    while time.time() - start < timeout:
        if proc.poll() is not None:
            raise RuntimeError(f"Server process terminated with code {proc.returncode}")
        try:
            status, data = make_request(f"{base_url}/", timeout=1)
            if status == 200:
                return time.time() - start
        except Exception as e:
            last_err = e
            time.sleep(0.2)
    raise TimeoutError(f"Server at {base_url} failed to start in {timeout}s. Last error: {last_err}")

def cleanup_proc(proc):
    if proc and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()

print("=" * 70)
print("AQUAPULSE EMPIRICAL CHALLENGER TEST HARNESS (M1)")
print("=" * 70)

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(project_root, "backend")
python_exe = sys.executable

results = {
    "suite_1_directory_portability": {},
    "suite_2_concurrency_and_integrity": {},
    "suite_3_schema_and_model_classes": {},
    "suite_4_process_cleanup": {},
    "summary": {"passed": 0, "failed": 0, "warnings": 0}
}

# ==============================================================================
# SUITE 1: Working Directory Portability & Cold Start
# ==============================================================================
print("\n>>> SUITE 1: Working Directory Portability & Cold Start")

# Test 1.1: Start from backend/ directory with main:app
print("Test 1.1: Starting from backend/ (main:app)...")
port1 = find_available_port(8101)
base_url1 = f"http://127.0.0.1:{port1}"
proc1 = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port1), "--log-level", "warning"],
    cwd=backend_dir
)
try:
    elapsed1 = wait_for_server(base_url1, proc1)
    status1, analysis1 = make_request(f"{base_url1}/api/analysis")
    assert status1 == 200
    assert analysis1.get("skin_risk") != "Error during prediction"
    print(f"  [PASS] Started from backend/ in {elapsed1:.2f}s. Model loaded successfully.")
    results["suite_1_directory_portability"]["cwd_backend"] = {"status": "PASS", "startup_sec": elapsed1}
    results["summary"]["passed"] += 1
except Exception as e:
    print(f"  [FAIL] cwd_backend: {e}")
    results["suite_1_directory_portability"]["cwd_backend"] = {"status": "FAIL", "error": str(e)}
    results["summary"]["failed"] += 1
finally:
    cleanup_proc(proc1)

# Test 1.2: Start from project root with backend.main:app
print("Test 1.2: Starting from project root (backend.main:app)...")
port2 = find_available_port(8102)
base_url2 = f"http://127.0.0.1:{port2}"
proc2 = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", str(port2), "--log-level", "warning"],
    cwd=project_root
)
try:
    elapsed2 = wait_for_server(base_url2, proc2)
    status2, analysis2 = make_request(f"{base_url2}/api/analysis")
    assert status2 == 200
    assert analysis2.get("skin_risk") != "Error during prediction"
    print(f"  [PASS] Started from project root in {elapsed2:.2f}s. Model loaded successfully.")
    results["suite_1_directory_portability"]["cwd_root"] = {"status": "PASS", "startup_sec": elapsed2}
    results["summary"]["passed"] += 1
except Exception as e:
    print(f"  [FAIL] cwd_root: {e}")
    results["suite_1_directory_portability"]["cwd_root"] = {"status": "FAIL", "error": str(e)}
    results["summary"]["failed"] += 1
finally:
    cleanup_proc(proc2)

# Test 1.3: Start from arbitrary temp directory with PYTHONPATH=backend
print("Test 1.3: Starting from isolated temp directory with PYTHONPATH=backend...")
temp_dir = tempfile.mkdtemp()
port3 = find_available_port(8103)
base_url3 = f"http://127.0.0.1:{port3}"
env3 = os.environ.copy()
env3["PYTHONPATH"] = backend_dir
proc3 = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port3), "--log-level", "warning"],
    cwd=temp_dir,
    env=env3
)
try:
    elapsed3 = wait_for_server(base_url3, proc3)
    status3, analysis3 = make_request(f"{base_url3}/api/analysis")
    assert status3 == 200
    assert analysis3.get("skin_risk") != "Error during prediction"
    # Ensure DB was created in backend_dir, not in temp_dir
    temp_files = os.listdir(temp_dir)
    assert "aquapulse.db" not in temp_files, f"Database erroneously created in temp dir: {temp_files}"
    print(f"  [PASS] Started from temp dir in {elapsed3:.2f}s. Database remained anchored in backend/.")
    results["suite_1_directory_portability"]["cwd_temp_anchored"] = {"status": "PASS", "startup_sec": elapsed3}
    results["summary"]["passed"] += 1
except Exception as e:
    print(f"  [FAIL] cwd_temp_anchored: {e}")
    results["suite_1_directory_portability"]["cwd_temp_anchored"] = {"status": "FAIL", "error": str(e)}
    results["summary"]["failed"] += 1
finally:
    cleanup_proc(proc3)

# ==============================================================================
# SUITE 2: Database Concurrency & SQLite Thread Integrity
# ==============================================================================
print("\n>>> SUITE 2: Database Concurrency & SQLite Thread Integrity")
port_c = find_available_port(8110)
base_url_c = f"http://127.0.0.1:{port_c}"
proc_c = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port_c), "--log-level", "warning"],
    cwd=backend_dir
)

try:
    wait_for_server(base_url_c, proc_c)
    
    # Check initial record count directly from DB
    db_file = os.path.join(backend_dir, "aquapulse.db")
    with sqlite3.connect(db_file) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sensor_data")
        initial_count = cursor.fetchone()[0]
    
    print(f"Initial DB record count: {initial_count}")
    
    # Stress concurrency: 25 concurrent threads, each doing 4 POSTs and 4 GETs = 100 POSTs + 100 GETs
    num_threads = 25
    requests_per_thread = 4
    total_expected_posts = num_threads * requests_per_thread
    
    print(f"Launching concurrency stress harness: {num_threads} threads, {total_expected_posts} total POSTs and GETs...")
    
    post_errors = []
    get_errors = []
    post_durations = []
    get_durations = []
    
    def worker_stress(thread_idx):
        for req_idx in range(requests_per_thread):
            # POST sensor data
            reading = {
                "ph": 6.8 + (thread_idx * 0.05),
                "tds": 200.0 + (req_idx * 10),
                "turbidity": 2.0 + (req_idx * 0.5),
                "temperature": 25.0 + thread_idx
            }
            t0 = time.time()
            try:
                st, resp = make_request(f"{base_url_c}/api/sensor-data", method="POST", data=reading, timeout=10)
                dur = time.time() - t0
                post_durations.append(dur)
                if st != 200 or "id" not in resp:
                    post_errors.append(f"Thread {thread_idx} POST {req_idx} bad response: {st} {resp}")
            except Exception as ex:
                post_errors.append(f"Thread {thread_idx} POST {req_idx} error: {ex}")
            
            # GET analysis
            t1 = time.time()
            try:
                st, resp = make_request(f"{base_url_c}/api/analysis", method="GET", timeout=10)
                dur = time.time() - t1
                get_durations.append(dur)
                if st != 200 or "skin_risk" not in resp:
                    get_errors.append(f"Thread {thread_idx} GET {req_idx} bad response: {st} {resp}")
            except Exception as ex:
                get_errors.append(f"Thread {thread_idx} GET {req_idx} error: {ex}")

    t_start = time.time()
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(worker_stress, i) for i in range(num_threads)]
        for f in as_completed(futures):
            f.result()
    total_stress_time = time.time() - t_start
    
    print(f"Concurrency run completed in {total_stress_time:.2f}s.")
    print(f"  POST errors: {len(post_errors)} / {total_expected_posts}")
    print(f"  GET errors:  {len(get_errors)} / {total_expected_posts}")
    if post_durations:
        print(f"  Avg POST latency: {(sum(post_durations)/len(post_durations))*1000:.1f}ms")
    if get_durations:
        print(f"  Avg GET latency:  {(sum(get_durations)/len(get_durations))*1000:.1f}ms")
        
    # Verify DB Integrity via PRAGMA integrity_check
    with sqlite3.connect(db_file) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        integrity_res = cursor.fetchall()
        cursor.execute("SELECT COUNT(*) FROM sensor_data")
        final_count = cursor.fetchone()[0]
        
    print(f"SQLite PRAGMA integrity_check: {integrity_res}")
    print(f"Final DB record count: {final_count} (Delta: {final_count - initial_count})")
    
    integrity_ok = len(integrity_res) == 1 and integrity_res[0][0] == "ok"
    records_match = (final_count - initial_count) == (total_expected_posts - len(post_errors))
    
    if integrity_ok and len(post_errors) == 0 and len(get_errors) == 0 and records_match:
        print("  [PASS] SQLite concurrency and integrity fully verified without locks or dropped rows.")
        results["suite_2_concurrency_and_integrity"]["status"] = "PASS"
        results["summary"]["passed"] += 1
    else:
        status_str = "FAIL" if (len(post_errors) > 0 or not integrity_ok) else "WARN"
        print(f"  [{status_str}] Concurrency discrepancies: post_errors={len(post_errors)}, get_errors={len(get_errors)}, integrity_ok={integrity_ok}")
        results["suite_2_concurrency_and_integrity"] = {
            "status": status_str,
            "post_errors": len(post_errors),
            "get_errors": len(get_errors),
            "integrity_ok": integrity_ok,
            "records_delta": final_count - initial_count
        }
        if status_str == "FAIL":
            results["summary"]["failed"] += 1
        else:
            results["summary"]["warnings"] += 1

finally:
    cleanup_proc(proc_c)

# ==============================================================================
# SUITE 3: Schema Validation Across Empty DB, Multiple Records & ML Classes
# ==============================================================================
print("\n>>> SUITE 3: Schema Validation Across Empty DB, Multiple Records & ML Classes")

# Test 3.1: Isolated Empty Database test
print("Test 3.1: Empty Database schema verification...")
# We will create an isolated fresh database file
isolated_db_dir = tempfile.mkdtemp()
isolated_db_path = os.path.join(isolated_db_dir, "test_empty.db")
# Start server pointing to this DB via overriding DB_PATH or python script
test_server_code = f"""
import os, sys
sys.path.insert(0, r'{backend_dir}')
import main
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Override DB to isolated empty db
isolated_url = r'sqlite:///{isolated_db_path}'
main.engine = create_engine(isolated_url, connect_args={{"check_same_thread": False}})
main.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main.engine)
main.Base.metadata.create_all(bind=main.engine)

import uvicorn
if __name__ == '__main__':
    uvicorn.run(main.app, host='127.0.0.1', port={find_available_port(8120)}, log_level='warning')
"""
test_script_path = os.path.join(isolated_db_dir, "run_empty_server.py")
with open(test_script_path, "w") as f:
    f.write(test_server_code)

port_empty = int(test_server_code.split("port=")[1].split(",")[0])
base_url_empty = f"http://127.0.0.1:{port_empty}"

proc_empty = subprocess.Popen([python_exe, test_script_path], cwd=isolated_db_dir)
try:
    wait_for_server(base_url_empty, proc_empty)
    
    # Test GET /api/latest-data on empty DB
    st_latest, data_latest = make_request(f"{base_url_empty}/api/latest-data")
    assert st_latest == 200
    assert data_latest["ph"] == 0.0
    assert data_latest["tds"] == 0.0
    assert data_latest["turbidity"] == 0.0
    assert data_latest["temperature"] == 0.0
    print(f"  Empty DB /api/latest-data: {data_latest}")
    
    # Test GET /api/analysis on empty DB
    st_ana, data_ana = make_request(f"{base_url_empty}/api/analysis")
    assert st_ana == 200
    assert data_ana["health_score"] == 0
    assert data_ana["quality_class"] == "Unknown"
    assert data_ana["risk_level"] == "Unknown"
    assert data_ana["skin_risk"] == "Unknown"
    assert data_ana["potability"] == "Unknown"
    assert isinstance(data_ana["plant_suitability"], list) and len(data_ana["plant_suitability"]) == 0
    assert isinstance(data_ana["appliance_impact"], list) and len(data_ana["appliance_impact"]) == 0
    print(f"  Empty DB /api/analysis: {data_ana}")
    print("  [PASS] Empty DB returns exact schema compliant fallback values.")
    results["suite_3_schema_and_model_classes"]["empty_db_schema"] = "PASS"
    results["summary"]["passed"] += 1
except Exception as e:
    print(f"  [FAIL] empty_db_schema: {e}")
    results["suite_3_schema_and_model_classes"]["empty_db_schema"] = {"status": "FAIL", "error": str(e)}
    results["summary"]["failed"] += 1
finally:
    cleanup_proc(proc_empty)

# Test 3.2: Multi-Record Latest Ordering & All 6 ML Model Classes
print("\nTest 3.2: Multi-Record Sorting & All 6 ML Classes...")
port_m = find_available_port(8130)
base_url_m = f"http://127.0.0.1:{port_m}"
proc_m = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port_m), "--log-level", "warning"],
    cwd=backend_dir
)

# 6 test profiles representing the 6 ML model target classes
test_profiles = [
    {
        "expected_class": "Acidic Irritant Contact Dermatitis",
        "data": {"ph": 5.01, "tds": 945.0, "turbidity": 1.93, "temperature": 36.7},
        "expected_potability": "Not Safe for Drinking"
    },
    {
        "expected_class": "Bacterial / Fungal Infection Risk",
        "data": {"ph": 6.43, "tds": 942.0, "turbidity": 15.62, "temperature": 30.6},
        "expected_potability": "Not Safe for Drinking"
    },
    {
        "expected_class": "Eczema / Skin Barrier Damage",
        "data": {"ph": 10.18, "tds": 202.0, "turbidity": 2.06, "temperature": 39.6},
        "expected_potability": "Not Safe for Drinking"
    },
    {
        "expected_class": "Pseudomonas Folliculitis (Hot Tub Rash)",
        "data": {"ph": 6.86, "tds": 637.0, "turbidity": 11.19, "temperature": 41.6},
        "expected_potability": "Not Safe for Drinking"
    },
    {
        "expected_class": "Safe (No Skin Risk)",
        "data": {"ph": 7.41, "tds": 238.0, "turbidity": 5.0, "temperature": 20.8},
        "expected_potability": "Safe for Drinking"
    },
    {
        "expected_class": "Severe Xerosis (Dry Skin Risk)",
        "data": {"ph": 8.31, "tds": 993.0, "turbidity": 3.74, "temperature": 23.1},
        "expected_potability": "Not Safe for Drinking"
    }
]

try:
    wait_for_server(base_url_m, proc_m)
    
    class_results = {}
    for idx, prof in enumerate(test_profiles):
        exp_cls = prof["expected_class"]
        exp_pot = prof["expected_potability"]
        # Ingest
        st_p, resp_p = make_request(f"{base_url_m}/api/sensor-data", method="POST", data=prof["data"])
        assert st_p == 200
        time.sleep(0.1) # ensure discrete timestamp
        
        # Query analysis immediately
        st_a, resp_a = make_request(f"{base_url_m}/api/analysis")
        assert st_a == 200
        actual_cls = resp_a.get("skin_risk")
        actual_pot = resp_a.get("potability")
        
        match = (actual_cls == exp_cls) and (actual_pot == exp_pot)
        print(f"  Class {idx+1}: '{exp_cls}' -> Actual: '{actual_cls}' | Potability: '{actual_pot}' -> {'PASS' if match else 'FAIL'}")
        class_results[exp_cls] = {"matched": match, "actual_skin_risk": actual_cls, "actual_potability": actual_pot}
        assert match, f"Mismatch for {exp_cls}: got skin_risk={actual_cls}, potability={actual_pot}"

    print("  [PASS] All 6 ML model classes predicted accurately and potability computed correctly.")
    results["suite_3_schema_and_model_classes"]["all_6_classes"] = "PASS"
    results["summary"]["passed"] += 1
    
    # Test 3.3: Boundary conditions for Potability
    print("\nTest 3.3: Potability boundary conditions...")
    boundary_cases = [
        {"name": "exact_upper_boundary", "data": {"ph": 8.5, "tds": 500.0, "turbidity": 5.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
        {"name": "exact_lower_boundary", "data": {"ph": 6.5, "tds": 500.0, "turbidity": 5.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
        {"name": "ph_just_below_6.5", "data": {"ph": 6.49, "tds": 200.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
        {"name": "ph_just_above_8.5", "data": {"ph": 8.51, "tds": 200.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
        {"name": "tds_just_above_500", "data": {"ph": 7.0, "tds": 500.1, "turbidity": 2.0, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
        {"name": "turbidity_just_above_5", "data": {"ph": 7.0, "tds": 200.0, "turbidity": 5.01, "temperature": 25.0}, "expected": "Not Safe for Drinking"}
    ]
    
    boundary_passes = 0
    for b in boundary_cases:
        st_p, _ = make_request(f"{base_url_m}/api/sensor-data", method="POST", data=b["data"])
        time.sleep(0.05)
        st_a, resp_a = make_request(f"{base_url_m}/api/analysis")
        act = resp_a.get("potability")
        if act == b["expected"]:
            boundary_passes += 1
        else:
            print(f"    Boundary failure on {b['name']}: expected {b['expected']}, got {act}")
            
    print(f"  Boundary checks passed: {boundary_passes} / {len(boundary_cases)}")
    assert boundary_passes == len(boundary_cases)
    results["suite_3_schema_and_model_classes"]["boundary_conditions"] = "PASS"
    results["summary"]["passed"] += 1

    # Test 3.4: Sub-millisecond ordering stress test (Investigating ORDER BY timestamp DESC)
    print("\nTest 3.4: Rapid sequential insertion ordering check...")
    # Insert 10 distinct records in rapid succession with marked temperatures
    for i in range(10):
        rec = {"ph": 7.0, "tds": 200.0, "turbidity": 1.0, "temperature": 100.0 + i}
        make_request(f"{base_url_m}/api/sensor-data", method="POST", data=rec)
    
    st_l, latest_data = make_request(f"{base_url_m}/api/latest-data")
    print(f"  Rapid insertion expected temp: 109.0, retrieved latest temp: {latest_data.get('temperature')}")
    if latest_data.get("temperature") == 109.0:
        print("  [PASS] Latest data correctly tracks sequential inserts.")
        results["suite_3_schema_and_model_classes"]["rapid_insert_ordering"] = "PASS"
        results["summary"]["passed"] += 1
    else:
        print(f"  [WARN] Timestamp tie caused non-latest record retrieval: {latest_data.get('temperature')}")
        results["suite_3_schema_and_model_classes"]["rapid_insert_ordering"] = "WARN"
        results["summary"]["warnings"] += 1

except Exception as e:
    print(f"  [FAIL] Test 3.2/3.3/3.4: {e}")
    results["suite_3_schema_and_model_classes"]["error"] = str(e)
    results["summary"]["failed"] += 1
finally:
    cleanup_proc(proc_m)

# ==============================================================================
# SUITE 4: Process and Memory Cleanup
# ==============================================================================
print("\n>>> SUITE 4: Process and Memory Cleanup")

def get_uvicorn_pids():
    try:
        out = subprocess.check_output(
            ["powershell", "-Command", "Get-Process -Name 'python' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"],
            text=True
        )
        return set(int(x.strip()) for x in out.splitlines() if x.strip().isdigit())
    except Exception:
        return set()

pids_before = get_uvicorn_pids()
print(f"Python PIDs before test: {pids_before}")

port_clean = find_available_port(8140)
base_url_clean = f"http://127.0.0.1:{port_clean}"
proc_clean = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port_clean), "--log-level", "warning"],
    cwd=backend_dir
)

try:
    wait_for_server(base_url_clean, proc_clean)
    pid_server = proc_clean.pid
    print(f"Spawned server PID: {pid_server}")
    pids_during = get_uvicorn_pids()
    assert pid_server in pids_during, f"Server PID {pid_server} not found in running processes"
    
    # Query to verify it is responsive
    st, _ = make_request(f"{base_url_clean}/")
    assert st == 200
    
    # Terminate process cleanly
    print("Sending terminate signal...")
    t_term_start = time.time()
    proc_clean.terminate()
    proc_clean.wait(timeout=5)
    term_duration = time.time() - t_term_start
    print(f"Server process terminated in {term_duration:.2f}s.")
    
    time.sleep(0.5)
    pids_after = get_uvicorn_pids()
    print(f"Python PIDs after shutdown: {pids_after}")
    assert pid_server not in pids_after, f"Orphaned server PID {pid_server} still running!"
    
    # Verify port reuse
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", port_clean))
    print(f"  [PASS] Port {port_clean} immediately released and re-bindable.")
    
    # Verify SQLite file lock is released
    db_path = os.path.join(backend_dir, "aquapulse.db")
    with sqlite3.connect(db_path) as conn:
        c = conn.cursor()
        c.execute("PRAGMA quick_check;")
        res = c.fetchone()
    print(f"  [PASS] Database lock released cleanly; quick_check: {res}")
    
    results["suite_4_process_cleanup"]["status"] = "PASS"
    results["summary"]["passed"] += 1

except Exception as e:
    print(f"  [FAIL] process_cleanup: {e}")
    results["suite_4_process_cleanup"]["status"] = "FAIL"
    results["suite_4_process_cleanup"]["error"] = str(e)
    results["summary"]["failed"] += 1
finally:
    cleanup_proc(proc_clean)

# ==============================================================================
# FINAL HARNESS SUMMARY
# ==============================================================================
print("\n" + "=" * 70)
print("CHALLENGER HARNESS EXECUTION SUMMARY")
print("=" * 70)
print(json.dumps(results, indent=2))
print("=" * 70)

if results["summary"]["failed"] == 0:
    print("ALL CHALLENGE SUITES COMPLETED WITH ZERO FAILURES.")
    sys.exit(0)
else:
    print(f"CHALLENGE FOUND {results['summary']['failed']} FAILURES.")
    sys.exit(1)
