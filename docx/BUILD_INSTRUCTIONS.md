# 📦 Build Instructions - CupSipSmart

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# 3. Build and verify
npm run build:check

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
npm run start
```

## 📋 Step-by-Step Build Process

### Step 1: Install Dependencies

```bash
npm install
```

This will install all dependencies including:
- Next.js 14
- React 18
- Firebase SDK
- Supabase SDK
- TypeScript
- And all other dependencies

**Expected output:** All packages installed successfully, no errors

### Step 2: Setup Environment Variables

1. Copy the template:
```bash
cp .env.example .env.local
```

2. Or use your existing config (from the template provided):
```bash
cp .env.local.template .env.local
```

3. Edit `.env.local` and fill in:
   - ✅ All Firebase variables (you have these)
   - ✅ All Supabase variables (you have these)
   - ✅ App configuration (you have these)
   - ✅ Admin credentials (you have these)
   - ⚠️ **MISSING**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (for map page)
   - ⚠️ **MISSING**: `RESEND_API_KEY` (for email sending - optional)
   - ✅ `GEMINI_API_KEY` (you have this)

### Step 3: Type Check

```bash
npm run type-check
```

This checks for TypeScript errors without building.

**Expected output:** `Found 0 errors.` (or list of errors to fix)

### Step 4: Lint Check

```bash
npm run lint
```

This checks for code style and potential errors.

**Expected output:** No linting errors (or warnings to fix)

### Step 5: Build Project

```bash
npm run build
```

This creates an optimized production build.

**Expected output:**
```
> cupsipsmart@1.0.0 build
> next build

   ▲ Next.js 14.0.4
   - Environments: .env.local

 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (X/X)
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XX kB          XXX kB
┌ ○ /about                              XX kB          XXX kB
...
```

**Common Build Errors:**

1. **Missing environment variable:**
   ```
   Error: Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY
   ```
   **Fix:** Add the missing variable to `.env.local`

2. **TypeScript errors:**
   ```
   Type error: Property 'xxx' does not exist on type 'yyy'
   ```
   **Fix:** Run `npm run type-check` to see detailed errors

3. **Module not found:**
   ```
   Module not found: Can't resolve 'xxx'
   ```
   **Fix:** Run `npm install` again

### Step 6: Run All Checks

```bash
npm run build:check
```

This runs type-check, lint, and build in sequence.

**Expected output:** All checks pass ✅

### Step 7: Test Production Build Locally

```bash
npm run build
npm run start
```

Visit `http://localhost:3000` and test your application.

## 🔍 Verification Checklist

After building, verify:

- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build completes successfully (`npm run build`)
- [ ] All pages load without errors
- [ ] API routes respond correctly
- [ ] Environment variables are accessible
- [ ] Database connections work (Supabase & Firebase)

## 🐛 Troubleshooting

### Issue: Build fails with "Module not found"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors in node_modules

**Solution:**
These are usually safe to ignore. If they block the build, add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Issue: Environment variables not working

**Solution:**
1. Verify `.env.local` exists in project root
2. Verify variable names start with `NEXT_PUBLIC_` for client-side
3. Restart dev server after changing `.env.local`
4. For production, set variables in deployment platform

### Issue: Supabase connection fails

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Supabase dashboard > Settings > API
3. Verify service role key is set (server-side only)

### Issue: Firebase connection fails

**Solution:**
1. Verify all 6 Firebase variables are set
2. Check Firebase Console > Project Settings > General
3. Verify API keys are correct

## 📝 Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables are set in deployment platform
- [ ] Database schema is deployed (Supabase)
- [ ] Firebase Security Rules are configured
- [ ] Build passes locally (`npm run build:check`)
- [ ] All tests pass (if you have tests)
- [ ] No console.log in production code
- [ ] Error handling is in place
- [ ] Monitoring/logging is configured (optional)

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Set `NODE_VERSION=18` or higher
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add all environment variables
5. Deploy

## ✅ Success Criteria

Your build is successful when:
- ✅ `npm run build:check` completes without errors
- ✅ Production build creates `.next` folder
- ✅ `npm run start` serves the application
- ✅ All pages load correctly
- ✅ API routes respond correctly
- ✅ No console errors in browser

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Environment Variables Guide](https://nextjs.org/docs/basic-features/environment-variables)

