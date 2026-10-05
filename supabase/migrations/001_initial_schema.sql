-- =========================================================================
-- Stage 3: Supabase Database Schema
-- Capstone: IoT Smart Meter with Load Control for Home Energy Management
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id_str VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'ESP32-PZEM-DEV-01'
    name VARCHAR(100) NOT NULL DEFAULT 'Main Smart Meter',
    mac_address VARCHAR(32) UNIQUE,
    relay_state BOOLEAN NOT NULL DEFAULT true,
    overload_limit_watts NUMERIC(8,2) NOT NULL DEFAULT 3000.00,
    tariff_rate_kwh NUMERIC(8,4) NOT NULL DEFAULT 12.0000, -- PHP / kWh
    currency_symbol VARCHAR(8) NOT NULL DEFAULT '₱',
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ENERGY READINGS (PZEM-004T Telemetry Logs)
CREATE TABLE IF NOT EXISTS public.energy_readings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    voltage NUMERIC(6,2) NOT NULL,        -- Volts (e.g., 220.5 V)
    current NUMERIC(6,3) NOT NULL,        -- Amperes (e.g., 4.523 A)
    power NUMERIC(8,2) NOT NULL,          -- Active Power in Watts (e.g., 985.4 W)
    energy NUMERIC(10,4) NOT NULL,        -- Cumulative Energy in kWh (e.g., 45.2104 kWh)
    frequency NUMERIC(5,2) NOT NULL,      -- Grid Frequency (e.g., 60.02 Hz)
    power_factor NUMERIC(4,2) NOT NULL,   -- Power Factor (0.00 to 1.00)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create performance indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_energy_readings_device_time 
    ON public.energy_readings (device_id, created_at DESC);

-- 3. LOAD SCHEDULES (Standby power reduction & automated cutoffs)
CREATE TABLE IF NOT EXISTS public.load_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('RELAY_ON', 'RELAY_OFF')),
    scheduled_time TIME NOT NULL, -- e.g., '23:00:00'
    days_of_week INT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon, 7=Sun
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ENERGY ALERTS & OVERLOAD LOGS
CREATE TABLE IF NOT EXISTS public.energy_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'OVERLOAD_CUTOFF', 'VOLTAGE_DIP', 'STANDBY_ALERT', 'BUDGET_EXCEEDED'
    message TEXT NOT NULL,
    power_at_trigger NUMERIC(8,2),
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FUNCTION: AGGREGATE HOURLY CONSUMPTION (Prevents transmitting 100k raw rows to mobile)
CREATE OR REPLACE FUNCTION get_hourly_energy_summary(
    p_device_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    hour_bucket TIMESTAMPTZ,
    avg_power NUMERIC,
    max_power NUMERIC,
    start_kwh NUMERIC,
    end_kwh NUMERIC,
    kwh_consumed NUMERIC
) LANGUAGE sql STABLE AS $$
    SELECT 
        date_trunc('hour', created_at) AS hour_bucket,
        ROUND(AVG(power), 2) AS avg_power,
        ROUND(MAX(power), 2) AS max_power,
        MIN(energy) AS start_kwh,
        MAX(energy) AS end_kwh,
        ROUND(GREATEST(0, MAX(energy) - MIN(energy)), 4) AS kwh_consumed
    FROM public.energy_readings
    WHERE device_id = p_device_id
      AND created_at >= p_start_time
      AND created_at <= p_end_time
    GROUP BY hour_bucket
    ORDER BY hour_bucket ASC;
$$;

-- 6. SEED INITIAL DEFAULT SMART METER DEVICE
INSERT INTO public.devices (device_id_str, name, mac_address, relay_state, overload_limit_watts, tariff_rate_kwh)
VALUES ('ESP32-PZEM-DEV-01', 'Smart Energy Meter #1', '24:6F:28:B4:7A:1C', true, 3000.0, 12.0)
ON CONFLICT (device_id_str) DO NOTHING;

-- 7. ENABLE ROW LEVEL SECURITY & REALTIME PUBLICATION
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write for IoT prototype development
CREATE POLICY "Allow anon access to devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to readings" ON public.energy_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to load_schedules" ON public.load_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to energy_alerts" ON public.energy_alerts FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime publication on devices & readings
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_alerts;
