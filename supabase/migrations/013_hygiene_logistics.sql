-- Migration: 013_hygiene_logistics.sql
-- Description: Setup tables for Hygiene & Logistics module AND Fix Admins table

-- 0. Fix Admins Table (Add user_id to link with Supabase Auth)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- Auto-link existing admins to auth users if email matches
DO $$
BEGIN
    UPDATE admins
    SET user_id = au.id
    FROM auth.users au
    WHERE admins.email = au.email
    AND admins.user_id IS NULL;
END $$;

-- 1. Cleaning Hubs (Trạm rửa)
CREATE TABLE IF NOT EXISTS cleaning_hubs (
  hub_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER DEFAULT 100, -- Năng suất rửa (ly/giờ)
  current_load INTEGER DEFAULT 0, -- Số ly đang đợi rửa
  status TEXT CHECK (status IN ('active', 'maintenance', 'closed')) DEFAULT 'active',
  manager_id UUID REFERENCES admins(admin_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cleaning Sessions (Phiên rửa)
CREATE TABLE IF NOT EXISTS cleaning_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hub_id UUID REFERENCES cleaning_hubs(hub_id),
  cup_count INTEGER NOT NULL CHECK (cup_count > 0),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  staff_id UUID REFERENCES admins(admin_id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT
);

-- 3. Update Cups Table (Lifecycle)
ALTER TABLE cups 
ADD COLUMN IF NOT EXISTS total_uses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS last_cleaned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manufacture_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS cleaning_hub_id UUID REFERENCES cleaning_hubs(hub_id);

-- 4. Redistribution Orders (Điều chuyển ly giữa các kho/trạm)
CREATE TABLE IF NOT EXISTS redistribution_orders (
  order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_store_id UUID REFERENCES stores(store_id),
  to_store_id UUID REFERENCES stores(store_id),
  cup_count INTEGER NOT NULL CHECK (cup_count > 0),
  status TEXT CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes TEXT,
  created_by UUID REFERENCES admins(admin_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Store Cup Alerts (Cảnh báo kho)
CREATE TABLE IF NOT EXISTS store_cup_alerts (
  alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(store_id),
  alert_type TEXT CHECK (alert_type IN ('low_stock', 'excess_stock')),
  current_count INTEGER,
  threshold INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- RLS Policies
-- Enable RLS
ALTER TABLE cleaning_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redistribution_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_cup_alerts ENABLE ROW LEVEL SECURITY;

-- Admins full access policies
-- Note: We now use user_id to check admin status if possible, or link via admins table
-- Since we added user_id to admins, we can use that for policy checks more reliably.

CREATE POLICY "Admins full access cleaning_hubs" ON cleaning_hubs FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) 
  OR 
  EXISTS (SELECT 1 FROM admins WHERE admin_id::text = auth.uid()::text) -- Fallback if auth.uid is admin_id (legacy)
);

CREATE POLICY "Admins full access cleaning_sessions" ON cleaning_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins full access redistribution_orders" ON redistribution_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins full access store_cup_alerts" ON store_cup_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);
