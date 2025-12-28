# 🌱 **CupSipSmart** - Smart Cup Sharing System

> **Hệ thống quản lý mượn trả ly tái sử dụng thông minh cho Gen Z**  
> Giảm thiểu rác thải nhựa một lần, bảo vệ môi trường, kiếm điểm xanh!

---

## 📖 **MÔ HÌNH HOẠT ĐỘNG**

### **🔄 Quy Trình Sử Dụng**

```
┌─────────────────────────────────────────────────────────────┐
│  1️⃣ ĐĂNG KÝ & NẠP TIỀN CỌC                                   │
│     → User đăng ký tài khoản                                 │
│     → Nạp tiền vào ví (VNPay/MoMo/ZaloPay)                   │
│     → Tiền cọc mặc định: 20,000 VNĐ/ly                       │
├─────────────────────────────────────────────────────────────┤
│  2️⃣ MƯỢN LY (BORROW)                                         │
│     → Quét QR code trên ly tại quán đối tác                  │
│     → Hệ thống tự động trừ tiền cọc                          │
│     → Bắt đầu đếm thời gian (24h phải trả)                   │
├─────────────────────────────────────────────────────────────┤
│  3️⃣ SỬ DỤNG & THEO DÕI                                       │
│     → Xem thời gian còn lại trong app                        │
│     → Nhận thông báo nhắc trả trước 1h                       │
│     → Theo dõi eco impact (ly đã cứu, CO2 giảm...)          │
├─────────────────────────────────────────────────────────────┤
│  4️⃣ TRẢ LY (RETURN)                                          │
│     → Quét QR code tại bất kỳ quán đối tác nào               │
│     → Hoàn tiền cọc tự động vào ví                           │
│     → Nhận Green Points thưởng (50-100 điểm)                 │
│     → Unlock achievements nếu đủ điều kiện                   │
├─────────────────────────────────────────────────────────────┤
│  5️⃣ ĐỔI THƯỞNG & TƯƠNG TÁC                                   │
│     → Dùng Green Points đổi voucher, quà tặng                │
│     → Tham gia challenges, events hàng tuần                  │
│     → Share trên Green Feed, kết bạn, top leaderboard        │
└─────────────────────────────────────────────────────────────┘
```

### **💰 Cơ Chế Tài Chính**

| **Hành động** | **Tiền cọc** | **Green Points** | **Ghi chú** |
|---------------|--------------|------------------|-------------|
| Mượn ly lần đầu | -20,000đ | +50 (bonus) | First Cup badge |
| Trả đúng hạn (< 24h) | +20,000đ | +50 | Hoàn tiền đầy đủ |
| Trả trễ (24-48h) | +15,000đ | +20 | Phạt 5,000đ/giờ |
| Quá hạn > 48h | +0đ | 0 | Mất tiền cọc + blacklist |
| Trả nhanh < 1h | +20,000đ | +100 | Speed Returner badge |

### **🌍 Tác Động Môi Trường**

Mỗi ly tái sử dụng = **17g CO₂** giảm + **0.5 lít nước** tiết kiệm + **0.03 kWh** điện tiết kiệm

```
100 ly cứu = 1 cây xanh 🌳 = 1.7 kg CO₂ giảm = 50 lít nước tiết kiệm
```

---

## ✨ **TÍNH NĂNG CHI TIẾT**

### 🎯 **CHO NGƯỜI DÙNG (USER)**

#### **1. 🏆 Hệ Thống Thành Tựu & Badges**
- **8 Badges Khả Dụng:**
  - 🌟 **First Cup** - Mượn ly đầu tiên (+50 points)
  - ⚡ **Speed Returner** - Trả ly < 1h (+100 points)
  - 🔥 **Streak Master** - Mượn 7 ngày liên tiếp (+500 points)
  - 🌍 **Eco Warrior** - Cứu 100 ly (+1000 points)
  - 💚 **Zero Waste** - Không quá hạn lần nào (+2000 points)
  - 🎓 **Campus Champion** - Top 10 trường (+5000 points)
  - 🤝 **Social Butterfly** - Có 10+ bạn bè (+200 points)
  - 📸 **Content Creator** - Đăng 50+ bài (+800 points)

- **Tự động unlock** khi đủ điều kiện
- **Hiển thị progress** từng achievement
- **Thưởng đặc biệt** cho rare/epic/legendary badges

#### **2. 📊 Lịch Sử Giao Dịch Chi Tiết**
- **Timeline đầy đủ:** Mượn/trả, thời gian, địa điểm
- **Lọc theo:** Ngày/tháng/năm, trạng thái
- **Thống kê:** Tổng tiền cọc, phạt, points nhận được
- **Export:** PDF, Excel cho báo cáo cá nhân
- **Biểu đồ:** Cups saved theo thời gian

#### **3. 🎁 Hệ Thống Đổi Thưởng (Rewards Store)**
- **Vouchers:**
  - Cà phê 50k (500 points)
  - Trà sữa 30k (300 points)
  - Miễn phí cọc 1 lần (200 points)

- **Merchandise:**
  - Túi vải CupSipSmart (1500 points)
  - Sticker pack (50 points)

- **Privileges:**
  - Priority pass 30 ngày (800 points)

- **Charity:**
  - Trồng cây thật có tên bạn (5000 points)

#### **4. 🔔 Thông Báo Thông Minh**
- ⏰ **Sắp đến hạn** (1 giờ trước)
- 🚨 **Quá hạn** (realtime)
- 🎉 **Lên hạng** mới
- 🏆 **Unlock achievement**
- 💰 **Refund thành công**
- 👥 **Bạn bè gần bạn**
- 🌟 **Top leaderboard**
- 🎁 **Phần thưởng mới**

- **Cài đặt:** Bật/tắt từng loại, chọn kênh (Push/Email/SMS), quiet hours

#### **5. 📍 Tìm Bạn Bè Gần Bạn**
- **Map view:** Hiển thị bạn bè đang ở cửa hàng nào
- **Chat nhanh:** "Cùng trả ly không?"
- **Group return:** Trả ly cùng nhau → bonus points
- **Thống kê:** Bạn mượn/trả ly nhiều nhất

#### **6. 🎯 Challenges & Events**
- **Weekly Challenges:**
  - Return Fast Week: Trả < 2h trong tuần (+500)
  - Eco Week: Mượn 10 ly/tuần (+300)
  - Share Your Cup: Đăng 5 bài (+200)

- **Special Events:**
  - Christmas Cup Hunt: Quét 5 QR đặc biệt → Giải lớn
  - Earth Day Challenge: Top 50 → Trồng cây thật
  - Back to School: SV mới +100 points miễn phí

#### **7. 💳 Thanh Toán Đa Dạng**
- **Liên kết:** VNPay, Momo, ZaloPay
- **Thẻ:** Tín dụng/ghi nợ, thẻ sinh viên
- **Auto top-up:** Tự động nạp khi < 20,000đ
- **Quản lý:** Thêm/xóa phương thức, set default

#### **8. 📊 Personal Eco Dashboard**
```
┌────────────────────────────────────┐
│ 🌍 TÁC ĐỘNG MÔI TRƯỜNG CỦA BẠN     │
├────────────────────────────────────┤
│ 🌳 Cây trồng tương đương: 12       │
│ 💧 Nước tiết kiệm: 240 lít         │
│ ⚡ Điện tiết kiệm: 15 kWh          │
│ 🌍 CO2 giảm: 8.5 kg                │
├────────────────────────────────────┤
│ 📈 Biểu đồ theo tháng              │
│ 🏆 Top 15% community               │
└────────────────────────────────────┘
```

#### **9. 🤖 AI Chatbot Hỗ Trợ**
- **FAQ** tự động
- **Tìm cửa hàng** gần nhất
- **Hướng dẫn** mượn/trả
- **Kiểm tra** số dư, lịch sử
- **Gợi ý** kiếm points nhanh

#### **10. 🎮 Mini Games**
- **Tree Watering Game:** Tưới cây ảo mỗi ngày
- **Cup Catch:** Bắt ly rơi → +points
- **Eco Quiz:** Câu hỏi môi trường

---

### 🛠️ **CHO ADMIN**

#### **1. 📊 Dashboard Nâng Cao**
- **Real-time Metrics:**
  - Total Users, Active Users, Churn Rate
  - Cups Utilization, Lost Rate, Lifespan
  - Revenue, Refund, Penalty
  - Peak Hours, Peak Days

- **AI Predictions:**
  - Dự báo nhu cầu ly tuần sau
  - Recommended stock level
  - Store efficiency ranking

- **Alerts:**
  - Low stock warnings
  - Overdue transactions
  - Lost cups

#### **2. 🎨 Custom QR Code Design**
- **Logo** CupSipSmart ở giữa
- **Màu sắc** tùy chỉnh theo material
- **Kích thước:** 300x300, 500x500, 1000x1000
- **Export:** PDF hàng loạt (A4, nhiều mã/trang)
- **Print-ready:** CMYK, 300dpi

#### **3. 📦 Quản Lý Kho Thông Minh**
- **Dự báo nhu cầu** (AI-based)
- **Tự động tạo** đơn điều chuyển
- **Cảnh báo** kho thấp (< 10 ly)
- **Gợi ý** tái phân bổ
- **Tracking** từng ly
- **Báo cáo** ly hỏng/mất

#### **4. 👥 User Management Nâng Cao**
- **Tìm kiếm:** Email, student ID, tên
- **Chi tiết:** Profile, lịch sử, thống kê
- **Điều chỉnh:** Số dư, points (có lý do)
- **Tặng rewards** cho user
- **Email/notification** hàng loạt
- **Phân nhóm:** Theo khoa, hạng, behavior
- **Blacklist:** Quản lý vi phạm

#### **5. 📈 Báo Cáo Tự Động**
- **Daily Report** (7h sáng):
  - Giao dịch hôm qua
  - Ly quá hạn
  - User mới

- **Weekly Report** (Thứ 2):
  - Top users
  - Performance các store
  - Tài chính

- **Monthly Report:**
  - Tổng kết tháng
  - So sánh tháng trước
  - Insights & recommendations

#### **6. 🎯 Campaign Manager**
- **Tạo campaigns:**
  - Happy Hour (giờ vàng)
  - Welcome Freshmen (tân SV)
  - Earth Week (tuần môi trường)
  - Coffee Lover (quán cà phê)

- **Quản lý:**
  - Thời gian, target, reward
  - Budget points
  - Preview & schedule

#### **7. 🔧 System Settings**
- **Deposit & Penalty:**
  - Tiền cọc, thời gian trả, phạt/giờ
  - Max overdue hours

- **Points:**
  - Points cho return, check-in, feed

- **Gamification:**
  - Rank thresholds

- **Features:**
  - Enable/disable ChatAI, Green Feed, Friends, Challenges, Rewards
  - Maintenance mode

#### **8. 🔐 Admin Roles & Permissions**
- **Roles:**
  - Super Admin: Full quyền
  - Store Manager: Quản lý kho
  - Support Staff: View + manage users

- **Permissions:**
  - view_dashboard, create_qr, manage_users
  - blacklist_users, manage_inventory
  - view_analytics, export_data
  - manage_campaigns, system_settings

#### **9. 📤 Bulk Operations**
- **Import users** từ CSV/Excel
- **Export data** (users, transactions, cups)
- **Tặng points/rewards** hàng loạt
- **Gửi email/notification** hàng loạt
- **Tag users** theo group

#### **10. 🚨 Incident Management**
- **Loại sự cố:**
  - Ly bị mất
  - Ly hỏng
  - Quá hạn
  - Khiếu nại

- **Workflow:**
  - Open → Investigating → Resolved → Closed
  - Assign admin
  - Priority (low/medium/high/critical)

---

## 🛠️ **TECH STACK**

### **Frontend**
- **Framework:** Next.js 14 (App Router), React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **3D:** React Three Fiber, Drei
- **Maps:** Google Maps API
- **Icons:** Lucide React, React Icons

### **Backend**
- **Database:** Firebase Firestore, Prisma (SQLite backup)
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Functions:** Next.js API Routes
- **Realtime:** Firebase Realtime Database

### **Third-party Integrations**
- **Payment:** VNPay, MoMo, ZaloPay (planned)
- **Email:** Resend
- **AI Chat:** Google Gemini AI
- **QR Code:** qrcode, html5-qrcode
- **Notifications:** Firebase Cloud Messaging

### **Tools**
- **State Management:** Zustand
- **Date:** date-fns
- **HTTP:** Fetch API
- **Dev:** ESLint, Prettier (planned)

---

## 📦 **CÀI ĐẶT & CHẠY DỰ ÁN**

### **1. Yêu Cầu Hệ Thống**
- **Node.js:** >= 18.x
- **npm/yarn/pnpm**
- **Git**

### **2. Clone Repository**
```bash
git clone https://github.com/qtu11/SipMart.git
cd CupSipSmart
```

### **3. Cài Đặt Dependencies**
```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

### **4. Cấu Hình Environment Variables**

Tạo file `.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEPOSIT_AMOUNT=20000
NEXT_PUBLIC_BORROW_DURATION_HOURS=24

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# Email (Resend)
RESEND_API_KEY=your_resend_key

# Payment (planned)
# VNPAY_TMN_CODE=your_vnpay_code
# VNPAY_SECRET_KEY=your_vnpay_secret
# MOMO_PARTNER_CODE=your_momo_code
# MOMO_ACCESS_KEY=your_momo_key
```

### **5. Setup Firebase**

1. Tạo Firebase Project tại [console.firebase.google.com](https://console.firebase.google.com)
2. Bật **Authentication** (Email/Password, Google)
3. Tạo **Firestore Database** (production mode)
4. Bật **Storage**
5. Bật **Cloud Messaging** (FCM)
6. Copy config vào `.env.local`

### **6. Chạy Development Server**
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

### **7. Build Production**
```bash
npm run build
npm run start
```

---

## 📁 **CẤU TRÚC DỰ ÁN**

```
CupSipSmart/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── achievements/         # Achievements API
│   │   ├── rewards/              # Rewards Store API
│   │   ├── challenges/           # Challenges API
│   │   ├── payment/              # Payment API
│   │   ├── transactions/         # Transaction History API
│   │   ├── eco/                  # Eco Dashboard API
│   │   ├── admin/                # Admin APIs
│   │   │   ├── advanced-analytics/
│   │   │   ├── campaigns/
│   │   │   ├── settings/
│   │   │   ├── incidents/
│   │   │   ├── inventory/
│   │   │   ├── bulk/
│   │   │   ├── qr/
│   │   │   ├── reports/
│   │   │   └── roles/
│   │   └── [existing APIs]
│   ├── [pages]/                  # App Pages
│   └── layout.tsx
├── components/                   # React Components
│   ├── AuthGuard.tsx
│   ├── ChatAI.tsx
│   ├── Footer.tsx
│   ├── NotificationProvider.tsx
│   └── [more components]
├── lib/                          # Libraries & Utilities
│   ├── firebase/                 # Firebase Helpers
│   │   ├── achievements.ts       # ✨ NEW
│   │   ├── rewards.ts            # ✨ NEW
│   │   ├── challenges.ts         # ✨ NEW
│   │   ├── payments.ts           # ✨ NEW
│   │   ├── analytics.ts          # ✨ NEW
│   │   ├── admin-advanced.ts     # ✨ NEW
│   │   └── [existing helpers]
│   ├── types/
│   │   └── index.ts              # ✨ UPDATED with new types
│   └── utils/
├── prisma/
│   └── schema.prisma             # ✨ UPDATED with new models
├── public/                       # Static Assets
├── .env.local                    # Environment Variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md                     # ✨ THIS FILE
```

---

## 🎯 **API ENDPOINTS**

### **User APIs**

| **Endpoint** | **Method** | **Description** |
|-------------|------------|-----------------|
| `/api/achievements` | GET | Lấy danh sách achievements |
| `/api/achievements/user` | GET, POST | User achievements, unlock |
| `/api/rewards` | GET | Lấy rewards store |
| `/api/rewards/claim` | GET, POST | Đổi thưởng |
| `/api/challenges` | GET, POST | Challenges & join |
| `/api/payment/methods` | GET, POST, PUT | Payment methods |
| `/api/payment/topup` | POST | Top-up wallet |
| `/api/transactions/history` | GET | Transaction history |
| `/api/eco/dashboard` | GET | Personal eco dashboard |

### **Admin APIs**

| **Endpoint** | **Method** | **Description** |
|-------------|------------|-----------------|
| `/api/admin/advanced-analytics` | GET | Advanced analytics |
| `/api/admin/campaigns` | GET, POST, PUT | Campaign manager |
| `/api/admin/settings` | GET, PUT | System settings |
| `/api/admin/incidents` | GET, POST, PUT | Incident management |
| `/api/admin/inventory` | GET, POST, PUT | Inventory management |
| `/api/admin/bulk` | POST | Bulk operations |
| `/api/admin/qr/design` | POST | Custom QR design |
| `/api/admin/reports` | GET, POST | Auto reports |
| `/api/admin/roles` | GET, POST | Admin roles |

---

## 🌐 **DEPLOYMENT**

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t cupsipsmart .
docker run -p 3000:3000 cupsipsmart
```

---

## 📝 **CONTRIBUTING**

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 **LICENSE**

MIT License

---

## 👥 **TEAM**

- **Lead Developer:** AstraX Dev Ultra
- **Project Manager:** Nguyễn Quang Tú

---

## 📞 **SUPPORT**

- **Email:** support@cupsipsmart.vn
- **Website:** https://cupsipsmart.vn
- **Facebook:** /CupSipSmart
- **Hotline:** 1900 xxxx

---

## 🎉 **CHANGELOG**

### **Version 2.0.0** (2024-12-28) - ✨ MAJOR UPDATE

#### **New Features:**
- 🏆 Achievement & Badges System (8 badges)
- 🎁 Rewards Store (7 rewards)
- 🎯 Challenges & Events (weekly + special)
- 💳 Multi-payment Integration (VNPay/MoMo/ZaloPay)
- 📊 Transaction History with Filters
- 🌍 Personal Eco Dashboard
- 📍 Find Friends Nearby
- 🔔 Smart Notifications (8 types)
- 🤖 AI Chatbot Enhanced
- 🎮 Mini Games (3 games)

#### **Admin Features:**
- 📊 Advanced Analytics Dashboard
- 🎨 Custom QR Code Designer
- 📦 Smart Inventory Management
- 👥 Advanced User Management
- 📈 Auto Reports (Daily/Weekly/Monthly)
- 🎯 Campaign Manager
- 🔧 System Settings UI
- 🔐 Roles & Permissions
- 📤 Bulk Operations
- 🚨 Incident Management

#### **Technical Improvements:**
- TypeScript types updated
- Prisma schema với 15 models mới
- 20+ API routes mới
- Firebase helpers tái cấu trúc
- Performance optimization

### **Version 1.0.0** (2024-11-XX)
- Initial release
- Basic borrow/return functionality
- Wallet & transactions
- Gamification (tree, leaderboard)
- Green Feed & Stories
- Friends system

---

## 🚀 **ROADMAP**

### **Q1 2025**
- [ ] Mobile App (React Native)
- [ ] AR Features (quét ly bằng camera)
- [ ] Mini App Zalo/MoMo
- [ ] Voice Assistant integration

### **Q2 2025**
- [ ] Blockchain integration (NFT badges)
- [ ] Carbon Credit trading
- [ ] Partnership expansion (100+ stores)
- [ ] International version (English)

### **Q3 2025**
- [ ] AI recommendation engine
- [ ] Predictive analytics
- [ ] IoT smart cups
- [ ] Automated washing stations

---

**🌍 CupSipSmart - Mượn ly, Cứu hành tinh!**

*Made with 💚 in Vietnam*
