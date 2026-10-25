import React, { createContext, useContext, useState, useEffect } from 'react';
import { SmartNode, TabType, SystemMode, HemsReport, DailyLog, HourlyDistribution } from '../types/hems';
import { createConsumptionSnapshot, RoomConsumption } from '../utils/consumption';

interface HemsContextType {
  consumptionRooms: RoomConsumption[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  systemMode: SystemMode;
  setSystemMode: (mode: SystemMode) => void;
  nodes: SmartNode[];
  toggleNodeRelay: (id: string) => void;
  extendCutoff: (id: string, minutes?: number) => void;
  report: HemsReport;
  dailyLogs: DailyLog[];
  hourlyDistribution: HourlyDistribution[];
  totalPowerWatts: number;
  totalCurrentAmps: number;
  averageVoltage: number;
  averagePowerFactor: number;
  todayTotalKwh: number;
  todayEstimatedCost: number;
  todaySavedKwh: number;
  applyStandbyRule: () => void;
  ruleApplied: boolean;
  signOut: () => void;
}

const HemsContext = createContext<HemsContextType | undefined>(undefined);

export const HemsProvider: React.FC<{
  children: React.ReactNode;
  onSignOut?: () => void;
}> = ({ children, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Ensure activeTab is always a valid tab
  useEffect(() => {
    const validTabs: TabType[] = ['home', 'usage', 'appliances', 'alerts', 'settings'];
    if (!validTabs.includes(activeTab)) {
      setActiveTab('home');
    }
  }, [activeTab]);
  const [systemMode, setSystemMode] = useState<SystemMode>('Auto');
  const [ruleApplied, setRuleApplied] = useState(false);

  const [nodes, setNodes] = useState<SmartNode[]>([
    {
      id: 'node-1',
      name: 'Room 1 Plug',
      location: 'Living Room Plug',
      code: 'LR-PLUG-A',
      hardware: 'PZEM-004T v3.0',
      isOnline: true,
      relayState: true,
      occupancy: 'Occupied',
      cutoffPending: false,
      cutoffCountdownSeconds: 0,
      voltage: 228.4,
      current: 3.82,
      activePowerWatts: 860,
      powerFactor: 0.96,
      frequency: 60.0,
      todayKwh: 5.14,
      monthKwh: 135.4,
      todayCost: 61.68,
      sharePercentage: 62,
      peakSpikeWatts: 1480,
      autoTrips: 28,
      standbyBleedWatts: 18,
    },
    {
      id: 'node-2',
      name: 'Room 2 Plug',
      location: 'Bedroom Plug',
      code: 'BR-PLUG-B',
      hardware: 'PZEM-004T v3.0',
      isOnline: true,
      relayState: true,
      occupancy: 'Vacant',
      cutoffPending: true,
      cutoffCountdownSeconds: 218, // 03:38
      voltage: 228.4,
      current: 2.40,
      activePowerWatts: 560,
      powerFactor: 0.95,
      frequency: 60.0,
      todayKwh: 3.28,
      monthKwh: 83.0,
      todayCost: 39.36,
      sharePercentage: 38,
      peakSpikeWatts: 920,
      autoTrips: 35,
    },
  ]);

  const [consumptionRooms] = useState(() => createConsumptionSnapshot(nodes));

  const [report] = useState<HemsReport>({
    month: 'February 2025',
    totalKwh: 218.4,
    benchmarkDiffPercent: -8.2,
    totalCost: 2620.80,
    tariffPerKwh: 12.00,
    autoSavedKwh: 52.8,
    reclaimedCost: 633.60,
    efficiencyScore: 88,
    selfPoweredPercent: 88,
    gridDependencePercent: 12,
    hoursSevered: 44.5,
    relayCutoffsCount: 63,
  });

  const [dailyLogs] = useState<DailyLog[]>([
    {
      date: 'Today, Feb 24',
      kwh: 8.42,
      savedKwh: 1.4,
      breakdown: 'R1: 5.14 kWh • R2: 3.28 kWh',
    },
    {
      date: 'Yesterday, Feb 23',
      kwh: 9.15,
      savedKwh: 1.8,
      breakdown: 'R1: 5.61 kWh • R2: 3.54 kWh',
    },
    {
      date: 'Thursday, Feb 22',
      kwh: 7.80,
      savedKwh: 2.1,
      breakdown: 'R1: 4.90 kWh • R2: 2.90 kWh',
    },
  ]);

  const [hourlyDistribution] = useState<HourlyDistribution[]>([
    { time: '00:00', loadWatts: 180, cutWatts: 420 },
    { time: '03:00', loadWatts: 150, cutWatts: 450 },
    { time: '06:00', loadWatts: 620, cutWatts: 200 },
    { time: '09:00', loadWatts: 380, cutWatts: 720 },
    { time: '12:00', loadWatts: 450, cutWatts: 580 },
    { time: '15:00', loadWatts: 310, cutWatts: 690 },
    { time: '18:00', loadWatts: 1650, cutWatts: 150 },
    { time: '21:00', loadWatts: 1420, cutWatts: 280 },
    { time: '23:59', loadWatts: 560, cutWatts: 620 },
  ]);

  // Real-time telemetry simulation & countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          let countdown = node.cutoffCountdownSeconds;
          let isCutoffPending = node.cutoffPending;
          let relay = node.relayState;

          if (isCutoffPending && countdown > 0) {
            countdown -= 1;
            if (countdown === 0) {
              // Trigger auto-cutoff
              relay = false;
              isCutoffPending = false;
            }
          }

          // Small natural electrical noise
          const vNoise = (Math.random() - 0.5) * 0.8;
          const voltage = +(228.4 + vNoise).toFixed(1);

          if (!relay) {
            return {
              ...node,
              voltage,
              current: 0,
              activePowerWatts: 0,
              cutoffCountdownSeconds: 0,
              cutoffPending: false,
              relayState: false,
            };
          }

          const basePower = node.id === 'node-1' ? 860 : 560;
          const pNoise = (Math.random() - 0.5) * 16;
          const activePowerWatts = Math.round(basePower + pNoise);
          const current = +(activePowerWatts / (voltage * node.powerFactor)).toFixed(2);

          return {
            ...node,
            voltage,
            current,
            activePowerWatts,
            relayState: relay,
            cutoffPending: isCutoffPending,
            cutoffCountdownSeconds: countdown,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleNodeRelay = (id: string) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          const nextRelay = !node.relayState;
          return {
            ...node,
            relayState: nextRelay,
            cutoffPending: false,
            activePowerWatts: nextRelay ? (node.id === 'node-1' ? 860 : 560) : 0,
          };
        }
        return node;
      })
    );
  };

  const extendCutoff = (id: string, minutes: number = 30) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            cutoffPending: true,
            cutoffCountdownSeconds: (node.cutoffCountdownSeconds || 0) + minutes * 60,
          };
        }
        return node;
      })
    );
  };

  const applyStandbyRule = () => {
    setRuleApplied(true);
  };

  const totalPowerWatts = nodes.reduce((sum, n) => sum + (n.relayState ? n.activePowerWatts : 0), 0);
  const totalCurrentAmps = +nodes.reduce((sum, n) => sum + (n.relayState ? n.current : 0), 0).toFixed(2);
  const averageVoltage = nodes.length > 0 ? nodes[0].voltage : 228.4;
  const averagePowerFactor = 0.96;
  const todayTotalKwh = +(nodes.reduce((sum, n) => sum + n.todayKwh, 0)).toFixed(2);
  const todayEstimatedCost = +(todayTotalKwh * 12.00).toFixed(2);
  const todaySavedKwh = 1.85;

  const signOut = () => {
    setActiveTab('home');
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <HemsContext.Provider
      value={{
        consumptionRooms,
        activeTab,
        setActiveTab,
        systemMode,
        setSystemMode,
        nodes,
        toggleNodeRelay,
        extendCutoff,
        report,
        dailyLogs,
        hourlyDistribution,
        totalPowerWatts,
        totalCurrentAmps,
        averageVoltage,
        averagePowerFactor,
        todayTotalKwh,
        todayEstimatedCost,
        todaySavedKwh,
        applyStandbyRule,
        ruleApplied,
        signOut,
      }}
    >
      {children}
    </HemsContext.Provider>
  );
};

export const useHems = () => {
  const context = useContext(HemsContext);
  if (!context) {
    throw new Error('useHems must be used within a HemsProvider');
  }
  return context;
};
