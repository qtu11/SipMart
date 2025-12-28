# Hướng dẫn Setup CupSipMart

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Đặt tên project: `cupsipmart` (hoặc tên khác)
4. Bật Google Analytics (tùy chọn)

## Bước 3: Cấu hình Firebase

### 3.1. Authentication
1. Vào **Authentication** > **Get started**
2. Bật các providers:
   - Email/Password
   - Google
   - Facebook (tùy chọn)

### 3.2. Firestore Database
1. Vào **Firestore Database** > **Create database**
2. Chọn **Production mode** (sẽ setup security rules sau)
3. Chọn location: `asia-southeast1` (Singapore) hoặc gần nhất

### 3.3. Storage
1. Vào **Storage** > **Get started**
2. Chọn **Production mode**
3. Chọn location giống Firestore

### 3.4. Lấy Firebase Config
1. Vào **Project Settings** (⚙️) > **General**
2. Scroll xuống **Your apps** > Click **Web** icon (`</>`)
3. Đăng ký app với nickname: `CupSipMart Web`
4. Copy các giá trị config

## Bước 4: Tạo file .env.local

Tạo file `.env.local` ở root project:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cupsipmart.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cupsipmart
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cupsipmart.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEPOSIT_AMOUNT=20000
NEXT_PUBLIC_BORROW_DURATION_HOURS=24

# Email Service (Resend) - Optional
# Đăng ký tại https://resend.com để lấy API key
# Nếu không có, hệ thống sẽ log email ra console (dev mode)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=CupSipMart <noreply@yourdomain.com>

# Push Notifications (FCM) - Optional
# Xem FCM_SETUP.md để biết cách lấy VAPID key
NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_key_here

# Google Maps API - Optional
# Đăng ký tại https://console.cloud.google.com/
# Enable Maps JavaScript API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Bước 5: Setup Firestore Security Rules

Vào **Firestore Database** > **Rules**, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role in ['super_admin', 'store_admin'];
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
    }
    
    // Cups collection
    match /cups/{cupId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }
    
    // Stores collection
    match /stores/{storeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Admins collection
    match /admins/{adminId} {
      allow read, write: if isAdmin();
    }
    
    // Leaderboard - public read
    match /leaderboard/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Virtual Trees
    match /virtualTrees/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);
    }
    
    // Green Feed - public read, authenticated write
    match /greenFeed/{postId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Bước 6: Tạo Admin User đầu tiên

Sau khi chạy app, tạo admin user thủ công trong Firestore:

1. Vào **Firestore Database** > **Data**
2. Tạo collection `admins`
3. Tạo document với ID = `userId` của bạn (lấy từ Authentication)
4. Thêm fields:
   ```json
   {
     "email": "admin@example.com",
     "displayName": "Admin",
     "role": "super_admin",
     "actionLog": [],
     "createdAt": "2024-01-01T00:00:00Z"
   }
   ```

## Bước 7: Tạo Store đầu tiên

Tạo collection `stores` với document mẫu:

```json
{
  "storeId": "store1",
  "name": "Canteen Trường Đại học",
  "gpsLocation": {
    "lat": 10.762622,
    "lng": 106.660172
  },
  "address": "123 Đường ABC, Quận XYZ",
  "cupInventory": {
    "available": 0,
    "inUse": 0,
    "cleaning": 0,
    "total": 0
  },
  "partnerStatus": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Bước 8: Chạy Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Bước 9: Test Flow

### Test Mượn ly:
1. Đăng ký/Đăng nhập
2. Nạp tiền vào ví (tối thiểu 20,000đ)
3. Vào trang **Quét QR**
4. Quét mã QR của ly (hoặc nhập cupId thủ công)
5. Chọn store
6. Xác nhận mượn

### Test Trả ly:
1. Vào trang **Quét QR**
2. Quét lại mã QR của ly đang mượn
3. Chọn store trả
4. Xác nhận trả

### Test Admin:
1. Đăng nhập với tài khoản admin
2. Vào `/admin`
3. Tạo mã QR cho lô ly mới
4. Xem analytics

## Troubleshooting

### Lỗi "Firebase: Error (auth/unauthorized-domain)"
- Vào **Authentication** > **Settings** > **Authorized domains**
- Thêm `localhost` và domain của bạn

### Lỗi "Permission denied" khi đọc Firestore
- Kiểm tra Security Rules
- Đảm bảo user đã đăng nhập
- Kiểm tra admin document đã được tạo đúng

### Lỗi "Module not found"
- Chạy lại `npm install`
- Xóa `node_modules` và `.next`, sau đó `npm install` lại

## Next Steps

- [ ] Setup Cloud Functions cho cron jobs (nhắc nhở)
- [ ] Tích hợp Payment Gateway
- [ ] Setup Push Notifications
- [ ] Deploy lên Vercel/Netlify

