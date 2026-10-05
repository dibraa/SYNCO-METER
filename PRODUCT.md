# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

Primary users: homeowners who own and use the IoT smart meter system (ESP32 + PZEM-004T) at home. They use the app to monitor energy consumption, control smart plugs, and reduce standby power waste.

## Product Purpose

SYNCO METER is an IoT smart energy management mobile app. It monitors real-time electrical telemetry (voltage, current, power, energy, power factor) from ESP32-based smart plugs, controls relay/contactors to cut standby power, tracks consumption costs, and provides analytics and audit reports. Success means homeowners can reduce energy waste and lower electricity bills through automated standby cutoff and overload protection.

## Positioning

The product's meaningful differentiator is the combination of real-time PZEM-004T telemetry with automated standby power reduction (relay cutoff) and multi-room smart plug management — a complete home energy management loop from sensing to actuation to analytics.

## Operating Context

Homeowners use the app in their homes to:
- Monitor live power consumption from smart plugs
- Control relay on/off states for connected appliances
- View 24-hour load analytics and cost tracking
- Receive automated cutoff alerts for vacant rooms
- Review monthly energy audit reports

The app connects to Supabase for real-time telemetry from ESP32 devices, or runs in mock/simulated mode for demonstration.

## Capabilities and Constraints

- Real-time telemetry: voltage, current, power (W), energy (kWh), frequency, power factor
- Relay/contactor control (on/off toggle)
- Multi-room smart plug management with auto-cutoff countdown
- System modes: Auto, Eco, Manual
- Appliance simulation presets (AC, refrigerator, induction cooker, water heater, standby, overload spike)
- 24-hour load history and cost analytics
- Monthly audit reports with efficiency scoring
- Supabase Realtime subscription for live device data
- Mock mode for development/demo without hardware
- Tariff rate configuration (default 12 PHP/kWh)
- Overload protection with configurable wattage limit

## Brand Commitments

- Product name: SYNCO METER
- Tagline: "IoT Energy & Load Management"
- Existing visual identity: dark theme (#0B0F19 background, #38BDF8 blue accent, #0F172A surfaces)
- Hardware: ESP32 + PZEM-004T v3.0

## Evidence on Hand

- Existing app implementation with full dashboard, rooms, analytics, and reports screens
- Supabase integration for realtime telemetry
- Mock telemetry generator for standalone demo

## Product Principles

1. **Clarity over complexity**: Energy data should be immediately understandable to homeowners
2. **Actionable automation**: The system should act on behalf of the user (auto-cutoff) while keeping them informed
3. **Trust through transparency**: Real-time data, clear costs, and honest reporting build user confidence
4. **Mobile-first**: The app is designed for phone use in home environments

## Accessibility & Inclusion

No specific accessibility requirements established beyond standard mobile app conventions.
