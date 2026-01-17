# VNES Wallet System - Implementation Plan

## Overview
Hệ thống ví VNES toàn diện, xử lý hàng triệu giao dịch tự động, minh bạch tài chính, quản lý đa vai trò (User/Admin/Partner).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VNES WALLET CORE                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │   Wallet    │   │ Transaction │   │    Settlement       │   │
│  │   Service   │   │   Engine    │   │    Processor        │   │
│  └─────────────┘   └─────────────┘   └─────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Payment Gateways                            │
│    ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────────┐        │
│    │ VNPay  │  │  MoMo  │  │ZaloPay │  │Bank Transfer │        │
│    └────────┘  └────────┘  └────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │  Users  │          │  Admin  │          │Partners │
    └─────────┘          └─────────┘          └─────────┘
```

---

## Database Schema

### 1. wallet_ledger (Sổ cái)
| Column | Type | Description |
|--------|------|-------------|
| ledger_id | UUID | Primary key |
| user_id | UUID | FK to users |
| entry_type | ENUM | 'credit', 'debit' |
| amount | DECIMAL(15,2) | Số tiền |
| balance_before | DECIMAL(15,2) | Số dư trước |
| balance_after | DECIMAL(15,2) | Số dư sau |
| reference_type | TEXT | 'topup', 'withdrawal', 'deposit', 'refund', 'fee', 'reward' |
| reference_id | UUID | FK to source transaction |
| description | TEXT | Mô tả giao dịch |
| created_at | TIMESTAMP | Thời gian |

### 2. partner_wallets
| Column | Type | Description |
|--------|------|-------------|
| partner_id | UUID | Primary key |
| partner_type | ENUM | 'store', 'transport', 'ebike' |
| balance | DECIMAL(15,2) | Số dư hiện tại |
| pending_settlement | DECIMAL(15,2) | Chờ quyết toán |
| total_earned | DECIMAL(15,2) | Tổng thu nhập |
| bank_account | JSONB | Thông tin ngân hàng |

### 3. settlement_batches
| Column | Type | Description |
|--------|------|-------------|
| batch_id | UUID | Primary key |
| partner_id | UUID | FK to partners |
| period_start | DATE | Bắt đầu kỳ |
| period_end | DATE | Kết thúc kỳ |
| total_amount | DECIMAL(15,2) | Tổng quyết toán |
| status | ENUM | 'pending', 'approved', 'paid', 'failed' |
| approved_by | UUID | Admin duyệt |
| paid_at | TIMESTAMP | Thời gian thanh toán |

### 4. escrow_accounts
| Column | Type | Description |
|--------|------|-------------|
| escrow_id | UUID | Primary key |
| type | ENUM | 'cup_deposit', 'transport_prepay' |
| total_balance | DECIMAL(15,2) | Tổng số dư ký quỹ |
| last_updated | TIMESTAMP | Cập nhật cuối |

---

## Transaction Flows

### Nạp tiền (Top-up)
1. User chọn số tiền → POST /api/wallet/topup
2. Tạo pending transaction → Redirect VNPay
3. VNPay callback → BEGIN TRANSACTION
4. UPDATE wallet_balance → INSERT ledger_entry → COMMIT
5. Thông báo thành công

### Mượn ly (Borrow)
1. Quét QR → POST /api/cups/borrow
2. Check wallet_balance >= 20.000đ
3. BEGIN TRANSACTION
4. wallet_balance -= 20.000đ
5. escrow_balance += 20.000đ
6. INSERT ledger_entry → COMMIT

### Trả ly (Return)
1. Quét QR → POST /api/cups/return
2. Tính phí thuê (nếu quá hạn)
3. BEGIN TRANSACTION
4. wallet_balance += (20.000đ - phí)
5. escrow_balance -= 20.000đ
6. partner_share += commission
7. INSERT ledger_entries → COMMIT

---

## Implementation Phases

| Phase | Files | Duration |
|-------|-------|----------|
| 1. Database | 035_vnes_wallet_system.sql | 1 ngày |
| 2. Backend APIs | wallet-service.ts, settlement-service.ts | 2 ngày |
| 3. User UI | app/wallet/page.tsx | 1 ngày |
| 4. Admin | app/admin/wallet-management/, settlements/ | 2 ngày |
| 5. Partner | app/partner/wallet/ | 1 ngày |

**Tổng: ~7 ngày**

---

## Security
- RLS cho tất cả bảng wallet
- Rate limiting cho API nạp/rút
- Audit log mọi thay đổi số dư
- Encryption cho bank account info
