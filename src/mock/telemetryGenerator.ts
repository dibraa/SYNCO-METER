import { AppliancePreset, ApplianceProfile, TelemetryReading } from '../types/telemetry';

export const APPLIANCE_PROFILES: Record<AppliancePreset, ApplianceProfile> = {
  STANDBY: {
    id: 'STANDBY',
    name: 'Standby / Idle Electronics',
    description: 'TV, chargers, microwave clock & routers in standby mode',
    nominalVoltage: 220.0,
    baseCurrent: 0.08, // ~15W
    currentVariance: 0.03,
    powerFactor: 0.65,
    icon: 'power',
  },
  REFRIGERATOR: {
    id: 'REFRIGERATOR',
    name: 'Inverter Refrigerator',
    description: 'Compressor cycling on dynamic cooling cycle',
    nominalVoltage: 220.0,
    baseCurrent: 0.95, // ~180W
    currentVariance: 0.35,
    powerFactor: 0.85,
    icon: 'snowflake',
  },
  AIR_CONDITIONER: {
    id: 'AIR_CONDITIONER',
    name: 'Split-type Air Conditioner',
    description: '1.5 HP inverter unit at steady cooling state',
    nominalVoltage: 220.0,
    baseCurrent: 4.8, // ~950W - 1100W
    currentVariance: 0.8,
    powerFactor: 0.94,
    icon: 'wind',
  },
  INDUCTION_COOKER: {
    id: 'INDUCTION_COOKER',
    name: 'Induction Cooktop',
    description: 'Medium-high heating element operating at 1800W',
    nominalVoltage: 220.0,
    baseCurrent: 8.5, // ~1800W
    currentVariance: 0.4,
    powerFactor: 0.98,
    icon: 'flame',
  },
  WATER_HEATER: {
    id: 'WATER_HEATER',
    name: 'Instant Shower Water Heater',
    description: 'High resistive load operating at ~2500W',
    nominalVoltage: 220.0,
    baseCurrent: 11.5, // ~2500W
    currentVariance: 0.5,
    powerFactor: 0.99,
    icon: 'droplet',
  },
  OVERLOAD_SPIKE: {
    id: 'OVERLOAD_SPIKE',
    name: 'Overload Spike Test',
    description: 'Simulates excessive load exceeding 3300W safety threshold',
    nominalVoltage: 218.0,
    baseCurrent: 16.2, // ~3500W (Overload)
    currentVariance: 0.6,
    powerFactor: 0.99,
    icon: 'alert-triangle',
  },
};

export class TelemetryGenerator {
  private deviceId: string;
  private currentPreset: AppliancePreset = 'AIR_CONDITIONER';
  private cumulativeEnergyKwh: number = 42.85; // Initial realistic reading
  private lastUpdateTime: number = Date.now();
  private relayState: boolean = true;
  private nominalVoltage: number = 220.0;
  private nominalFrequency: number = 60.0;

  constructor(deviceId: string = 'ESP32-PZEM-DEV-01') {
    this.deviceId = deviceId;
  }

  public setAppliancePreset(preset: AppliancePreset) {
    this.currentPreset = preset;
  }

  public getAppliancePreset(): AppliancePreset {
    return this.currentPreset;
  }

  public setRelayState(state: boolean) {
    this.relayState = state;
  }

  public getRelayState(): boolean {
    return this.relayState;
  }

  public setCumulativeEnergy(kwh: number) {
    this.cumulativeEnergyKwh = kwh;
  }

  /**
   * Generates a single point in time telemetry reading matching PZEM-004T v3.0 precision
   */
  public generateReading(): TelemetryReading {
    const now = Date.now();
    const dtSeconds = Math.max(0.5, (now - this.lastUpdateTime) / 1000);
    this.lastUpdateTime = now;

    // Small grid fluctuations
    const voltageNoise = (Math.random() - 0.5) * 3.5; // +/- 1.75V
    const voltage = Math.round((this.nominalVoltage + voltageNoise) * 10) / 10;

    const freqNoise = (Math.random() - 0.5) * 0.15; // +/- 0.075Hz
    const frequency = Math.round((this.nominalFrequency + freqNoise) * 10) / 10;

    // If relay is open (turned OFF), zero current & active power flows through load
    if (!this.relayState) {
      return {
        deviceId: this.deviceId,
        voltage,
        current: 0.0,
        power: 0.0,
        energy: Math.round(this.cumulativeEnergyKwh * 1000) / 1000,
        frequency,
        powerFactor: 0.0,
        relayState: false,
        timestamp: new Date(now).toISOString(),
      };
    }

    const profile = APPLIANCE_PROFILES[this.currentPreset];
    const currentNoise = (Math.random() - 0.5) * 2 * profile.currentVariance;
    const current = Math.max(0, Math.round((profile.baseCurrent + currentNoise) * 100) / 100);

    const pfNoise = (Math.random() - 0.5) * 0.02;
    const powerFactor = Math.min(1.0, Math.max(0.2, Math.round((profile.powerFactor + pfNoise) * 100) / 100));

    // Active Power: P = V * I * PF (Watts)
    const activePower = Math.round(voltage * current * powerFactor * 10) / 10;

    // Energy increment in kWh: (Watts * hours) / 1000
    const energyDeltaKwh = (activePower * (dtSeconds / 3600)) / 1000;
    this.cumulativeEnergyKwh += energyDeltaKwh;

    return {
      deviceId: this.deviceId,
      voltage,
      current,
      power: activePower,
      energy: Math.round(this.cumulativeEnergyKwh * 1000) / 1000,
      frequency,
      powerFactor,
      relayState: this.relayState,
      timestamp: new Date(now).toISOString(),
    };
  }

  /**
   * Generates 24-hour historical mock dataset for trend analysis
   */
  public generate24HourHistory(tariffRate: number = 12.0) {
    const history = [];
    const now = new Date();
    
    // Simulate typical household 24-hour load curve
    // Peak hours: 18:00 - 22:00, Off-peak: 01:00 - 05:00
    for (let hour = 23; hour >= 0; hour--) {
      const time = new Date(now.getTime() - hour * 3600 * 1000);
      const h = time.getHours();
      
      let baseLoadWatts = 180; // Baseline standby & fridge
      if (h >= 6 && h <= 8) baseLoadWatts = 850; // Morning rush
      else if (h >= 11 && h <= 13) baseLoadWatts = 700; // Lunch
      else if (h >= 18 && h <= 22) baseLoadWatts = 1650; // Evening peak (Aircon + Cooker + TV)
      else if (h >= 23 || h <= 5) baseLoadWatts = 250; // Night sleep

      const noise = (Math.random() - 0.5) * 150;
      const avgWatts = Math.max(80, Math.round(baseLoadWatts + noise));
      const kwhForHour = Math.round((avgWatts / 1000) * 100) / 100;
      const costForHour = Math.round(kwhForHour * tariffRate * 100) / 100;

      history.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        powerWatts: avgWatts,
        energyKwh: kwhForHour,
        cost: costForHour,
        timestamp: time.toISOString(),
      });
    }

    return history;
  }
}
