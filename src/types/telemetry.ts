export interface TelemetryReading {
  id?: string | number;
  deviceId: string;
  voltage: number;       // Volts (V)
  current: number;       // Amperes (A)
  power: number;         // Active Power (Watts)
  energy: number;        // Cumulative Energy (kWh)
  frequency: number;     // Grid Frequency (Hz)
  powerFactor: number;   // Power Factor (0.00 - 1.00)
  relayState: boolean;   // Relay status: true = ON (Closed), false = OFF (Tripped/Open)
  timestamp: string;     // ISO timestamp
}

export type AppliancePreset = 
  | 'STANDBY'
  | 'REFRIGERATOR'
  | 'AIR_CONDITIONER'
  | 'INDUCTION_COOKER'
  | 'WATER_HEATER'
  | 'OVERLOAD_SPIKE';

export interface ApplianceProfile {
  id: AppliancePreset;
  name: string;
  description: string;
  nominalVoltage: number;
  baseCurrent: number;
  currentVariance: number;
  powerFactor: number;
  icon: string;
}

export interface DeviceConfig {
  id: string;
  name: string;
  macAddress: string;
  relayState: boolean;
  overloadLimitWatts: number;
  tariffRatePerKwh: number;
  currencySymbol: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface DailyEnergySummary {
  date: string;
  totalKwh: number;
  estimatedCost: number;
  peakPowerWatts: number;
}
