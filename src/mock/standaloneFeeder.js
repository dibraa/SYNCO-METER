/**
 * Standalone Telemetry Feeder (Simulated ESP32 + PZEM-004T)
 * Can be run via: `node src/mock/standaloneFeeder.js`
 * 
 * Supports:
 * 1. Console stream mode (local debugging)
 * 2. Supabase ingestion mode (pushes directly to Supabase REST endpoint if configured)
 */

const https = require('https');

// Default Config
const CONFIG = {
  deviceId: process.env.DEVICE_ID || 'ESP32-PZEM-01',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || '',
  intervalMs: 2000,
  nominalVoltage: 220.0,
  nominalFrequency: 60.0,
};

let cumulativeEnergyKwh = 15.42;
let relayState = true;
let currentAppliance = 'AIR_CONDITIONER'; // 'STANDBY', 'REFRIGERATOR', 'AIR_CONDITIONER', 'WATER_HEATER'

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
      device_id: CONFIG.deviceId,
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
    device_id: CONFIG.deviceId,
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

async function sendToSupabase(payload) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    return false;
  }

  const endpoint = new URL('/rest/v1/energy_readings', CONFIG.supabaseUrl);
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.supabaseKey,
          'Authorization': `Bearer ${CONFIG.supabaseKey}`,
          'Prefer': 'return=minimal',
        },
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          console.error(`Supabase returned status ${res.statusCode}`);
          resolve(false);
        }
      }
    );

    req.on('error', (err) => {
      console.error('Network error posting to Supabase:', err.message);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
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
