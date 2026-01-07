# 📡 API Reference - CupSipSmart

## API Endpoints Documentation

---

## Base URL

```
Production: https://cupsipsmart.com/api
Development: http://localhost:3000/api
```

---

## 🔐 Authentication

Hầu hết API yêu cầu authentication qua Supabase Auth token.

### Headers
```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

---

## 📱 User APIs

### Mượn Ly
```http
POST /api/borrow
```

**Body:**
```json
{
  "cupId": "12345678",
  "storeId": "uuid-store-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mượn ly thành công!",
  "transaction": {
    "transactionId": "uuid",
    "cupId": "12345678",
    "borrowTime": "2026-01-07T08:00:00Z",
    "dueTime": "2026-01-08T08:00:00Z"
  },
  "greenPoints": 50,
  "walletBalance": 80000
}
```

---

### Trả Ly
```http
POST /api/return
```

**Body:**
```json
{
  "cupId": "12345678",
  "storeId": "uuid-store-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trả ly thành công!",
  "refundAmount": 20000,
  "greenPointsEarned": 100,
  "isSpeedBonus": true
}
```

---

### Quét QR
```http
POST /api/qr/scan
```

**Body:**
```json
{
  "qrData": "CUP|12345678|pp_plastic|CupSipSmart"
}
```

**Response:**
```json
{
  "action": "borrow",
  "cupId": "12345678",
  "material": "pp_plastic",
  "cupStatus": "available",
  "message": "Sẵn sàng mượn ly",
  "canProceed": true
}
```

---

## 💰 Payment APIs

### Tạo URL Nạp Tiền
```http
POST /api/payment/create_url
```

**Body:**
```json
{
  "amount": 50000
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/...",
  "transactionCode": "TXN123456"
}
```

---

### VNPay IPN Callback
```http
GET /api/payment/vnpay_ipn
```
*Được gọi bởi VNPay server*

---

## 🎁 Rewards APIs

### Lấy Danh Sách Rewards
```http
GET /api/rewards
```

**Response:**
```json
{
  "success": true,
  "rewards": [
    {
      "rewardId": "uuid",
      "name": "Voucher Cà Phê 50k",
      "pointsCost": 500,
      "stock": 100,
      "category": "voucher"
    }
  ]
}
```

---

### Đổi Reward
```http
POST /api/rewards/claim
```

**Body:**
```json
{
  "rewardId": "uuid-reward-id"
}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "claimId": "uuid",
    "rewardId": "uuid",
    "pointsUsed": 500,
    "status": "pending"
  }
}
```

---

## 👥 Friends APIs

### Tìm User
```http
GET /api/friends/search?studentId=123456
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "displayName": "Nguyen Van A",
    "rankLevel": "tree"
  }
}
```

---

### Gửi Lời Mời Kết Bạn
```http
POST /api/friends/request
```

**Body:**
```json
{
  "toUserId": "uuid-target-user"
}
```

---

## 🏪 Stores APIs

### Lấy Danh Sách Cửa Hàng
```http
GET /api/stores
```

**Response:**
```json
{
  "success": true,
  "stores": [
    {
      "storeId": "uuid",
      "name": "CupSipSmart - ĐH Bách Khoa",
      "address": "268 Lý Thường Kiệt",
      "gpsLat": 10.773,
      "gpsLng": 106.657,
      "cupAvailable": 25
    }
  ]
}
```

---

## 🔔 Notifications APIs

### Lấy Thông Báo
```http
GET /api/notifications
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "notificationId": "uuid",
      "type": "success",
      "title": "Mượn ly thành công!",
      "message": "Bạn nhận được 50 Green Points",
      "read": false,
      "timestamp": "2026-01-07T08:00:00Z"
    }
  ]
}
```

---

### Đánh Dấu Đã Đọc
```http
PATCH /api/notifications/:id/read
```

---

## 🏆 Leaderboard APIs

### Lấy Bảng Xếp Hạng
```http
GET /api/leaderboard?limit=10
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "displayName": "Nguyen Van A",
      "greenPoints": 15000,
      "rankLevel": "forest"
    }
  ]
}
```

---

## ⚡ Cron APIs

*Chỉ dành cho internal/scheduled jobs*

```http
POST /api/cron/check-overdue
POST /api/cron/due-reminders
POST /api/cron/daily
POST /api/cron/refresh-rankings
```

**Headers:**
```http
Authorization: Bearer <CRON_SECRET>
```

---

## ❌ Error Responses

### Cấu trúc lỗi
```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

---

## 🔒 Rate Limiting

- User APIs: 10 requests/minute
- Payment APIs: 5 requests/minute
- Cron APIs: No limit (with valid secret)

---

*API Reference v1.0 | 07/01/2026*
