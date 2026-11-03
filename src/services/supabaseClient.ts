import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_SUPABASE_URL = '@capstone_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = '@capstone_supabase_key';
const STORAGE_KEY_DEVICE_ID = '@capstone_device_id';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  deviceId: string;
}

// Fallback environment variables (configured via .env or Expo EAS)
const ENV_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const ENV_DEVICE_ID = process.env.EXPO_PUBLIC_DEVICE_ID || 'ESP32-PZEM-DEV-01';

const DEFAULT_CONFIG: SupabaseConfig = {
  url: ENV_SUPABASE_URL,
  anonKey: ENV_SUPABASE_ANON_KEY,
  deviceId: ENV_DEVICE_ID,
};

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = { ...DEFAULT_CONFIG };

type ConfigListener = (config: SupabaseConfig) => void;
const configListeners: Set<ConfigListener> = new Set();

function buildClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.error('[SupabaseClient] Error initializing client:', err);
    return null;
  }
}

// Initialize immediately if environment credentials exist
if (DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey) {
  supabaseInstance = buildClient(DEFAULT_CONFIG.url, DEFAULT_CONFIG.anonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    currentConfig.url &&
    currentConfig.anonKey &&
    currentConfig.url.trim().length > 0 &&
    currentConfig.anonKey.trim().length > 0 &&
    supabaseInstance !== null
  );
}

export async function loadSavedSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_URL);
    const savedKey = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_KEY);
    const savedDevice = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID);

    currentConfig = {
      url: savedUrl || ENV_SUPABASE_URL || '',
      anonKey: savedKey || ENV_SUPABASE_ANON_KEY || '',
      deviceId: savedDevice || ENV_DEVICE_ID || 'ESP32-PZEM-DEV-01',
    };

    if (currentConfig.url && currentConfig.anonKey) {
      supabaseInstance = buildClient(currentConfig.url, currentConfig.anonKey);
    } else {
      supabaseInstance = null;
    }

    notifyConfigListeners(currentConfig);
    return currentConfig;
  } catch (error) {
    console.warn('[SupabaseClient] Failed to load config from AsyncStorage', error);
    return currentConfig;
  }
}

export async function saveSupabaseConfig(config: SupabaseConfig): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_URL, config.url.trim());
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_KEY, config.anonKey.trim());
    await AsyncStorage.setItem(STORAGE_KEY_DEVICE_ID, config.deviceId.trim());

    currentConfig = {
      url: config.url.trim(),
      anonKey: config.anonKey.trim(),
      deviceId: config.deviceId.trim() || 'ESP32-PZEM-DEV-01',
    };

    if (currentConfig.url && currentConfig.anonKey) {
      supabaseInstance = buildClient(currentConfig.url, currentConfig.anonKey);
    } else {
      supabaseInstance = null;
    }

    notifyConfigListeners(currentConfig);
    return true;
  } catch (error) {
    console.error('[SupabaseClient] Error saving Supabase config', error);
    return false;
  }
}

export async function clearSupabaseConfig(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
    await AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
    await AsyncStorage.removeItem(STORAGE_KEY_DEVICE_ID);

    currentConfig = {
      url: ENV_SUPABASE_URL || '',
      anonKey: ENV_SUPABASE_ANON_KEY || '',
      deviceId: ENV_DEVICE_ID || 'ESP32-PZEM-DEV-01',
    };

    supabaseInstance = currentConfig.url && currentConfig.anonKey
      ? buildClient(currentConfig.url, currentConfig.anonKey)
      : null;

    notifyConfigListeners(currentConfig);
    return true;
  } catch (error) {
    console.error('[SupabaseClient] Error clearing config', error);
    return false;
  }
}

export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = (testUrl || currentConfig.url || '').trim();
    const key = (testKey || currentConfig.anonKey || '').trim();

    if (!url || !key) {
      return {
        success: false,
        message: 'Server URL and public API key cannot be empty.',
      };
    }

    // Basic URL format validation
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return {
        success: false,
        message: 'Server URL must start with https://',
      };
    }

    const testClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test REST API connectivity by attempting to reach the auth health check or devices table
    const { error: sessionError } = await testClient.auth.getSession();
    if (sessionError) {
      return {
        success: false,
        message: `Auth verification failed: ${sessionError.message}`,
      };
    }

    // Also attempt lightweight database query
    const { error: dbError } = await testClient
      .from('devices')
      .select('device_id_str')
      .limit(1);

    if (dbError && dbError.code !== 'PGRST116') {
      // If table doesn't exist yet, it's still reachable as long as it's not a 401/403
      if (dbError.message.includes('relation "public.devices" does not exist')) {
        return {
          success: true,
          message: 'Connected, but device data is unavailable. Contact your administrator.',
        };
      }
      return {
        success: false,
        message: `Database check error: ${dbError.message}`,
      };
    }

    return {
      success: true,
      message: 'Connection verified! The server is reachable and ready.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error: could not connect to the server.',
    };
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

export function getLoadedConfig(): SupabaseConfig {
  return currentConfig;
}

export function onSupabaseConfigChange(listener: ConfigListener): () => void {
  configListeners.add(listener);
  return () => {
    configListeners.delete(listener);
  };
}

function notifyConfigListeners(config: SupabaseConfig) {
  configListeners.forEach((fn) => {
    try {
      fn(config);
    } catch (e) {
      console.error('[SupabaseClient] Error in config listener:', e);
    }
  });
}
