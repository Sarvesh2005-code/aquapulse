# AquaPulse Architecture

AquaPulse is an IoT-based smart water monitoring system divided into three main components: Hardware, Backend, and Frontend.

## 1. Hardware (Edge Node)
*   **Microcontroller:** ESP32 DevKit V1
*   **Sensors:** pH Sensor, TDS Sensor, Turbidity Sensor, DS18B20 Temperature Sensor.
*   **Role:** The ESP32 continuously reads analog and digital signals from the sensors, applies conversion formulas to generate readable metrics (pH level, NTU, ppm), and sends this data over Wi-Fi to the cloud backend via an HTTP POST request.

## 2. Backend (Cloud API)
*   **Framework:** FastAPI (Python)
*   **Database:** SQLite via SQLAlchemy ORM
*   **Role:** The backend acts as the central hub. It receives the HTTP POST requests from the ESP32 and stores the raw data in an SQLite database. It exposes GET endpoints for the frontend to retrieve the latest data and health analysis. It includes rule-based logic to score the water quality.
*   **Hosting:** Configured to be hosted on Render.com.

## 3. Frontend (Dashboard)
*   **Framework:** React (Vite, TypeScript)
*   **Styling:** Tailwind CSS
*   **Charting:** Chart.js & react-chartjs-2
*   **Role:** A responsive web dashboard that polls the backend every 5 seconds for the latest data. It visualizes the data using historical line charts and displays an AI-driven "Health Analysis" card detailing quality, plant suitability, and appliance impact.
*   **Hosting:** Configured to be hosted on Vercel.
