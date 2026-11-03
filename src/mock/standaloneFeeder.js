/* global __dirname */
/**
 * Standalone Telemetry Feeder (Simulated ESP32 + PZEM-004T)
 * Can be run via: `node src/mock/standaloneFeeder.js`
 * 
 * Supports:
 * 1. Console stream mode (local debugging)
 * 2. Supabase ingestion mode (pushes directly to Supabase REST endpoint if configured)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Auto-load environment variables from .env or .env.local
function loadEnv() {
  const envFiles = ['.env', '.env.local'];
  for (const file of envFiles) {
    const fullPath = path.resolve(__dirname, '../../', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          value = value.replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key] && value) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}
loadEnv();

// Configuration
const CONFIG = {
  deviceId: process.env.DEVICE_ID || process.env.EXPO_PUBLIC_DEVICE_ID || 'ESP32-PZEM-DEV-01',
  supabaseUrl: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  intervalMs: 2000,
  nominalVoltage: 220.0,
  nominalFrequency: 60.0,
};

let cumulativeEnergyKwh = 15.42;
let relayState = true;
let currentAppliance = 'AIR_CONDITIONER'; // 'STANDBY', 'REFRIGERATOR', 'AIR_CONDITIONER', 'WATER_HEATER'
let resolvedDeviceUuid = null;

const PROFILES = {
  STANDBY: { current: 0.08, pf: 0.65 },
  REFRIGERATOR: { current: 0.95, pf: 0.85 },
  AIR_CONDITIONER: { current: 5.1, pf: 0.94 },
  WATER_HEATER: { current: 11.2, pf: 0.99 },
};

function generateReading() {
  const vNoise = (Math.random() - 0.5) * 4.0;
  const voltage = +(CONFIG.nominalVoltage + vNoise).toFixed(1);
  const freq = +(CONFIG.nominalFrequency + (Math.random() - 0.5) * 0.1).toFixed(2);

  if (!relayState) {
    return {
      voltage,
      current: 0.0,
      power: 0.0,
      energy: +cumulativeEnergyKwh.toFixed(4),
      frequency: freq,
      power_factor: 0.0,
      relay_state: false,
      created_at: new Date().toISOString(),
    };
  }

  const profile = PROFILES[currentAppliance] || PROFILES.AIR_CONDITIONER;
  const cNoise = (Math.random() - 0.5) * 0.4;
  const current = +Math.max(0.01, profile.current + cNoise).toFixed(2);
  const powerFactor = +Math.min(1.0, Math.max(0.5, profile.pf + (Math.random() - 0.5) * 0.02)).toFixed(2);
  const power = +(voltage * current * powerFactor).toFixed(1);

  // kWh delta for the interval
  const kwhDelta = (power * (CONFIG.intervalMs / 3600000)) / 1000;
  cumulativeEnergyKwh += kwhDelta;

  return {
    voltage,
    current,
    power,
    energy: +cumulativeEnergyKwh.toFixed(4),
    frequency: freq,
    power_factor: powerFactor,
    relay_state: true,
    created_at: new Date().toISOString(),
  };
}

// Request helper
function makeRequest(url, options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

// Resolve device UUID from Supabase devices table
async function resolveOrCreateDeviceUuid() {
  if (resolvedDeviceUuid) return resolvedDeviceUuid;
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return null;

  try {
    const queryUrl = new URL(
      `/rest/v1/devices?device_id_str=eq.${encodeURIComponent(CONFIG.deviceId)}&select=id`,
      CONFIG.supabaseUrl
    );

    const res = await makeRequest(queryUrl, {
      method: 'GET',
      headers: {
        apikey: CONFIG.supabaseKey,
        Authorization: `Bearer ${CONFIG.supabaseKey}`,
      },
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const records = JSON.parse(res.body || '[]');
      if (records.length > 0) {
        resolvedDeviceUuid = records[0].id;
        return resolvedDeviceUuid;
      }
    }

    // If device row not present, insert it
    const insertUrl = new URL('/rest/v1/devices', CONFIG.supabaseUrl);
    const createRes = await makeRequest(
      insertUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CONFIG.supabaseKey,
          Authorization: `Bearer ${CONFIG.supabaseKey}`,
          Prefer: 'return=representation',
        },
      },
      JSON.stringify({
        device_id_str: CONFIG.deviceId,
        name: 'Main Smart Meter',
        relay_state: true,
        overload_limit_watts: 3000.0,
        tariff_rate_kwh: 12.0,
      })
    );

    if (createRes.statusCode >= 200 && createRes.statusCode < 300) {
      const created = JSON.parse(createRes.body || '[]');
      if (created.length > 0) {
        resolvedDeviceUuid = created[0].id;
        return resolvedDeviceUuid;
      }
    }
  } catch (e) {
    console.warn('  ↳ [Notice] Could not resolve device UUID in Supabase:', e.message);
  }

  return null;
}

async function sendToSupabase(payload) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    return false;
  }

  const deviceUuid = await resolveOrCreateDeviceUuid();
  const dbPayload = {
    ...payload,
    ...(deviceUuid ? { device_id: deviceUuid } : {}),
  };

  const endpoint = new URL('/rest/v1/energy_readings', CONFIG.supabaseUrl);
  const body = JSON.stringify(dbPayload);

  try {
    const res = await makeRequest(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CONFIG.supabaseKey,
          Authorization: `Bearer ${CONFIG.supabaseKey}`,
          Prefer: 'return=minimal',
        },
      },
      body
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return true;
    } else {
      console.error(`Supabase returned status ${res.statusCode}: ${res.body}`);
      return false;
    }
  } catch (err) {
    console.error('Network error posting to Supabase:', err.message);
    return false;
  }
}

console.log('='.repeat(65));
console.log('  ⚡ Simulated ESP32 + PZEM-004T v3.0 Feeder Initialized');
console.log(`  Device ID: ${CONFIG.deviceId}`);
console.log(`  Target: ${CONFIG.supabaseUrl ? CONFIG.supabaseUrl : 'Local Console Simulation (No Supabase URL set)'}`);
console.log(`  Sampling Rate: Every ${CONFIG.intervalMs / 1000}s`);
console.log('='.repeat(65));

setInterval(async () => {
  const reading = generateReading();
  const time = new Date().toLocaleTimeString();

  console.log(
    `[${time}] ${reading.voltage}V | ${reading.current}A | ${reading.power}W | PF: ${reading.power_factor} | ${reading.energy} kWh | Relay: ${reading.relay_state ? 'ON' : 'OFF'}`
  );

  if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
    const success = await sendToSupabase(reading);
    if (success) {
      process.stdout.write('  ↳ [Supabase Sync OK]\n');
    }
  }
}, CONFIG.intervalMs);
