#!/usr/bin/env python3
"""
Adversarial Stress Test Script for AquaPulse Backend (Milestone 1)
Tests:
1. Potability Rule Boundary Precision (pH 6.5/6.49, 8.5/8.51; TDS 500/501; Turbidity 5.0/5.1)
2. Edge Case and Extreme ML Inputs (Extreme pH, Extreme Turbidity, High/Low TDS, Extreme Temps)
3. Malformed and Invalid Payloads to /api/sensor-data (Type mismatches, missing fields)
4. High-Throughput Rapid Sequential Requests (Latency profiling: min, p50, p95, max)
5. Concurrent Requests (Stress testing SQLite & FastAPI under concurrent thread access)
6. Response Schema and Value Invariant Validation
"""

import sys
import os
import time
import socket
import json
import subprocess
import concurrent.futures
from typing import Dict, Any, List, Tuple
import httpx

def find_available_port(preferred=8000) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

KNOWN_SKIN_CLASSES = {
    "Acidic Irritant Contact Dermatitis",
    "Bacterial / Fungal Infection Risk",
    "Eczema / Skin Barrier Damage",
    "Pseudomonas Folliculitis (Hot Tub Rash)",
    "Safe (No Skin Risk)",
    "Severe Xerosis (Dry Skin Risk)"
}

def validate_analysis_schema(payload: Dict[str, Any]) -> Tuple[bool, str]:
    required_keys = [
        "health_score", "quality_class", "risk_level",
        "plant_suitability", "appliance_impact", "skin_risk", "potability"
    ]
    for key in required_keys:
        if key not in payload:
            return False, f"Missing key: {key}"
    
    if not isinstance(payload["health_score"], int) or not (0 <= payload["health_score"] <= 100):
        return False, f"Invalid health_score: {payload['health_score']}"
        
    if payload["potability"] not in ["Safe for Drinking", "Not Safe for Drinking", "Unknown"]:
        return False, f"Invalid potability: {payload['potability']}"
        
    if not isinstance(payload["plant_suitability"], list):
        return False, f"plant_suitability is not list: {type(payload['plant_suitability'])}"
        
    if not isinstance(payload["appliance_impact"], list):
        return False, f"appliance_impact is not list: {type(payload['appliance_impact'])}"
        
    return True, "OK"

def run_adversarial_suite():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    port = find_available_port(8000)
    base_url = f"http://127.0.0.1:{port}"
    print(f"==================================================")
    print(f"  AquaPulse Backend Adversarial & Stress Suite   ")
    print(f"==================================================")
    print(f"Target URL: {base_url}")
    print(f"Working Directory: {backend_dir}")
    print(f"Python Executable: {sys.executable}")

    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--log-level",
        "warning"
    ]

    proc = subprocess.Popen(cmd, cwd=backend_dir)
    client = httpx.Client(base_url=base_url, timeout=10.0)

    results = {
        "boundary_tests": {"total": 0, "passed": 0, "failed": 0, "failures": []},
        "extreme_tests": {"total": 0, "passed": 0, "failed": 0, "failures": []},
        "malformed_tests": {"total": 0, "passed": 0, "failed": 0, "failures": []},
        "sequential_stress": {},
        "concurrent_stress": {}
    }

    try:
        # Wait for server ready
        print("\nWaiting for server to become responsive...")
        start_wait = time.time()
        ready = False
        while time.time() - start_wait < 20:
            if proc.poll() is not None:
                raise RuntimeError(f"Server exited early with code {proc.returncode}")
            try:
                r = client.get("/")
                if r.status_code == 200:
                    ready = True
                    print(f"Server online in {time.time() - start_wait:.2f}s: {r.json()}")
                    break
            except Exception:
                time.sleep(0.3)
        if not ready:
            raise RuntimeError("Server failed to respond within 20s")

        # -------------------------------------------------------------
        # SUITE 1: Potability Rule Boundaries
        # -------------------------------------------------------------
        print("\n--- SUITE 1: Potability Rule Boundary Precision ---")
        boundary_cases = [
            # Exact lower bound pH 6.5
            {"name": "pH 6.50 (exact lower bound)", "data": {"ph": 6.50, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
            # Just below lower bound pH 6.49
            {"name": "pH 6.49 (below lower bound)", "data": {"ph": 6.49, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
            # Exact upper bound pH 8.50
            {"name": "pH 8.50 (exact upper bound)", "data": {"ph": 8.50, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
            # Just above upper bound pH 8.51
            {"name": "pH 8.51 (above upper bound)", "data": {"ph": 8.51, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
            # Exact upper bound TDS 500
            {"name": "TDS 500.0 (exact upper bound)", "data": {"ph": 7.20, "tds": 500.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
            # Just above upper bound TDS 501
            {"name": "TDS 501.0 (above upper bound)", "data": {"ph": 7.20, "tds": 501.0, "turbidity": 2.0, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
            # Exact upper bound Turbidity 5.0
            {"name": "Turbidity 5.0 (exact upper bound)", "data": {"ph": 7.20, "tds": 300.0, "turbidity": 5.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
            # Just above upper bound Turbidity 5.1
            {"name": "Turbidity 5.1 (above upper bound)", "data": {"ph": 7.20, "tds": 300.0, "turbidity": 5.1, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
            # Multi-boundary edge: all 3 at exact thresholds
            {"name": "All bounds exact (pH 6.5, TDS 500, Turb 5.0)", "data": {"ph": 6.50, "tds": 500.0, "turbidity": 5.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
            # Multi-boundary edge: all 3 at upper edge (pH 8.5, TDS 500, Turb 5.0)
            {"name": "All bounds upper (pH 8.5, TDS 500, Turb 5.0)", "data": {"ph": 8.50, "tds": 500.0, "turbidity": 5.0, "temperature": 25.0}, "expected": "Safe for Drinking"},
            # Multi-boundary edge: pH 6.499, TDS 500.01, Turb 5.01
            {"name": "All bounds slightly breached", "data": {"ph": 6.499, "tds": 500.01, "turbidity": 5.01, "temperature": 25.0}, "expected": "Not Safe for Drinking"},
        ]

        for tc in boundary_cases:
            results["boundary_tests"]["total"] += 1
            post_r = client.post("/api/sensor-data", json=tc["data"])
            assert post_r.status_code == 200, f"Failed POST: {post_r.status_code}"
            
            get_r = client.get("/api/analysis")
            assert get_r.status_code == 200, f"Failed GET: {get_r.status_code}"
            payload = get_r.json()
            ok, msg = validate_analysis_schema(payload)
            assert ok, msg
            
            actual = payload["potability"]
            passed = (actual == tc["expected"])
            if passed:
                results["boundary_tests"]["passed"] += 1
                print(f"  [PASS] {tc['name']}: expected '{tc['expected']}', got '{actual}' (skin_risk: '{payload['skin_risk']}')")
            else:
                results["boundary_tests"]["failed"] += 1
                failure_msg = f"{tc['name']}: expected '{tc['expected']}', got '{actual}'"
                results["boundary_tests"]["failures"].append(failure_msg)
                print(f"  [FAIL] {failure_msg}")

        # -------------------------------------------------------------
        # SUITE 2: Edge Cases & Extreme ML Inputs
        # -------------------------------------------------------------
        print("\n--- SUITE 2: Extreme & Adversarial ML Inputs ---")
        extreme_cases = [
            {"name": "Extreme pH 0.0 (Strong Acid)", "data": {"ph": 0.0, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}},
            {"name": "Extreme pH 14.0 (Strong Base)", "data": {"ph": 14.0, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}},
            {"name": "Negative pH -2.0 (Hypothetical Hyper-Acid)", "data": {"ph": -2.0, "tds": 300.0, "turbidity": 2.0, "temperature": 25.0}},
            {"name": "Extreme Turbidity 5000.0 (Mud/Slurry)", "data": {"ph": 7.0, "tds": 300.0, "turbidity": 5000.0, "temperature": 25.0}},
            {"name": "Extreme TDS 100000.0 (High Salinity/Brine)", "data": {"ph": 7.0, "tds": 100000.0, "turbidity": 2.0, "temperature": 25.0}},
            {"name": "Pure Zero Values (0 pH, 0 TDS, 0 Turb, 0 Temp)", "data": {"ph": 0.0, "tds": 0.0, "turbidity": 0.0, "temperature": 0.0}},
            {"name": "Sub-zero Temperature (-20.0 C Freezing)", "data": {"ph": 7.0, "tds": 200.0, "turbidity": 1.0, "temperature": -20.0}},
            {"name": "Boiling Water (100.0 C)", "data": {"ph": 7.0, "tds": 200.0, "turbidity": 1.0, "temperature": 100.0}},
            {"name": "Superheated Temperature (350.0 C)", "data": {"ph": 7.0, "tds": 200.0, "turbidity": 1.0, "temperature": 350.0}},
            {"name": "Micro Turbidity 0.0 (Distilled pure)", "data": {"ph": 7.0, "tds": 5.0, "turbidity": 0.0, "temperature": 22.0}},
        ]

        observed_classes = set()
        for tc in extreme_cases:
            results["extreme_tests"]["total"] += 1
            post_r = client.post("/api/sensor-data", json=tc["data"])
            if post_r.status_code != 200:
                results["extreme_tests"]["failed"] += 1
                results["extreme_tests"]["failures"].append(f"{tc['name']} POST failed with {post_r.status_code}")
                continue
            
            get_r = client.get("/api/analysis")
            if get_r.status_code != 200:
                results["extreme_tests"]["failed"] += 1
                results["extreme_tests"]["failures"].append(f"{tc['name']} GET failed with {get_r.status_code}")
                continue
            
            payload = get_r.json()
            ok, msg = validate_analysis_schema(payload)
            if not ok:
                results["extreme_tests"]["failed"] += 1
                results["extreme_tests"]["failures"].append(f"{tc['name']} invalid schema: {msg}")
                continue
            
            skin_risk = payload["skin_risk"]
            observed_classes.add(skin_risk)
            results["extreme_tests"]["passed"] += 1
            print(f"  [PASS] {tc['name']}: skin_risk='{skin_risk}', potability='{payload['potability']}', health_score={payload['health_score']}")

        print(f"\nUnique ML classes observed during extremes: {observed_classes}")

        # -------------------------------------------------------------
        # SUITE 3: Malformed & Invalid Payloads to /api/sensor-data
        # -------------------------------------------------------------
        print("\n--- SUITE 3: Malformed & Invalid Payloads ---")
        malformed_cases = [
            {"name": "Empty JSON object {}", "data": {}, "expected_code": 422},
            {"name": "Missing temperature field", "data": {"ph": 7.0, "tds": 300, "turbidity": 2.0}, "expected_code": 422},
            {"name": "String instead of float for pH", "data": {"ph": "not-a-number", "tds": 300, "turbidity": 2.0, "temperature": 25.0}, "expected_code": 422},
            {"name": "Null TDS value", "data": {"ph": 7.0, "tds": None, "turbidity": 2.0, "temperature": 25.0}, "expected_code": 422},
            {"name": "Array for turbidity", "data": {"ph": 7.0, "tds": 300, "turbidity": [1.0, 2.0], "temperature": 25.0}, "expected_code": 422},
            {"name": "Valid numeric strings ('7.4')", "data": {"ph": "7.4", "tds": "320", "turbidity": "1.8", "temperature": "26.0"}, "expected_code": 200},
        ]

        for tc in malformed_cases:
            results["malformed_tests"]["total"] += 1
            post_r = client.post("/api/sensor-data", json=tc["data"])
            if post_r.status_code == tc["expected_code"]:
                results["malformed_tests"]["passed"] += 1
                print(f"  [PASS] {tc['name']}: got expected HTTP {post_r.status_code}")
            else:
                results["malformed_tests"]["failed"] += 1
                err = f"{tc['name']}: expected {tc['expected_code']}, got {post_r.status_code}"
                results["malformed_tests"]["failures"].append(err)
                print(f"  [FAIL] {err}")

        # Ensure that invalid payloads didn't corrupt the database or get_analysis
        verify_r = client.get("/api/analysis")
        assert verify_r.status_code == 200, "Analysis broke after malformed payloads!"
        print("  [PASS] Post-malformed health analysis endpoint operational.")

        # -------------------------------------------------------------
        # SUITE 4: High-Throughput Rapid Sequential Requests
        # -------------------------------------------------------------
        print("\n--- SUITE 4: Rapid Sequential Stress Test (100 iterations = 200 requests) ---")
        seq_latencies_post = []
        seq_latencies_get = []
        seq_errors = 0
        iterations = 100

        start_seq = time.time()
        for i in range(iterations):
            # Alternate values
            ph_val = 6.0 + (i % 30) * 0.1
            tds_val = 100.0 + (i % 50) * 10.0
            turb_val = 0.5 + (i % 20) * 0.3
            temp_val = 20.0 + (i % 25) * 0.5
            
            t0 = time.perf_counter()
            pr = client.post("/api/sensor-data", json={"ph": ph_val, "tds": tds_val, "turbidity": turb_val, "temperature": temp_val})
            t1 = time.perf_counter()
            seq_latencies_post.append((t1 - t0) * 1000.0)
            if pr.status_code != 200:
                seq_errors += 1

            t2 = time.perf_counter()
            gr = client.get("/api/analysis")
            t3 = time.perf_counter()
            seq_latencies_get.append((t3 - t2) * 1000.0)
            if gr.status_code != 200:
                seq_errors += 1

        total_seq_time = time.time() - start_seq
        
        seq_latencies_post.sort()
        seq_latencies_get.sort()

        post_p50 = seq_latencies_post[int(len(seq_latencies_post) * 0.50)]
        post_p95 = seq_latencies_post[int(len(seq_latencies_post) * 0.95)]
        post_p99 = seq_latencies_post[int(len(seq_latencies_post) * 0.99)]
        post_max = max(seq_latencies_post)
        post_mean = sum(seq_latencies_post) / len(seq_latencies_post)

        get_p50 = seq_latencies_get[int(len(seq_latencies_get) * 0.50)]
        get_p95 = seq_latencies_get[int(len(seq_latencies_get) * 0.95)]
        get_p99 = seq_latencies_get[int(len(seq_latencies_get) * 0.99)]
        get_max = max(seq_latencies_get)
        get_mean = sum(seq_latencies_get) / len(seq_latencies_get)

        results["sequential_stress"] = {
            "iterations": iterations,
            "total_requests": iterations * 2,
            "total_duration_sec": round(total_seq_time, 2),
            "errors": seq_errors,
            "post_latency_ms": {
                "mean": round(post_mean, 2),
                "p50": round(post_p50, 2),
                "p95": round(post_p95, 2),
                "p99": round(post_p99, 2),
                "max": round(post_max, 2)
            },
            "get_latency_ms": {
                "mean": round(get_mean, 2),
                "p50": round(get_p50, 2),
                "p95": round(get_p95, 2),
                "p99": round(get_p99, 2),
                "max": round(get_max, 2)
            }
        }

        print(f"Sequential completed in {total_seq_time:.2f}s ({iterations * 2 / total_seq_time:.1f} req/s). Errors: {seq_errors}")
        print(f"  POST /api/sensor-data -> mean: {post_mean:.2f}ms | p50: {post_p50:.2f}ms | p95: {post_p95:.2f}ms | max: {post_max:.2f}ms")
        print(f"  GET  /api/analysis    -> mean: {get_mean:.2f}ms | p50: {get_p50:.2f}ms | p95: {get_p95:.2f}ms | max: {get_max:.2f}ms")

        # -------------------------------------------------------------
        # SUITE 5: Concurrent Requests Stress Test (10 workers, 20 reqs each)
        # -------------------------------------------------------------
        print("\n--- SUITE 5: Concurrent Multithreaded Stress Test (10 threads, 20 reqs each = 200 requests) ---")
        concurrent_errors = 0
        concurrent_latencies = []

        def worker_task(worker_id: int):
            worker_client = httpx.Client(base_url=base_url, timeout=10.0)
            local_errors = 0
            local_latencies = []
            for j in range(10):
                # 1 post, 1 get
                try:
                    t0 = time.perf_counter()
                    pr = worker_client.post("/api/sensor-data", json={
                        "ph": 7.0 + (worker_id * 0.1),
                        "tds": 250.0 + (j * 10),
                        "turbidity": 1.5,
                        "temperature": 25.0
                    })
                    t1 = time.perf_counter()
                    local_latencies.append((t1 - t0) * 1000.0)
                    if pr.status_code != 200:
                        local_errors += 1
                except Exception as ex:
                    local_errors += 1

                try:
                    t2 = time.perf_counter()
                    gr = worker_client.get("/api/analysis")
                    t3 = time.perf_counter()
                    local_latencies.append((t3 - t2) * 1000.0)
                    if gr.status_code != 200:
                        local_errors += 1
                except Exception as ex:
                    local_errors += 1
            worker_client.close()
            return local_errors, local_latencies

        start_conc = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(worker_task, w) for w in range(10)]
            for f in concurrent.futures.as_completed(futures):
                errs, lats = f.result()
                concurrent_errors += errs
                concurrent_latencies.extend(lats)
        total_conc_time = time.time() - start_conc
        concurrent_latencies.sort()

        conc_p50 = concurrent_latencies[int(len(concurrent_latencies) * 0.50)]
        conc_p95 = concurrent_latencies[int(len(concurrent_latencies) * 0.95)]
        conc_max = max(concurrent_latencies)
        conc_mean = sum(concurrent_latencies) / len(concurrent_latencies)

        results["concurrent_stress"] = {
            "workers": 10,
            "total_requests": len(concurrent_latencies),
            "total_duration_sec": round(total_conc_time, 2),
            "errors": concurrent_errors,
            "latency_ms": {
                "mean": round(conc_mean, 2),
                "p50": round(conc_p50, 2),
                "p95": round(conc_p95, 2),
                "max": round(conc_max, 2)
            }
        }
        print(f"Concurrent completed in {total_conc_time:.2f}s ({len(concurrent_latencies) / total_conc_time:.1f} req/s). Errors: {concurrent_errors}")
        print(f"  All Requests -> mean: {conc_mean:.2f}ms | p50: {conc_p50:.2f}ms | p95: {conc_p95:.2f}ms | max: {conc_max:.2f}ms")

        # -------------------------------------------------------------
        # SUITE 6: ML Class Variety Exploration
        # -------------------------------------------------------------
        print("\n--- SUITE 6: Multi-Profile Skin Risk Classification Diversity ---")
        profiles = [
            ("Low pH, Moderate TDS, Clean", {"ph": 4.5, "tds": 250.0, "turbidity": 1.2, "temperature": 24.0}),
            ("High Temp, High Turbidity", {"ph": 7.8, "tds": 450.0, "turbidity": 15.0, "temperature": 42.0}),
            ("High TDS, Moderate pH", {"ph": 7.5, "tds": 1200.0, "turbidity": 3.0, "temperature": 26.0}),
            ("Extreme Alkaline, Hot", {"ph": 11.5, "tds": 800.0, "turbidity": 8.0, "temperature": 38.0}),
            ("Near Perfect Potable", {"ph": 7.3, "tds": 180.0, "turbidity": 0.8, "temperature": 23.0}),
            ("High Turbidity, Cold", {"ph": 6.8, "tds": 350.0, "turbidity": 25.0, "temperature": 12.0}),
        ]
        diverse_classes = set()
        for label, p_data in profiles:
            client.post("/api/sensor-data", json=p_data)
            p_res = client.get("/api/analysis").json()
            diverse_classes.add(p_res["skin_risk"])
            print(f"  Profile '{label}': potability='{p_res['potability']}', skin_risk='{p_res['skin_risk']}'")

        print(f"Distinct classes stimulated across profiles: {len(diverse_classes)} -> {diverse_classes}")

        print("\n==================================================")
        print("                  FINAL SUMMARY                   ")
        print("==================================================")
        total_tests = (
            results["boundary_tests"]["total"] +
            results["extreme_tests"]["total"] +
            results["malformed_tests"]["total"]
        )
        total_passed = (
            results["boundary_tests"]["passed"] +
            results["extreme_tests"]["passed"] +
            results["malformed_tests"]["passed"]
        )
        total_failed = (
            results["boundary_tests"]["failed"] +
            results["extreme_tests"]["failed"] +
            results["malformed_tests"]["failed"]
        )
        print(f"Boundary Tests : {results['boundary_tests']['passed']}/{results['boundary_tests']['total']} passed")
        print(f"Extreme Inputs : {results['extreme_tests']['passed']}/{results['extreme_tests']['total']} passed")
        print(f"Malformed Tests: {results['malformed_tests']['passed']}/{results['malformed_tests']['total']} passed")
        print(f"Sequential Req : {results['sequential_stress']['total_requests']} reqs, {results['sequential_stress']['errors']} errors")
        print(f"Concurrent Req : {results['concurrent_stress']['total_requests']} reqs, {results['concurrent_stress']['errors']} errors")
        print(f"Total Unit Tests: {total_passed}/{total_tests} passed")

        if total_failed == 0 and results["sequential_stress"]["errors"] == 0 and results["concurrent_stress"]["errors"] == 0:
            print("\nVERDICT: >>> APPROVE <<<")
        else:
            print(f"\nVERDICT: >>> REQUEST_CHANGES <<< ({total_failed} functional failures, errors in stress tests)")

    finally:
        client.close()
        print("\nCleaning up server subprocess...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
            print("Server cleanly shut down.")
        except subprocess.TimeoutExpired:
            print("Force killing server...")
            proc.kill()
            proc.wait()

    # Dump JSON results for reporting
    with open(os.path.join(backend_dir, "test_adversarial_results.json"), "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    try:
        run_adversarial_suite()
    except Exception as e:
        print(f"FATAL ERROR in adversarial suite: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
