# VoltPulse HEMS — IoT Smart Meter with Load Control & Standby Power Reduction

[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![ESP32](https://img.shields.io/badge/ESP32-PZEM--004T%20v3.0-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://espressif.com)

**VoltPulse HEMS** is an end-to-end Home Energy Management System designed to monitor AC electrical telemetry with sub-second accuracy, eliminate vampire standby power through occupancy-based automation, and provide remote/autonomous load control contactors to prevent household electrical overloads.

---

## ⚡ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│               STAGE 5: DUAL HARDWARE NODES               │
│                                                         │
│  [ Room 1: Living Room ]        [ Room 2: Bedroom ]     │
│  • PZEM-004T v3.0 (AC Sensor)   • PZEM-004T v3.0        │
│  • AC Load Relay (GPIO 23)      • AC Load Relay         │
│  • ESP32 Node A (UART2)         • ESP32 Node B (UART2)  │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS REST / Realtime
                             ▼
┌─────────────────────────────────────────────────────────┐
│            STAGE 3 & 4: SUPABASE CLOUD BACKEND          │
│                                                         │
│  • PostgreSQL Tables: devices, energy_readings, alerts  │
│  • Aggregation Engine: get_hourly_energy_summary() RPC  │
│  • Realtime Pub/Sub: Dual-node telemetry & relay bus    │
└────────────────────────────┬────────────────────────────┘
                             │ Bi-directional Pub/Sub
                             ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 2: VOLTPULSE HEMS MOBILE APP            │
│                                                         │
│  1. Live Dashboard   : Semicircular Arc Gauge & Radar   │
│  2. Rooms & Plugs    : Multi-node control & 03:38 timer │
│  3. Analytics        : 24h Load vs Cut distribution     │
│  4. Audit Reports    : 88% Eco score & PDF/CSV export   │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 4-Screen Mobile Application Overview

### 1. Live Energy Dashboard (`Home`)
- **Daily Impact Semi-Circular Radial Gauge**: Dynamic $0\text{--}3.0\text{ kW}$ active power meter ($1,420\text{ W}$, $1.42\text{ kW}$ current) with 3-column sub-metrics: `Voltage: 228.4V`, `Current: 6.22A`, `Power Factor: 0.96 cosφ`.
- **Radar Automation Card**: Live presence monitoring (Room 1: *Occupied*, Room 2: *Vacant • Off in 4m*).
- **Smart Nodes Section**: Multi-node tiles with individual Wattage readouts and tactile toggle switches.
- **Today's Summary**: Energy tally ($8.42\text{ kWh}$), estimated cost ($\$1.26$), and saved draw ($1.85\text{ kWh}$).
- **System Mode Pills**: `[Auto]`, `[Eco]`, `[Manual]`.

### 2. Rooms & Smart Plugs (`Rooms`)
- **Total Active Load**: Aggregated power ($1,420\text{ W}$ across 2 synced plugs).
- **Room 1 Plug (Living Room)**: $860\text{ W}$, $5.14\text{ kWh}$ today, *Occupied* indicator, online relay status.
- **Room 2 Plug (Bedroom)**: $560\text{ W}$, *Vacant* indicator, **Auto-Cutoff Pending Countdown** (`03:38`).
- **Tactile Action**: `[Keep ON for 30m]` button to immediately postpone scheduled standby shutdown.
- **Automation Settings** navigation.

### 3. Consumption Analytics (`Analytics`)
- **Time Filters**: `[Every Day]` and `[Every Month]` toggle pills.
- **Active Cycle Summary**: $218.4\text{ kWh}$, $\$34.90$ with Room 1 ($62\%$) & Room 2 ($38\%$) load split.
- **Occupancy Auto-Cut Savings**: Highlights $52.8\text{ kWh}$ avoided standby waste ($+\$8.45$ reclaimed).
- **24h Load Distribution**: Dual-color bar chart comparing active `Load` (green) against avoided `Cut` power (mint) across 24 hours.
- **Sub-Meters & Daily Logs**: Hourly and daily breakdown with energy conservation deltas.

### 4. Audit & Efficiency Reports (`Reports`)
- **Monthly Energy Audit**: Verified PZEM-004T telemetry and cutoff logs for February 2025.
- **Total Grid Consumption**: $218.4\text{ kWh}$ ($-8.2\%$ under municipal benchmark).
- **Efficiency Score Gauge**: $88\%$ Eco Conservation score ($44.5\text{ hrs}$ severed, $63$ cutoffs logged).
- **Dual Hardware Node Logs**: Peak spike analysis ($1.48\text{ kW}$ vs $920\text{ W}$) and auto-trip counts ($28$ vs $35$).
- **Standby Bleed Action Card**: Identifies $18\text{ W}$ continuous idle vampire drain with interactive `[Apply Rule →]`.
- **Export Actions**: `[Download PDF]` and `[Export CSV]`.

---

## 🎨 UI Color Palette & Design Tokens

The VoltPulse HEMS design system utilizes a modern, high-contrast **Eco-Clean Aesthetic** characterized by crisp whites, subtle grays, vibrant energy greens, and high-visibility warning ambers:

### 1. Primary Eco Greens (Energy, Occupied & Savings)
| Color | Hex | Role & Swatch | Usage in UI |
|---|---|:---:|---|
| **Vibrant Eco Green** | `#00C853` | 🟢 | Semicircle active gauge arc, Relay ON toggle, *Occupied* pills, Bottom tab active state |
| **Accent Lime** | `#84CC16` | 🌱 | Filter pill active state (`Every Day`, `All Nodes`) |
| **Mint Tint** | `#E8F5E9` | 🟩 | Background for badges, icon circles, and eco-saving banners |
| **Light Mint** | `#A7F3D0` | 🌿 | Avoided standby energy ("Cut") bars in 24h distribution chart |
| **Forest Text** | `#166534` | 🌲 | High-contrast green text inside eco-saving cards |

### 2. Warning & Vacancy Ambers (Standby Bleed & Countdown)
| Color | Hex | Role & Swatch | Usage in UI |
|---|---|:---:|---|
| **Warning Orange** | `#EA580C` | 🟠 | Bedroom Plug accent, countdown timer (`03:38`), *Vacant* status badge |
| **Alert Amber** | `#F59E0B` | 🟡 | Room 2 load bar, relay switches in cutoff state |
| **Peach Tint** | `#FFEDD5` | 🟨 | Background for auto-cutoff pending banner and *Vacant* badges |
| **Standby Amber** | `#FEF3C7` | 💡 | Background for Standby Bleed warning card (18W idle alert) |
| **Deep Rust** | `#9A3412` | 🟫 | Alert title text and high-priority warning headers |

### 3. Neutral Canvas & Surface System
| Color | Hex | Role & Swatch | Usage in UI |
|---|---|:---:|---|
| **Primary Canvas** | `#F9FAFB` | ⚪ | Main screen background (off-white, low glare) |
| **Surface Card** | `#FFFFFF` | ⬜ | High-elevation card surfaces with soft shadows |
| **Subtle Divider** | `#F3F4F6` | 🔘 | Border dividers, inactive pill backgrounds, header buttons |
| **Track Border** | `#E5E7EB` | ◽ | Semicircular gauge background track, pill borders |
| **Desktop Backdrop** | `#E5E7EB` | 🌫️ | Outer framing background when viewed on desktop web browsers |

### 4. Typography & Contrast Hierarchy
| Color | Hex | Role & Swatch | Usage in UI |
|---|---|:---:|---|
| **Headline Obsidian** | `#111827` | ⬛ | Primary metrics ($1,420\text{ W}$, $218.4\text{ kWh}$), screen headers |
| **Sub-Header Slate** | `#4B5563` | ◼️ | Section titles, icon buttons, dropdown labels |
| **Muted Slate** | `#6B7280` | ◾ | Secondary descriptions, appliance locations, unit tags |
| **Caption Gray** | `#9CA3AF` | ◽ | Subtitle captions, timestamps, inactive bottom tab icons |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v24)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Mobile App
To run the app locally with live web preview:
```bash
npx expo start -c --web
```
*To preview on your physical smartphone, scan the terminal QR code using the **Expo Go** app (iOS/Android).*

### 3. Run Standalone Hardware Simulator
To simulate an active physical ESP32 streaming readings to the terminal or Supabase without running the mobile app:
```bash
node src/mock/standaloneFeeder.js
```

---

## 📂 Project Directory Layout

```
d:\1_Capstone\App\
├── src\
│   ├── components\
│   │   ├── BottomNavBar.tsx          # 4-tab bottom navigation
│   │   ├── RadialGauge.tsx           # Daily Impact semicircle arc meter
│   │   ├── EfficiencyGauge.tsx       # Audit efficiency score arc gauge
│   │   ├── DualBarChart.tsx          # 24h Load vs Cut histogram
│   │   ├── MetricCard.tsx            # Voltage, Current, Frequency, PF cards
│   │   ├── RelayControlCard.tsx      # Tactile AC breaker switch
│   │   ├── CostEnergyCard.tsx        # Cumulative kWh and cost accrual
│   │   ├── ApplianceSelector.tsx     # Mock load switcher (Aircon, Fridge, etc.)
│   │   └── SupabaseConfigModal.tsx   # Cloud credentials & mode switcher
│   ├── context\
│   │   ├── HemsContext.tsx           # Multi-node state, countdown timer & actions
│   │   └── TelemetryContext.tsx      # Core live telemetry feed & provider
│   ├── mock\
│   │   ├── telemetryGenerator.ts     # AC physics simulation & load profiles
│   │   └── standaloneFeeder.js       # Standalone Node.js ESP32 simulator
│   ├── screens\
│   │   ├── LiveDashboardScreen.tsx   # Screen 1: Daily Impact & Radar
│   │   ├── RoomsSmartPlugsScreen.tsx # Screen 2: Rooms & Auto-Cutoff
│   │   ├── ConsumptionAnalyticsScreen.tsx # Screen 3: 24h Load Distribution
│   │   ├── AuditReportsScreen.tsx    # Screen 4: Audit & Efficiency Score
│   │   └── MainAppNavigator.tsx      # Screen switcher & web responsive frame
│   ├── services\
│   │   ├── supabaseClient.ts         # Supabase client with AsyncStorage
│   │   └── realtimeService.ts        # Supabase Realtime broadcast & changes
│   └── types\
│       ├── hems.ts                   # Multi-node, occupancy, & report types
│       └── telemetry.ts              # Electrical telemetry & appliance types
├── supabase\
│   └── migrations\
│       └── 001_initial_schema.sql    # DDL for devices, readings, RPC, & RLS
├── firmware\
│   └── esp32_pzem\
│       ├── esp32_pzem.ino            # ESP32 C++ firmware with auto-trip
│       └── README.md                 # Hardware BOM, pinout, & AC safety
├── metro.config.js                   # Metro resolver configuration for web
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Hardware Wiring & Pinouts (Stage 5)

| ESP32 Pin | Connected Component | Function / Description |
|---|---|---|
| **GPIO 16 (RX2)** | PZEM-004T **TX** | Hardware UART Serial2 Data In |
| **GPIO 17 (TX2)** | PZEM-004T **RX** | Hardware UART Serial2 Data Out |
| **GPIO 23** | Relay Module **IN** | AC Contactor Control (Active High / Low) |
| **GPIO 2** | Onboard LED | Relay Status Indicator |
| **VIN / 5V** | 5V Power Supply | Powers ESP32, PZEM logic, & Relay coil |
| **GND** | Power Supply GND | Common Ground |

> [!CAUTION]
> **AC Current Transformer (CT) Safety**:
> Pass strictly **ONE** conductor (the Live Line wire) through the CT coil. Running both Live and Neutral through the coil together will cancel out the magnetic field and produce a $0.00\text{ A}$ reading.

---

## 🗄️ Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy and run the script located at:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. This creates:
   - `devices` table with multi-node tracking and overload limits.
   - `energy_readings` table with time-series index `idx_energy_readings_device_time`.
   - `load_schedules` and `energy_alerts` tables.
   - Downsampling RPC function `get_hourly_energy_summary()`.
   - Realtime publication on `devices` and `energy_readings`.

---

## 🛠️ Verification & Quality Checks

Run these commands inside the `App` directory to ensure system stability:

```bash
# Typecheck TypeScript definitions (Strict Mode)
npx tsc --noEmit

# Diagnose Expo dependencies and configuration
npx expo-doctor

# Validate web production bundle
npx expo export --platform web
```

---

## 👥 Capstone Research Context
This application forms the software and IoT telemetric core for the capstone study:
*“Design and Development of an IoT Smart Meter with Load Control for Home Energy Management Systems”* and *“Design and Performance Evaluation of a Home Energy Management System to Reduce Standby Power”*.
