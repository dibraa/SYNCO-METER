# Stage 5: ESP32 + PZEM-004T v3.0 Hardware & Firmware Guide

## 1. Hardware Bill of Materials (BOM)
| Component | Specification | Purpose |
|---|---|---|
| **ESP32-WROOM-32** | 30-pin or 38-pin DevKit | Central microcontroller with WiFi & UART |
| **Peacefair PZEM-004T v3.0** | 80–260V AC, 100A Current Transformer | High-precision AC energy metering IC |
| **AC Relay Module** | 5V Coil, 10A–30A 250V AC Contact | Contactor for remote switching & auto-cutoff |
| **Step-down 5V / 2A Power Supply** | AC-DC 220V to 5V | Powers ESP32, PZEM logic, and Relay coil |
| **CT Coil (Closed or Split Core)** | 100A ratio | Clamps over the AC Line (Hot) wire |

---

## 2. Wiring & Pinout Diagram

```
                 +--------------------------------+
                 |       ESP32 Microcontroller    |
                 |                                |
  5V Power ----->| VIN                         GND|<---- Power Supply Ground
                 |                                |
  PZEM TX   ----->| GPIO 16 (RX2)                  |
  PZEM RX   <-----| GPIO 17 (TX2)                  |
                 |                                |
  Relay IN  <-----| GPIO 23                        |
  Status LED<-----| GPIO 2 (Onboard)               |
                 +--------------------------------+

                 +--------------------------------+
                 |       PZEM-004T v3.0           |
  5V Power ----->| 5V                         TX  |-----> ESP32 GPIO 16
  Ground   ----->| GND                        RX  |<----- ESP32 GPIO 17
                 +--------------------------------+
                 | AC Mains (L)     AC Mains (N)  |
                 | CT Coil Wire 1   CT Coil Wire 2|
                 +--------------------------------+

                 +--------------------------------+
                 |       Relay Module             |
  5V Power ----->| VCC                        IN  |<----- ESP32 GPIO 23
  Ground   ----->| GND                            |
                 +--------------------------------+
                 | COM (AC Live from Grid)        |
                 | NO  (AC Live to Load Sockets)  |
                 +--------------------------------+
```

---

## 3. High-Voltage AC Safety Rules
1. **Pass Only ONE Wire Through the CT Coil**:
   - The Current Transformer (CT) coil must clamp strictly around the **Line (Live)** conductor.
   - Do **NOT** run both Live and Neutral through the coil together, or the magnetic fields will cancel out and read 0.00 Amps.
2. **PZEM AC Terminals**:
   - Terminal 1 & 2 connect across AC Mains (220V AC) to power the internal metering chip and measure Voltage/Frequency.
   - Never touch the PZEM board when connected to AC mains; enclose it inside an insulated enclosure.
3. **Relay Safety Rating**:
   - Standard blue songle relays are rated for 10A (~2200W). If controlling loads exceeding 2000W (e.g. continuous water heaters or air conditioning clusters), use a 30A high-power relay or an external AC contactor.

---

## 4. Software Dependencies
In the Arduino IDE or PlatformIO, install:
- `PZEM004Tv30` (by Mandar Joshi)
- `ArduinoJson` (by Benoit Blanchon)
