# AquaPulse Hardware Setup Guide

## Sensor Pinout Mapping

| Component | Pin on Component | Pin on ESP32 | Notes |
| :--- | :--- | :--- | :--- |
| **pH Sensor** | VCC / GND | 3.3V / GND | |
| | PO (Analog Out) | **GPIO 34** (ADC1_CH6) | Use a voltage divider if sensor outputs 5V. |
| **TDS Sensor** | VCC / GND | 3.3V / GND | |
| | A (Analog Out) | **GPIO 35** (ADC1_CH7) | Use a voltage divider if sensor outputs 5V. |
| **Turbidity Sensor** | VCC / GND | 3.3V / GND | |
| | OUT (Analog) | **GPIO 32** (ADC1_CH4) | Use a voltage divider if sensor outputs 5V. |
| **DS18B20 Temp** | VCC / GND | 3.3V / GND | |
| | DQ (Data) | **GPIO 4** | **Requires 4.7kΩ pull-up resistor** between DQ and 3.3V. |

## Important Hardware Rules
1.  **Floating Pins:** If a sensor is disconnected from an analog pin, the ESP32 will read random electromagnetic noise (fluctuating values). Always ensure sensors are securely grounded.
2.  **Voltage Dividers:** The ESP32 ADC pins can only safely read up to 3.3V. If your sensor modules output 5V, you *must* use a voltage divider (e.g., 10kΩ and 20kΩ resistors) to drop the signal down to 3.3V to prevent damaging the ESP32.
3.  **TDS Conductivity:** A dry TDS sensor in the air has infinite resistance, meaning it will output 0V and read `0.00 ppm`. It must be submerged in water to provide a reading.
