-- Migration to add mandatory fields and profile visibility
DO $$
BEGIN
    -- 1. Họ và tên
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
    END IF;

    -- 2. Số điện thoại
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
        ALTER TABLE users ADD COLUMN phone_number VARCHAR(15);
    END IF;

    -- 3. Địa chỉ chi tiết
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;

    -- 4. Tỉnh/Thành phố
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'province') THEN
        ALTER TABLE users ADD COLUMN province TEXT;
    END IF;

    -- 5. Ngày tham gia (created_at đã có trong bảng users, ta check để chắc chắn)
    -- IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
    --    ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    -- END IF;
    
    -- 6. Cờ hiển thị hồ sơ công khai (Profile Visibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_profile_public') THEN
        ALTER TABLE users ADD COLUMN is_profile_public BOOLEAN DEFAULT TRUE;
    END IF;

END $$;
