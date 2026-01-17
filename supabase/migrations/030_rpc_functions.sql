-- =====================================================
-- SipSmart RPC Functions for Green Ecosystem
-- Migration 030: Stored Procedures
-- =====================================================

-- ==================================================
-- 1. GREEN MOBILITY PAYMENT (Bus/Metro)
-- ==================================================
CREATE OR REPLACE FUNCTION process_green_mobility_payment(
  p_user_id UUID,
  p_partner_id UUID,
  p_trip_type TEXT,
  p_fare NUMERIC,
  p_distance_km NUMERIC,
  p_route_info JSONB
) RETURNS TABLE(
  trip_id UUID,
  new_balance NUMERIC,
  vnes_points INTEGER,
  co2_saved NUMERIC
) AS $$
DECLARE
  v_trip_id UUID;
  v_new_balance NUMERIC;
  v_commission NUMERIC;
  v_partner_revenue NUMERIC;
  v_co2_saved NUMERIC;
  v_vnes_points INTEGER;
  v_commission_rate NUMERIC;
BEGIN
  -- 1. Get commission rate from settings
  SELECT (value->>'rate')::NUMERIC INTO v_commission_rate
  FROM system_settings WHERE key = 'commission_rate';
  
  -- 2. Calculate split payment
  v_commission := p_fare * v_commission_rate; -- 0.1%
  v_partner_revenue := p_fare - v_commission; -- 99.9%
  
  -- 3. Calculate CO2 savings (Bus/Metro vs motorbike: 0.12kg/km)
  v_co2_saved := p_distance_km * 0.12;
  
  -- 4. Calculate VNES points (1km = 10 points)
  v_vnes_points := FLOOR(p_distance_km * 10)::INTEGER;
  
  -- 5. Deduct from user wallet
  UPDATE users
  SET 
    wallet_balance = wallet_balance - p_fare,
    green_points = green_points + v_vnes_points,
    total_plastic_reduced = total_plastic_reduced + v_co2_saved,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;
  
  -- Check if update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- 6. Add to partner revenue
  UPDATE stores
  SET 
    transport_revenue = COALESCE(transport_revenue, 0) + v_partner_revenue,
    total_co2_saved_kg = COALESCE(total_co2_saved_kg, 0) + v_co2_saved,
    updated_at = NOW()
  WHERE store_id = p_partner_id;
  
  -- 7. Create trip record
  INSERT INTO green_mobility_trips (
    user_id, transport_partner_id, trip_type, fare,
    commission_amount, partner_amount, distance_km,
    co2_saved_kg, vnes_points_earned, status,
    route_info, end_time
  ) VALUES (
    p_user_id, p_partner_id, p_trip_type, p_fare,
    v_commission, v_partner_revenue, p_distance_km,
    v_co2_saved, v_vnes_points, 'completed',
    p_route_info, NOW()
  ) RETURNING green_mobility_trips.trip_id INTO v_trip_id;
  
  -- 8. Create audit log
  INSERT INTO audit_logs (actor_id, actor_type, action, resource_type, resource_id, metadata)
  VALUES (
    p_user_id, 'user', 'green_mobility_payment', 'trip', v_trip_id,
    jsonb_build_object(
      'trip_type', p_trip_type,
      'fare', p_fare,
      'commission', v_commission,
      'co2_saved', v_co2_saved
    )
  );
  
  -- 9. Return results
  RETURN QUERY SELECT v_trip_id, v_new_balance, v_vnes_points, v_co2_saved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 2. E-BIKE UNLOCK
-- ==================================================
CREATE OR REPLACE FUNCTION unlock_ebike(
  p_user_id UUID,
  p_bike_id TEXT,
  p_station_id UUID,
  p_planned_duration_hours NUMERIC  
) RETURNS TABLE(
  rental_id UUID,
  fare NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_rental_id UUID;
  v_fare NUMERIC;
  v_user_verified BOOLEAN;
  v_bike_status TEXT;
  v_pricing JSONB;
BEGIN
  -- 1. Check eKYC verification
  SELECT ekyc_verified INTO v_user_verified
  FROM users WHERE user_id = p_user_id;
  
  IF NOT v_user_verified THEN
    RAISE EXCEPTION 'eKYC verification required for e-bike rental';
  END IF;
  
  -- 2. Check bike availability
  SELECT status INTO v_bike_status
  FROM ebikes WHERE bike_id = p_bike_id FOR UPDATE;
  
  IF v_bike_status != 'available' THEN
    RAISE EXCEPTION 'Bike is not available (status: %)', v_bike_status;
  END IF;
  
  -- 3. Get pricing
  SELECT value INTO v_pricing
  FROM system_settings WHERE key = 'ebike_pricing';
  
  -- 4. Calculate fare based on plan
  IF p_planned_duration_hours <= 1 THEN
    v_fare := (v_pricing->>'1h')::NUMERIC;
  ELSIF p_planned_duration_hours <= 3 THEN
    v_fare := (v_pricing->>'3h')::NUMERIC;
  ELSIF p_planned_duration_hours <= 5 THEN
    v_fare := (v_pricing->>'5h')::NUMERIC;
  ELSE
    v_fare := (v_pricing->>'24h')::NUMERIC;
  END IF;
  
  -- 5. Check wallet balance
  IF (SELECT wallet_balance FROM users WHERE user_id = p_user_id) < v_fare THEN
    RAISE EXCEPTION 'Insufficient balance. Required: % VND', v_fare;
  END IF;
  
  -- 6. Create rental record
  INSERT INTO ebike_rentals (
    user_id, bike_id, start_station_id,
    planned_duration_hours, fare, status
  ) VALUES (
    p_user_id, p_bike_id, p_station_id,
    p_planned_duration_hours, v_fare, 'ongoing'
  ) RETURNING ebike_rentals.rental_id INTO v_rental_id;
  
  -- 7. Update bike status
  UPDATE ebikes
  SET 
    status = 'in_use',
    current_rental_id = v_rental_id,
    current_user_id = p_user_id,
    updated_at = NOW()
  WHERE bike_id = p_bike_id;
  
  -- 8. Update station availability
  UPDATE ebike_stations
  SET 
    available_bikes = available_bikes - 1,
    updated_at = NOW()
  WHERE station_id = p_station_id;
  
  -- Return success
  RETURN QUERY SELECT 
    v_rental_id, 
    v_fare,
    'Bike unlocked successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 3. E-BIKE RETURN & PAYMENT
-- ==================================================
CREATE OR REPLACE FUNCTION return_ebike(
  p_rental_id UUID,
  p_end_station_id UUID,
  p_distance_km NUMERIC
) RETURNS TABLE(
  payment_amount NUMERIC,
  commission_amount NUMERIC,
  co2_saved NUMERIC,
  vnes_points INTEGER,
  message TEXT
) AS $$
DECLARE
  v_rental RECORD;
  v_duration_hours NUMERIC;
  v_actual_fare NUMERIC;
  v_commission NUMERIC;
  v_partner_revenue NUMERIC;
  v_co2_saved NUMERIC;
  v_vnes_points INTEGER;
  v_commission_rate NUMERIC;
BEGIN
  -- 1. Get rental details
  SELECT * INTO v_rental
  FROM ebike_rentals
  WHERE rental_id = p_rental_id AND status = 'ongoing'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found or already completed';
  END IF;
  
  -- 2. Calculate duration
  v_duration_hours := EXTRACT(EPOCH FROM (NOW() - v_rental.start_time)) / 3600;
  
  -- 3. Use planned fare (already paid)
  v_actual_fare := v_rental.fare;
  
  -- 4. Get commission rate
  SELECT (value->>'rate')::NUMERIC INTO v_commission_rate
  FROM system_settings WHERE key = 'commission_rate';
  
  v_commission := v_actual_fare * v_commission_rate;
  v_partner_revenue := v_actual_fare - v_commission;
  
  -- 5. Calculate CO2 savings (e-bike vs motorbike: 0.12kg/km)
  v_co2_saved := p_distance_km * 0.12;
  v_vnes_points := FLOOR(p_distance_km * 10)::INTEGER;
  
  -- 6. Deduct payment from user
  UPDATE users
  SET 
    wallet_balance = wallet_balance - v_actual_fare,
    green_points = green_points + v_vnes_points,
    total_plastic_reduced = total_plastic_reduced + v_co2_saved,
    updated_at = NOW()
  WHERE user_id = v_rental.user_id;
  
  -- 7. Add to partner revenue (station)
  UPDATE stores
  SET 
    transport_revenue = COALESCE(transport_revenue, 0) + v_partner_revenue,
    total_co2_saved_kg = COALESCE(total_co2_saved_kg, 0) + v_co2_saved,
    updated_at = NOW()
  WHERE store_id = p_end_station_id;
  
  -- 8. Complete rental
  UPDATE ebike_rentals
  SET 
    end_station_id = p_end_station_id,
    end_time = NOW(),
    duration_hours = v_duration_hours,
    distance_km = p_distance_km,
    commission_amount = v_commission,
    partner_amount = v_partner_revenue,
    co2_saved_kg = v_co2_saved,
    vnes_points_earned = v_vnes_points,
    status = 'completed',
    is_returned_at_station = true,
    updated_at = NOW()
  WHERE rental_id = p_rental_id;
  
  -- 9. Update bike
  UPDATE ebikes
  SET 
    status = 'charging',
    current_station_id = p_end_station_id,
    current_rental_id = NULL,
    current_user_id = NULL,
    total_distance_km = total_distance_km + p_distance_km,
    total_uses = total_uses + 1,
    updated_at = NOW()
  WHERE bike_id = v_rental.bike_id;
  
  -- 10. Update station
  UPDATE ebike_stations
  SET 
    available_bikes = available_bikes - 1,
    charging_bikes = charging_bikes + 1,
    updated_at = NOW()
  WHERE station_id = p_end_station_id;
  
  -- Return results
  RETURN QUERY SELECT 
    v_actual_fare,
    v_commission,
    v_co2_saved,
    v_vnes_points,
    format('Trip completed! Distance: %s km, CO2 saved: %s kg, +%s VNES points', 
      p_distance_km, v_co2_saved, v_vnes_points)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 4. UPDATE GREEN CREDIT SCORE
-- ==================================================
CREATE OR REPLACE FUNCTION update_green_credit_score(
  p_user_id UUID,
  p_action TEXT,
  p_score_change INTEGER,
  p_reason TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_old_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Get current score
  SELECT green_credit_score INTO v_old_score
  FROM users WHERE user_id = p_user_id;
  
  -- Calculate new score (min 0, max 1000)
  v_new_score := LEAST(1000, GREATEST(0, v_old_score + p_score_change));
  
  -- Update user score
  UPDATE users
  SET 
    green_credit_score = v_new_score,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the change
  INSERT INTO green_credit_history (
    user_id, action, score_change, old_score, new_score,
    reason, related_resource_type, related_resource_id
  ) VALUES (
    p_user_id, p_action, p_score_change, v_old_score, v_new_score,
    p_reason, p_resource_type, p_resource_id
  );
  
  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_green_mobility_payment IS 'Handles bus/metro payment with 99.9% split';
COMMENT ON FUNCTION unlock_ebike IS 'Unlocks e-bike and creates rental record with eKYC check';
COMMENT ON FUNCTION return_ebike IS 'Completes e-bike rental and processes payment';
COMMENT ON FUNCTION update_green_credit_score IS 'Updates user green credit score and logs change';
