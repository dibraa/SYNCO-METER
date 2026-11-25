import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import {
  TelemetryReading,
  PrototypeBridgePayload,
  PrototypeCommandPayload,
} from '../types/telemetry';

const PROTOTYPE_CHANNEL_NAME = 'synco_prototype_bridge';

export class RealtimeService {
  private static channel: RealtimeChannel | null = null;
  private static prototypeChannel: RealtimeChannel | null = null;
  private static localBroadcast: BroadcastChannel | null = null;

  /**
   * Fetch the latest energy reading from Supabase DB
   */
  public static async fetchLatestReading(deviceId?: string): Promise<TelemetryReading | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('energy_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

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
   * Create or update a smart plug device in public.devices
   */
  public static async upsertDevice(device: {
    deviceIdStr: string;
    name: string;
    relayState?: boolean;
  }): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('devices').upsert(
        {
          device_id_str: device.deviceIdStr,
          name: device.name,
          relay_state: device.relayState ?? true,
          is_online: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_id_str' }
      );
      if (error) {
        console.warn('[RealtimeService] Could not upsert device:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[RealtimeService] Error upserting device:', err);
      return false;
    }
  }

  /**
   * Rename (or update device_id_str of) an existing smart plug in public.devices
   */
  public static async renameDevice(
    oldDeviceIdStr: string,
    updates: { name: string; newDeviceIdStr?: string }
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload: Record<string, unknown> = {
        name: updates.name,
        updated_at: new Date().toISOString(),
      };
      if (updates.newDeviceIdStr && updates.newDeviceIdStr !== oldDeviceIdStr) {
        payload.device_id_str = updates.newDeviceIdStr;
      }

      const { error } = await supabase
        .from('devices')
        .update(payload)
        .eq('device_id_str', oldDeviceIdStr);

      if (error) {
        console.warn('[RealtimeService] Could not rename device:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[RealtimeService] Error renaming device:', err);
      return false;
    }
  }

  /**
   * Delete a smart plug device from public.devices
   */
  public static async deleteDevice(deviceIdStr: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('device_id_str', deviceIdStr);

      if (error) {
        console.warn('[RealtimeService] Could not delete device:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[RealtimeService] Error deleting device:', err);
      return false;
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

    this.channel.on('broadcast', { event: 'telemetry_stream' }, (payload) => {
      if (payload && payload.payload) {
        onReadingReceived(payload.payload as TelemetryReading);
      }
    });

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
   * Subscribe to the bidirectional 3D Hardware Prototype bridge (Supabase Realtime + local BroadcastChannel fallback)
   */
  public static subscribeToPrototypeBridge(
    onSnapshot: (snapshot: PrototypeBridgePayload) => void
  ) {
    this.unsubscribePrototypeBridge();

    const handleIncoming = (raw: unknown) => {
      if (
        raw &&
        typeof raw === 'object' &&
        (raw as PrototypeBridgePayload).source === 'hardware_prototype_3d' &&
        Array.isArray((raw as PrototypeBridgePayload).rooms)
      ) {
        onSnapshot(raw as PrototypeBridgePayload);
      }
    };

    // 1. Local browser BroadcastChannel fallback (same-device instant sync even offline)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.localBroadcast = new BroadcastChannel(PROTOTYPE_CHANNEL_NAME);
        this.localBroadcast.onmessage = (ev) => {
          handleIncoming(ev.data);
        };
      } catch (err) {
        console.warn('[RealtimeService] Local BroadcastChannel unavailable:', err);
      }
    }

    // 2. Supabase Realtime Broadcast (works cross-device: Laptop 3D Prototype <-> Android/Web SYNCO METER)
    const supabase = getSupabase();
    if (!supabase) return;

    const ch = supabase.channel(PROTOTYPE_CHANNEL_NAME, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    ch.on('broadcast', { event: 'prototype_state' }, (msg) => {
      if (msg && msg.payload) {
        handleIncoming(msg.payload);
      }
    });

    ch.subscribe((status) => {
      console.log(`[RealtimeService] Prototype bridge status:`, status);
      if (status === 'SUBSCRIBED') {
        void this.sendPrototypeCommand({
          source: 'synco_meter_app',
          command: 'REQUEST_SYNC',
          timestamp: new Date().toISOString(),
        });
      }
    });

    this.prototypeChannel = ch;
  }

  /**
   * Send relay or cutoff-extension command from SYNCO METER to the 3D Hardware Prototype
   */
  public static async sendPrototypeCommand(cmd: PrototypeCommandPayload): Promise<boolean> {
    let sent = false;

    if (this.localBroadcast) {
      try {
        this.localBroadcast.postMessage(cmd);
        sent = true;
      } catch (err) {
        console.warn('[RealtimeService] Local BroadcastChannel send error:', err);
      }
    }

    if (this.prototypeChannel) {
      try {
        const res = await this.prototypeChannel.send({
          type: 'broadcast',
          event: 'app_command',
          payload: cmd,
        });
        if (res === 'ok') sent = true;
      } catch (err) {
        console.warn('[RealtimeService] Prototype bridge command error:', err);
      }
    }

    return sent;
  }

  /**
   * Unsubscribe prototype bridge
   */
  public static unsubscribePrototypeBridge() {
    if (this.localBroadcast) {
      try {
        this.localBroadcast.close();
      } catch {
        // ignore
      }
      this.localBroadcast = null;
    }

    const supabase = getSupabase();
    if (supabase && this.prototypeChannel) {
      try {
        supabase.removeChannel(this.prototypeChannel);
      } catch (e) {
        console.warn('[RealtimeService] Prototype channel remove error:', e);
      }
      this.prototypeChannel = null;
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
