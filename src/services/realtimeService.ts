import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import { TelemetryReading } from '../types/telemetry';

export class RealtimeService {
  private static channel: RealtimeChannel | null = null;

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
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    const channelName = `meter_${deviceId}`;
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
            id: row.id,
            deviceId: row.device_id,
            voltage: parseFloat(row.voltage),
            current: parseFloat(row.current),
            power: parseFloat(row.power),
            energy: parseFloat(row.energy),
            frequency: parseFloat(row.frequency),
            powerFactor: parseFloat(row.power_factor),
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
      // 1. Update database state
      const { error: dbError } = await supabase
        .from('devices')
        .update({
          relay_state: newState,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id_str', deviceId);

      if (dbError) {
        console.error('[RealtimeService] Failed to update device relay state in DB:', dbError);
      }

      // 2. Broadcast immediate command event over realtime channel for <100ms response
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'relay_command',
          payload: {
            deviceId,
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
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
