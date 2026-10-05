import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TelemetryReading, AppliancePreset } from '../types/telemetry';
import { TelemetryGenerator, APPLIANCE_PROFILES } from '../mock/telemetryGenerator';
import { RealtimeService } from '../services/realtimeService';
import { loadSavedSupabaseConfig, saveSupabaseConfig, SupabaseConfig, getSupabase } from '../services/supabaseClient';

export type DataSourceMode = 'MOCK' | 'SUPABASE';

interface TelemetryContextType {
  reading: TelemetryReading;
  history: Array<{ hour: string; powerWatts: number; energyKwh: number; cost: number }>;
  sourceMode: DataSourceMode;
  setSourceMode: (mode: DataSourceMode) => void;
  appliancePreset: AppliancePreset;
  setAppliancePreset: (preset: AppliancePreset) => void;
  relayState: boolean;
  toggleRelay: () => Promise<void>;
  tariffRate: number;
  setTariffRate: (rate: number) => void;
  currencySymbol: string;
  overloadLimitWatts: number;
  setOverloadLimitWatts: (limit: number) => void;
  isOverloaded: boolean;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: SupabaseConfig) => Promise<boolean>;
  isConnected: boolean;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sourceMode, setSourceMode] = useState<DataSourceMode>('MOCK');
  const [appliancePreset, setAppliancePresetState] = useState<AppliancePreset>('AIR_CONDITIONER');
  const [tariffRate, setTariffRate] = useState<number>(12.0); // 12 PHP/kWh default
  const [currencySymbol] = useState<string>('₱');
  const [overloadLimitWatts, setOverloadLimitWatts] = useState<number>(3000);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    deviceId: 'ESP32-PZEM-DEV-01',
  });
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Generator reference for mock mode
  const generatorRef = useRef<TelemetryGenerator>(new TelemetryGenerator(supabaseConfig.deviceId));

  const [reading, setReading] = useState<TelemetryReading>(() => generatorRef.current.generateReading());
  const [history, setHistory] = useState<Array<{ hour: string; powerWatts: number; energyKwh: number; cost: number }>>(
    () => generatorRef.current.generate24HourHistory(12.0)
  );

  // Initialize saved settings on start
  useEffect(() => {
    loadSavedSupabaseConfig().then((cfg) => {
      setSupabaseConfig(cfg);
      if (cfg.url && cfg.anonKey) {
        // If credentials exist, user can switch or stay
      }
    });
  }, []);

  // Update appliance preset in generator
  const setAppliancePreset = (preset: AppliancePreset) => {
    setAppliancePresetState(preset);
    generatorRef.current.setAppliancePreset(preset);
  };

  // Switch between Mock simulation loop and Supabase Realtime
  useEffect(() => {
    let intervalId: any = null;

    if (sourceMode === 'MOCK') {
      setIsConnected(true);
      intervalId = setInterval(() => {
        const newReading = generatorRef.current.generateReading();
        setReading(newReading);
      }, 1000);
    } else {
      // Connect to Supabase Realtime
      const supabase = getSupabase();
      if (!supabase) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
        RealtimeService.subscribeToTelemetry(
          supabaseConfig.deviceId,
          (newReading) => {
            setReading(newReading);
            setIsConnected(true);
          },
          (newRelayState) => {
            setReading((prev) => ({ ...prev, relayState: newRelayState }));
          }
        );
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (sourceMode === 'SUPABASE') {
        RealtimeService.unsubscribe();
      }
    };
  }, [sourceMode, supabaseConfig.deviceId]);

  // Toggle relay switch
  const toggleRelay = async () => {
    const nextState = !reading.relayState;

    if (sourceMode === 'MOCK') {
      generatorRef.current.setRelayState(nextState);
      setReading((prev) => ({
        ...prev,
        relayState: nextState,
        power: nextState ? prev.power : 0,
        current: nextState ? prev.current : 0,
      }));
    } else {
      const success = await RealtimeService.toggleRelay(supabaseConfig.deviceId, nextState);
      if (success) {
        setReading((prev) => ({ ...prev, relayState: nextState }));
      }
    }
  };

  const updateSupabaseConfig = async (newConfig: SupabaseConfig) => {
    const success = await saveSupabaseConfig(newConfig);
    if (success) {
      setSupabaseConfig(newConfig);
    }
    return success;
  };

  const isOverloaded = reading.power > overloadLimitWatts;

  return (
    <TelemetryContext.Provider
      value={{
        reading,
        history,
        sourceMode,
        setSourceMode,
        appliancePreset,
        setAppliancePreset,
        relayState: reading.relayState,
        toggleRelay,
        tariffRate,
        setTariffRate,
        currencySymbol,
        overloadLimitWatts,
        setOverloadLimitWatts,
        isOverloaded,
        supabaseConfig,
        updateSupabaseConfig,
        isConnected,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
