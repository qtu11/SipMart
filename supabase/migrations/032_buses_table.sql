-- Create buses table for bus QR codes
CREATE TABLE IF NOT EXISTS buses (
    bus_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_code text NOT NULL,
    route_name text NOT NULL,
    vehicle_number text,
    qr_data text NOT NULL,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_buses_route_code ON buses(route_code);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);

-- RLS policies
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Allow read buses" ON buses
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow all for service role
CREATE POLICY "Allow all for service role" ON buses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
