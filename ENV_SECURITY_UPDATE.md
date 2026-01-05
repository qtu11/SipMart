# Environment Variables - Security Update Required

## 🚨 CRITICAL: Update Required

The following environment variables **MUST** be updated for security:

### 1. Remove from `.env.local`:
```env
NEXT_PUBLIC_ADMIN_KEY=qtusadmin@gmail.com    # ❌ REMOVE THIS
NEXT_PUBLIC_ADMIN_PASSWORD=qtusdev            # ❌ REMOVE THIS
```

### 2. Add to `.env.local` (Server-only):
```env
# Admin Credentials (Server-only - DO NOT use NEXT_PUBLIC_ prefix)
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-password

# Cron Secret (Required - Generate a strong random secret)
CRON_SECRET=your-randomly-generated-secret-min-32-characters

# Existing Variables (Keep these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
# ... other vars
```

### 3. Generate Secure Secrets

Run these commands to generate secure secrets:

**PowerShell (Windows):**
```powershell
# Generate CRON_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate ADMIN_PASSWORD
-join ((65..90) + (97..122) + (48..57) + (33, 64, 35, 36, 37, 94, 38, 42) | Get-Random -Count 20 | ForEach-Object {[char]$_})
```

**Bash/Linux/Mac:**
```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Generate ADMIN_PASSWORD
openssl rand -base64 20
```

### 4. Update Production Environment

If deployed on Vercel/Netlify/etc.:
1. Go to project settings
2. Remove `NEXT_PUBLIC_ADMIN_KEY` and `NEXT_PUBLIC_ADMIN_PASSWORD`
3. Add new `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `CRON_SECRET`
4. Redeploy

## ✅ Verification Checklist

- [ ] Removed `NEXT_PUBLIC_ADMIN_KEY` from all .env files
- [ ] Removed `NEXT_PUBLIC_ADMIN_PASSWORD` from all .env files
- [ ] Added secure `ADMIN_EMAIL`
- [ ] Added strong `ADMIN_PASSWORD` (min 16 characters)
- [ ] Added random `CRON_SECRET` (min 32 characters)
- [ ] Updated production environment variables
- [ ] Tested admin login with new credentials
- [ ] Verified cron jobs still work

## 📝 Notes

- **Never** commit `.env.local` to Git
- Use different credentials for dev/staging/production
- Rotate secrets periodically (every 90 days recommended)
- Store production secrets in secure vault (1Password, LastPass, etc.)
