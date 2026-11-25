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

export interface PrototypeRoomAlert {
  id: string;
  title: string;
  description: string;
  urgent: boolean;
}

export interface PrototypeRoomSnapshot {
  roomIndex: number; // 0 = Room 201, 1 = Room 202
  roomName: string;
  deviceCode: string;
  isOnline: boolean;
  relayState: boolean;
  occupancy: 'Occupied' | 'Vacant';
  cardInserted: boolean;
  motionDetected: boolean;
  cutoffPending: boolean;
  cutoffCountdownSeconds: number;
  voltage: number;
  current: number;
  power: number;
  powerFactor: number;
  frequency: number;
  energyKwh: number;
  savedKwh: number;
  autoTrips: number;
  alert?: PrototypeRoomAlert | null;
}

export interface PrototypeBridgePayload {
  source: 'hardware_prototype_3d';
  online: boolean;
  tariffPerKwh: number;
  simTime: string;
  rooms: PrototypeRoomSnapshot[];
  timestamp: string;
}

export interface PrototypeCommandPayload {
  source: 'synco_meter_app';
  command: 'RELAY_SET' | 'EXTEND_CUTOFF' | 'REQUEST_SYNC';
  roomIndex?: number;
  deviceCode?: string;
  relayState?: boolean;
  extendMinutes?: number;
  timestamp: string;
}
