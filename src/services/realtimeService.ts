import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import { TelemetryReading } from '../types/telemetry';

export class RealtimeService {
  private static channel: RealtimeChannel | null = null;

  /**
   * Fetch the latest energy reading from Supabase DB
   */
  public static async fetchLatestReading(deviceId?: string): Promise<TelemetryReading | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      let query = supabase
        .from('energy_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data, error } = await query;
      if (error) {
        console.warn('[RealtimeService] Could not fetch latest reading:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        const row = data[0];
        return {
          id: String(row.id),
          deviceId: row.device_id || deviceId || 'ESP32-PZEM-DEV-01',
          voltage: parseFloat(row.voltage) || 220,
          current: parseFloat(row.current) || 0,
          power: parseFloat(row.power) || 0,
          energy: parseFloat(row.energy) || 0,
          frequency: parseFloat(row.frequency) || 60,
          powerFactor: parseFloat(row.power_factor) || 0.95,
          relayState: true,
          timestamp: row.created_at,
        };
      }
      return null;
    } catch (err) {
      console.warn('[RealtimeService] Error fetching latest reading:', err);
      return null;
    }
  }

  /**
   * Fetch device information and current relay state
   */
  public static async fetchDevice(deviceId: string) {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('device_id_str', deviceId)
        .maybeSingle();

      if (error) {
        console.warn('[RealtimeService] Could not fetch device:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[RealtimeService] Error fetching device:', err);
      return null;
    }
  }

  /**
   * Subscribe to live real-time telemetry events from Supabase
   */
  public static subscribeToTelemetry(
    deviceId: string,
    onReadingReceived: (reading: TelemetryReading) => void,
    onRelayStateChanged?: (relayState: boolean) => void
  ) {
    const supabase = getSupabase();
    if (!supabase) {
      console.log('[RealtimeService] No Supabase client initialized. Running in Mock/Offline mode.');
      return;
    }

    // Clean up existing channel if active
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn('[RealtimeService] Channel cleanup error:', e);
      }
      this.channel = null;
    }

    const channelName = `meter_${deviceId || 'ESP32-PZEM-DEV-01'}`;
    this.channel = supabase.channel(channelName);

    // 1. Listen for ultra-fast broadcast events (ESP32 -> Mobile UI)
    this.channel.on('broadcast', { event: 'telemetry_stream' }, (payload) => {
      if (payload && payload.payload) {
        onReadingReceived(payload.payload as TelemetryReading);
      }
    });

    // 2. Listen for DB postgres_changes on energy_readings table
    this.channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'energy_readings',
      },
      (payload) => {
        const row = payload.new;
        if (row) {
          const reading: TelemetryReading = {
            id: String(row.id),
            deviceId: row.device_id || deviceId,
            voltage: parseFloat(row.voltage) || 220,
            current: parseFloat(row.current) || 0,
            power: parseFloat(row.power) || 0,
            energy: parseFloat(row.energy) || 0,
            frequency: parseFloat(row.frequency) || 60,
            powerFactor: parseFloat(row.power_factor) || 0.95,
            relayState: true,
            timestamp: row.created_at,
          };
          onReadingReceived(reading);
        }
      }
    );

    // 3. Listen for relay state modifications in devices table
    this.channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'devices',
      },
      (payload) => {
        const row = payload.new;
        if (row && onRelayStateChanged && typeof row.relay_state === 'boolean') {
          onRelayStateChanged(row.relay_state);
        }
      }
    );

    this.channel.subscribe((status) => {
      console.log(`[RealtimeService] Channel ${channelName} subscription status:`, status);
    });
  }

  /**
   * Broadcast relay toggle command to ESP32 via Supabase
   */
  public static async toggleRelay(deviceId: string, newState: boolean): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const targetId = deviceId || 'ESP32-PZEM-DEV-01';

      // 1. Update database state
      const { error: dbError } = await supabase
        .from('devices')
        .update({
          relay_state: newState,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id_str', targetId);

      if (dbError) {
        console.warn('[RealtimeService] Could not update device row directly:', dbError.message);
      }

      // 2. Broadcast immediate command event over realtime channel for <100ms response
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'relay_command',
          payload: {
            deviceId: targetId,
            command: newState ? 'RELAY_ON' : 'RELAY_OFF',
            state: newState,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (err) {
      console.error('[RealtimeService] Error toggling relay:', err);
      return false;
    }
  }

  /**
   * Unsubscribe and cleanup
   */
  public static unsubscribe() {
    const supabase = getSupabase();
    if (supabase && this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn('[RealtimeService] Channel remove error:', e);
      }
      this.channel = null;
    }
  }
}
