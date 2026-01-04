# QR Code Workflow - Quy trình hoạt động

## 📋 Tổng quan

Hệ thống QR code hoạt động theo workflow sau:

## 1️⃣ Tạo Mã QR (Admin)

**Endpoint:** `POST /api/admin/cups`

**Quy trình:**
1. Admin đăng nhập và vào trang `/admin`
2. Nhập số lượng ly và chọn chất liệu
3. Click "Tạo mã QR"
4. API sẽ:
   - Verify admin credentials
   - Tạo từng cup với 8-digit ID duy nhất
   - Lưu vào database (Firebase Admin SDK → Supabase fallback → Client SDK)
   - Tạo QR code data: `CUP|{cupId}|{material}|CupSipSmart`
   - Generate QR code image (base64)
   - Cập nhật inventory store
   - Trả về danh sách QR codes

**Format QR Code:**
```
CUP|12345678|pp_plastic|CupSipSmart
```

## 2️⃣ Quét Mã QR (User)

**Endpoint:** `POST /api/qr/scan`

**Quy trình:**
1. User mở app và vào trang `/scan`
2. Quét QR code bằng camera hoặc chọn ảnh
3. App parse QR code data:
   - Format mới: `CUP|{cupId}|{material}|CupSipSmart`
   - Format cũ (backward compatibility): URL với `cup_id` param
   - Format đơn giản: chỉ có 8 số (cup ID)
4. Gửi `cupId` và `userId` đến API
5. API tự động nhận diện hành vi:
   - **Borrow:** Cup status = `available` và user chưa mượn
   - **Return:** Cup status = `in_use` và user đang mượn
   - **Cleaning:** Cup status = `cleaning`
   - **Invalid:** Các trường hợp khác

## 3️⃣ Mượn Ly (User)

**Endpoint:** `POST /api/borrow`

**Quy trình:**
1. User quét QR code → API trả về `action: 'borrow'`
2. User click "Mượn ly"
3. API sẽ:
   - Kiểm tra số dư ví (cần >= 20,000đ)
   - Tạo transaction
   - Cập nhật cup status = `in_use`
   - Trừ tiền cọc vào ví
   - Cập nhật store inventory
   - Trả về thông tin transaction

## 4️⃣ Trả Ly (User)

**Endpoint:** `POST /api/return`

**Quy trình:**
1. User quét QR code → API trả về `action: 'return'`
2. User click "Trả ly"
3. API sẽ:
   - Tìm transaction đang ongoing
   - Cập nhật cup status = `cleaning`
   - Hoàn tiền cọc vào ví
   - Tính green points
   - Cập nhật store inventory
   - Trả về thông tin hoàn tất

## 5️⃣ Vệ Sinh Ly (Admin/Store)

**Quy trình:**
1. Sau khi user trả ly, cup status = `cleaning`
2. Admin/Store vệ sinh ly
3. Cập nhật cup status = `available`
4. Cập nhật store inventory

## 🔄 Fallback Mechanism

Hệ thống sử dụng fallback để đảm bảo hoạt động:

1. **Firebase Admin SDK** (ưu tiên)
   - Bypass security rules
   - Cần Service Account Key hoặc ADC

2. **Supabase** (fallback)
   - Sử dụng Service Role Key
   - Bypass RLS policies
   - Hoạt động nếu Firebase Admin không khả dụng

3. **Firebase Client SDK** (fallback cuối)
   - Cần user authentication
   - Tuân theo security rules

## ✅ Kiểm tra

### Test tạo QR:
1. Đăng nhập admin
2. Tạo mã QR
3. Kiểm tra console log để xem method nào được sử dụng
4. Verify QR code được tạo trong database

### Test scan QR:
1. Quét QR code đã tạo
2. Verify API trả về đúng action
3. Test mượn/trả ly
4. Verify database được cập nhật đúng

## 🐛 Troubleshooting

### Lỗi: "Could not load the default credentials"
**Giải pháp:** Xem `FIREBASE_ADMIN_SETUP.md`

### Lỗi: "Cup not found" khi quét QR
**Nguyên nhân:**
- Cup chưa được tạo trong database
- QR code format không đúng

**Giải pháp:**
- Kiểm tra cup có trong database không
- Verify QR code data format

### QR code không scan được
**Nguyên nhân:**
- QR code image bị lỗi
- Format không đúng

**Giải pháp:**
- Regenerate QR code
- Kiểm tra QR code data format





