# 📖 CupSipSmart - Tổng Quan Dự Án

## 🎯 Giới Thiệu

**CupSipSmart** là hệ thống quản lý mượn trả ly tái sử dụng thông minh, hướng đến Gen Z với mục tiêu giảm thiểu rác thải nhựa một lần và bảo vệ môi trường.

### Tầm Nhìn
> "Mỗi ly tái sử dụng = Một bước tiến bảo vệ Trái Đất"

### Đặc Điểm Nổi Bật
- 🎮 **Gamification** - Tích điểm, thành tựu, thử thách
- 💳 **Ví điện tử** - Nạp tiền qua VNPay
- 📱 **QR Code** - Quét để mượn/trả ly
- 🌍 **Eco Impact** - Theo dõi tác động môi trường
- 👥 **Kết nối xã hội** - Kết bạn, feed, stories

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ User UI │  │Admin UI │  │ Scanner │  │   Map   │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
└───────┼────────────┼────────────┼────────────┼──────────┘
        │            │            │            │
┌───────┴────────────┴────────────┴────────────┴──────────┐
│                  API ROUTES (Serverless)                 │
│  /api/borrow  /api/return  /api/payment  /api/admin/*   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                   SUPABASE (PostgreSQL)                  │
│  users | cups | transactions | notifications | rewards  │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Tính Năng Chính

### Dành Cho Người Dùng

| Tính năng | Mô tả |
|-----------|-------|
| 🔐 Đăng ký/Đăng nhập | Email + xác thực |
| 📷 Quét QR | Mượn/trả ly bằng camera |
| 💰 Ví điện tử | Nạp tiền VNPay |
| 🌱 Green Points | Tích điểm xanh |
| 🏆 Thành tựu | 8 badges đạt được |
| 🎯 Thử thách | Daily/weekly challenges |
| 🎁 Đổi thưởng | Voucher, quà tặng |
| 👥 Kết bạn | Mã sinh viên |
| 📍 Bản đồ | Tìm cửa hàng gần |

### Dành Cho Admin

| Tính năng | Mô tả |
|-----------|-------|
| 📊 Dashboard | Thống kê realtime |
| 🍵 Quản lý ly | CRUD cups |
| 🏪 Quản lý cửa hàng | Partners |
| 👤 Quản lý user | Blacklist, balance |
| 📢 Broadcast | Gửi thông báo |
| 🔧 Cài đặt | System config |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Payment** | VNPay |
| **QR** | qrcode, html5-qrcode |
| **Maps** | Google Maps API |
| **Email** | Resend |
| **State** | Zustand |

---

## 📂 Cấu Trúc Thư Mục

```
SipMart/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # Admin pages
│   ├── auth/              # Auth pages
│   ├── scan/              # QR Scanner
│   └── ...                # Other pages
├── components/            # React components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase functions
│   └── middleware/       # Auth, rate-limit
├── supabase/
│   └── migrations/       # SQL migrations
└── docx/                  # Documentation
```

---

## 🔄 Flow Hoạt Động

### Mượn Ly
```
User quét QR → Xác thực → Trừ tiền cọc → Cập nhật ly → Tạo giao dịch → Gửi thông báo
```

### Trả Ly
```
User quét QR → Xác minh → Hoàn tiền → Cập nhật ly → Tích điểm → Gửi thông báo
```

### Nạp Tiền
```
Chọn số tiền → Tạo URL VNPay → Thanh toán → IPN callback → Cập nhật ví
```

---

## 📞 Liên Hệ

- **Email**: support@cupsipsmart.com
- **Website**: https://cupsipsmart.com

---

*Phiên bản: 1.0.0 | Cập nhật: 07/01/2026*
