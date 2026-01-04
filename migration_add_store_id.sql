-- Add store_id column to cups table
ALTER TABLE cups 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(store_id);

-- Create an index for faster lookups by store
CREATE INDEX IF NOT EXISTS idx_cups_store_id ON cups(store_id);

-- Optional: Update existing cups to have a default store (e.g. if you know the UUID of 'Kho A')
-- UPDATE cups SET store_id = 'UUID_OF_STORE' WHERE store_id IS NULL;
