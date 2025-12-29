# 🔐 Fix Admin Login Issue

## Vấn đề
- Không đăng nhập được vào admin
- Lỗi infinite recursion trong admins table policy

## Giải pháp

### Bước 1: Fix RLS Policies (Fix infinite recursion)

Chạy file SQL trong Supabase SQL Editor:

**Option 1: Nếu schema đã có, chỉ cần fix RLS:**
```sql
-- Chạy file: supabase/fix_rls_complete.sql
```

**Option 2: Nếu cần tạo lại toàn bộ schema:**
```sql
-- Chạy file: supabase/complete_schema_fixed.sql
```

### Bước 2: Tạo Admin User trong Supabase Auth

1. Vào Supabase Dashboard: https://supabase.com/dashboard/project/hxgmiwywovbbnzcpdhjg
2. Vào **Authentication** > **Users**
3. Click **Add user** > **Create new user**
4. Điền thông tin:
   - **Email:** `qtusadmin@gmail.com` (hoặc email trong ADMIN_KEY)
   - **Password:** `qtusdev` (hoặc password trong ADMIN_PASSWORD)
   - **Auto Confirm User:** ✅ Bật (quan trọng!)
5. Click **Create user**
6. Copy **User UID** (sẽ dùng ở bước 3)

### Bước 3: Tạo Admin Record trong admins Table

Sau khi có User UID, chạy SQL này trong Supabase SQL Editor:

```sql
-- Thay {USER_UID} bằng User UID từ bước 2
INSERT INTO admins (admin_id, email, display_name, role)
VALUES (
  '{USER_UID}'::uuid,
  'qtusadmin@gmail.com',
  'Admin',
  'super_admin'
)
ON CONFLICT (admin_id) DO UPDATE
SET email = EXCLUDED.email,
    display_name = EXCLUDED.email,
    role = EXCLUDED.role;
```

**Hoặc dùng service role để insert (nếu có lỗi RLS):**

Trong API route hoặc script, dùng:
```typescript
import { getSupabaseAdmin } from '@/lib/supabase/server';

const supabase = getSupabaseAdmin();
await supabase.from('admins').upsert({
  admin_id: userUid, // User UID từ Supabase Auth
  email: 'qtusadmin@gmail.com',
  display_name: 'Admin',
  role: 'super_admin'
});
```

### Bước 4: Verify Admin Setup

Chạy SQL này để verify:

```sql
-- Check admin user exists
SELECT * FROM admins WHERE email = 'qtusadmin@gmail.com';

-- Check function exists
SELECT * FROM pg_proc WHERE proname = 'is_admin_user';

-- Test function (sẽ return false nếu chưa login)
SELECT public.is_admin_user();
```

### Bước 5: Test Admin Login

1. Mở app: `/auth/login`
2. Đăng nhập với:
   - **Email:** `qtusadmin@gmail.com`
   - **Password:** `qtusdev`
3. Nếu thành công, sẽ redirect đến `/admin`

## Troubleshooting

### Lỗi: "User not found" hoặc "Invalid credentials"

**Nguyên nhân:** User chưa được tạo trong Supabase Auth

**Giải pháp:**
- Tạo user trong Supabase Dashboard > Authentication > Users
- Đảm bảo "Auto Confirm User" được bật

### Lỗi: "Cannot read admins table"

**Nguyên nhân:** RLS policy chưa được fix hoặc admin record chưa có

**Giải pháp:**
1. Chạy lại `supabase/fix_rls_complete.sql`
2. Tạo admin record trong admins table với đúng admin_id

### Lỗi: "Infinite recursion detected"

**Nguyên nhân:** Policy cũ vẫn còn

**Giải pháp:**
1. Chạy `supabase/fix_rls_complete.sql` để drop tất cả policies cũ
2. Tạo lại policies mới với function `is_admin_user()`

### Admin login thành công nhưng không redirect đến /admin

**Nguyên nhân:** Code check admin email không đúng

**Giải pháp:**
- Kiểm tra `NEXT_PUBLIC_ADMIN_KEY` trong `.env.local`
- Kiểm tra code trong `app/auth/login/page.tsx` line 72-85

## Quick Fix Script

Nếu muốn tự động tạo admin, chạy script này trong Supabase SQL Editor:

```sql
-- 1. Tạo admin user trong auth (cần làm manual trong Dashboard)
-- 2. Sau đó chạy SQL này với User UID:

DO $$
DECLARE
  admin_email TEXT := 'qtusadmin@gmail.com';
  admin_uid UUID;
BEGIN
  -- Lấy user ID từ auth.users
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users. Please create user in Dashboard first.', admin_email;
  END IF;

  -- Insert vào admins table
  INSERT INTO admins (admin_id, email, display_name, role)
  VALUES (admin_uid, admin_email, 'Admin', 'super_admin')
  ON CONFLICT (admin_id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role;

  RAISE NOTICE 'Admin created successfully with ID: %', admin_uid;
END $$;
```

## Verification Checklist

- [ ] RLS policies đã được fix (chạy `fix_rls_complete.sql`)
- [ ] Function `is_admin_user()` đã được tạo
- [ ] Admin user đã được tạo trong Supabase Auth
- [ ] Admin record đã được tạo trong admins table
- [ ] `admin_id` trong admins table = `id` trong auth.users
- [ ] Environment variables đúng (`NEXT_PUBLIC_ADMIN_KEY`, `NEXT_PUBLIC_ADMIN_PASSWORD`)
- [ ] Test login thành công

## Notes

- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) tự động bypass RLS
- API routes dùng `getSupabaseAdmin()` sẽ không bị ảnh hưởng bởi RLS
- Function `is_admin_user()` dùng `SECURITY DEFINER` để bypass RLS khi check admin
- Điều này fix infinite recursion trong admins table policy

