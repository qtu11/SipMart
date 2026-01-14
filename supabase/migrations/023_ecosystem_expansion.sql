-- SipSmart Database Schema Extension for Green Mobility & IoT
-- Created at: 2026-01-14

-- 1. GREEN MOBILITY MODULE
-- Vehicles (Bus điện, Xe đạp điện)
CREATE TABLE IF NOT EXISTS transport_vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('ebus', 'ebike')),
    partner_id UUID REFERENCES partners_v2(partner_id), -- Owner of the vehicle
    code VARCHAR(50) UNIQUE NOT NULL,
    qr_code VARCHAR(255) UNIQUE,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    battery_level INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, in_use, charging
    last_maintenance TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Trips
CREATE TABLE IF NOT EXISTS transport_trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    vehicle_id UUID REFERENCES transport_vehicles(vehicle_id),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    distance_km NUMERIC(10,2) DEFAULT 0,
    fare_amount NUMERIC(10,2) DEFAULT 0,
    commission_amount NUMERIC(10,2) DEFAULT 0, -- 0.2% fee
    co2_saved_kg NUMERIC(10,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ongoing', -- ongoing, completed, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending' -- pending, paid, failed
);

-- 2. RESOURCE EFFICIENCY MODULE
-- Smart Devices (Hand dryer, Solar station)
CREATE TABLE IF NOT EXISTS smart_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('hand_dryer', 'charging_station', 'cup_dispenser', 'solar_kiosk')),
    name VARCHAR(100),
    location_id UUID REFERENCES partner_branches(branch_id), -- Linked to partner branch
    qr_code VARCHAR(255) UNIQUE,
    energy_source VARCHAR(20) DEFAULT 'grid', -- grid, solar
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Usage Logs
CREATE TABLE IF NOT EXISTS device_usage_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES smart_devices(device_id),
    user_id UUID REFERENCES users(user_id),
    used_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER,
    energy_consumed_kwh NUMERIC(10,4),
    resource_saved_type VARCHAR(50), -- paper_towel, plastic_cup, fuel
    resource_saved_amount NUMERIC(10,2),
    eco_points_earned INTEGER DEFAULT 0
);

-- 3. CARBON CALCULATOR CONSTANTS
CREATE TABLE IF NOT EXISTS eco_impact_factors (
    factor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) UNIQUE NOT NULL, -- ebus_km, ebike_km, hand_dryer_use, cup_reuse
    co2_saved_kg_per_unit NUMERIC(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- km, use, minute
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial factors
INSERT INTO eco_impact_factors (action_type, co2_saved_kg_per_unit, unit, description) VALUES
('ebus_km', 0.1200, 'km', 'Đi xe bus điện thay vì xe máy/oto cá nhân'),
('ebike_km', 0.1500, 'km', 'Đi xe đạp điện thay vì xe máy'),
('hand_dryer_use', 0.0050, 'use', 'Dùng máy sấy tay thay khăn giấy'),
('cup_reuse', 0.0200, 'use', 'Dùng ly bộ lọc thay ly nhựa'),
('solar_charge', 0.5000, 'kwh', 'Sạc bằng năng lượng mặt trời')
ON CONFLICT (action_type) DO UPDATE 
SET co2_saved_kg_per_unit = EXCLUDED.co2_saved_kg_per_unit;

-- 4. RLS POLICIES
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_usage_logs ENABLE ROW LEVEL SECURITY;

-- Public read for vehicles and devices
CREATE POLICY "Public vehicles are viewable" ON transport_vehicles FOR SELECT USING (true);
CREATE POLICY "Public devices are viewable" ON smart_devices FOR SELECT USING (true);

-- Users can view their own trips and usage
CREATE POLICY "Users can view own trips" ON transport_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON device_usage_logs FOR SELECT USING (auth.uid() = user_id);

-- 5. FUNCTION TO CALCULATE TRIP FARE
CREATE OR REPLACE FUNCTION calculate_transport_fare(distance_km NUMERIC, vehicle_type VARCHAR) 
RETURNS TABLE (fare NUMERIC, commission NUMERIC) AS $$
DECLARE
    base_fare NUMERIC;
BEGIN
    IF vehicle_type = 'ebus' THEN
        IF distance_km <= 50 THEN base_fare := 10000;
        ELSIF distance_km <= 80 THEN base_fare := 30000;
        ELSE base_fare := 50000;
        END IF;
    ELSIF vehicle_type = 'ebike' THEN
        -- 10k per hour -> converted to approx km/h (avg 15km/h) => ~700d/km
        base_fare := CEIL(distance_km * 700); 
    ELSE
        base_fare := 0;
    END IF;

    RETURN QUERY SELECT 
        base_fare, 
        base_fare * 0.002; -- 0.2% commission
END;
$$ LANGUAGE plpgsql;

