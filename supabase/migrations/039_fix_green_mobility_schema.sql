-- Fix numeric overflow for coordinates (Longitude > 100 needs more than 2 digits before decimal)
ALTER TABLE ebike_stations ALTER COLUMN gps_lat TYPE NUMERIC(12,8);
ALTER TABLE ebike_stations ALTER COLUMN gps_lng TYPE NUMERIC(12,8);

-- Add bike_code to ebikes table as it was missing
ALTER TABLE ebikes ADD COLUMN IF NOT EXISTS bike_code TEXT;

-- Also check store coordinates just in case
ALTER TABLE stores ALTER COLUMN gps_lat TYPE NUMERIC(12,8);
ALTER TABLE stores ALTER COLUMN gps_lng TYPE NUMERIC(12,8);

-- Ensure we can store larger values for future use
ALTER TABLE ebikes ALTER COLUMN gps_lat TYPE NUMERIC(12,8);
ALTER TABLE ebikes ALTER COLUMN gps_lng TYPE NUMERIC(12,8);
