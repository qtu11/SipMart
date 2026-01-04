# CupSipSmart - Sơ đồ Quy trình và Lưu đồ Chi tiết

Tài liệu này mô tả chi tiết các quy trình xử lý và luồng hoạt động của hệ thống CupSipSmart từ Frontend đến Backend và Database.

---

## Mục lục
1. [Kiến trúc Tổng quan](#kiến-trúc-tổng-quan)
2. [Xác thực người dùng (Authentication)](#xác-thực-người-dùng)
3. [Mượn ly (Borrow Cup)](#mượn-ly)
4. [Trả ly (Return Cup)](#trả-ly)
5. [Quản lý Ví (Wallet Management)](#quản-lý-ví)
6. [Green Feed & Social](#green-feed--social)
7. [Admin Dashboard](#admin-dashboard)
8. [Gamification System](#gamification-system)

---

## Kiến trúc Tổng quan

```
┌─────────────────┐
│   Frontend      │
│  (Next.js App)  │
└────────┬────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐
│   API Routes    │
│  (Next.js API)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Supabase│ │ Firebase│
│(PostgreSQL)│(Firestore)│
└─────────┘ └─────────┘

- Supabase: Users, Eco Actions, Admins
- Firebase: Cups, Transactions, Stores
```

---

## Xác thực người dùng (Authentication)

### Luồng đăng ký (Sign Up)

```mermaid
flowchart TD
    A[User nhập thông tin] --> B{Validate input}
    B -->|Invalid| A
    B -->|Valid| C[Gọi Supabase Auth signUp]
    C --> D{Success?}
    D -->|No| E[Hiển thị lỗi]
    D -->|Yes| F{Admin email?}
    F -->|Yes| G[Tạo Admin record trong Supabase]
    F -->|No| H[Tạo User record trong Supabase]
    G --> I[Redirect to Admin Dashboard]
    H --> J[Redirect to Home]
    
    style C fill:#e1f5ff
    style G fill:#fff4e1
    style H fill:#e1ffe1
```

**Chi tiết Database Operations:**

1. **Supabase Auth:**
   - Tạo user trong `auth.users` (Supabase built-in)
   - Trả về `user.id` (UUID)

2. **Supabase Database:**
   - INSERT vào `users` table:
     ```sql
     INSERT INTO users (user_id, email, display_name, wallet_balance, green_points, rank_level)
     VALUES (userId, email, displayName, 0, 0, 'seed')
     ```

3. **Nếu là Admin:**
   - INSERT vào `admins` table:
     ```sql
     INSERT INTO admins (admin_id, email, display_name, role)
     VALUES (userId, email, displayName, 'super_admin')
     ```

### Luồng đăng nhập (Sign In)

```mermaid
flowchart TD
    A[User nhập email/password] --> B[Gọi Supabase Auth signIn]
    B --> C{Success?}
    C -->|No| D{Admin credentials?}
    D -->|Yes| E[Tạo user trong Supabase Auth]
    D -->|No| F[Hiển thị lỗi]
    E --> G{User exists in DB?}
    C -->|Yes| G
    G -->|No| H[Tạo User record]
    G -->|Yes| I{Admin?}
    H --> I
    I -->|Yes| J[Redirect to Admin]
    I -->|No| K[Redirect to Home]
    
    style B fill:#e1f5ff
    style E fill:#fff4e1
    style H fill:#e1ffe1
```

---

## Mượn ly (Borrow Cup)

### Luồng mượn ly chi tiết

```mermaid
flowchart TD
    A[User scan QR code] --> B[Gọi API /api/borrow]
    B --> C{Validate request}
    C -->|Invalid| D[Return error]
    C -->|Valid| E[Lấy user từ Supabase]
    E --> F{User exists?}
    F -->|No| D
    F -->|Yes| G{User blacklisted?}
    G -->|Yes| D
    G -->|No| H{Wallet balance >= deposit?}
    H -->|No| D
    H -->|Yes| I[Lấy cup từ Firebase]
    I --> J{Cup available?}
    J -->|No| D
    J -->|Yes| K[Lấy store từ Firebase]
    K --> L{Store has cups?}
    L -->|No| D
    L -->|Yes| M[Trừ tiền cọc trong Supabase]
    M --> N[Firebase Transaction Start]
    N --> O[Update cup status: in_use]
    O --> P[Create transaction record]
    P --> Q[Update store inventory]
    Q --> R[Firebase Transaction Commit]
    R --> S{Success?}
    S -->|No| T[Refund wallet - rollback]
    S -->|Yes| U[Gửi email notification]
    U --> V[Return success]
    
    style E fill:#e1f5ff
    style I fill:#ffe1e1
    style M fill:#e1f5ff
    style N fill:#ffe1e1
    style U fill:#fff4e1
```

**Chi tiết Database Operations:**

1. **Supabase (Users):**
   ```sql
   -- Kiểm tra user
   SELECT * FROM users WHERE user_id = :userId;
   
   -- Trừ tiền cọc (trong API route)
   UPDATE users 
   SET wallet_balance = wallet_balance - :depositAmount
   WHERE user_id = :userId;
   ```

2. **Firebase (Atomic Transaction):**
   ```javascript
   runTransaction(async (tx) => {
     // Update cup
     tx.update(cupRef, {
       status: 'in_use',
       currentUserId: userId,
       currentTransactionId: transactionId
     });
     
     // Create transaction
     tx.set(transactionRef, {
       userId, cupId, borrowStoreId,
       borrowTime: now(),
       dueTime: now + 24h,
       status: 'ongoing',
       depositAmount: 20000
     });
     
     // Update store inventory
     tx.update(storeRef, {
       'cupInventory.available': increment(-1),
       'cupInventory.inUse': increment(1)
     });
   });
   ```

3. **Email Notification:**
   - Background job gửi email thông báo mượn ly thành công

---

## Trả ly (Return Cup)

### Luồng trả ly chi tiết

```mermaid
flowchart TD
    A[User scan QR code] --> B[Gọi API /api/return]
    B --> C{Validate request}
    C -->|Invalid| D[Return error]
    C -->|Valid| E[Lấy cup từ Firebase]
    E --> F{Cup status = in_use?}
    F -->|No| D
    F -->|Yes| G{User owns cup?}
    G -->|No| D
    G -->|Yes| H[Lấy transaction từ Firebase]
    H --> I{Transaction ongoing?}
    I -->|No| D
    I -->|Yes| J[Check overdue]
    J --> K{Overdue?}
    K -->|Yes| L[Green Points = 20]
    K -->|No| M[Green Points = 50]
    L --> N[Hoàn tiền cọc trong Supabase]
    M --> N
    N --> O[Firebase Transaction Start]
    O --> P[Hoàn tiền trong user]
    P --> Q[Update cup: cleaning]
    Q --> R[Update transaction: completed]
    R --> S[Update store inventory]
    S --> T[Firebase Transaction Commit]
    T --> U[Add green points trong Supabase]
    U --> V[Increment cups saved]
    V --> W{Rank up?}
    W -->|Yes| X[Tạo rank up story]
    W -->|No| Y{Tạo cup saved story?}
    Y -->|Yes| X
    Y -->|No| Z[Return success]
    X --> Z
    
    style E fill:#ffe1e1
    style N fill:#e1f5ff
    style O fill:#ffe1e1
    style U fill:#e1f5ff
    style X fill:#fff4e1
```

**Chi tiết Database Operations:**

1. **Supabase (Users):**
   ```sql
   -- Hoàn tiền cọc
   UPDATE users 
   SET wallet_balance = wallet_balance + :depositAmount
   WHERE user_id = :userId;
   
   -- Cộng green points và check rank up
   UPDATE users 
   SET green_points = green_points + :points,
       rank_level = CASE
         WHEN green_points + :points >= 5000 AND rank_level = 'seed' THEN 'sprout'
         WHEN green_points + :points >= 5000 AND rank_level = 'sprout' THEN 'sapling'
         -- ... more rank logic
         ELSE rank_level
       END
   WHERE user_id = :userId;
   
   -- Tăng số ly đã cứu
   UPDATE users 
   SET total_cups_saved = total_cups_saved + 1,
       total_plastic_reduced = total_plastic_reduced + 15
   WHERE user_id = :userId;
   
   -- Tạo eco action
   INSERT INTO eco_actions (user_id, type, cup_id, points, description)
   VALUES (:userId, 'return', :cupId, :points, 'Trả ly đúng hạn');
   ```

2. **Firebase (Atomic Transaction):**
   ```javascript
   runTransaction(async (tx) => {
     // Hoàn tiền (deprecated - now done in Supabase)
     
     // Update cup
     tx.update(cupRef, {
       status: 'cleaning',
       currentUserId: null,
       currentTransactionId: null
     });
     
     // Update transaction
     tx.update(transactionRef, {
       returnStoreId: storeId,
       returnTime: now(),
       status: 'completed',
       refundAmount: depositAmount,
       greenPointsEarned: greenPoints,
       isOverdue: isOverdue,
       overdueHours: overdueHours
     });
     
     // Update store inventory
     tx.update(storeRef, {
       'cupInventory.inUse': increment(-1),
       'cupInventory.cleaning': increment(1)
     });
   });
   ```

3. **Tạo Story (Firebase):**
   - Nếu rank up: Tạo achievement story với type 'rank_up'
   - Nếu trả đúng hạn: Tạo achievement story với type 'cup_saved'

---

## Quản lý Ví (Wallet Management)

### Luồng nạp tiền (Top-up)

```mermaid
flowchart TD
    A[User chọn số tiền] --> B[Gọi API /api/payment/topup]
    B --> C{Validate amount}
    C -->|Invalid| D[Return error]
    C -->|Valid| E{Payment method?}
    E -->|VNPay| F[Gọi VNPay API]
    E -->|MoMo| G[Gọi MoMo API]
    E -->|ZaloPay| H[Gọi ZaloPay API]
    F --> I[Return payment URL]
    G --> I
    H --> I
    I --> J[User thanh toán]
    J --> K{Payment success?}
    K -->|No| L[Return error]
    K -->|Yes| M[Webhook nhận callback]
    M --> N[Update wallet trong Supabase]
    N --> O[Tạo payment transaction record]
    O --> P[Gửi notification]
    P --> Q[Return success]
    
    style F fill:#fff4e1
    style G fill:#fff4e1
    style H fill:#fff4e1
    style N fill:#e1f5ff
    style O fill:#ffe1e1
```

**Database Operations:**

```sql
-- Update wallet
UPDATE users 
SET wallet_balance = wallet_balance + :amount
WHERE user_id = :userId;

-- Tạo payment transaction (Firebase)
INSERT INTO payment_transactions (
  userId, type, amount, paymentMethod,
  status, transactionCode
) VALUES (
  :userId, 'topup', :amount, :method,
  'success', :code
);
```

### Luồng xem ví

```mermaid
flowchart TD
    A[User mở Wallet page] --> B[Gọi API /api/wallet]
    B --> C[Lấy user từ Supabase]
    C --> D[Return wallet data]
    D --> E[Hiển thị balance, points, rank]
    
    style C fill:#e1f5ff
```

**Database Query:**

```sql
SELECT 
  wallet_balance,
  green_points,
  rank_level,
  total_cups_saved,
  total_plastic_reduced
FROM users
WHERE user_id = :userId;
```

---

## Green Feed & Social

### Luồng tạo post

```mermaid
flowchart TD
    A[User upload ảnh] --> B[Gọi API /api/feed/upload]
    B --> C[Upload image to storage]
    C --> D{Success?}
    D -->|No| E[Return error]
    D -->|Yes| F[Gọi API /api/feed/posts POST]
    F --> G[Insert post vào Supabase]
    G --> H[Add green points]
    H --> I[Update user stats]
    I --> J[Tạo notification]
    J --> K[Return success]
    
    style G fill:#e1f5ff
    style H fill:#e1f5ff
```

**Database Operations:**

```sql
-- Insert post
INSERT INTO green_feed_posts (
  user_id, display_name, avatar,
  image_url, caption, cup_id,
  green_points_earned
) VALUES (
  :userId, :displayName, :avatar,
  :imageUrl, :caption, :cupId,
  10
);

-- Add green points
UPDATE users 
SET green_points = green_points + 10
WHERE user_id = :userId;

-- Create notification
INSERT INTO notifications (
  user_id, type, title, message
) VALUES (
  :userId, 'success',
  'Bài đăng thành công!',
  'Bạn nhận được 10 Green Points!'
);
```

### Luồng like post

```mermaid
flowchart TD
    A[User click like] --> B[Gọi API /api/feed/like]
    B --> C{Already liked?}
    C -->|Yes| D[Unlike - DELETE]
    C -->|No| E[Like - INSERT]
    D --> F[Trigger: Decrement likes count]
    E --> G[Trigger: Increment likes count]
    F --> H[Return success]
    G --> H
    
    style D fill:#e1f5ff
    style E fill:#e1f5ff
    style F fill:#fff4e1
    style G fill:#fff4e1
```

**Database Operations:**

```sql
-- Insert like (with UNIQUE constraint)
INSERT INTO post_likes (post_id, user_id)
VALUES (:postId, :userId)
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Trigger automatically updates:
-- UPDATE green_feed_posts 
-- SET likes = likes + 1 
-- WHERE post_id = :postId;
```

---

## Admin Dashboard

### Luồng tạo QR code (Cup)

```mermaid
flowchart TD
    A[Admin nhập thông tin cup] --> B[Gọi API /api/admin/cups POST]
    B --> C{Admin authenticated?}
    C -->|No| D[Return 403]
    C -->|Yes| E[Generate Cup ID]
    E --> F[Generate QR code data]
    F --> G[Create cup trong Firebase]
    G --> H[Update store inventory]
    H --> I[Log admin action]
    I --> J[Return QR code]
    
    style C fill:#fff4e1
    style G fill:#ffe1e1
    style I fill:#e1f5ff
```

**Database Operations:**

```javascript
// Firebase
await adminDb.collection('cups').doc(cupId).set({
  cupId,
  material: 'pp_plastic',
  status: 'available',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  totalUses: 0
});

// Update store
await adminDb.collection('stores').doc(storeId).update({
  'cupInventory.available': increment(1),
  'cupInventory.total': increment(1)
});

// Supabase - Log action
INSERT INTO admin_actions (admin_id, type, details)
VALUES (:adminId, 'create_qr', 'Created cup: ' || :cupId);
```

### Luồng xem analytics

```mermaid
flowchart TD
    A[Admin mở Analytics] --> B[Gọi API /api/admin/analytics]
    B --> C{Admin authenticated?}
    C -->|No| D[Return 403]
    C -->|Yes| E[Query Firebase: Transactions]
    E --> F[Query Firebase: Cups]
    F --> G[Query Supabase: Users]
    G --> H[Query Supabase: Eco Actions]
    H --> I[Aggregate data]
    I --> J[Calculate metrics]
    J --> K[Return analytics]
    
    style C fill:#fff4e1
    style E fill:#ffe1e1
    style F fill:#ffe1e1
    style G fill:#e1f5ff
    style H fill:#e1f5ff
```

---

## Gamification System

### Luồng tính điểm và rank up

```mermaid
flowchart TD
    A[User thực hiện action] --> B{Action type?}
    B -->|Return cup| C[Points = 50]
    B -->|Return overdue| D[Points = 20]
    B -->|Green Feed post| E[Points = 10]
    B -->|Check-in| F[Points = 5]
    C --> G[Add points trong Supabase]
    D --> G
    E --> G
    F --> G
    G --> H{Check rank thresholds}
    H -->|>= 5000 & seed| I[Rank up: sprout]
    H -->|>= 15000 & sprout| J[Rank up: sapling]
    H -->|>= 50000 & sapling| K[Rank up: tree]
    H -->|>= 100000 & tree| L[Rank up: forest]
    H -->|No change| M[Continue]
    I --> N[Tạo rank up story]
    J --> N
    K --> N
    L --> N
    M --> O[Update leaderboard]
    N --> O
    O --> P[Send notification]
    
    style G fill:#e1f5ff
    style N fill:#fff4e1
    style O fill:#e1f5ff
```

**Database Operations:**

```sql
-- Update user points and rank
UPDATE users 
SET 
  green_points = green_points + :points,
  rank_level = CASE
    WHEN green_points + :points >= 100 AND rank_level = 'seed' THEN 'sprout'
    WHEN green_points + :points >= 500 AND rank_level = 'sprout' THEN 'sapling'
    WHEN green_points + :points >= 2000 AND rank_level = 'sapling' THEN 'tree'
    WHEN green_points + :points >= 5000 AND rank_level = 'tree' THEN 'forest'
    ELSE rank_level
  END,
  last_activity = NOW()
WHERE user_id = :userId;

-- Create eco action
INSERT INTO eco_actions (user_id, type, points, description)
VALUES (:userId, 'share', :points, :description);

-- Update leaderboard (periodic job)
SELECT update_leaderboard();
```

### Luồng leaderboard

```mermaid
flowchart TD
    A[User mở Leaderboard] --> B[Gọi API /api/leaderboard]
    B --> C{Cache valid?}
    C -->|Yes| D[Return cached data]
    C -->|No| E[Query Supabase leaderboard table]
    E --> F{Has data?}
    F -->|No| G[Run update_leaderboard()]
    F -->|Yes| H[Return leaderboard]
    G --> H
    
    style E fill:#e1f5ff
    style G fill:#e1f5ff
```

---

## Transaction History

### Luồng xem lịch sử giao dịch

```mermaid
flowchart TD
    A[User mở Transaction History] --> B[Gọi API /api/transactions/history]
    B --> C[Query Firebase: Transactions]
    C --> D[Filter by userId]
    D --> E[Join với Stores]
    E --> F[Format data]
    F --> G[Return history]
    
    style C fill:#ffe1e1
```

**Database Query (Firebase):**

```javascript
const transactionsQuery = query(
  collection(db, 'transactions'),
  where('userId', '==', userId),
  orderBy('borrowTime', 'desc'),
  limit(limit || 50)
);

const transactions = await getDocs(transactionsQuery);

// For each transaction, fetch store info
const enrichedTransactions = await Promise.all(
  transactions.docs.map(async (doc) => {
    const data = doc.data();
    const borrowStore = await getStore(data.borrowStoreId);
    const returnStore = data.returnStoreId 
      ? await getStore(data.returnStoreId) 
      : null;
    return {
      ...data,
      borrowStoreName: borrowStore?.name,
      returnStoreName: returnStore?.name
    };
  })
);
```

---

## Notifications System

### Luồng gửi notification

```mermaid
flowchart TD
    A[Event xảy ra] --> B{Gửi notification?}
    B -->|No| C[Skip]
    B -->|Yes| D[Gọi API /api/notifications/send]
    D --> E[Insert vào Supabase]
    E --> F[Trigger Realtime]
    F --> G[Frontend nhận update]
    G --> H[Hiển thị notification]
    
    style E fill:#e1f5ff
    style F fill:#fff4e1
```

**Database Operations:**

```sql
-- Insert notification
INSERT INTO notifications (
  user_id, type, title, message, url, data
) VALUES (
  :userId, :type, :title, :message, :url, :data::jsonb
);

-- Frontend queries unread notifications
SELECT * FROM notifications
WHERE user_id = :userId AND read = false
ORDER BY timestamp DESC
LIMIT 20;
```

---

## Error Handling & Rollback

### Luồng xử lý lỗi

```mermaid
flowchart TD
    A[Operation starts] --> B{Operation type?}
    B -->|Atomic Transaction| C[Try Firebase Transaction]
    B -->|Multi-step| D[Step 1: Supabase]
    C --> E{Success?}
    E -->|No| F[Auto rollback]
    E -->|Yes| G[Complete]
    D --> H{Success?}
    H -->|No| I[Manual rollback Step 1]
    H -->|Yes| J[Step 2: Firebase]
    J --> K{Success?}
    K -->|No| L[Rollback Step 1]
    K -->|Yes| G
    F --> M[Return error]
    I --> M
    L --> M
    G --> N[Return success]
    
    style C fill:#ffe1e1
    style D fill:#e1f5ff
    style J fill:#ffe1e1
```

**Rollback Strategy:**

1. **Firebase Transactions:** Tự động rollback nếu fail
2. **Supabase + Firebase:** 
   - Nếu Firebase transaction fail sau khi đã update Supabase:
     - Thử refund wallet (nếu là borrow operation)
     - Log error để admin xử lý thủ công
     - Gửi notification cho user

---

## Security & Permissions

### Luồng kiểm tra quyền

```mermaid
flowchart TD
    A[API Request] --> B[Extract auth token]
    B --> C{Has token?}
    C -->|No| D[Return 401]
    C -->|Yes| E[Verify token với Supabase]
    E --> F{Valid?}
    F -->|No| D
    F -->|Yes| G{Admin route?}
    G -->|No| H[Check user permissions]
    G -->|Yes| I[Check admin permissions]
    I --> J{Is admin?}
    J -->|No| K[Return 403]
    J -->|Yes| L[Allow access]
    H --> M{Has permission?}
    M -->|No| K
    M -->|Yes| L
    
    style E fill:#e1f5ff
    style I fill:#fff4e1
```

**RLS Policies (Supabase):**

- Users chỉ có thể đọc/ghi dữ liệu của chính mình
- Admins có thể đọc/ghi tất cả (qua service role bypass RLS)
- Public có thể đọc một số bảng (leaderboard, stores, cups)

---

## Realtime Updates

### Luồng Realtime

```mermaid
flowchart TD
    A[Database change] --> B[Supabase Realtime trigger]
    B --> C[WebSocket message]
    C --> D[Frontend hook nhận]
    D --> E[Update local state]
    E --> F[Re-render UI]
    
    style B fill:#fff4e1
    style D fill:#e1ffe1
```

**Realtime Subscriptions:**

```typescript
// Subscribe to notifications
const { data } = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update notifications list
    setNotifications(prev => [payload.new, ...prev]);
  })
  .subscribe();
```

---

## Tổng kết

Hệ thống CupSipSmart sử dụng kiến trúc hybrid:
- **Supabase (PostgreSQL)**: Users, Eco Actions, Admins, Social features
- **Firebase (Firestore)**: Cups, Transactions, Stores (real-time operations)

Các điểm quan trọng:
1. **Atomic Operations**: Firebase transactions đảm bảo consistency cho cups/transactions/stores
2. **Cross-database Operations**: Cần xử lý rollback thủ công khi kết hợp Supabase + Firebase
3. **Security**: RLS policies trong Supabase, Firebase Security Rules
4. **Realtime**: Supabase Realtime cho notifications, Firebase Realtime cho inventory updates
5. **Caching**: Leaderboard được cache trong Supabase table, update định kỳ

