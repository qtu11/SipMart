-- =====================================================
-- SipSmart eKYC & Green Credit System
-- Migration 028: eKYC Verification Tables
-- =====================================================

-- eKYC Verifications
CREATE TABLE IF NOT EXISTS ekyc_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- ID Card Information
  id_card_number TEXT,
  full_name TEXT,
  date_of_birth DATE,
  address TEXT,
  id_card_issue_date DATE,
  id_card_issue_place TEXT,
  
  -- Document Images (Supabase Storage paths)
  front_image_url TEXT,
  back_image_url TEXT,
  face_image_url TEXT,
  liveness_video_url TEXT,
  
  -- Verification Status
  verification_status TEXT DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired', 'under_review')),
  
  -- AI Verification
  ai_match_score NUMERIC(5,2) CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  ai_verification_data JSONB, -- Detailed AI response
  
  -- Admin Review
  admin_reviewed_by UUID REFERENCES users(user_id),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  
  -- Validity
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- eKYC validity (6 months - 1 year)
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ekyc_status ON ekyc_verifications(verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ekyc_user ON ekyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ekyc_pending ON ekyc_verifications(verification_status) WHERE verification_status = 'pending';

-- Extend users table for Green Credit Score & eKYC
ALTER TABLE users ADD COLUMN IF NOT EXISTS green_credit_score INTEGER DEFAULT 100 
  CHECK (green_credit_score >= 0 AND green_credit_score <= 1000);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ekyc_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ekyc_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ekyc_expires_at TIMESTAMPTZ;

-- eKYC Verification Logs
CREATE TABLE IF NOT EXISTS ekyc_verification_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES ekyc_verifications(verification_id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'submitted', 'ai_verified', 'admin_approved', 'rejected', 'expired'
  actor_id UUID REFERENCES users(user_id),
  actor_type TEXT, -- 'user', 'admin', 'system'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ekyc_logs_verification ON ekyc_verification_logs(verification_id, created_at DESC);

-- Green Credit Score History
CREATE TABLE IF NOT EXISTS green_credit_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'trip_completed', 'violation', 'late_return', 'damage_reported'
  score_change INTEGER NOT NULL,
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  reason TEXT,
  related_resource_type TEXT, -- 'ebike_rental', 'transaction', 'report'
  related_resource_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_history_user ON green_credit_history(user_id, created_at DESC);

-- Trigger to update users.updated_at on eKYC status change
CREATE OR REPLACE FUNCTION update_user_ekyc_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'approved' AND OLD.verification_status != 'approved' THEN
    UPDATE users
    SET 
      ekyc_verified = true,
      ekyc_verified_at = NEW.verified_at,
      ekyc_expires_at = NEW.expires_at,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.verification_status IN ('rejected', 'expired') THEN
    UPDATE users
    SET 
      ekyc_verified = false,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_ekyc
  AFTER UPDATE OF verification_status ON ekyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ekyc_status();

COMMENT ON TABLE ekyc_verifications IS 'User identity verification records with AI matching';
COMMENT ON TABLE green_credit_history IS 'Tracks user green credit score changes';
COMMENT ON COLUMN users.green_credit_score IS 'User trust score (0-1000), affects rental privileges';
