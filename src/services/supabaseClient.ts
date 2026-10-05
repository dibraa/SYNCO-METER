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

// Fallback placeholder credentials (can be updated dynamically in-app)
const DEFAULT_CONFIG: SupabaseConfig = {
  url: '',
  anonKey: '',
  deviceId: 'ESP32-PZEM-DEV-01',
};

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = { ...DEFAULT_CONFIG };

export async function loadSavedSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_URL);
    const anonKey = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_KEY);
    const deviceId = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID);

    currentConfig = {
      url: url || '',
      anonKey: anonKey || '',
      deviceId: deviceId || 'ESP32-PZEM-DEV-01',
    };

    if (currentConfig.url && currentConfig.anonKey) {
      supabaseInstance = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          persistSession: false,
        },
      });
    }

    return currentConfig;
  } catch (error) {
    console.warn('Failed to load saved Supabase credentials from AsyncStorage', error);
    return currentConfig;
  }
}

export async function saveSupabaseConfig(config: SupabaseConfig): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_URL, config.url);
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_KEY, config.anonKey);
    await AsyncStorage.setItem(STORAGE_KEY_DEVICE_ID, config.deviceId);

    currentConfig = { ...config };

    if (config.url && config.anonKey) {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
        },
      });
    } else {
      supabaseInstance = null;
    }

    return true;
  } catch (error) {
    console.error('Error saving Supabase config', error);
    return false;
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

export function getLoadedConfig(): SupabaseConfig {
  return currentConfig;
}
