#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "OPPO A77s";
const char* password = "Sarvy2503@";

const String serverName = "https://aquapulse-ne52.onrender.com/api/sensor-data";

#define PH_PIN 34
#define TDS_PIN 35
#define TURBIDITY_PIN 32
#define ONE_WIRE_BUS 4 

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

unsigned long lastTime = 0;
unsigned long timerDelay = 10000; 

const int NUM_SAMPLES = 20;

float getMedian(float samples[], int size) {
  for (int i = 0; i < size - 1; i++) {
    for (int j = i + 1; j < size; j++) {
      if (samples[i] > samples[j]) {
        float temp = samples[i];
        samples[i] = samples[j];
        samples[j] = temp;
      }
    }
  }
  if (size % 2 == 0) {
    return (samples[size / 2 - 1] + samples[size / 2]) / 2.0;
  } else {
    return samples[size / 2];
  }
}

float readPh(bool &isConnected) {
  float samples[NUM_SAMPLES];
  for (int i = 0; i < NUM_SAMPLES; i++) {
    samples[i] = analogRead(PH_PIN);
    delay(5);
  }
  float medianRaw = getMedian(samples, NUM_SAMPLES);
  
  if (medianRaw < 10) {
    isConnected = false;
    return 7.2; 
  }
  
  isConnected = true;
  float voltage = medianRaw * (3.3 / 4095.0);
  return 3.5 * voltage;
}

float readTDS() {
  float samples[NUM_SAMPLES];
  for (int i = 0; i < NUM_SAMPLES; i++) {
    samples[i] = analogRead(TDS_PIN);
    delay(5);
  }
  float medianRaw = getMedian(samples, NUM_SAMPLES);
  if (medianRaw < 10) {
    return 0.0;
  }
  float voltage = medianRaw * (3.3 / 4095.0);
  // Calibration: offset of ~0.6068V in air
  float tds_voltage = voltage - 0.6068;
  if (tds_voltage < 0) tds_voltage = 0;
  return tds_voltage * 100.0;
}

float readTurbidity() {
  float samples[NUM_SAMPLES];
  for (int i = 0; i < NUM_SAMPLES; i++) {
    samples[i] = analogRead(TURBIDITY_PIN);
    delay(5);
  }
  float medianRaw = getMedian(samples, NUM_SAMPLES);
  if (medianRaw < 10) {
    return 0.0;
  }
  float voltage = medianRaw * (3.3 / 4095.0);
  // Calibration: 2.95V is ~0 NTU (in air / clear water)
  float turbidity = 100.0 - (voltage / 2.95) * 100.0;
  if (turbidity < 0) turbidity = 0;
  return turbidity;
}

float readTemperature(bool &isSensorConnected) {
  sensors.requestTemperatures(); 
  float tempC = sensors.getTempCByIndex(0);
  
  if (tempC != DEVICE_DISCONNECTED_C && tempC > -50.0 && tempC < 100.0) {
    isSensorConnected = true;
    return tempC;
  } 
  
  isSensorConnected = false;
  return 25.0; 
}

void setup() {
  Serial.begin(115200);

  analogSetPinAttenuation(PH_PIN, ADC_11db);
  analogSetPinAttenuation(TDS_PIN, ADC_11db);
  analogSetPinAttenuation(TURBIDITY_PIN, ADC_11db);

  sensors.begin();
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  
  int attempts = 0;
  while(WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println("");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected to WiFi: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to WiFi on startup.");
  }
}

void loop() {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.reconnect();
    delay(5000);
    return; 
  }

  if ((millis() - lastTime) >= timerDelay) {
    HTTPClient http;
    
    bool phConnected = false;
    float phValue = readPh(phConnected);
    float tdsValue = readTDS();
    float turbidityValue = readTurbidity();
    bool tempSensorConnected = false;
    float tempValue = readTemperature(tempSensorConnected);

    Serial.printf("pH: %.2f | TDS: %.2f ppm | Turbidity: %.2f NTU | Temp: %.2f C (Connected: %s, pH Connected: %s)\n", 
      phValue, tdsValue, turbidityValue, tempValue, tempSensorConnected ? "Yes" : "No", phConnected ? "Yes" : "No");

    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    
    String tempSource = tempSensorConnected ? "sensor" : "estimated";
    String phStatus = phConnected ? "valid" : "estimated";
    
    String httpRequestData = "{";
    httpRequestData += "\"ph\":" + String(phValue) + ",";
    httpRequestData += "\"tds\":" + String(tdsValue) + ",";
    httpRequestData += "\"turbidity\":" + String(turbidityValue) + ",";
    httpRequestData += "\"temperature\":" + String(tempValue) + ",";
    httpRequestData += "\"temp_source\":\"" + tempSource + "\",";
    httpRequestData += "\"ph_status\":\"" + phStatus + "\"";
    httpRequestData += "}";           
    
    int httpResponseCode = http.POST(httpRequestData);
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
    
    lastTime = millis();
  }
}
