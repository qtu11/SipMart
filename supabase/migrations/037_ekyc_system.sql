-- =====================================================
-- Migration: 037_ekyc_system.sql
-- eKYC / Identity Verification System
-- =====================================================

-- STEP 1: Update users table - Add KYC columns
DO $$
BEGIN
    -- Add kyc_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kyc_verified') THEN
        ALTER TABLE public.users ADD COLUMN kyc_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add kyc_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE public.users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'none';
    END IF;
    
    -- Add role column for admin check
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- STEP 2: Create user_kyc table
CREATE TABLE IF NOT EXISTS user_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity Information (extracted from OCR)
    id_number VARCHAR(20),
    full_name VARCHAR(255),
    dob DATE,
    gender VARCHAR(10),
    nationality VARCHAR(50) DEFAULT 'Việt Nam',
    place_of_origin TEXT,
    place_of_residence TEXT,
    
    -- Document Images (paths in Supabase Storage)
    front_img_path TEXT,
    back_img_path TEXT,
    selfie_img_path TEXT,
    
    -- Verification Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    
    -- OCR Data
    ocr_front_data JSONB,
    ocr_back_data JSONB,
    ocr_confidence DECIMAL(5,2),
    
    -- Timestamps
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_kyc_user_id ON user_kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_status ON user_kyc(status);

-- STEP 3: Enable RLS
ALTER TABLE user_kyc ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create helper function to check if user is admin (by email only - no role column dependency)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the current user's email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Check if email is in admin whitelist
    RETURN user_email IN ('qtusadmin@gmail.com', 'qtusdev@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 5: RLS Policies for user_kyc

-- Policy 1: Users can view their own KYC record
DROP POLICY IF EXISTS "Users can view own kyc" ON user_kyc;
CREATE POLICY "Users can view own kyc" ON user_kyc 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own KYC record
DROP POLICY IF EXISTS "Users can insert own kyc" ON user_kyc;
CREATE POLICY "Users can insert own kyc" ON user_kyc 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update only draft or rejected KYC
DROP POLICY IF EXISTS "Users can update draft kyc" ON user_kyc;
CREATE POLICY "Users can update draft kyc" ON user_kyc
    FOR UPDATE
    USING (auth.uid() = user_id AND status IN ('draft', 'rejected'))
    WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'rejected', 'pending'));

-- Policy 4: Admin can view all KYC records (using email check function)
DROP POLICY IF EXISTS "Admin can view all kyc" ON user_kyc;
CREATE POLICY "Admin can view all kyc" ON user_kyc
    FOR SELECT
    USING (is_admin_user());

-- Policy 5: Admin can update any KYC record (for approval)
DROP POLICY IF EXISTS "Admin can update any kyc" ON user_kyc;
CREATE POLICY "Admin can update any kyc" ON user_kyc
    FOR UPDATE
    USING (is_admin_user());

-- STEP 6: Triggers & Functions

-- Function: Sync KYC status to users table
CREATE OR REPLACE FUNCTION sync_kyc_status_to_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET 
        kyc_verified = (NEW.status = 'verified'),
        kyc_status = NEW.status,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-sync KYC status
DROP TRIGGER IF EXISTS trigger_sync_kyc_status ON user_kyc;
CREATE TRIGGER trigger_sync_kyc_status
    AFTER INSERT OR UPDATE OF status ON user_kyc
    FOR EACH ROW
    EXECUTE FUNCTION sync_kyc_status_to_user();

-- Function & Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kyc_updated_at ON user_kyc;
CREATE TRIGGER trigger_update_kyc_updated_at
    BEFORE UPDATE ON user_kyc
    FOR EACH ROW
    EXECUTE FUNCTION update_kyc_updated_at();

-- STEP 7: Storage Bucket Configuration

-- Create bucket 'kyc-documents' (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies to avoid duplicates
DROP POLICY IF EXISTS "Users can upload kyc docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own kyc docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own kyc docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own kyc docs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view all kyc docs" ON storage.objects;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload kyc docs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can view their own files
CREATE POLICY "Users can view own kyc docs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can update their own files
CREATE POLICY "Users can update own kyc docs" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own kyc docs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Admin can view all KYC documents
CREATE POLICY "Admin can view all kyc docs" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'kyc-documents'
        AND is_admin_user()
    );
