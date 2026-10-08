export type TabType = 'home' | 'usage' | 'appliances' | 'alerts' | 'settings';

export type SystemMode = 'Auto' | 'Eco' | 'Manual';

export interface SmartNode {
  id: string;
  name: string;
  location: string;
  code: string;
  hardware: string; // 'PZEM-004T v3.0'
  isOnline: boolean;
  relayState: boolean;
  occupancy: 'Occupied' | 'Vacant';
  cutoffPending: boolean;
  cutoffCountdownSeconds: number; // e.g. 218 seconds (03:38)
  voltage: number;
  current: number;
  activePowerWatts: number;
  powerFactor: number;
  frequency: number;
  todayKwh: number;
  monthKwh: number;
  todayCost: number;
  sharePercentage: number;
  peakSpikeWatts: number;
  autoTrips: number;
  standbyBleedWatts?: number;
}

export interface DailyLog {
  date: string;
  kwh: number;
  savedKwh: number;
  breakdown: string;
}

export interface HourlyDistribution {
  time: string;
  loadWatts: number;
  cutWatts: number;
}

export interface HemsReport {
  month: string;
  totalKwh: number;
  benchmarkDiffPercent: number;
  totalCost: number;
  tariffPerKwh: number;
  autoSavedKwh: number;
  reclaimedCost: number;
  efficiencyScore: number;
  selfPoweredPercent: number;
  gridDependencePercent: number;
  hoursSevered: number;
  relayCutoffsCount: number;
}
