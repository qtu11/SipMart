# ✅ Pre-Deploy Checklist - CupSipSmart

## 🎯 Mục tiêu
Kiểm tra toàn bộ hệ thống đảm bảo hoạt động tốt trước khi deploy.

## 📋 Checklist

### 1. Environment Variables (.env.local)

#### ✅ Firebase Configuration (Required)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

#### ✅ Supabase Configuration (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (chỉ 1 lần, không duplicate)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (recommended cho API routes)

#### ✅ App Configuration (Required)
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_DEPOSIT_AMOUNT`
- [ ] `NEXT_PUBLIC_BORROW_DURATION_HOURS`

#### ✅ Admin Credentials (Required)
- [ ] `ADMIN_KEY` (server-side)
- [ ] `ADMIN_PASSWORD` (server-side)
- [ ] `NEXT_PUBLIC_ADMIN_KEY` (client-side)
- [ ] `NEXT_PUBLIC_ADMIN_PASSWORD` (client-side)

#### ⚠️ Optional Services (Recommended)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (cho map features)
- [ ] `RESEND_API_KEY` (cho email sending)
- [ ] `RESEND_FROM_EMAIL` (cho email from address)
- [ ] `GEMINI_API_KEY` (cho chat AI)
- [ ] `RECAPTCHA_SECRET_KEY` (cho spam protection)

### 2. Supabase Database Setup

#### ✅ Schema Setup
- [ ] Đã chạy `supabase/setup_complete.sql` trong Supabase SQL Editor
- [ ] Tất cả tables đã được tạo:
  - [ ] `users`
  - [ ] `cups`
  - [ ] `stores`
  - [ ] `transactions`
  - [ ] `admins`
  - [ ] `notifications`
  - [ ] `stories`
  - [ ] `story_views`
  - [ ] `admin_actions`
  - [ ] `eco_actions`

#### ✅ Row Level Security (RLS)
- [ ] Đã chạy `supabase/policies.sql` (nếu có)
- [ ] RLS policies đã được setup cho các tables

#### ✅ Authentication
- [ ] Supabase Auth đã được enable
- [ ] Email provider đã được enable
- [ ] Google OAuth đã được setup (nếu dùng)
- [ ] Email confirmation có thể tắt trong dev mode

### 3. Firebase Setup

#### ✅ Authentication
- [ ] Email/Password provider đã enable
- [ ] Google provider đã enable (nếu dùng)
- [ ] Firebase Auth rules đã được setup

#### ✅ Firestore Database
- [ ] Database đã được tạo
- [ ] Security rules đã được setup
- [ ] Collections structure đúng

#### ✅ Storage
- [ ] Storage bucket đã được tạo
- [ ] Storage rules đã được setup

### 4. Code Verification

#### ✅ Authentication Flow
- [ ] Đăng ký tài khoản hoạt động (`/auth/register`)
- [ ] Đăng nhập tài khoản hoạt động (`/auth/login`)
- [ ] Google OAuth hoạt động (nếu dùng)
- [ ] Đăng xuất hoạt động
- [ ] Auth state persistence hoạt động

#### ✅ QR Code Generation
- [ ] Admin có thể tạo QR codes (`/admin`)
- [ ] QR codes được lưu vào database (Supabase/Firebase)
- [ ] QR code images được generate đúng format
- [ ] QR code data format: `CUP|{cupId}|{material}|CupSipSmart`

#### ✅ Admin Features
- [ ] Admin login hoạt động
- [ ] Admin dashboard hiển thị đúng (`/admin`)
- [ ] Tạo QR codes hoạt động
- [ ] Quản lý inventory hoạt động
- [ ] Analytics hoạt động

#### ✅ User Features
- [ ] Quét QR code hoạt động (`/scan`)
- [ ] Mượn ly hoạt động (`/api/borrow`)
- [ ] Trả ly hoạt động (`/api/return`)
- [ ] Wallet hoạt động (`/wallet`)
- [ ] Profile hoạt động (`/profile`)

### 5. API Routes Testing

#### ✅ Authentication APIs
- [ ] `/api/auth/verify-recaptcha` (nếu dùng)
- [ ] `/api/auth/callback` (OAuth callback)

#### ✅ Transaction APIs
- [ ] `/api/borrow` - Mượn ly
- [ ] `/api/return` - Trả ly
- [ ] `/api/qr/scan` - Quét QR code

#### ✅ Admin APIs
- [ ] `/api/admin/cups` - Tạo QR codes
- [ ] `/api/admin/cups/export` - Export QR codes
- [ ] `/api/admin/analytics` - Analytics
- [ ] `/api/admin/inventory` - Inventory management

### 6. Build & Type Check

```bash
# Chạy các lệnh sau và đảm bảo không có lỗi:
npm run type-check    # TypeScript type checking
npm run lint          # ESLint checking
npm run build         # Next.js build
npm run verify        # System verification script
```

- [ ] TypeScript compilation không có lỗi
- [ ] ESLint không có lỗi
- [ ] Next.js build thành công
- [ ] System verification script pass

### 7. Manual Testing

#### ✅ Authentication
- [ ] Test đăng ký tài khoản mới
- [ ] Test đăng nhập với tài khoản đã có
- [ ] Test đăng nhập admin
- [ ] Test đăng xuất

#### ✅ QR Code Flow
- [ ] Admin tạo QR codes thành công
- [ ] QR codes hiển thị đúng
- [ ] User quét QR code thành công
- [ ] Mượn ly flow hoạt động
- [ ] Trả ly flow hoạt động

#### ✅ Database Operations
- [ ] User được tạo trong Supabase `users` table
- [ ] Cups được tạo trong Supabase `cups` table
- [ ] Transactions được tạo trong Supabase `transactions` table
- [ ] Store inventory được cập nhật đúng

### 8. Error Handling

- [ ] Error messages hiển thị đúng (toast notifications)
- [ ] Console không có lỗi nghiêm trọng
- [ ] Network errors được handle đúng
- [ ] Database errors được handle đúng

### 9. Performance

- [ ] Page load time < 3s
- [ ] API response time < 1s
- [ ] Images được optimize
- [ ] No console warnings về performance

### 10. Security

- [ ] Environment variables không bị expose trong client code
- [ ] Admin routes được protect đúng
- [ ] API routes có authentication check
- [ ] SQL injection protection (Supabase handles this)
- [ ] XSS protection (React handles this)

## 🚀 Quick Verification Commands

```bash
# 1. Check environment variables
npm run verify

# 2. Type check
npm run type-check

# 3. Lint check
npm run lint

# 4. Build check
npm run build

# 5. Run all checks
npm run build:check && npm run verify
```

## 📝 Notes

### Common Issues & Solutions

1. **Không tạo được QR code:**
   - Kiểm tra Supabase `cups` table đã được tạo chưa
   - Kiểm tra `SUPABASE_SERVICE_ROLE_KEY` đã set chưa
   - Kiểm tra admin credentials đúng chưa

2. **Không đăng ký/đăng nhập được:**
   - Kiểm tra Supabase Auth đã enable chưa
   - Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` đúng chưa
   - Kiểm tra email confirmation có thể tắt trong dev mode

3. **Database errors:**
   - Chạy lại `supabase/setup_complete.sql` trong Supabase SQL Editor
   - Kiểm tra RLS policies không block operations
   - Sử dụng `SUPABASE_SERVICE_ROLE_KEY` cho admin operations

4. **Build errors:**
   - Xóa `.next` folder và build lại
   - Xóa `node_modules` và `package-lock.json`, chạy `npm install` lại
   - Kiểm tra TypeScript errors

## ✅ Final Checklist

Trước khi deploy, đảm bảo:

- [ ] Tất cả tests pass
- [ ] Build thành công
- [ ] System verification pass
- [ ] Manual testing pass
- [ ] Environment variables đầy đủ
- [ ] Database schema đã setup
- [ ] Không có lỗi trong console
- [ ] Documentation đã được update

## 🎉 Ready to Deploy!

Nếu tất cả checklist items đều ✅, hệ thống đã sẵn sàng để deploy!

