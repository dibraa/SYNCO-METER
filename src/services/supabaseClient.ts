import { Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_SUPABASE_URL = '@capstone_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = '@capstone_supabase_key';
const STORAGE_KEY_DEVICE_ID = '@capstone_device_id';
const STORAGE_KEY_OFFLINE_OVERRIDE = '@capstone_offline_override';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  deviceId: string;
}

export type ReachabilityStatus = 'checking' | 'reachable' | 'unreachable' | 'offline';

/**
 * Normalizes a Supabase URL and auto-heals pasted Supabase Dashboard URLs:
 * e.g. https://supabase.com/dashboard/project/abc123 -> https://abc123.supabase.co
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';

  const dashboardMatch = trimmed.match(
    /^https?:\/\/(?:app\.)?supabase\.com\/(?:dashboard\/)?project\/([a-z0-9]{10,40})(?:\/.*)?$/i
  );
  if (dashboardMatch) {
    return `https://${dashboardMatch[1].toLowerCase()}.supabase.co`;
  }

  return trimmed.replace(/\/+$/, '');
}

// Fallback environment variables (configured via .env or Expo EAS)
const ENV_SUPABASE_URL = normalizeSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL || '');
const ENV_SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const ENV_DEVICE_ID = (process.env.EXPO_PUBLIC_DEVICE_ID || 'ESP32-PZEM-DEV-01').trim();

const DEFAULT_CONFIG: SupabaseConfig = {
  url: ENV_SUPABASE_URL,
  anonKey: ENV_SUPABASE_ANON_KEY,
  deviceId: ENV_DEVICE_ID,
};

let supabaseInstance: SupabaseClient | null = null;
let activeClientSignature = '';
let currentConfig: SupabaseConfig = { ...DEFAULT_CONFIG };

type ConfigListener = (config: SupabaseConfig) => void;
const configListeners: Set<ConfigListener> = new Set();

function ensureClient(url: string, anonKey: string): SupabaseClient | null {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = (anonKey || '').trim();

  if (!cleanUrl || !cleanKey) {
    supabaseInstance = null;
    activeClientSignature = '';
    return null;
  }

  const nextSignature = `${cleanUrl}::${cleanKey}`;
  if (supabaseInstance && activeClientSignature === nextSignature) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(cleanUrl, cleanKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    activeClientSignature = nextSignature;
    return supabaseInstance;
  } catch (err) {
    console.error('[SupabaseClient] Error initializing client:', err);
    supabaseInstance = null;
    activeClientSignature = '';
    return null;
  }
}

// Initialize immediately if environment credentials exist
if (DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey) {
  ensureClient(DEFAULT_CONFIG.url, DEFAULT_CONFIG.anonKey);
}

export function hasDefaultEnvSupabaseConfig(): boolean {
  return Boolean(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY);
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

export function isTransientNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; status?: number; message?: string };
  if (e.name === 'AuthRetryableFetchError' || e.name === 'AbortError') return true;
  if (e.status === 0) return true;
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('network request failed') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('enotfound') ||
    msg.includes('timed out')
  );
}

export function getPasswordResetRedirectUrl(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return undefined;
}

export function classifySupabaseError(
  err: unknown,
  targetUrl?: string
): { isNetworkError: boolean; message: string } {
  const url = normalizeSupabaseUrl(targetUrl || currentConfig.url || '');
  let host = url;
  try {
    if (url) host = new URL(url).hostname;
  } catch {
    host = url;
  }

  if (isTransientNetworkError(err)) {
    return {
      isNetworkError: true,
      message: host
        ? `Could not reach ${host}. Check your internet connection or open Connection Settings to verify your Supabase URL.`
        : 'Network request failed. Check your internet connection or Connection Settings.',
    };
  }

  const msg =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
      ? (err as { message: string }).message
      : 'Authentication failed. Please try again.';

  const lower = msg.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('for security purposes')) {
    return {
      isNetworkError: false,
      message: 'Too many requests. Please wait a minute before trying again.',
    };
  }
  if (lower.includes('email not confirmed')) {
    return {
      isNetworkError: false,
      message:
        'This account was created before email confirmation was disabled. Check your inbox or confirm it in Supabase Auth.',
    };
  }

  return { isNetworkError: false, message: msg };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries transient network/DNS failures (e.g. flaky local DNS or brief Wi-Fi drops)
 * without retrying real API responses like invalid credentials or rate limits.
 */
export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const result = await operation();
      const maybeError =
        result && typeof result === 'object' && 'error' in result
          ? (result as { error?: unknown }).error
          : null;

      if (maybeError && isTransientNetworkError(maybeError) && attempt < maxRetries) {
        attempt += 1;
        await delay(450 * attempt);
        continue;
      }
      return result;
    } catch (err) {
      if (isTransientNetworkError(err) && attempt < maxRetries) {
        attempt += 1;
        await delay(450 * attempt);
        continue;
      }
      throw err;
    }
  }
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkSupabaseReachability(
  timeoutMs: number = 6000
): Promise<'offline' | 'reachable' | 'unreachable'> {
  if (!isSupabaseConfigured()) return 'offline';

  const url = normalizeSupabaseUrl(currentConfig.url);
  const key = currentConfig.anonKey.trim();

  try {
    const res = await withAuthRetry(
      () =>
        fetchWithTimeout(
          `${url}/auth/v1/health`,
          {
            method: 'GET',
            headers: {
              apikey: key,
            },
          },
          timeoutMs
        ),
      1
    );
    return res.status < 500 ? 'reachable' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

export async function loadSavedSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    const [savedUrlRaw, savedKeyRaw, savedDevice, offlineOverride] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_SUPABASE_URL),
      AsyncStorage.getItem(STORAGE_KEY_SUPABASE_KEY),
      AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID),
      AsyncStorage.getItem(STORAGE_KEY_OFFLINE_OVERRIDE),
    ]);

    if (offlineOverride === 'true') {
      currentConfig = {
        url: '',
        anonKey: '',
        deviceId: savedDevice || ENV_DEVICE_ID || 'ESP32-PZEM-DEV-01',
      };
      ensureClient('', '');
      notifyConfigListeners(currentConfig);
      return currentConfig;
    }

    const normalizedSavedUrl = normalizeSupabaseUrl(savedUrlRaw || '');
    // Self-heal if a dashboard URL or trailing slash was previously saved in AsyncStorage
    if (savedUrlRaw && normalizedSavedUrl && normalizedSavedUrl !== savedUrlRaw) {
      AsyncStorage.setItem(STORAGE_KEY_SUPABASE_URL, normalizedSavedUrl).catch(() => {});
    }

    currentConfig = {
      url: normalizedSavedUrl || ENV_SUPABASE_URL || '',
      anonKey: (savedKeyRaw || '').trim() || ENV_SUPABASE_ANON_KEY || '',
      deviceId: (savedDevice || '').trim() || ENV_DEVICE_ID || 'ESP32-PZEM-DEV-01',
    };

    ensureClient(currentConfig.url, currentConfig.anonKey);
    notifyConfigListeners(currentConfig);
    return currentConfig;
  } catch (error) {
    console.warn('[SupabaseClient] Failed to load config from AsyncStorage', error);
    return currentConfig;
  }
}

export async function saveSupabaseConfig(config: SupabaseConfig): Promise<boolean> {
  try {
    const cleanUrl = normalizeSupabaseUrl(config.url);
    const cleanKey = (config.anonKey || '').trim();
    const cleanDevice = (config.deviceId || '').trim() || 'ESP32-PZEM-DEV-01';

    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_URL, cleanUrl);
    await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_KEY, cleanKey);
    await AsyncStorage.setItem(STORAGE_KEY_DEVICE_ID, cleanDevice);

    if (cleanUrl && cleanKey) {
      await AsyncStorage.removeItem(STORAGE_KEY_OFFLINE_OVERRIDE);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_OFFLINE_OVERRIDE, 'true');
    }

    currentConfig = {
      url: cleanUrl,
      anonKey: cleanKey,
      deviceId: cleanDevice,
    };

    ensureClient(currentConfig.url, currentConfig.anonKey);
    notifyConfigListeners(currentConfig);
    return true;
  } catch (error) {
    console.error('[SupabaseClient] Error saving Supabase config', error);
    return false;
  }
}

/**
 * Switches the app cleanly to Offline / Demo mode even when .env has default credentials.
 */
export async function clearSupabaseConfig(): Promise<boolean> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_URL),
      AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_KEY),
      AsyncStorage.removeItem(STORAGE_KEY_DEVICE_ID),
      AsyncStorage.setItem(STORAGE_KEY_OFFLINE_OVERRIDE, 'true'),
    ]);

    currentConfig = {
      url: '',
      anonKey: '',
      deviceId: ENV_DEVICE_ID || 'ESP32-PZEM-DEV-01',
    };

    ensureClient('', '');
    notifyConfigListeners(currentConfig);
    return true;
  } catch (error) {
    console.error('[SupabaseClient] Error clearing config', error);
    return false;
  }
}

/**
 * Clears custom saved overrides and restores default .env project credentials.
 */
export async function restoreDefaultSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_URL),
      AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_KEY),
      AsyncStorage.removeItem(STORAGE_KEY_DEVICE_ID),
      AsyncStorage.removeItem(STORAGE_KEY_OFFLINE_OVERRIDE),
    ]);
  } catch (error) {
    console.warn('[SupabaseClient] Error removing overrides during restore', error);
  }

  currentConfig = {
    url: ENV_SUPABASE_URL || '',
    anonKey: ENV_SUPABASE_ANON_KEY || '',
    deviceId: ENV_DEVICE_ID || 'ESP32-PZEM-DEV-01',
  };

  ensureClient(currentConfig.url, currentConfig.anonKey);
  notifyConfigListeners(currentConfig);
  return currentConfig;
}

export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string; normalizedUrl?: string }> {
  try {
    const url = normalizeSupabaseUrl(testUrl || currentConfig.url || '');
    const key = (testKey || currentConfig.anonKey || '').trim();

    if (!url || !key) {
      return {
        success: false,
        message: 'Server URL and Publishable / Anon API key cannot be empty.',
      };
    }

    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return {
        success: false,
        message: 'Server URL must start with https:// (e.g. https://<ref>.supabase.co)',
      };
    }

    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      return {
        success: false,
        message: 'Invalid Server URL format.',
      };
    }

    // 1. Live network probe against GoTrue Auth health endpoint (with 1 automatic retry)
    let healthRes: Response;
    try {
      healthRes = await withAuthRetry(
        () =>
          fetchWithTimeout(
            `${url}/auth/v1/health`,
            {
              method: 'GET',
              headers: {
                apikey: key,
              },
            },
            8000
          ),
        1
      );
    } catch (err) {
      return {
        success: false,
        normalizedUrl: url,
        message: classifySupabaseError(err, url).message,
      };
    }

    if (healthRes.status === 401 || healthRes.status === 403) {
      return {
        success: false,
        normalizedUrl: url,
        message: `Reached ${host}, but the API key was rejected (${healthRes.status}).`,
      };
    }

    if (!healthRes.ok) {
      return {
        success: false,
        normalizedUrl: url,
        message: `Auth server at ${host} responded with HTTP ${healthRes.status}.`,
      };
    }

    // 2. Lightweight database table check with isolated storageKey (avoids duplicate GoTrueClient warnings)
    const testClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-synco-connection-test',
      },
    });

    const { error: dbError } = await testClient
      .from('devices')
      .select('device_id_str')
      .limit(1);

    if (dbError && dbError.code !== 'PGRST116') {
      if (dbError.message.includes('relation "public.devices" does not exist')) {
        return {
          success: true,
          normalizedUrl: url,
          message: 'Auth connected! Run 001_initial_schema.sql to initialize the devices table.',
        };
      }
      return {
        success: false,
        normalizedUrl: url,
        message: `Database check error: ${dbError.message}`,
      };
    }

    return {
      success: true,
      normalizedUrl: url,
      message: `Connected to ${host}! Auth and database are ready.`,
    };
  } catch (err) {
    return {
      success: false,
      message: classifySupabaseError(err, testUrl).message,
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
