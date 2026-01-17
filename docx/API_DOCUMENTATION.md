# SipMart Carbon Reward Ecosystem - API Documentation

## Overview

SipMart provides a comprehensive REST API for the Carbon Reward Ecosystem, including Green Mobility, eKYC verification, e-Bike rentals, and ESG tracking.

**Base URL:** `https://your-domain.com/api`  
**Authentication:** Bearer token (Supabase Auth)

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-supabase-access-token>
```

---

## User Endpoints

### eKYC

#### Upload eKYC Documents
```http
POST /api/ekyc/upload
```

**Request Body:**
```json
{
  "frontImage": "data:image/jpeg;base64,...",
  "backImage": "data:image/jpeg;base64,...",
  "faceImage": "data:image/jpeg;base64,...",
  "idCardNumber": "001234567890",
  "fullName": "Nguyen Van A",
  "dateOfBirth": "2000-01-01",
  "address": "123 ABC Street" // optional
}
```

**Response:**
```json
{
  "success": true,
  "verification_id": "uuid",
  "status": "approved",
  "match_score": 92,
  "message": "✅ Xác thực thành công!"
}
```

#### Get eKYC Status
```http
GET /api/ekyc/upload
```

**Response:**
```json
{
  "verified": true,
  "status": "approved",
  "match_score": 92,
  "verified_at": "2026-01-16T...",
  "expires_at": "2027-01-16T..."
}
```

---

### Green Mobility

#### Scan QR (Bus/Metro Payment)
```http
POST /api/mobility/scan
```

**Request Body:**
```json
{
  "partnerId": "uuid",
  "tripType": "bus",
  "fare": 7000,
  "routeInfo": {
    "from": "Bến xe Miền Đông",
    "to": "Sân bay TSN",
    "distance_km": 15,
    "route_name": "109"
  }
}
```

**Response:**
```json
{
  "success": true,
  "trip_id": "uuid",
  "fare": 7000,
  "new_balance": 493000,
  "co2_saved_kg": 1.8,
  "vnes_points_earned": 150,
  "message": "✅ Bạn đã tiết kiệm 1.80kg CO₂!"
}
```

#### Get Trip History
```http
GET /api/mobility/scan?type=bus&limit=50
```

---

### e-Bike

#### Unlock Bike
```http
POST /api/ebike/unlock
```

**Request Body:**
```json
{
  "bikeId": "BIKE-001",
  "stationId": "uuid",
  "plannedDurationHours": 3
}
```

**Response:**
```json
{
  "success": true,
  "rental_id": "uuid",
  "bike_id": "BIKE-001",
  "fare": 45000,
  "message": "🚲 Xe đã mở khóa!"
}
```

**Error (eKYC required):**
```json
{
  "error": "eKYC verification required",
  "action_required": "complete_ekyc"
}
```

#### Get Available Bikes
```http
GET /api/ebike/unlock?stationId=uuid
```

#### Return Bike
```http
POST /api/ebike/return
```

**Request Body:**
```json
{
  "rentalId": "uuid",
  "stationId": "uuid",
  "distanceKm": 8.5
}
```

**Response:**
```json
{
  "success": true,
  "payment_amount": 45000,
  "commission_amount": 45,
  "distance_km": 8.5,
  "co2_saved_kg": 1.02,
  "vnes_points_earned": 85,
  "message": "Trip completed! +85 VNES points"
}
```

#### Get Active Rental
```http
GET /api/ebike/return
```

---

### ESG

#### Personal ESG Dashboard
```http
GET /api/esg/personal?period=month
```

**Response:**
```json
{
  "personal_esg": {
    "co2_saved_kg": "45.23",
    "plastic_reduced_kg": "1.20",
    "water_saved_liters": "30.0",
    "energy_saved_kwh": "1.80",
    "trees_equivalent": 2,
    "total_vnes_points": 1250,
    "total_distance_km": "125.0"
  },
  "breakdown": {
    "green_mobility_trips": 20,
    "ebike_rentals": 5,
    "cups_saved": 60
  }
}
```

#### Global ESG Stats
```http
GET /api/esg/global?period=month
```

---

## Partner Endpoints

### Dashboard
```http
GET /api/partner/dashboard?period=month
```

**Response:**
```json
{
  "partner": {
    "id": "uuid",
    "name": "Bus điện Green Line",
    "type": "transport"
  },
  "stats": {
    "total_revenue": 5000000,
    "total_commission": 5000,
    "transaction_count": 150,
    "total_co2_saved": 125.5
  },
  "pending_payouts": [...],
  "recent_transactions": [...]
}
```

### Request Payout
```http
POST /api/partner/payout/request
```

**Request Body:**
```json
{
  "period_start": "2026-01-01T00:00:00Z",
  "period_end": "2026-01-31T23:59:59Z"
}
```

### ESG Report (IPCC)
```http
GET /api/partner/esg-report?period=quarter
```

---

## Admin Endpoints

### eKYC Approval
```http
GET /api/admin/ekyc?status=pending
POST /api/admin/ekyc
```

**POST Body:**
```json
{
  "verification_id": "uuid",
  "action": "approve",
  "notes": "Verified successfully"
}
```

### Financial Hub
```http
GET /api/admin/financial-hub?period=month
```

### Payout Processing
```http
GET /api/admin/payouts?status=pending
POST /api/admin/payouts
```

**POST Body:**
```json
{
  "payout_id": "uuid",
  "action": "approve",
  "bank_transfer_reference": "REF123456"
}
```

### e-Bike Fleet
```http
GET /api/admin/ebikes
POST /api/admin/ebikes
```

**POST Body:**
```json
{
  "bike_id": "BIKE-001",
  "action": "mark_maintenance",
  "notes": "Battery replacement"
}
```

### IoT Commands
```http
POST /api/admin/iot
```

**Request Body:**
```json
{
  "bike_id": "BIKE-001",
  "command": "unlock"
}
```

Commands: `unlock`, `lock`, `alarm`, `locate`

### Solar Monitoring
```http
GET /api/admin/solar
```

---

## Error Responses

```json
{
  "error": "Error message",
  "details": [...] // Optional validation errors
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- 100 requests/minute per user
- 1000 requests/minute per admin

---

## Webhook Events (Future)

```json
{
  "event": "ebike.returned",
  "data": {
    "rental_id": "uuid",
    "user_id": "uuid",
    "co2_saved": 1.02
  },
  "timestamp": "2026-01-16T..."
}
```

---

## SDK Examples

### JavaScript
```javascript
const response = await fetch('/api/mobility/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    partnerId: 'uuid',
    tripType: 'bus',
    fare: 7000,
    routeInfo: { from: 'A', to: 'B', distance_km: 10 }
  })
});
```

---

*Last updated: 2026-01-16*
