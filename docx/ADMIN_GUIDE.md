# 🔧 Hướng Dẫn Quản Trị - CupSipSmart Admin

## Dành cho Admin

---

## 1. 🔐 Đăng Nhập Admin

### Truy cập
1. Vào URL: `https://domain.com/admin`
2. Đăng nhập với tài khoản admin
3. Dashboard admin sẽ hiển thị

### Yêu cầu
- Tài khoản phải có role `admin` hoặc `super_admin`
- 2FA được khuyến nghị

---

## 2. 📊 Dashboard

### Metrics Realtime
- 👥 Tổng người dùng
- ☕ Tổng số ly
- 💰 Tổng doanh thu
- 📈 Giao dịch hôm nay
- 🌱 Điểm xanh đã phát

### Charts
- Biểu đồ giao dịch theo ngày
- Biểu đồ người dùng mới
- Top cửa hàng

---

## 3. 👤 Quản Lý Người Dùng

### Xem danh sách
1. Menu → **"Users"**
2. Tìm kiếm theo email/student_id
3. Lọc theo rank, status

### Thao tác
| Hành động | Mô tả |
|-----------|-------|
| **View** | Xem chi tiết user |
| **Edit** | Chỉnh sửa thông tin |
| **Blacklist** | Khóa tài khoản |
| **Adjust Balance** | Điều chỉnh ví |
| **Reset Password** | Gửi email reset |

### Blacklist User
1. Chọn user cần khóa
2. Nhấn **"Blacklist"**
3. Nhập lý do
4. Xác nhận

---

## 4. ☕ Quản Lý Ly (Cups)

### Tạo ly mới
1. Menu → **"Cups"** → **"Tạo mới"**
2. Điền thông tin:
   - Cup ID (8 số, tự động)
   - Material (PP Plastic / Bamboo Fiber)
   - Store (cửa hàng ban đầu)
3. Nhấn **"Tạo"**
4. QR Code được tự động generate

### Tạo hàng loạt
1. Nhấn **"Bulk Create"**
2. Chọn số lượng
3. Chọn material
4. Chọn store
5. Tải về file QR codes

### Trạng thái ly
| Status | Mô tả |
|--------|-------|
| `available` | Sẵn sàng mượn |
| `in_use` | Đang được mượn |
| `cleaning` | Đang vệ sinh |
| `damaged` | Hư hỏng |
| `lost` | Thất lạc |

---

## 5. 🏪 Quản Lý Cửa Hàng

### Thêm cửa hàng
1. Menu → **"Stores"** → **"Thêm mới"**
2. Điền thông tin:
   - Tên cửa hàng
   - Địa chỉ
   - GPS (lat, lng)
   - Liên hệ
3. Nhấn **"Lưu"**

### Quản lý inventory
- Xem số ly available/in_use/cleaning
- Chuyển ly giữa các cửa hàng
- Báo cáo thất lạc

---

## 6. 📢 Gửi Thông Báo

### Broadcast Notification
1. Menu → **"Notifications"** → **"Gửi mới"**
2. Chọn loại:
   - `info` - Thông tin
   - `warning` - Cảnh báo
   - `promotion` - Khuyến mãi
   - `maintenance` - Bảo trì
   - `event` - Sự kiện
3. Nhập tiêu đề & nội dung
4. Chọn đối tượng:
   - All users
   - Active (7 ngày)
   - Inactive (>30 ngày)
   - New (<7 ngày)
   - Premium (Tree/Forest rank)
5. Nhấn **"Gửi"**

---

## 7. 🎁 Quản Lý Rewards

### Thêm reward mới
1. Menu → **"Rewards"**
2. Nhấn **"Thêm mới"**
3. Điền thông tin:
   - Tên, mô tả
   - Điểm cần đổi
   - Số lượng stock
   - Category (voucher/merchandise/privilege/charity)
   - Hình ảnh
4. Nhấn **"Lưu"**

### Quản lý claims
- Xem danh sách đổi thưởng
- Xác nhận/hủy claim
- Theo dõi stock

---

## 8. 📈 Báo Cáo & Analytics

### Xem báo cáo
1. Menu → **"Analytics"**
2. Chọn khoảng thời gian
3. Xem:
   - Tổng giao dịch
   - Doanh thu
   - User engagement
   - Eco impact

### Export
- Xuất CSV/Excel
- Scheduled reports (daily/weekly/monthly)

---

## 9. ⚙️ Cài Đặt Hệ Thống

### System Settings
| Setting | Mô tả |
|---------|-------|
| `DEPOSIT_AMOUNT` | Tiền cọc mỗi ly (mặc định 20,000đ) |
| `BORROW_DURATION_HOURS` | Thời gian mượn (mặc định 24h) |
| `LATE_FEE_PER_HOUR` | Phí quá hạn mỗi giờ |
| `MIN_TOPUP_AMOUNT` | Nạp tối thiểu (10,000đ) |

### Maintenance Mode
- Bật/tắt chế độ bảo trì
- Gửi thông báo tự động

---

## 10. 🔄 Cron Jobs

### Danh sách jobs
| Job | Schedule | Chức năng |
|-----|----------|-----------|
| `check-overdue` | */15 min | Check giao dịch quá hạn |
| `due-reminders` | */15 min | Nhắc nhở 1h trước hạn |
| `refresh-rankings` | Hourly | Cập nhật bảng xếp hạng |
| `daily` | Midnight | Tasks hàng ngày |

### Manual trigger
```bash
curl -X POST https://domain.com/api/cron/check-overdue \
  -H "Authorization: Bearer CRON_SECRET"
```

---

## 11. 🛡️ Bảo Mật

### Best Practices
- ✅ Sử dụng 2FA
- ✅ Thay đổi password định kỳ
- ✅ Không chia sẻ tài khoản
- ✅ Review audit logs thường xuyên
- ✅ Backup database định kỳ

### Audit Logs
- Xem tại **"Settings"** → **"Audit Logs"**
- Lọc theo action, user, time
- Export khi cần

---

## 📞 Hỗ Trợ Kỹ Thuật

- **Email**: tech@cupsipsmart.com
- **Slack**: #sipmart-admin

---

*Admin Guide v1.0 | 07/01/2026*
