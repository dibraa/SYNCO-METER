import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SmartNode,
  TabType,
  SystemMode,
  HemsReport,
  DailyLog,
  HourlyDistribution,
  PlugInput,
} from '../types/hems';
import { createConsumptionSnapshot, RoomConsumption } from '../utils/consumption';
import { ActiveAlert } from '../utils/alerts';
import { PrototypeBridgePayload } from '../types/telemetry';
import {
  isSupabaseConfigured,
  getLoadedConfig,
  onSupabaseConfigChange,
} from '../services/supabaseClient';
import { RealtimeService } from '../services/realtimeService';

const STORAGE_KEY_NODES = '@synco_smart_nodes_v1';

const DEFAULT_NODES: SmartNode[] = [
  {
    id: 'node-1',
    name: 'Room 1 Plug',
    location: 'Living Room Plug',
    code: 'ESP32-PZEM-DEV-01',
    hardware: 'PZEM-004T v3.0',
    icon: 'sofa-outline',
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
    icon: 'bed-outline',
    isOnline: true,
    relayState: true,
    occupancy: 'Vacant',
    cutoffPending: true,
    cutoffCountdownSeconds: 218, // 03:38
    voltage: 228.4,
    current: 2.4,
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
];

interface HemsContextType {
  consumptionRooms: RoomConsumption[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  systemMode: SystemMode;
  setSystemMode: (mode: SystemMode) => void;
  nodes: SmartNode[];
  toggleNodeRelay: (id: string) => void;
  extendCutoff: (id: string, minutes?: number) => void;
  addPlug: (input: PlugInput) => Promise<void>;
  renamePlug: (id: string, input: PlugInput) => Promise<void>;
  deletePlug: (id: string) => Promise<void>;
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
  isSupabaseConnected: boolean;
  supabaseDeviceId: string;
  isHardwareTelemetryActive: boolean;
  isPrototypeLinked: boolean;
  prototypeAlerts: ActiveAlert[];
}

const HemsContext = createContext<HemsContextType | undefined>(undefined);

function baseWattsForNode(node: SmartNode): number {
  if (node.id === 'node-1') return 860;
  if (node.id === 'node-2') return 560;
  if (node.icon === 'air-conditioner') return 980;
  if (node.icon === 'fridge-outline') return 180;
  if (node.icon === 'television') return 145;
  if (node.icon === 'desk-lamp') return 95;
  return 240;
}

async function persistNodes(nextNodes: SmartNode[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nextNodes));
  } catch (err) {
    console.warn('[HemsContext] Failed to persist nodes:', err);
  }
}

export const HemsProvider: React.FC<{
  children: React.ReactNode;
  onSignOut?: () => void;
}> = ({ children, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    const validTabs: TabType[] = ['home', 'usage', 'appliances', 'alerts', 'settings'];
    if (!validTabs.includes(activeTab)) {
      setActiveTab('home');
    }
  }, [activeTab]);

  const [systemMode, setSystemMode] = useState<SystemMode>('Auto');
  const [ruleApplied, setRuleApplied] = useState(false);

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured());
  const [supabaseDeviceId, setSupabaseDeviceId] = useState<string>(
    getLoadedConfig().deviceId || 'ESP32-PZEM-DEV-01'
  );
  const [isHardwareTelemetryActive, setIsHardwareTelemetryActive] = useState(false);
  const [isPrototypeLinked, setIsPrototypeLinked] = useState(false);
  const [prototypeAlerts, setPrototypeAlerts] = useState<ActiveAlert[]>([]);
  const lastHardwareTimestamp = useRef<number>(0);
  const lastPrototypeTimestamp = useRef<number>(0);

  const [nodes, setNodes] = useState<SmartNode[]>(DEFAULT_NODES);
  const snapshotCacheRef = useRef<Map<string, RoomConsumption>>(new Map());
  const snapshotAnchorRef = useRef<Date>(new Date());

  // Hydrate saved plugs from AsyncStorage on mount
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY_NODES)
      .then((raw) => {
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNodes(parsed);
        }
      })
      .catch((err) => {
        console.warn('[HemsContext] Could not load saved plugs:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Derive consumptionRooms dynamically so add / rename / delete updates Usage & Reports immediately
  const consumptionRooms = useMemo(() => {
    const cache = snapshotCacheRef.current;
    const missing = nodes.filter((n) => !cache.has(n.id));
    if (missing.length > 0) {
      const generated = createConsumptionSnapshot(missing, snapshotAnchorRef.current);
      generated.forEach((entry) => cache.set(entry.roomId, entry));
    }

    return nodes.map((node) => {
      const cached = cache.get(node.id);
      if (cached) {
        return {
          ...cached,
          name: node.name,
          location: node.location,
        };
      }
      const [fresh] = createConsumptionSnapshot([node], snapshotAnchorRef.current);
      cache.set(node.id, fresh);
      return fresh;
    });
  }, [nodes]);

  const [baseReport] = useState<HemsReport>({
    month: 'November 2026',
    totalKwh: 218.4,
    benchmarkDiffPercent: -8.2,
    totalCost: 2620.8,
    tariffPerKwh: 12.0,
    autoSavedKwh: 52.8,
    reclaimedCost: 633.6,
    efficiencyScore: 88,
    selfPoweredPercent: 88,
    gridDependencePercent: 12,
    hoursSevered: 44.5,
    relayCutoffsCount: 63,
  });

  const [dailyLogs] = useState<DailyLog[]>([
    {
      date: 'Today',
      kwh: 8.42,
      savedKwh: 1.4,
      breakdown: 'R1: 5.14 kWh • R2: 3.28 kWh',
    },
    {
      date: 'Yesterday',
      kwh: 9.15,
      savedKwh: 1.8,
      breakdown: 'R1: 5.61 kWh • R2: 3.54 kWh',
    },
    {
      date: '2 days ago',
      kwh: 7.8,
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

  // Connect to Supabase Realtime Telemetry & 3D Hardware Prototype Bridge
  useEffect(() => {
    const applyPrototypeSnapshot = (snapshot: PrototypeBridgePayload) => {
      const now = Date.now();
      lastPrototypeTimestamp.current = now;
      lastHardwareTimestamp.current = now;
      setIsPrototypeLinked(true);
      setIsHardwareTelemetryActive(true);

      const incomingAlerts: ActiveAlert[] = [];
      for (const rm of snapshot.rooms) {
        if (rm.alert) {
          incomingAlerts.push({
            id: rm.alert.id,
            title: rm.alert.title,
            description: rm.alert.description,
            urgent: rm.alert.urgent,
          });
        }
      }
      setPrototypeAlerts(incomingAlerts);

      setNodes((prev) =>
        prev.map((node, idx) => {
          const matched =
            snapshot.rooms.find((r) => r.deviceCode && node.code === r.deviceCode) ||
            snapshot.rooms.find((r) => r.roomIndex === idx);

          if (!matched) return node;

          const tariff = snapshot.tariffPerKwh || 12;
          const liveKwh = matched.energyKwh > 0 ? +matched.energyKwh.toFixed(3) : node.todayKwh;

          return {
            ...node,
            isOnline: snapshot.online && matched.isOnline,
            relayState: matched.relayState,
            occupancy: matched.occupancy,
            cutoffPending: matched.cutoffPending,
            cutoffCountdownSeconds: matched.cutoffCountdownSeconds,
            voltage: +matched.voltage.toFixed(1),
            current: +matched.current.toFixed(2),
            activePowerWatts: Math.round(matched.power),
            powerFactor: +matched.powerFactor.toFixed(2),
            frequency: +matched.frequency.toFixed(1),
            todayKwh: liveKwh,
            todayCost: +(liveKwh * tariff).toFixed(2),
            autoTrips: matched.autoTrips,
            standbyBleedWatts: 0,
          };
        })
      );
    };

    function setupSupabaseSync() {
      const configured = isSupabaseConfigured();
      setIsSupabaseConnected(configured);

      // Always subscribe to the 3D Hardware Prototype bridge (uses Supabase Realtime + local BroadcastChannel)
      RealtimeService.subscribeToPrototypeBridge(applyPrototypeSnapshot);

      if (!configured) {
        RealtimeService.unsubscribe();
        return;
      }

      const devId = getLoadedConfig().deviceId || 'ESP32-PZEM-DEV-01';
      setSupabaseDeviceId(devId);

      const isTargetNode = (node: SmartNode, index: number) =>
        node.code === devId || (index === 0 && node.id === 'node-1');

      RealtimeService.fetchLatestReading(devId).then((reading) => {
        if (reading) {
          lastHardwareTimestamp.current = Date.now();
          setIsHardwareTelemetryActive(true);
          setNodes((prev) =>
            prev.map((node, idx) => {
              if (isTargetNode(node, idx)) {
                return {
                  ...node,
                  voltage: reading.voltage,
                  current: reading.current,
                  activePowerWatts: Math.round(reading.power),
                  powerFactor: reading.powerFactor,
                  frequency: reading.frequency,
                  todayKwh: reading.energy > 0 ? reading.energy : node.todayKwh,
                };
              }
              return node;
            })
          );
        }
      });

      RealtimeService.fetchDevice(devId).then((device) => {
        if (device && typeof device.relay_state === 'boolean') {
          setNodes((prev) =>
            prev.map((node, idx) =>
              isTargetNode(node, idx) ? { ...node, relayState: device.relay_state } : node
            )
          );
        }
      });

      RealtimeService.subscribeToTelemetry(
        devId,
        (reading) => {
          lastHardwareTimestamp.current = Date.now();
          setIsHardwareTelemetryActive(true);
          setNodes((prev) =>
            prev.map((node, idx) => {
              if (isTargetNode(node, idx)) {
                return {
                  ...node,
                  voltage: reading.voltage,
                  current: reading.current,
                  activePowerWatts: Math.round(reading.power),
                  powerFactor: reading.powerFactor,
                  frequency: reading.frequency,
                  todayKwh: reading.energy > 0 ? reading.energy : node.todayKwh,
                  relayState:
                    reading.relayState !== undefined ? reading.relayState : node.relayState,
                };
              }
              return node;
            })
          );
        },
        (newRelayState) => {
          setNodes((prev) =>
            prev.map((node, idx) => {
              if (isTargetNode(node, idx)) {
                return {
                  ...node,
                  relayState: newRelayState,
                  activePowerWatts: newRelayState
                    ? node.activePowerWatts || baseWattsForNode(node)
                    : 0,
                };
              }
              return node;
            })
          );
        }
      );
    }

    setupSupabaseSync();

    const unsubConfig = onSupabaseConfigChange(() => {
      setupSupabaseSync();
    });

    return () => {
      unsubConfig();
      RealtimeService.unsubscribe();
      RealtimeService.unsubscribePrototypeBridge();
    };
  }, []);

  // Background timer (handles auto-cutoff countdowns and fallback simulation)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const hasRecentPrototype = now - lastPrototypeTimestamp.current < 10000;
      const hasRecentLiveTelemetry =
        hasRecentPrototype || now - lastHardwareTimestamp.current < 7000;

      if (!hasRecentPrototype && isPrototypeLinked) {
        setIsPrototypeLinked(false);
        setPrototypeAlerts([]);
      }
      if (!hasRecentLiveTelemetry && isHardwareTelemetryActive) {
        setIsHardwareTelemetryActive(false);
      }

      setNodes((prevNodes) =>
        prevNodes.map((node, idx) => {
          let countdown = node.cutoffCountdownSeconds;
          let isCutoffPending = node.cutoffPending;
          let relay = node.relayState;

          // When linked live to the 3D hardware prototype, let the prototype own room 1 & 2 state
          const isSyncedPrototypeNode =
            hasRecentPrototype &&
            (idx < 2 || node.code === 'ESP32-PZEM-DEV-01' || node.code === 'BR-PLUG-B');
          if (isSyncedPrototypeNode) {
            return {
              ...node,
              cutoffCountdownSeconds:
                isCutoffPending && countdown > 0 ? Math.max(0, countdown - 1) : countdown,
            };
          }

          if (isCutoffPending && countdown > 0) {
            countdown -= 1;
            if (countdown === 0) {
              relay = false;
              isCutoffPending = false;
              if (isSupabaseConfigured()) {
                RealtimeService.toggleRelay(node.code || supabaseDeviceId, false);
              }
            }
          }

          const isLivePrimary = node.code === supabaseDeviceId && hasRecentLiveTelemetry;
          if (isLivePrimary) {
            return {
              ...node,
              relayState: relay,
              cutoffPending: isCutoffPending,
              cutoffCountdownSeconds: countdown,
            };
          }

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

          const basePower = baseWattsForNode(node);
          const pNoise = (Math.random() - 0.5) * 16;
          const activePowerWatts = Math.max(0, Math.round(basePower + pNoise));
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
  }, [isHardwareTelemetryActive, isPrototypeLinked, supabaseDeviceId]);

  const toggleNodeRelay = (id: string) => {
    setNodes((prev) => {
      const next = prev.map((node, idx) => {
        if (node.id === id) {
          const nextRelay = !node.relayState;
          const targetId = node.code || supabaseDeviceId;
          if (isSupabaseConfigured()) {
            RealtimeService.toggleRelay(targetId, nextRelay);
          }
          void RealtimeService.sendPrototypeCommand({
            source: 'synco_meter_app',
            command: 'RELAY_SET',
            roomIndex: idx,
            deviceCode: targetId,
            relayState: nextRelay,
            timestamp: new Date().toISOString(),
          });
          return {
            ...node,
            relayState: nextRelay,
            cutoffPending: false,
            activePowerWatts: nextRelay ? baseWattsForNode(node) : 0,
          };
        }
        return node;
      });
      persistNodes(next);
      return next;
    });
  };

  const extendCutoff = (id: string, minutes: number = 30) => {
    setNodes((prev) =>
      prev.map((node, idx) => {
        if (node.id === id) {
          void RealtimeService.sendPrototypeCommand({
            source: 'synco_meter_app',
            command: 'EXTEND_CUTOFF',
            roomIndex: idx,
            deviceCode: node.code || supabaseDeviceId,
            extendMinutes: minutes,
            timestamp: new Date().toISOString(),
          });
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

  const addPlug = async (input: PlugInput) => {
    const cleanName = input.name.trim();
    const cleanLocation = input.location.trim();
    const cleanCode = input.code.trim().toUpperCase();
    const icon = input.icon || 'power-socket-eu';
    const initialNodeBase: SmartNode = {
      id: `node-${Date.now()}`,
      name: cleanName,
      location: cleanLocation,
      code: cleanCode,
      hardware: 'PZEM-004T v3.0',
      icon,
      isOnline: true,
      relayState: true,
      occupancy: 'Occupied',
      cutoffPending: false,
      cutoffCountdownSeconds: 0,
      voltage: 228.4,
      current: 1.09,
      activePowerWatts: 240,
      powerFactor: 0.96,
      frequency: 60.0,
      todayKwh: 1.45,
      monthKwh: 38.2,
      todayCost: +(1.45 * baseReport.tariffPerKwh).toFixed(2),
      sharePercentage: 0,
      peakSpikeWatts: 420,
      autoTrips: 0,
    };

    const baseW = baseWattsForNode(initialNodeBase);
    initialNodeBase.activePowerWatts = baseW;
    initialNodeBase.current = +(baseW / (228.4 * 0.96)).toFixed(2);

    setNodes((prev) => {
      const next = [...prev, initialNodeBase];
      persistNodes(next);
      return next;
    });

    if (isSupabaseConfigured()) {
      await RealtimeService.upsertDevice({
        deviceIdStr: cleanCode,
        name: cleanName,
        relayState: true,
      });
    }
  };

  const renamePlug = async (id: string, input: PlugInput) => {
    const cleanName = input.name.trim();
    const cleanLocation = input.location.trim();
    const cleanCode = input.code.trim().toUpperCase();
    let previousCode = '';

    setNodes((prev) => {
      const next = prev.map((node) => {
        if (node.id === id) {
          previousCode = node.code;
          return {
            ...node,
            name: cleanName,
            location: cleanLocation,
            code: cleanCode || node.code,
            icon: input.icon || node.icon,
          };
        }
        return node;
      });
      persistNodes(next);
      return next;
    });

    if (isSupabaseConfigured() && previousCode) {
      await RealtimeService.renameDevice(previousCode, {
        name: cleanName,
        newDeviceIdStr: cleanCode || previousCode,
      });
    }
  };

  const deletePlug = async (id: string) => {
    let targetCode = '';

    setNodes((prev) => {
      const found = prev.find((n) => n.id === id);
      targetCode = found?.code || '';
      const next = prev.filter((node) => node.id !== id);
      snapshotCacheRef.current.delete(id);
      persistNodes(next);
      return next;
    });

    if (isSupabaseConfigured() && targetCode) {
      await RealtimeService.deleteDevice(targetCode);
    }
  };

  const applyStandbyRule = () => {
    setRuleApplied(true);
  };

  const totalPowerWatts = nodes.reduce(
    (sum, n) => sum + (n.relayState ? n.activePowerWatts : 0),
    0
  );
  const totalCurrentAmps = +nodes
    .reduce((sum, n) => sum + (n.relayState ? n.current : 0), 0)
    .toFixed(2);
  const averageVoltage = nodes.length > 0 ? nodes[0].voltage : 228.4;
  const averagePowerFactor =
    nodes.length > 0
      ? +(nodes.reduce((sum, n) => sum + n.powerFactor, 0) / nodes.length).toFixed(2)
      : 0.96;
  const todayTotalKwh = +consumptionRooms
    .reduce((sum, r) => sum + r.todayKwh, 0)
    .toFixed(2);
  const todayEstimatedCost = +(todayTotalKwh * baseReport.tariffPerKwh).toFixed(2);
  const todaySavedKwh = nodes.length > 0 ? 1.85 : 0;

  const monthTotalKwh = +consumptionRooms
    .reduce((sum, r) => sum + r.monthKwh, 0)
    .toFixed(2);
  const report: HemsReport = useMemo(
    () => ({
      ...baseReport,
      totalKwh: monthTotalKwh,
      totalCost: +(monthTotalKwh * baseReport.tariffPerKwh).toFixed(2),
    }),
    [baseReport, monthTotalKwh]
  );

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
        addPlug,
        renamePlug,
        deletePlug,
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
        isSupabaseConnected,
        supabaseDeviceId,
        isHardwareTelemetryActive,
        isPrototypeLinked,
        prototypeAlerts,
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
