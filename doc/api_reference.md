# AquaPulse API Reference

The FastAPI backend exposes the following RESTful endpoints to facilitate communication between the ESP32 and the React Dashboard.

## `POST /api/sensor-data`
Used by the ESP32 to upload new sensor readings.

**Request Body (JSON):**
```json
{
  "ph": 7.2,
  "tds": 250.5,
  "turbidity": 2.1,
  "temperature": 24.5
}
```
**Response:** `200 OK`

---

## `GET /api/latest-data`
Used by the React dashboard to fetch the most recent sensor reading.

**Response (JSON):**
```json
{
  "ph": 7.2,
  "tds": 250.5,
  "turbidity": 2.1,
  "temperature": 24.5,
  "timestamp": "2026-07-27T12:00:00.000Z"
}
```

---

## `GET /api/analysis`
Used by the React dashboard to fetch the rule-based health analysis of the latest water sample.

**Response (JSON):**
```json
{
  "health_score": 80,
  "quality_class": "Moderate",
  "risk_level": "Low Risk",
  "plant_suitability": ["Tulsi", "Tomato"],
  "appliance_impact": ["Safe for RO", "Safe for Geyser"]
}
```
