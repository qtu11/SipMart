# 🚀 Quick Start Guide - CupSipSmart

## Hướng Dẫn Cài Đặt & Chạy Dự Án

---

## 📋 Yêu Cầu Hệ Thống

- **Node.js** >= 18.x
- **npm** hoặc **yarn** hoặc **pnpm**
- **Git**
- **Supabase Account** (database)
- **VNPay Account** (payment - optional for dev)

---

## 1. Clone Repository

```bash
git clone https://github.com/your-org/sipmart.git
cd sipmart
```

---

## 2. Cài Đặt Dependencies

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

---

## 3. Cấu Hình Environment

### Tạo file `.env.local`

```bash
cp .env.example .env.local
```

### Điền các biến môi trường

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# VNPay (optional for dev)
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_SANDBOX=true

# Cron Secret
CRON_SECRET=your-random-secret

# Email (optional)
RESEND_API_KEY=your-resend-key

# App
NEXT_PUBLIC_APP_URL=https://cupsipmart-uefedu-qt.vercel.app
```

---

## 4. Setup Database

### Chạy migrations trên Supabase

1. Vào Supabase Dashboard
2. Mở **SQL Editor**
3. Chạy lần lượt các file trong `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `007_gamification_tables.sql`
   - `009_performance_indexes.sql`

### Hoặc dùng Supabase CLI

```bash
npx supabase db push
```

---

## 5. Chạy Development

```bash
npm run dev
```

Mở trình duyệt: https://cupsipmart-uefedu-qt.vercel.app

---

## 6. Build Production

```bash
npm run build
npm run start
```

---

## 7. Test Cron Jobs (Manual)

```bash
# Check overdue
curl -X POST https://cupsipmart-uefedu-qt.vercel.app/api/cron/check-overdue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Due reminders
curl -X POST https://cupsipmart-uefedu-qt.vercel.app/api/cron/due-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📁 Cấu Trúc Quan Trọng

```
sipmart/
├── .env.local              # ⚠️ KHÔNG COMMIT
├── app/
│   ├── api/               # API endpoints
│   ├── admin/             # Admin pages
│   └── (user pages)
├── lib/
│   └── supabase/          # Database functions
├── supabase/
│   └── migrations/        # SQL migrations
└── vercel.json            # Cron config
```

---

## 🔧 Scripts Có Sẵn

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy development |
| `npm run build` | Build production |
| `npm run start` | Start production |
| `npm run lint` | Check lint errors |

---

## ❓ Troubleshooting

### Lỗi Supabase connection
- Kiểm tra `NEXT_PUBLIC_SUPABASE_URL`
- Kiểm tra `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Lỗi build
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Lỗi VNPay
- Đảm bảo `VNPAY_SANDBOX=true` khi dev
- Kiểm tra IP whitelist

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, tạo issue trên GitHub hoặc liên hệ team.

---

*Quick Start v1.0 | 07/01/2026*
