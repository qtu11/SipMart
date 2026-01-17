-- =====================================================
-- SipSmart Green Mobility Ecosystem
-- Migration 027: Green Mobility Tables
-- =====================================================

-- Green Mobility Trips (Bus, Metro, e-Bike)
CREATE TABLE IF NOT EXISTS green_mobility_trips (
  trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('bus', 'metro', 'ebike')),
  transport_partner_id UUID REFERENCES stores(store_id), -- Reuse stores table for transport partners
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  distance_km NUMERIC(10,2),
  fare NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) DEFAULT 0, -- 0.1% SipSmart fee
  partner_amount NUMERIC(10,2) DEFAULT 0, -- 99.9% partner revenue
  co2_saved_kg NUMERIC(10,3) DEFAULT 0, -- Calculated CO2 savings
  vnes_points_earned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled')),
  route_info JSONB, -- JSON: { from, to, route_name, vehicle_number }
  metadata JSONB, -- Additional data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON green_mobility_trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_partner_time ON green_mobility_trips(transport_partner_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_trips_created ON green_mobility_trips(created_at DESC);

-- e-Bike Stations
CREATE TABLE IF NOT EXISTS ebike_stations (
  station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  gps_lat NUMERIC(10,8) NOT NULL,
  gps_lng NUMERIC(10,8) NOT NULL,
  total_slots INTEGER DEFAULT 10,
  available_bikes INTEGER DEFAULT 0,
  charging_bikes INTEGER DEFAULT 0,
  maintenance_bikes INTEGER DEFAULT 0,
  solar_capacity_kw NUMERIC(10,2) DEFAULT 0, -- Solar panel capacity
  current_energy_production_kw NUMERIC(10,2) DEFAULT 0, -- Real-time solar output
  total_energy_generated_kwh NUMERIC(12,2) DEFAULT 0, -- Cumulative
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for GPS queries
CREATE INDEX IF NOT EXISTS idx_stations_location ON ebike_stations(gps_lat, gps_lng) WHERE is_active = true;

-- e-Bike Inventory
CREATE TABLE IF NOT EXISTS ebikes (
  bike_id TEXT PRIMARY KEY, -- QR code ID (e.g., "BIKE-001")
  current_station_id UUID REFERENCES ebike_stations(station_id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'charging', 'maintenance', 'lost')),
  battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  gps_lat NUMERIC(10,8),
  gps_lng NUMERIC(10,8),
  last_gps_update TIMESTAMPTZ,
  total_distance_km NUMERIC(10,2) DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  current_rental_id UUID,
  current_user_id UUID REFERENCES users(user_id),
  iot_device_id TEXT, -- Smart lock device ID
  last_maintenance_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebikes_station_status ON ebikes(current_station_id, status);
CREATE INDEX IF NOT EXISTS idx_ebikes_gps ON ebikes(gps_lat, gps_lng) WHERE status = 'in_use';
CREATE INDEX IF NOT EXISTS idx_ebikes_user ON ebikes(current_user_id) WHERE current_user_id IS NOT NULL;

-- e-Bike Rentals
CREATE TABLE IF NOT EXISTS ebike_rentals (
  rental_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  bike_id TEXT NOT NULL REFERENCES ebikes(bike_id),
  start_station_id UUID NOT NULL REFERENCES ebike_stations(station_id),
  end_station_id UUID REFERENCES ebike_stations(station_id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_hours NUMERIC(10,2),
  planned_duration_hours NUMERIC(10,2), -- User selected plan (1h, 3h, 5h, 24h)
  fare NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  partner_amount NUMERIC(10,2) DEFAULT 0,
  distance_km NUMERIC(10,2) DEFAULT 0,
  co2_saved_kg NUMERIC(10,3) DEFAULT 0,
  vnes_points_earned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled', 'violation')),
  violation_reason TEXT,
  is_returned_at_station BOOLEAN DEFAULT false,
  gps_route JSONB, -- Array of GPS points during trip
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rentals_user_status ON ebike_rentals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rentals_bike_time ON ebike_rentals(bike_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_rentals_active ON ebike_rentals(status) WHERE status = 'ongoing';

-- Extend stores table for transport partners
ALTER TABLE stores ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'retail' 
  CHECK (partner_type IN ('retail', 'transport', 'ebike_station'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS transport_revenue NUMERIC(12,2) DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS total_co2_saved_kg NUMERIC(12,3) DEFAULT 0;

COMMENT ON TABLE green_mobility_trips IS 'Tracks all green transportation trips (bus, metro, ebike)';
COMMENT ON TABLE ebike_stations IS 'Physical stations where bikes are parked and charged';
COMMENT ON TABLE ebikes IS 'Individual bike inventory with IoT tracking';
COMMENT ON TABLE ebike_rentals IS 'Rental transactions for e-bikes';
