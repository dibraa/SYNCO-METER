/*
 * =========================================================================
 * Capstone Project: IoT Smart Meter with Load Control & Standby Reduction
 * Hardware: ESP32-WROOM-32 + PZEM-004T v3.0 + AC Relay Module
 * Stage 5: Microcontroller Firmware
 * =========================================================================
 * 
 * Hardware Pin Connections:
 * ESP32 GPIO 16 (RX2) <----> PZEM-004T TX
 * ESP32 GPIO 17 (TX2) <----> PZEM-004T RX (use 1k resistor or 5V-3.3V divider if required)
 * ESP32 GPIO 23       <----> Relay Control Pin (IN)
 * ESP32 GPIO 2        <----> Status LED (Onboard)
 * 5V / VIN            <----> PZEM 5V VCC & Relay VCC
 * GND                 <----> Common Ground (ESP32, PZEM, Relay)
 * 
 * Dependencies (install via Arduino Library Manager):
 * - PZEM004Tv30 by Mandar Joshi
 * - ArduinoJson by Benoit Blanchon (v6 or v7)
 * - WiFiClientSecure & HTTPClient (built into ESP32 core)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <PZEM004Tv30.h>
#include <ArduinoJson.h>

// ================= CONFIGURATION =================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase Cloud Endpoint
const char* SUPABASE_URL  = "https://YOUR_PROJECT.supabase.co/rest/v1/energy_readings";
const char* SUPABASE_KEY  = "YOUR_SUPABASE_ANON_KEY";
const char* DEVICE_ID_STR = "ESP32-PZEM-DEV-01";

// Hardware Pins
#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
#define RELAY_PIN   23
#define LED_PIN     2

// Relay logic: Set to LOW if using an active-low relay module (common on 5V relays)
#define RELAY_ENERGIZED HIGH
#define RELAY_DE_ENERGIZED LOW

// Safety Overload Cutoff (Autonomous in hardware)
const float OVERLOAD_THRESHOLD_WATTS = 3000.0; 

// Telemetry Reporting Interval
const unsigned long REPORT_INTERVAL_MS = 2000; // 2 seconds

// ================= OBJECTS & STATE =================
// PZEM-004T v3.0 on Serial2
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

bool currentRelayState = true;
unsigned long lastReportTime = 0;
bool isOverloadTripped = false;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==============================================");
  Serial.println("  SYNCO SMART ENERGY METER - ESP32 FIRMWARE");
  Serial.println("==============================================");

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Default state: Closed / Energized
  setRelay(true);

  // Connect to WiFi
  connectWiFi();
}

// ================= MAIN LOOP =================
void loop() {
  // Check and maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Read parameters from PZEM-004T v3.0
  float voltage   = pzem.voltage();
  float current   = pzem.current();
  float power     = pzem.power();
  float energy    = pzem.energy();
  float frequency = pzem.frequency();
  float pf        = pzem.pf();

  // Validate readings
  if (isnan(voltage)) {
    Serial.println("[PZEM] Error reading voltage. Check PZEM wiring & AC power.");
    voltage = 0.0;
  }
  if (isnan(current))   current = 0.0;
  if (isnan(power))     power = 0.0;
  if (isnan(energy))    energy = 0.0;
  if (isnan(frequency)) frequency = 60.0;
  if (isnan(pf))        pf = 1.0;

  // 2. Autonomous Local Overload Protection (Trips even if WiFi is offline!)
  if (currentRelayState && power > OVERLOAD_THRESHOLD_WATTS) {
    Serial.println("\n[SAFETY HAZARD] Overload detected! Instant autonomous trip triggered!");
    setRelay(false);
    isOverloadTripped = true;
  }

  // 3. Periodic Telemetry Transmission
  unsigned long now = millis();
  if (now - lastReportTime >= REPORT_INTERVAL_MS) {
    lastReportTime = now;

    printSerialDebug(voltage, current, power, energy, frequency, pf);

    // Send payload to Supabase
    if (WiFi.status() == WL_CONNECTED) {
      sendTelemetryToSupabase(voltage, current, power, energy, frequency, pf);
    }
  }
}

// ================= HELPER FUNCTIONS =================

void setRelay(bool state) {
  currentRelayState = state;
  digitalWrite(RELAY_PIN, state ? RELAY_ENERGIZED : RELAY_DE_ENERGIZED);
  digitalWrite(LED_PIN, state ? HIGH : LOW);
  Serial.printf("[RELAY] State changed to: %s\n", state ? "ON (Energized)" : "OFF (Tripped/Disconnected)");
}

void connectWiFi() {
  Serial.printf("[WIFI] Connecting to %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Connection failed. Retrying in background...");
  }
}

void printSerialDebug(float v, float i, float p, float e, float f, float pf) {
  Serial.printf("[METRICS] %6.1f V | %5.2f A | %6.1f W | %6.3f kWh | %4.1f Hz | PF: %4.2f | Relay: %s\n",
    v, i, p, e, f, pf, currentRelayState ? "ON" : "OFF"
  );
}

void sendTelemetryToSupabase(float v, float i, float p, float e, float f, float pf) {
  WiFiClientSecure client;
  client.setInsecure(); // Skip TLS certificate verification for simplicity on embedded IoT

  HTTPClient http;
  if (!http.begin(client, SUPABASE_URL)) {
    Serial.println("[HTTP] Unable to connect to Supabase endpoint");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Prefer", "return=minimal");

  // Construct JSON Payload
  StaticJsonDocument<256> doc;
  doc["voltage"]      = v;
  doc["current"]      = i;
  doc["power"]        = p;
  doc["energy"]       = e;
  doc["frequency"]    = f;
  doc["power_factor"] = pf;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode >= 200 && httpCode < 300) {
    Serial.println("[HTTP] Telemetry successfully posted to Supabase.");
  } else {
    Serial.printf("[HTTP] POST error code: %d\n", httpCode);
  }

  http.end();
}
