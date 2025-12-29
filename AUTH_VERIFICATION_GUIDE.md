# 🔐 Authentication Verification Guide

## ✅ Quick Verification Steps

### 1. Kiểm tra Supabase Configuration

#### Supabase Dashboard Setup
1. Vào https://supabase.com/dashboard/project/hxgmiwywovbbnzcpdhjg
2. **Authentication > Providers:**
   - [ ] Email provider: **Enabled**
   - [ ] Google provider: **Enabled**
   - [ ] Email confirmation: **TẮT** (cho dev) hoặc **BẬT** (cho production)

3. **Authentication > URL Configuration:**
   - [ ] Site URL: `https://sipsmart.vn` (production) hoặc `http://localhost:3000` (dev)
   - [ ] Redirect URLs:
     - `http://localhost:3000/auth/callback` (dev)
     - `https://sipsmart.vn/auth/callback` (production)

4. **Authentication > Settings:**
   - [ ] Enable email confirmations: **OFF** (cho dev/test nhanh)
   - [ ] Enable email change confirmations: **OFF** (cho dev)

### 2. Test Đăng Ký Tài Khoản

#### Test Manual:
1. Mở `/auth/register`
2. Điền form:
   - Email: `testuser@example.com`
   - Password: `test123456`
   - Display Name: `Test User`
3. Click "Đăng ký"

#### Expected Results:
- ✅ Toast: "Đăng ký thành công!"
- ✅ Redirect đến `/` hoặc `/auth/login` (nếu email confirmation bật)
- ✅ User được tạo trong Supabase Auth
- ✅ User document được tạo trong `users` table

#### Verify in Supabase:
```sql
-- Check auth user
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'testuser@example.com';

-- Check user document
SELECT user_id, email, display_name, created_at 
FROM users 
WHERE email = 'testuser@example.com';
```

### 3. Test Đăng Nhập Google

#### Test Manual:
1. Mở `/auth/login`
2. Click "Đăng nhập với Google"
3. Chọn Google account
4. Authorize app

#### Expected Results:
- ✅ Redirect đến Google OAuth page
- ✅ Sau khi authorize, redirect về `/auth/callback`
- ✅ User được tạo trong Supabase Auth (nếu chưa có)
- ✅ User document được tạo trong `users` table
- ✅ Redirect đến `/` (hoặc `/admin` nếu là admin email)

#### Verify in Supabase:
```sql
-- Check OAuth identity
SELECT user_id, provider, provider_id 
FROM auth.identities 
WHERE provider = 'google';

-- Check user
SELECT * FROM users WHERE email = 'google_email@gmail.com';
```

## 🔍 Code Verification

### 1. Register Flow
**File:** `app/auth/register/page.tsx`
- ✅ Form validation (email, password length, password match)
- ✅ reCAPTCHA handling (skip nếu không có)
- ✅ Error handling với messages rõ ràng
- ✅ Success handling với redirect

**File:** `lib/supabase/auth.ts` - `signUpWithEmail()`
- ✅ Supabase Auth signUp
- ✅ Admin document creation (nếu admin email)
- ✅ User document creation với error handling
- ✅ Duplicate user handling

### 2. Login Flow
**File:** `app/auth/login/page.tsx`
- ✅ Form validation
- ✅ Error handling với messages cụ thể
- ✅ Admin detection và redirect
- ✅ Google OAuth button

**File:** `lib/supabase/auth.ts` - `signInWithEmail()`
- ✅ Supabase Auth signIn
- ✅ Admin credentials fallback
- ✅ User document auto-creation
- ✅ Admin document auto-creation

### 3. Google OAuth Flow
**File:** `lib/supabase/auth.ts` - `signInWithGoogle()`
- ✅ Supabase OAuth signIn
- ✅ Redirect URL configuration
- ✅ Error handling

**File:** `app/auth/callback/route.ts`
- ✅ Code exchange for session
- ✅ User creation (nếu chưa có)
- ✅ Admin detection và creation
- ✅ Redirect based on admin status
- ✅ Error handling

## 🐛 Common Issues & Fixes

### Issue 1: "Email already registered" nhưng không đăng nhập được

**Nguyên nhân:** Email confirmation đang bật

**Fix:**
```sql
-- Supabase Dashboard > Authentication > Providers > Email
-- Tắt "Confirm email" hoặc confirm thủ công:

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

### Issue 2: Google OAuth không redirect

**Nguyên nhân:** Redirect URL chưa được config

**Fix:**
1. Supabase Dashboard > Authentication > URL Configuration
2. Thêm Redirect URL: `http://localhost:3000/auth/callback`
3. Verify Site URL đúng

### Issue 3: User được tạo nhưng không có trong users table

**Nguyên nhân:** RLS policy block hoặc createUser fail

**Fix:**
1. Check RLS policies đã đúng chưa (chạy `fix_rls_safe.sql`)
2. Check service role key đã set chưa
3. Check console logs để xem lỗi cụ thể

### Issue 4: OAuth callback error

**Nguyên nhân:** Code exchange fail hoặc user creation fail

**Fix:**
1. Check Supabase logs
2. Check redirect URL đúng chưa
3. Check RLS policies cho users table

## 📊 Database Verification Queries

### Check All Auth Users
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
```

### Check All Users Table
```sql
SELECT 
  user_id,
  email,
  display_name,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;
```

### Check OAuth Users
```sql
SELECT 
  u.id,
  u.email,
  i.provider,
  i.provider_id
FROM auth.users u
JOIN auth.identities i ON u.id = i.user_id
WHERE i.provider = 'google';
```

### Check Admins
```sql
SELECT 
  admin_id,
  email,
  display_name,
  role,
  created_at
FROM admins;
```

### Check User Creation Errors
```sql
-- Find auth users without user documents
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id::text = u.user_id::text
WHERE u.user_id IS NULL;
```

## ✅ Final Checklist

Trước khi deploy, đảm bảo:

- [ ] Supabase Auth providers đã enable (Email, Google)
- [ ] Redirect URLs đã config đúng
- [ ] Email confirmation: TẮT (dev) hoặc BẬT (production)
- [ ] RLS policies đã fix (chạy `fix_rls_safe.sql`)
- [ ] Test đăng ký thành công
- [ ] Test đăng nhập thành công
- [ ] Test Google OAuth thành công
- [ ] Test admin login thành công
- [ ] Không có lỗi trong console
- [ ] Error messages rõ ràng
- [ ] Session persistence hoạt động

## 🚀 Quick Test Script

```bash
# 1. Start dev server
npm run dev

# 2. Test đăng ký
# - Mở http://localhost:3000/auth/register
# - Điền form và submit
# - Verify trong Supabase Dashboard

# 3. Test đăng nhập
# - Mở http://localhost:3000/auth/login
# - Đăng nhập với credentials vừa tạo
# - Verify redirect và session

# 4. Test Google OAuth
# - Click "Đăng nhập với Google"
# - Authorize và verify redirect
```

## 📝 Notes

- **Email Confirmation:** Nếu bật, user cần confirm email trước khi đăng nhập
- **Service Role Key:** Dùng cho API routes, bypass RLS
- **OAuth Redirect:** Phải match exactly với config trong Supabase
- **Error Handling:** Tất cả errors đều được catch và hiển thị message rõ ràng

