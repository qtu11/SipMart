# ✅ Authentication Test Checklist

## 🎯 Mục tiêu
Đảm bảo đăng ký tài khoản và đăng nhập Google hoạt động ổn định, không có lỗi ẩn.

## 📋 Pre-Test Setup

### 1. Supabase Configuration
- [ ] Supabase Auth đã được enable
- [ ] Email provider đã được enable
- [ ] Google OAuth provider đã được enable
- [ ] Email confirmation: **TẮT** (cho dev/test) hoặc **BẬT** (cho production)
- [ ] Redirect URLs đã được config:
  - [ ] `http://localhost:3000/auth/callback` (dev)
  - [ ] `https://sipsmart.vn/auth/callback` (production)

### 2. Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` đã set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` đã set (cho API routes)

### 3. Database Schema
- [ ] Đã chạy `supabase/fix_rls_safe.sql` để fix RLS policies
- [ ] Tất cả tables đã được tạo
- [ ] RLS policies đã được setup đúng

## 🧪 Test Cases

### Test 1: Đăng ký tài khoản mới (Email/Password)

#### Test Case 1.1: Đăng ký thành công
**Steps:**
1. Vào `/auth/register`
2. Điền form:
   - Email: `test@example.com` (email chưa tồn tại)
   - Password: `password123` (>= 6 ký tự)
   - Confirm Password: `password123`
   - Display Name: `Test User`
   - Student ID: `SV001` (optional)
3. Click "Đăng ký"

**Expected Results:**
- [ ] Toast hiển thị: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận."
- [ ] Redirect đến `/` sau 1.5s
- [ ] User được tạo trong Supabase Auth
- [ ] User document được tạo trong `users` table
- [ ] Console không có lỗi

**Verify in Supabase:**
```sql
-- Check user in auth.users
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'test@example.com';

-- Check user in users table
SELECT * FROM users WHERE email = 'test@example.com';
```

#### Test Case 1.2: Email đã tồn tại
**Steps:**
1. Đăng ký với email đã tồn tại
2. Click "Đăng ký"

**Expected Results:**
- [ ] Toast hiển thị: "Email đã được sử dụng"
- [ ] Không redirect
- [ ] Form vẫn hiển thị để user có thể sửa

#### Test Case 1.3: Password quá ngắn
**Steps:**
1. Điền password < 6 ký tự (ví dụ: `12345`)
2. Click "Đăng ký"

**Expected Results:**
- [ ] Toast hiển thị: "Mật khẩu phải có ít nhất 6 ký tự"
- [ ] Form validation ngăn submit

#### Test Case 1.4: Password không khớp
**Steps:**
1. Điền password và confirm password khác nhau
2. Click "Đăng ký"

**Expected Results:**
- [ ] Toast hiển thị: "Mật khẩu xác nhận không khớp"
- [ ] Form validation ngăn submit

#### Test Case 1.5: Thiếu thông tin bắt buộc
**Steps:**
1. Để trống email, password, hoặc display name
2. Click "Đăng ký"

**Expected Results:**
- [ ] Toast hiển thị: "Vui lòng điền đầy đủ thông tin bắt buộc"
- [ ] HTML5 validation ngăn submit

### Test 2: Đăng nhập (Email/Password)

#### Test Case 2.1: Đăng nhập thành công
**Steps:**
1. Vào `/auth/login`
2. Điền email và password đã đăng ký
3. Click "Đăng nhập"

**Expected Results:**
- [ ] Toast hiển thị: "Đăng nhập thành công!"
- [ ] Redirect đến `/`
- [ ] Session được lưu
- [ ] Console log: "Login successful, user: ..."

**Verify:**
- [ ] Refresh page, user vẫn đăng nhập (session persistence)
- [ ] User document tồn tại trong `users` table

#### Test Case 2.2: Email không tồn tại
**Steps:**
1. Đăng nhập với email chưa đăng ký
2. Click "Đăng nhập"

**Expected Results:**
- [ ] Toast hiển thị: "Email không tồn tại. Vui lòng đăng ký tài khoản trước."
- [ ] Không redirect

#### Test Case 2.3: Password sai
**Steps:**
1. Đăng nhập với password sai
2. Click "Đăng nhập"

**Expected Results:**
- [ ] Toast hiển thị: "Mật khẩu không đúng. Vui lòng kiểm tra lại."
- [ ] Không redirect

#### Test Case 2.4: Email chưa confirm (nếu email confirmation bật)
**Steps:**
1. Đăng ký tài khoản mới
2. Chưa click link confirm trong email
3. Thử đăng nhập

**Expected Results:**
- [ ] Toast hiển thị lỗi về email chưa confirm
- [ ] Hướng dẫn user check email

### Test 3: Đăng nhập Google OAuth

#### Test Case 3.1: Đăng nhập Google thành công (User mới)
**Steps:**
1. Vào `/auth/login`
2. Click "Đăng nhập với Google"
3. Chọn Google account chưa đăng ký
4. Authorize app

**Expected Results:**
- [ ] Redirect đến Google OAuth page
- [ ] Sau khi authorize, redirect về `/auth/callback`
- [ ] User được tạo trong Supabase Auth
- [ ] User document được tạo trong `users` table
- [ ] Redirect đến `/`
- [ ] Toast hiển thị: "Đăng nhập thành công!"

**Verify in Supabase:**
```sql
-- Check OAuth user
SELECT id, email, provider FROM auth.users WHERE email = 'google_email@gmail.com';

-- Check user document
SELECT * FROM users WHERE email = 'google_email@gmail.com';
```

#### Test Case 3.2: Đăng nhập Google thành công (User đã tồn tại)
**Steps:**
1. Đăng nhập Google với account đã đăng ký trước đó
2. Authorize app

**Expected Results:**
- [ ] Redirect về `/auth/callback`
- [ ] User đã tồn tại, không tạo duplicate
- [ ] Redirect đến `/`
- [ ] Đăng nhập thành công

#### Test Case 3.3: Google OAuth bị cancel
**Steps:**
1. Click "Đăng nhập với Google"
2. Cancel ở Google OAuth page

**Expected Results:**
- [ ] Redirect về `/auth/login`
- [ ] Không có lỗi
- [ ] User có thể thử lại

#### Test Case 3.4: Google OAuth với Admin Email
**Steps:**
1. Đăng nhập Google với admin email (`qtusadmin@gmail.com`)
2. Authorize app

**Expected Results:**
- [ ] User được tạo trong Supabase Auth
- [ ] Admin document được tạo trong `admins` table
- [ ] User document được tạo trong `users` table
- [ ] Redirect đến `/admin` (không phải `/`)

**Verify:**
```sql
-- Check admin document
SELECT * FROM admins WHERE email = 'qtusadmin@gmail.com';
```

### Test 4: Edge Cases & Error Handling

#### Test Case 4.1: Network Error
**Steps:**
1. Tắt internet
2. Thử đăng ký/đăng nhập

**Expected Results:**
- [ ] Toast hiển thị lỗi rõ ràng
- [ ] Không crash app
- [ ] User có thể retry

#### Test Case 4.2: Supabase Service Down
**Steps:**
1. Giả lập Supabase service down (block request)
2. Thử đăng ký/đăng nhập

**Expected Results:**
- [ ] Error message rõ ràng
- [ ] Không crash app
- [ ] User có thể retry sau

#### Test Case 4.3: Database Error (RLS Policy Block)
**Steps:**
1. Đảm bảo RLS policies đúng
2. Thử đăng ký user mới

**Expected Results:**
- [ ] User được tạo thành công
- [ ] Không bị block bởi RLS (vì dùng service role)

#### Test Case 4.4: Duplicate User Document
**Steps:**
1. Tạo user trong auth.users nhưng chưa có trong users table
2. Thử đăng nhập

**Expected Results:**
- [ ] User document được tự động tạo khi đăng nhập
- [ ] Đăng nhập thành công

#### Test Case 4.5: Email với ký tự đặc biệt
**Steps:**
1. Đăng ký với email: `test+tag@example.com`
2. Đăng ký với email: `test.user@example.com`

**Expected Results:**
- [ ] Đăng ký thành công
- [ ] Email được lưu đúng format

## 🔍 Verification Commands

### Check Supabase Auth Users
```sql
-- List all auth users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Users Table
```sql
-- List all users
SELECT user_id, email, display_name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Admins Table
```sql
-- List all admins
SELECT admin_id, email, display_name, role 
FROM admins;
```

### Check OAuth Providers
```sql
-- Check OAuth identities
SELECT user_id, provider, provider_id 
FROM auth.identities 
WHERE provider = 'google';
```

## 🐛 Common Issues & Solutions

### Issue 1: "Email already registered" nhưng không đăng nhập được
**Nguyên nhân:** Email confirmation đang bật, user chưa confirm

**Giải pháp:**
1. Tắt email confirmation trong Supabase Dashboard
2. Hoặc confirm email thủ công trong Dashboard

### Issue 2: Google OAuth redirect về `/auth/login?error=oauth_failed`
**Nguyên nhân:**
- Redirect URL chưa được config trong Supabase
- OAuth callback route có lỗi

**Giải pháp:**
1. Check Supabase Dashboard > Authentication > URL Configuration
2. Thêm redirect URL: `http://localhost:3000/auth/callback`
3. Check `/auth/callback` route có lỗi không

### Issue 3: User được tạo nhưng không có trong users table
**Nguyên nhân:** RLS policy block hoặc createUser function fail

**Giải pháp:**
1. Check RLS policies đã đúng chưa
2. Check service role key đã set chưa
3. Check console logs để xem lỗi cụ thể

### Issue 4: Google OAuth không redirect
**Nguyên nhân:** Redirect URL không đúng hoặc chưa config

**Giải pháp:**
1. Check `signInWithGoogle()` function
2. Check redirect URL trong Supabase Dashboard
3. Check `window.location.origin` có đúng không

## ✅ Success Criteria

Hệ thống được coi là ổn định khi:
- [ ] Tất cả test cases pass
- [ ] Không có lỗi trong console
- [ ] Error messages rõ ràng, user-friendly
- [ ] Session persistence hoạt động
- [ ] Google OAuth hoạt động ổn định
- [ ] Edge cases được handle đúng
- [ ] Database operations thành công
- [ ] Không có lỗi ẩn (check console, network tab)

## 📝 Test Report Template

```
Test Date: [Date]
Tester: [Name]
Environment: [Dev/Production]

Results:
- Test 1.1: ✅/❌
- Test 1.2: ✅/❌
- Test 2.1: ✅/❌
- Test 3.1: ✅/❌
...

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
[Any additional notes]
```

