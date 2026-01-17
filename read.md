# 📖 TỔNG HỢP QUY TRÌNH HOẠT ĐỘNG HỆ THỐNG SIPMART

> **Hệ thống mượn trả ly tái sử dụng thông minh dành cho Gen Z**  
> Ngày cập nhật: 16/01/2026

---

## 🎯 1. TỔNG QUAN HỆ THỐNG

**SipMart** là nền tảng quản lý mượn trả ly tái sử dụng, kết hợp:
- ✅ Thanh toán tự động (VNPay)
- ✅ Gamification (điểm xanh, hạng, thành tựu, thử thách)
- ✅ Social Network (feed, bạn bè, chat, stories)
- ✅ Eco Impact Tracking (CO₂, nước, điện tiết kiệm)
- ✅ Admin Dashboard (quản lý, phân tích, báo cáo)

---

## 🔄 2. QUY TRÌNH SỬ DỤNG CHÍNH

### **BƯỚC 1: ĐĂNG KÝ & NẠP TIỀN**

```
User → Đăng ký (Supabase Auth) → Xác minh email → Đăng nhập 
     → Nạp tiền qua VNPay → Wallet có số dư → Sẵn sàng mượn ly
```

**Chi tiết:**
- Email/Password hoặc Google Sign-in
- Mỗi user có `wallet_balance` (số dư ví)
- Nạp tối thiểu: **10,000 VNĐ**
- Tiền cọc mặc định: **20,000 VNĐ/ly**

**Database:**
- Table `users`: Lưu thông tin, số dư, điểm xanh, hạng
- Table `payment_transactions`: Log giao dịch nạp tiền

---

### **BƯỚC 2: MƯỢN LY (BORROW)**

```
User quét QR → App gọi API /api/borrow → Kiểm tra điều kiện 
→ Trừ tiền cọc → Cập nhật trạng thái ly → Tạo giao dịch 
→ Cộng Green Points → Gửi thông báo → Hoàn tất
```

**Flow API `/api/borrow`:**

1. **Authentication** - Verify JWT token
2. **Rate Limiting** - 10 requests/phút/user
3. **Validation** (Zod):
   - `cupId` (string, required)
   - `storeId` (UUID, required)

4. **Kiểm tra User:**
   - User tồn tại
   - Không bị blacklist (`is_blacklisted = false`)
   - Số dư ví ≥ 20,000 VNĐ
   - Không vượt giới hạn gói hạng (tier limit)

5. **Kiểm tra Ly:**
   - Ly tồn tại (`cups` table)
   - Trạng thái = `available` (chưa ai mượn)

6. **Kiểm tra Store:**
   - Store tồn tại
   - Có ly khả dụng (`cup_available > 0`)

7. **Thực hiện Transaction (ATOMIC):**
   ```sql
   -- Gọi RPC function borrowCupAtomic()
   BEGIN;
   
   -- Trừ tiền cọc
   UPDATE users 
   SET wallet_balance = wallet_balance - 20000 
   WHERE user_id = ?;
   
   -- Cập nhật ly
   UPDATE cups 
   SET status = 'in_use', 
       current_user_id = ?, 
       current_transaction_id = ? 
   WHERE cup_id = ? AND status = 'available';
   
   -- Tạo transaction
   INSERT INTO transactions (...) VALUES (...);
   
   -- Cập nhật inventory store
   UPDATE stores 
   SET cup_available = cup_available - 1, 
       cup_in_use = cup_in_use + 1;
   
   COMMIT;
   ```

8. **Gamification:**
   - Cộng **+50 Green Points**
   - Nếu lần đầu: **+100 bonus points**, badge "First Cup"
   - Cập nhật streak (user_green_streaks)
   - Cập nhật tiến độ challenges (user_challenges)

9. **Logging:**
   - Tạo `audit_log` (action: borrow_cup)
   - Tạo `eco_action` (tracking môi trường)

10. **Notification & Email:**
    - Gửi notification: "🎉 Mượn ly thành công! +50 Green Points"
    - Email xác nhận (async, non-blocking)

**Database Tables:**
- `transactions` → Giao dịch mượn/trả
- `cups` → Trạng thái ly
- `stores` → Kho ly
- `users` → Số dư, điểm
- `user_green_streaks` → Streak
- `audit_logs` → Lịch sử hành động

---

### **BƯỚC 3: SỬ DỤNG LY**

**User có thể:**
- Xem thời gian còn lại (24h)
- Xem điểm xanh đã nhận
- Xem eco impact (CO₂, nước, điện tiết kiệm)
- Nhận thông báo:
  - ⏰ **1h trước đáo hạn**: "Sắp đến hạn trả ly!"
  - 🚨 **Quá hạn**: "Ly đã quá hạn! Phạt 5,000đ/giờ"

**Cron Jobs:**
- `/api/cron/due-reminders` - Gửi nhắc nhở trước 1h
- `/api/cron/check-overdue` - Kiểm tra quá hạn

---

### **BƯỚC 4: TRẢ LY (RETURN)**

```
User quét QR → API /api/return → Kiểm tra quyền sở hữu 
→ Tính refund/phạt → Hoàn tiền → Cập nhật ly → Cộng điểm 
→ Gửi thông báo → Hoàn tất
```

**Flow API `/api/return`:**

1. **Authentication & Validation**
2. **Kiểm tra:**
   - Ly đang `in_use`
   - User hiện tại = người mượn (`current_user_id`)
   - Transaction đang `ongoing`

3. **Tính toán Refund:**
   ```javascript
   // Không quá hạn (≤ 24h)
   if (duration <= 24h) {
     refund = 20,000 VNĐ  // Hoàn đầy đủ
     points = +50
     
     // Bonus nếu trả nhanh < 1h
     if (duration < 1h) {
       points = +100
       badge = "Speed Returner"
     }
   }
   
   // Quá hạn 24-48h
   else if (duration <= 48h) {
     penalty = (overdue_hours * 5000)  // 5k/giờ
     refund = 20,000 - penalty
     points = +20
   }
   
   // Quá hạn > 48h
   else {
     refund = 0  // Mất tiền cọc
     points = 0
     blacklist_count++  // Cảnh cáo
   }
   ```

4. **Atomic Operation:**
   ```sql
   BEGIN;
   
   -- Hoàn tiền
   UPDATE users SET wallet_balance = wallet_balance + refund;
   
   -- Cập nhật ly
   UPDATE cups SET status = 'cleaning', current_user_id = NULL;
   
   -- Hoàn thành transaction
   UPDATE transactions SET status = 'completed', return_time = NOW();
   
   -- Cộng điểm
   UPDATE users SET green_points = green_points + points;
   
   COMMIT;
   ```

5. **Gamification:**
   - Cập nhật stats: `total_cups_saved++`, `total_plastic_reduced`
   - Check achievements: "Zero Waste" (không quá hạn lần nào)
   - Cập nhật leaderboard
   - Cập nhật hạng (rank_level)

6. **Notifications:**
   - "💰 Hoàn tiền thành công! +{refund} VNĐ, +{points} điểm"
   - Nếu lên hạng: "🎉 Bạn đã lên hạng Sprout!"

---

### **BƯỚC 5: ĐỔI THƯỞNG & TÍCH ĐIỂM**

**User dùng Green Points đổi:**
- Vouchers (cà phê, trà sữa, miễn cọc)
- Merchandise (túi vải, sticker)
- Privileges (priority pass)
- Charity (trồng cây thật)

**Flow đổi thưởng:**

```
User chọn reward → API /api/rewards/claim 
→ Kiểm tra điểm đủ → Trừ điểm → Tạo claim_code 
→ Giảm stock → Gửi notification → QR code/voucher
```

**Database:**
- `rewards` - Danh sách phần thưởng
- `reward_claims` - Lịch sử đổi thưởng

---

## 💰 3. HỆ THỐNG THANH TOÁN (VNPAY)

### **A. NẠP TIỀN (TOP-UP)**

```
User → Chọn số tiền → API /api/payment/create_url 
→ VNPay URL → User thanh toán → VNPay callback 
→ API /api/payment/vnpay_return → Xác thực → Cộng tiền
```

**Chi tiết:**

1. **Tạo Payment URL:**
   ```javascript
   // /api/payment/create_url
   - Validate amount ≥ 10,000 VNĐ
   - Create payment_transaction (status: pending)
   - Generate VNPay payment URL (HMAC signature)
   - Return URL + transaction code
   ```

2. **User thanh toán tại VNPay**

3. **VNPay Callback:**
   ```javascript
   // /api/payment/vnpay_return
   - Verify HMAC signature
   - Decode response
   
   if (response_code == "00") {  // Thành công
     - Update payment_transaction (status: completed)
     - Update user wallet_balance
     - Create notification
     - Send email
   } else {  // Thất bại
     - Update payment_transaction (status: failed)
     - Log error
   }
   ```

**Security:**
- HMAC-SHA512 signature verification
- IP logging
- Timeout mechanism (15 phút)
- Unique transaction code

---

## 🎮 4. HỆ THỐNG GAMIFICATION

### **A. GREEN POINTS - ĐIỂM XANH**

**Nguồn điểm:**
| Hành động | Điểm |
|-----------|------|
| Mượn ly lần đầu | +50 (bonus: +100) |
| Trả đúng hạn | +50 |
| Trả nhanh < 1h | +100 |
| Chia sẻ lên Feed | +30 |
| Kết bạn | +10 |
| Check-in store | +20 |
| Hoàn thành Challenge | +200-500 |
| Streak bonus (7 ngày liên tiếp) | +500 |

**Hạng (Rank Level):**
| Hạng | Điểm cần | Benefits |
|------|----------|----------|
| 🌱 Seed | 0 - 499 | Mượn tối đa 2 ly |
| 🌿 Sprout | 500 - 1,499 | Mượn tối đa 3 ly |
| 🌳 Sapling | 1,500 - 4,999 | Mượn tối đa 5 ly, ưu tiên support |
| 🌲 Tree | 5,000 - 9,999 | Mượn tối đa 10 ly, miễn phí giao ly |
| 🌲🌲 Forest | 10,000+ | Unlimited, VIP rewards |

---

### **B. ACHIEVEMENTS (THÀNH TỰU)**

**8 Badges:**

1. **🌟 First Cup** - Mượn ly đầu tiên
2. **⚡ Speed Returner** - Trả < 1h
3. **🔥 Streak Master** - 7 ngày liên tiếp
4. **🌍 Eco Warrior** - Cứu 100 ly
5. **💚 Zero Waste** - Không quá hạn lần nào
6. **🎓 Campus Champion** - Top 10 trường
7. **🤝 Social Butterfly** - 10+ bạn bè
8. **📸 Content Creator** - 50+ bài đăng

**Database:**
- `achievements` - Định nghĩa badges
- `user_achievements` - Badges của user

---

### **C. CHALLENGES (THỬ THÁCH)**

**Loại challenges:**
- **Daily** - Hàng ngày
- **Weekly** - Hàng tuần
- **Monthly** - Hàng tháng
- **Special** - Sự kiện đặc biệt

**Ví dụ:**
- "Return Fast Week" - Trả < 2h trong tuần → +500 points
- "Eco Week" - Mượn 10 ly/tuần → +300 points
- "Share Your Cup" - Đăng 5 bài → +200 points

**Database:**
- `challenges` - Định nghĩa thử thách
- `user_challenges` - Tiến độ của user

---

### **D. STREAK SYSTEM**

**Cơ chế:**
- Mỗi ngày mượn/trả ly = duy trì streak
- Streak boost điểm nhận được
- Streak reset nếu skip 1 ngày

**Database:**
- `user_green_streaks`:
  - `current_streak` - Streak hiện tại
  - `longest_streak` - Streak dài nhất
  - `last_activity_date` - Ngày hoạt động cuối

---

## 🤝 5. HỆ THỐNG SOCIAL

### **A. KẾT BẠN (FRIENDS)**

**Flow:**
```
User tìm kiếm → Search by student_id/email 
→ Gửi friend request → User 2 nhận notification 
→ Accept/Reject → Tạo friendship
```

**APIs:**
- `/api/friends/search` - Tìm kiếm user
- `/api/friends/request` - Gửi lời mời
- `/api/friends/accept` - Chấp nhận
- `/api/friends/reject` - Từ chối
- `/api/friends/list` - Danh sách bạn bè

**Database:**
- `friend_requests` - Lời mời kết bạn
- `friendships` - Quan hệ bạn bè

---

### **B. GREEN FEED (MẠNG XÃ HỘI)**

**User có thể:**
- Đăng bài với ảnh + caption
- Tag ly đã mượn (cupId)
- Like bài của bạn bè
- Comment
- Share

**Database:**
- `green_feed_posts`:
  - `user_id`, `image_url`, `caption`
  - `cup_id` (optional)
  - `green_points_earned` - Điểm nhận khi post
  - `likes` - Số lượt thích
  - `emotion` - Cảm xúc (happy, proud, motivated...)

---

### **C. STORIES**

**Tương tự Instagram Stories:**
- Tự động hết hạn sau 24h
- Loại: image, video, achievement, milestone
- Share thành tựu khi unlock badge

**Database:**
- `stories`:
  - `type`, `content`, `thumbnail`
  - `achievement_type`, `achievement_data`
  - `expires_at` - Tự động xóa

---

### **D. CHAT (MESSAGES)**

**Features:**
- 1-1 chat với bạn bè
- Group chat
- Gửi ảnh/video
- Typing indicator
- Read receipts

**Database:**
- `conversations` - Cuộc trò chuyện
- `conversation_participants` - Thành viên
- `messages` - Tin nhắn
- `message_attachments` - File đính kèm

**Storage:**
- Supabase Storage bucket: `chat-media`

---

## 🗺️ 6. HỆ THỐNG MAP & STORES

### **Tìm cửa hàng gần nhất:**

**Features:**
- Hiển thị tất cả stores trên map (Google Maps API)
- Filter theo khoảng cách
- Xem số ly khả dụng (`cup_available`)
- Navigation đến store
- Chi tiết store: address, hours, inventory

**Database:**
- `stores`:
  - `name`, `address`
  - `gps_lat`, `gps_lng` - Tọa độ GPS
  - `cup_available`, `cup_in_use`, `cup_cleaning`, `cup_total`
  - `partner_status` - active/inactive/pending

**Frontend:**
- Page: `/map`
- Component: Google Maps integration

---

## 🔔 7. HỆ THỐNG THÔNG BÁO

### **A. THÔNG BÁO CÁ NHÂN (NOTIFICATIONS)**

**Loại thông báo:**
- ✅ `success` - Mượn/trả thành công
- ⏰ `reminder` - Sắp đến hạn
- 🚨 `warning` - Quá hạn
- 🎉 `info` - Lên hạng, unlock achievement
- 👥 `friend` - Lời mời kết bạn

**Database:**
- `notifications`:
  - `user_id`, `type`, `title`, `message`
  - `url` - Deep link
  - `data` (JSONB) - Metadata
  - `read` - Đã đọc chưa

---

### **B. BROADCAST (ADMIN → ALL USERS)**

**Admin có thể gửi thông báo hệ thống:**

**Flow:**
```
Admin điền form → API /api/admin/notifications/broadcast 
→ Tạo system_notification → Filter target users 
→ Batch create notifications (chunks 1000)
→ Users nhận thông báo
```

**Target Filtering:**
- **All** - Tất cả user
- **Active** - Hoạt động trong 7 ngày
- **Inactive** - Không hoạt động > 30 ngày
- **New** - Đăng ký < 7 ngày
- **Premium** - Hạng Tree/Forest
- **Specific Rank** - Filter theo hạng

**Database:**
- `system_notifications` - Thông báo hệ thống
- Auto-create `notifications` cho từng user

---

## 📊 8. ADMIN DASHBOARD & QUẢN LÝ

### **A. ANALYTICS DASHBOARD**

**Metrics:**
- Total Users, Active Users, Churn Rate
- Cups: Available, In Use, Cleaning, Lost
- Revenue, Refunds, Penalties
- Peak hours, peak days
- User growth chart
- Transaction volume chart

**APIs:**
- `/api/admin/analytics` - Thống kê cơ bản
- `/api/admin/advanced-analytics` - AI predictions

---

### **B. USER MANAGEMENT**

**Chức năng:**
- Xem danh sách users
- Chi tiết user: profile, transactions, stats
- Điều chỉnh số dư (`wallet_balance`)
- Điều chỉnh điểm (`green_points`)
- Blacklist user (cấm mượn ly)
- Unblacklist
- Gửi notification riêng

**Database:**
- `users` table
- `audit_logs` - Log mọi thay đổi admin thực hiện

---

### **C. QUẢN LÝ LY (CUPS)**

**Chức năng:**
- Tạo batch ly mới
- Generate QR codes
- Xem trạng thái ly (available, in_use, cleaning, lost)
- Đánh dấu ly mất/hỏng
- Export QR codes (PDF)

**Flow tạo ly:**
```
Admin → Chọn số lượng + material (PP Plastic/Bamboo Fiber) 
→ API /api/admin/cups/batch 
→ Generate unique cupId 
→ Create QR codes 
→ Insert vào database 
→ Download PDF với QR codes
```

---

### **D. QUẢN LÝ STORES**

**Chức năng:**
- Thêm/sửa/xóa stores
- Cập nhật GPS location
- Quản lý inventory (kho ly)
- Xem performance (giao dịch, doanh thu)
- Active/Inactive store

---

### **E. QR CODE DESIGNER**

**Features:**
- Custom logo overlay
- Chọn màu sắc theo material
- Kích thước: 300x300, 500x500, 1000x1000
- Export PDF hàng loạt (print-ready)

**API:**
- `/api/admin/qr/design`

---

### **F. BULK OPERATIONS**

**Chức năng:**
- Import users từ CSV/Excel
- Export data (users, transactions, cups)
- Gửi email/notification hàng loạt
- Tặng points/rewards hàng loạt

**API:**
- `/api/admin/bulk`

---

### **G. BÁO CÁO TỰ ĐỘNG (AUTO REPORTS)**

**Loại báo cáo:**
- **Daily Report** (7h sáng):
  - Giao dịch hôm qua
  - Ly quá hạn
  - User mới
  
- **Weekly Report** (Thứ 2):
  - Top users
  - Performance stores
  - Tài chính

- **Monthly Report:**
  - Tổng kết tháng
  - So sánh tháng trước
  - Insights & recommendations

**Gửi qua:**
- Email
- Notification

---

## 🛡️ 9. BẢO MẬT & SECURITY

### **Authentication:**
- Supabase Auth (JWT tokens)
- Row Level Security (RLS) policies

### **API Security:**
- Rate limiting (10-20 requests/phút)
- Input validation (Zod schemas)
- SQL injection prevention (Parameterized queries)
- XSS protection

### **Payment Security:**
- VNPay HMAC-SHA512 signature verification
- IP logging
- Transaction timeout (15 phút)

### **Database Security:**
- RLS policies cho từng table
- Admin-only access cho sensitive operations
- Audit logs cho mọi thay đổi quan trọng

---

## 🗄️ 10. KIẾN TRÚC DATABASE

### **Core Tables:**
1. `users` - Người dùng
2. `cups` - Ly
3. `stores` - Cửa hàng
4. `transactions` - Giao dịch mượn/trả
5. `payment_transactions` - Thanh toán

### **Gamification Tables:**
6. `rewards` - Phần thưởng
7. `reward_claims` - Đổi thưởng
8. `achievements` - Thành tựu
9. `user_achievements` - Thành tựu của user
10. `challenges` - Thử thách
11. `user_challenges` - Tiến độ thử thách
12. `user_green_streaks` - Streak

### **Social Tables:**
13. `friendships` - Bạn bè
14. `friend_requests` - Lời mời kết bạn
15. `green_feed_posts` - Bài đăng
16. `green_feed_comments` - Bình luận
17. `green_feed_likes` - Thích
18. `stories` - Stories
19. `conversations` - Cuộc trò chuyện
20. `messages` - Tin nhắn

### **Admin Tables:**
21. `admins` - Quản trị viên
22. `audit_logs` - Lịch sử thao tác
23. `system_notifications` - Thông báo hệ thống
24. `notifications` - Thông báo cá nhân

### **Partner Tables:**
25. `vouchers` - Voucher
26. `user_vouchers` - Voucher của user
27. `merchant_accounts` - Tài khoản đối tác
28. `partner_contracts` - Hợp đồng
29. `partner_settlements` - Thanh toán đối tác

### **Logistics Tables:**
30. `cup_cleaning_logs` - Lịch sử vệ sinh ly
31. `cup_hygiene_checks` - Kiểm tra vệ sinh
32. `redistribution_requests` - Yêu cầu điều phối ly

---

## 🚀 11. FLOW CÔNG NGHỆ

### **Frontend → Backend:**
```
Next.js Page/Component → API Route (/app/api/*) 
→ Supabase Client (Server-side) → PostgreSQL
→ Response JSON → Update UI
```

### **Authentication Flow:**
```
Login Form → Supabase Auth → JWT Token 
→ Store in Cookie → Middleware verify 
→ Attach userId to requests
```

### **Real-time Updates:**
```
Component → useEffect → Supabase Realtime Subscribe 
→ Listen to DB changes → Auto update UI
```

---

## 📱 12. TÍNH NĂNG BỔ SUNG

### **A. ECO IMPACT TRACKING**

Mỗi ly tái sử dụng tiết kiệm:
- 17g CO₂
- 0.5 lít nước
- 0.03 kWh điện

**Personal Eco Dashboard:**
- Tổng ly đã cứu
- CO₂ giảm
- Nước tiết kiệm
- Điện tiết kiệm
- Cây trồng tương đương
- Biểu đồ theo tháng

---

### **B. MINI GAMES**

1. **Tree Watering** - Tưới cây ảo mỗi ngày → +points
2. **Cup Catch** - Game bắt ly rơi → +points
3. **Eco Quiz** - Câu hỏi môi trường → +points

---

### **C. AI CHATBOT**

Powered by Google Gemini AI:
- FAQ tự động
- Tìm cửa hàng gần nhất
- Hướng dẫn mượn/trả
- Kiểm tra số dư, lịch sử
- Gợi ý kiếm points nhanh

---

## 🔧 13. CẤU HÌNH HỆ THỐNG

### **Biến môi trường (.env.local):**

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# App Config
NEXT_PUBLIC_APP_URL=https://sipmart.vercel.app
NEXT_PUBLIC_DEPOSIT_AMOUNT=20000
NEXT_PUBLIC_BORROW_DURATION_HOURS=24

# Payment
VNPAY_TMN_CODE=xxx
VNPAY_SECRET_KEY=xxx

# AI
GEMINI_API_KEY=xxx

# Email
RESEND_API_KEY=xxx

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
```

---

## 📋 14. API ENDPOINTS SUMMARY

### **User APIs:**
- `POST /api/borrow` - Mượn ly
- `POST /api/return` - Trả ly
- `GET /api/transactions` - Lịch sử giao dịch
- `POST /api/payment/create_url` - Tạo link thanh toán
- `GET /api/rewards` - Danh sách rewards
- `POST /api/rewards/claim` - Đổi thưởng
- `GET /api/achievements` - Thành tựu
- `GET /api/challenges` - Thử thách
- `GET /api/friends` - Bạn bè
- `GET /api/feed` - Green feed
- `GET /api/eco/dashboard` - Eco dashboard

### **Admin APIs:**
- `GET /api/admin/analytics` - Thống kê
- `GET /api/admin/users` - Quản lý users
- `POST /api/admin/cups/batch` - Tạo batch ly
- `POST /api/admin/notifications/broadcast` - Gửi thông báo hệ thống
- `GET /api/admin/stores` - Quản lý stores
- `POST /api/admin/bulk` - Thao tác hàng loạt

### **System APIs:**
- `GET /api/cron/due-reminders` - Nhắc nhở trả ly
- `GET /api/cron/check-overdue` - Kiểm tra quá hạn
- `GET /api/cron/refresh-rankings` - Cập nhật leaderboard

---

## 🎯 15. KẾT LUẬN

**SipMart** là hệ thống hoàn chỉnh với:

✅ **Core Features:**
- Mượn/trả ly tự động với QR code
- Thanh toán VNPay seamless
- Gamification đầy đủ (điểm, hạng, badges, challenges)

✅ **Social Features:**
- Kết bạn, feed, chat, stories
- Leaderboard, eco impact tracking

✅ **Admin Tools:**
- Dashboard analytics
- User/Cup/Store management
- Broadcast notifications
- Bulk operations
- Auto reports

✅ **Security:**
- Supabase Auth + RLS
- Rate limiting
- Input validation
- Audit logging
- Payment encryption

✅ **Scalability:**
- Next.js serverless
- Supabase PostgreSQL
- Atomic transactions
- Optimized queries

---

**Hệ thống sẵn sàng production với khả năng mở rộng cao!**

🌍 **SipMart - Mượn ly, Cứu hành tinh!**

*Made with 💚 by Nguyễn Quang Tú - UEF University*
