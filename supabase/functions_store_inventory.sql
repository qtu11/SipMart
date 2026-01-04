-- ============================================
-- SUPABASE FUNCTIONS FOR STORE INVENTORY
-- ============================================

-- Function to increment store inventory when adding cups
CREATE OR REPLACE FUNCTION increment_store_inventory(
  p_store_id UUID,
  p_total INTEGER,
  p_available INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET 
    cup_total = cup_total + p_total,
    cup_available = cup_available + COALESCE(p_available, p_total)
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement store inventory when removing cups
CREATE OR REPLACE FUNCTION decrement_store_inventory(
  p_store_id UUID,
  p_total INTEGER,
  p_available INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET 
    cup_total = GREATEST(0, cup_total - p_total),
    cup_available = GREATEST(0, cup_available - COALESCE(p_available, p_total))
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update cup status counts in store
CREATE OR REPLACE FUNCTION update_store_cup_status(
  p_store_id UUID,
  p_status_field TEXT,
  p_increment INTEGER
)
RETURNS VOID AS $$
BEGIN
  CASE p_status_field
    WHEN 'available' THEN
      UPDATE stores SET cup_available = cup_available + p_increment WHERE store_id = p_store_id;
    WHEN 'in_use' THEN
      UPDATE stores SET cup_in_use = cup_in_use + p_increment WHERE store_id = p_store_id;
    WHEN 'cleaning' THEN
      UPDATE stores SET cup_cleaning = cup_cleaning + p_increment WHERE store_id = p_store_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Store inventory functions created successfully! ✅' AS status;
