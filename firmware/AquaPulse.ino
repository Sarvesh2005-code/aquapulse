#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --- WiFi Credentials ---
const char* ssid = "OPPO A77s";
const char* password = "Sarvy2503@";

// --- Backend API ---
// Change this to your computer's local IP address where FastAPI is running
const String serverName = "http://10.79.110.152/api/sensor-data";

// --- Pin Definitions (30-Pin ESP32) ---
#define PH_PIN 34
#define TDS_PIN 35
#define TURBIDITY_PIN 32
#define ONE_WIRE_BUS 4 // DS18B20 Temp Sensor

// Setup a oneWire instance to communicate with any OneWire devices
OneWire oneWire(ONE_WIRE_BUS);
// Pass our oneWire reference to Dallas Temperature sensor 
DallasTemperature sensors(&oneWire);

// Timing variables
unsigned long lastTime = 0;
// Send data every 10 seconds for testing (change to 60000 for 1 min in production)
unsigned long timerDelay = 10000;

void setup() {
  Serial.begin(115200);

  // Initialize Sensors
  sensors.begin();
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Send an HTTP POST request every timerDelay milliseconds
  if ((millis() - lastTime) > timerDelay) {
    
    // Check WiFi connection status
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      
      // Read sensors
      float phValue = readPh();
      float tdsValue = readTDS();
      float turbidityValue = readTurbidity();
      float tempValue = readTemperature();

      // Print for debugging
      Serial.printf("pH: %.2f | TDS: %.2f ppm | Turbidity: %.2f NTU | Temp: %.2f C\n", phValue, tdsValue, turbidityValue, tempValue);

      // Your Domain name with URL path or IP address with path
      http.begin(serverName);
      
      // Specify content-type header
      http.addHeader("Content-Type", "application/json");
      
      // Prepare JSON payload
      String httpRequestData = "{\"ph\":\"" + String(phValue) + "\",\"tds\":\"" + String(tdsValue) + "\",\"turbidity\":\"" + String(turbidityValue) + "\",\"temperature\":\"" + String(tempValue) + "\"}";           
      
      // Send HTTP POST request
      int httpResponseCode = http.POST(httpRequestData);
     
      if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
      }
      else {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
      }
      // Free resources
      http.end();
    }
    else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}

// --- Sensor Reading Functions ---

float readPh() {
  int analogValue = analogRead(PH_PIN);
  // Calibration required: convert analog value (0-4095) to pH (0-14)
  // This is a dummy conversion for testing
  float voltage = analogValue * (3.3 / 4095.0);
  float ph = 3.5 * voltage; // Simplified example formula
  return ph;
}

float readTDS() {
  int analogValue = analogRead(TDS_PIN);
  // Calibration required: convert analog value to TDS in ppm
  float voltage = analogValue * (3.3 / 4095.0);
  float tds = voltage * 100; // Simplified example formula
  return tds;
}

float readTurbidity() {
  int analogValue = analogRead(TURBIDITY_PIN);
  // Calibration required: convert analog value to NTU
  float voltage = analogValue * (3.3 / 4095.0);
  float turbidity = 100.00 - (voltage / 3.3) * 100.00; // Simplified
  return turbidity;
}

float readTemperature() {
  sensors.requestTemperatures(); 
  float tempC = sensors.getTempCByIndex(0);
  // Check if reading was successful
  if(tempC != DEVICE_DISCONNECTED_C) 
  {
    return tempC;
  } 
  return -127.0; // Error value
}
