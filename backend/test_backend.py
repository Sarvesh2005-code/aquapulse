#!/usr/bin/env python3
"""
Acceptance Test Script for AquaPulse Backend
Starts the FastAPI server with uvicorn in a subprocess, posts sensor readings,
queries /api/analysis, verifies HTTP 200 and payload schema (skin_risk, potability),
and cleanly terminates the server.
"""

import sys
import os
import time
import socket
import json
import subprocess
import urllib.request
import urllib.error

def find_available_port(preferred=8000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=5) as response:
        status_code = response.getcode()
        resp_data = json.loads(response.read().decode("utf-8"))
        return status_code, resp_data

def run_tests():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    port = find_available_port(8000)
    base_url = f"http://127.0.0.1:{port}"
    print(f"=== AquaPulse Backend Acceptance Test ===")
    print(f"Target URL: {base_url}")
    print(f"Python Executable: {sys.executable}")
    print(f"Working Directory: {backend_dir}")

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
        "info"
    ]

    print(f"Starting server process: {' '.join(cmd)}")
    proc = subprocess.Popen(
        cmd,
        cwd=backend_dir
    )

    try:
        # Wait for server readiness
        print("Waiting for server to become responsive...")
        server_ready = False
        start_time = time.time()
        last_error = None
        while time.time() - start_time < 20:
            if proc.poll() is not None:
                raise RuntimeError(f"Server process terminated prematurely with exit code {proc.returncode}")
            try:
                status, data = make_request(f"{base_url}/")
                if status == 200:
                    server_ready = True
                    print(f"Server is online! Root response: {data}")
                    break
            except Exception as e:
                last_error = e
                time.sleep(0.5)
        
        if not server_ready:
            raise RuntimeError(f"Server failed to respond within 20 seconds. Last error: {last_error}")

        # Test 1: Query /api/analysis before new post (verifies response schema)
        print("\n--- Test 1: Initial GET /api/analysis ---")
        status, analysis = make_request(f"{base_url}/api/analysis")
        print(f"HTTP Status: {status}")
        print(f"Payload: {json.dumps(analysis, indent=2)}")
        assert status == 200, f"Expected 200, got {status}"
        assert "skin_risk" in analysis, "Response missing 'skin_risk'"
        assert "potability" in analysis, "Response missing 'potability'"
        assert "health_score" in analysis, "Response missing 'health_score'"
        assert "quality_class" in analysis, "Response missing 'quality_class'"
        assert "influencing_features" in analysis, "Response missing 'influencing_features'"
        print("Test 1 passed: Schema keys present and HTTP 200 returned.")

        # Test 2: Ingest clean/potable water sensor readings
        print("\n--- Test 2: POST /api/sensor-data (Potable / Clean Profile) ---")
        clean_reading = {
            "ph": 7.3,
            "tds": 210.0,
            "turbidity": 1.5,
            "temperature": 24.5
        }
        status, post_resp = make_request(f"{base_url}/api/sensor-data", method="POST", data=clean_reading)
        print(f"HTTP Status: {status}, Response: {post_resp}")
        assert status == 200, f"Expected 200, got {status}"
        assert "id" in post_resp, "Expected inserted record ID"

        # Test 3: Query /api/analysis and verify ML prediction + potability
        print("\n--- Test 3: GET /api/analysis (Verifying ML skin_risk & potability) ---")
        status, analysis = make_request(f"{base_url}/api/analysis")
        print(f"HTTP Status: {status}")
        print(f"Payload: {json.dumps(analysis, indent=2)}")
        assert status == 200, f"Expected 200, got {status}"
        assert analysis["potability"] == "Safe for Drinking", f"Expected 'Safe for Drinking', got {analysis['potability']}"
        assert analysis["skin_risk"] == "Safe (No Skin Risk)", f"Expected 'Safe (No Skin Risk)', got {analysis['skin_risk']}"
        assert analysis["health_score"] >= 80, f"Expected score >= 80, got {analysis['health_score']}"
        assert "influencing_features" in analysis, "Response missing 'influencing_features'"
        assert isinstance(analysis["influencing_features"], list) and len(analysis["influencing_features"]) > 0, "influencing_features should be a non-empty list"
        print("Test 3 passed: Correct ML prediction ('Safe (No Skin Risk)'), Potability ('Safe for Drinking'), and Influencing Features are present.")

        # Test 4: Ingest acidic/contaminated water sensor readings
        print("\n--- Test 4: POST /api/sensor-data (Contaminated / Acidic Profile) ---")
        acidic_reading = {
            "ph": 4.6,
            "tds": 750.0,
            "turbidity": 14.2,
            "temperature": 36.5
        }
        status, post_resp = make_request(f"{base_url}/api/sensor-data", method="POST", data=acidic_reading)
        print(f"HTTP Status: {status}, Response: {post_resp}")
        assert status == 200, f"Expected 200, got {status}"

        # Test 5: Query /api/analysis on contaminated reading
        print("\n--- Test 5: GET /api/analysis (Contaminated Profile Analysis) ---")
        status, analysis = make_request(f"{base_url}/api/analysis")
        print(f"HTTP Status: {status}")
        print(f"Payload: {json.dumps(analysis, indent=2)}")
        assert status == 200, f"Expected 200, got {status}"
        assert analysis["potability"] == "Not Safe for Drinking", f"Expected 'Not Safe for Drinking', got {analysis['potability']}"
        valid_skin_risks = [
            "Scalp Irritation Risk",
            "Skin Irritation Risk",
            "Dry Skin Risk",
            "Safe (No Skin Risk)",
            "Severe Hair/Skin Dryness"
        ]
        assert analysis["skin_risk"] in valid_skin_risks, f"Unexpected skin_risk: {analysis['skin_risk']}"
        assert "influencing_features" in analysis, "Response missing 'influencing_features'"
        assert isinstance(analysis["influencing_features"], list) and len(analysis["influencing_features"]) > 0, "influencing_features should be a non-empty list"
        print(f"Test 5 passed: Potability 'Not Safe for Drinking', ML predicted risk: {analysis['skin_risk']}, Influencing Features: {analysis['influencing_features']}")

        print("\n=== All Backend Tests Passed Successfully! ===")

    finally:
        print("\nShutting down FastAPI server process...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
            print("Server shut down cleanly.")
        except subprocess.TimeoutExpired:
            print("Force killing server process...")
            proc.kill()
            proc.wait()
            print("Server process killed.")

if __name__ == "__main__":
    try:
        run_tests()
        sys.exit(0)
    except Exception as e:
        print(f"\nTEST FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
