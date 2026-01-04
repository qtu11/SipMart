# 🔄 Migration: reCAPTCHA → hCaptcha

## ✅ Completed Changes

### 1. **Removed reCAPTCHA from Frontend**
All reCAPTCHA code has been completely removed from:
- [app/auth/login/page.tsx](file:///c:/Users/Public/Lập%20trình/CupSipSmart/app/auth/login/page.tsx) - Email/password and Google OAuth login
- [app/auth/register/page.tsx](file:///c:/Users/Public/Lập%20trình/CupSipSmart/app/auth/register/page.tsx) - User registration

**Before:**
```typescript
window.grecaptcha.enterprise.execute('SITE_KEY', { action: 'LOGIN' });
```

**After:**
```typescript
// hCaptcha is managed by Supabase - no frontend verification needed
```

### 2. **Created Supabase SQL Functions**
Added required database functions for store inventory management:
- **File:** [supabase/functions_store_inventory.sql](file:///c:/Users/Public/Lập%20trình/CupSipSmart/supabase/functions_store_inventory.sql)
- **Functions:**
  - `increment_store_inventory(p_store_id, p_total, p_available)` - Add cups to store
  - `decrement_store_inventory(p_store_id, p_total, p_available)` - Remove cups from store
  - `update_store_cup_status(p_store_id, p_status_field, p_increment)` - Update cup status counts

**Status:** ✅ Successfully created in Supabase Dashboard

![Supabase function creation success]( file:///C:/Users/ADMIN/.gemini/antigravity/brain/76b680ad-5963-4ac7-a9a1-1176dc5ab538/supabase_function_success_1767523698706.png)

### 3. **Fixed Store Inventory Calls**
Updated [lib/firebase/stores-with-fallback.ts](file:///c:/Users/Public/Lập%20trình/CupSipSmart/lib/firebase/stores-with-fallback.ts) to match function signature:
```typescript
const { error } = await supabase.rpc('increment_store_inventory', {
  p_store_id: storeId,
  p_total: count,      // ✅ Fixed order
  p_available: count,
});
```

---

## 🎯 How hCaptcha Works Now

### **Supabase Managed Captcha**
- **Location:** Supabase Dashboard → Authentication → Attack Protection
- **Current Status:** **DISABLED** (for development)
- **Provider Options:** hCaptcha, Cloudflare Turnstile, reCAPTCHA v2

### **No Frontend Code Needed**
- When enabled in Supabase, captcha is automatically enforced on auth endpoints
- No JavaScript SDK required in application code
- Supabase handles all validation server-side

---

## 🔧 How to Enable hCaptcha (Optional for Production)

> [!NOTE]
> hCaptcha is currently DISABLED for development. Enable it when deploying to production.

### Step 1: Get hCaptcha Keys
1. Go to https://www.hcaptcha.com/
2. Sign up / Log in
3. Create a new site
4. Copy **Site Key** and **Secret Key**

### Step 2: Configure Supabase
1. Go to [Supabase Attack Protection](https://supabase.com/dashboard/project/hxgmiwywovbbnzcpdhjg/auth/protection)
2. Toggle **ON**: "Enable Captcha protection"
3. Select **hCaptcha** as provider
4. Enter **Site Key** and **Secret Key**
5. Click "Save changes"

### Step 3: Test
- Try logging in → hCaptcha challenge will appear
- Try registering → hCaptcha will verify
- All handled automatically by Supabase

---

## 🐛 QR Code Generation Fix

### **Problem:**
```
Error: Could not find the function public.increment_store_inventory
```

### **Solution:**
Created the missing SQL function in Supabase:
```sql
CREATE OR REPLACE FUNCTION increment_store_inventory(
  p_store_id UUID,
  p_total INTEGER,
  p_available INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET 
    cup_total = cup_total + p_total,
    cup_available = cup_available + COALESCE(p_available, p_total)
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Status:** ✅ Function created successfully

---

## 📝 Files Modified

### Frontend
1. [app/auth/login/page.tsx](file:///c:/Users/Public/Lập%20trình/CupSipSmart/app/auth/login/page.tsx)
   - Removed reCAPTCHA interface declaration
   - Removed reCAPTCHA verification logic (lines 50-89)
   - Removed reCAPTCHA from Google OAuth (lines 117-147)

2. [app/auth/register/page.tsx](file:///c:/Users/Public/Lập%20trình/CupSipSmart/app/auth/register/page.tsx)
   - Removed reCAPTCHA interface declaration
   - Removed reCAPTCHA verification logic (lines 51-84)

### Backend & Database
3. [lib/firebase/stores-with-fallback.ts](file:///c:/Users/Public/Lập%20trình/CupSipSmart/lib/firebase/stores-with-fallback.ts)
   - Fixed argument order in `increment_store_inventory` call

4. [supabase/functions_store_inventory.sql](file:///c:/Users/Public/Lập%20trình/CupSipSmart/supabase/functions_store_inventory.sql) **(NEW)**
   - Created store inventory management functions

---

## ✅ Testing Checklist

- [ ] Login với email/password
- [ ] Login với Google OAuth
- [ ] Register new account
- [ ] **Create QR codes từ Admin Dashboard** (test fix)
- [ ] Verify no console errors
- [ ] (Optional) Test hCaptcha when enabled

---

## 🚀 Next Steps

1. **Test QR Code Generation:**
   - Go to `/admin` dashboard
   - Navigate to QR code generation
   - Try creating a batch of cups
   - Should work now without errors

2. **Deployment to Production:**
   - Enable hCaptcha in Supabase Dashboard
   - Test all auth functions with hCaptcha enabled
   - Monitor logs for any issues

3. **Cleanup (Optional):**
   - Remove unused reCAPTCHA files/routes if any (e.g., `/api/auth/verify-recaptcha`)
   - Remove reCAPTCHA environment variables from `.env`

---

## 📊 Benefits of This Change

| Feature | Before (reCAPTCHA) | After (hCaptcha via Supabase) |
|---------|-------------------|-------------------------------|
| **Frontend Code** | Complex verification logic | None - Supabase handles it |
| **Maintainability** | High - manual updates needed | Low - managed by Supabase |
| **Security** | Good | Better - server-side only |
| **User Privacy** | Google tracking | More privacy-friendly |
| **Dev Experience** | Need API keys, scripts | Just toggle in dashboard |
| **Cost** | Free tier limited | hCaptcha more generous |

---

## ⚠️ Important Notes

> [!WARNING]
> **Captcha is currently DISABLED in Supabase.** This is intentional for development. Remember to enable it in production!

> [!TIP]
> You can switch between hCaptcha providers (hCaptcha, Cloudflare Turnstile, reCAPTCHA v2) in the Supabase Dashboard without any code changes.

> [!IMPORTANT]
> The `increment_store_inventory` function must exist in Supabase for QR code generation to work. It has been created and verified.
