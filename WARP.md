# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

---

## 🏗️ **Architecture Overview**

### **Stack**
- **Framework**: Next.js 15.5.4 (App Router with React Server Components)
- **Language**: TypeScript with strict mode enabled
- **Database**: Neon (Serverless PostgreSQL)
- **Authentication**: Supabase Auth with custom JWT verification
- **Payments**: Stripe with Radar fraud detection
- **Styling**: Tailwind CSS 4 + custom glass morphism design system
- **Deployment**: Vercel

### **Key Architectural Patterns**

1. **Dual Database System**:
   - **Supabase**: Authentication only (`auth.users` table)
   - **Neon**: All application data (users, subscriptions, workouts, etc.)
   - Users are linked via `supabase_user_id` foreign key in Neon `users` table

2. **Middleware-Based Auth Flow**:
   - `middleware.ts` handles ALL route protection and rate limiting
   - Checks both cookie sessions AND Authorization headers (for API routes)
   - Public routes (`/`, `/auth/*`, `/about`, etc.) bypass auth
   - Protected routes check `onb` cookie to determine onboarding status
   - Admin routes verify role via environment variable `ADMIN_USER_IDS`

3. **AuthProvider Context**:
   - Wraps entire app in `app/layout.tsx`
   - **Critical**: Has 5-second timeout to prevent infinite loading
   - Manages Supabase session + Neon user data
   - Public routes render immediately without waiting for auth
   - Located: `components/AuthProvider.tsx`

4. **Security Architecture**:
   - **Rate Limiting**: In-memory store in middleware (consider Redis for production)
   - **Security Monitor**: `lib/security-monitor.ts` - Tracks failed logins, SQL injection attempts, privilege escalation
   - **Automated Response**: `lib/security-response-system.ts` - Auto-blocks IPs, locks accounts, escalates incidents
   - **Admin Security**: `lib/admin-middleware.ts` - Role-based access with JWT verification

---

## 📝 **Essential Commands**

### **Development**
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # TypeScript validation
npm run type-check:watch # Watch mode for TypeScript
```

### **Database**
```bash
npm run db:migrate            # Run Neon database migrations
npm run db:fix-profiles       # Fix profiles schema
npm run db:test              # Test database connection
node scripts/test-supabase-connection.js  # Diagnose Supabase issues
```

### **Testing**
```bash
# Unit Tests (Jest)
npm test                 # Run all unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:unit        # Only unit tests

# Integration Tests
npm run test:integration

# E2E Tests (Playwright)
npm run test:e2e         # Headless
npm run test:e2e:ui      # With Playwright UI
npm run test:e2e:headed  # Browser visible

# All Tests
npm run test:all         # Run everything
```

### **Validation & Security**
```bash
npm run validate-env         # Check all environment variables
npm run test:stripe         # Test Stripe integration
npm run test:emails         # Test email configuration
npm run test:jwt            # Test JWT configuration
npm run security-audit      # Run npm audit
```

### **Media & Scripts**
```bash
npm run scrape:videos       # Scrape workout videos
npm run ingest:media        # Trigger media ingestion
```

---

## 🗂️ **Critical File Locations**

### **Authentication**
- `middleware.ts` - Route protection, rate limiting, auth verification
- `components/AuthProvider.tsx` - Client-side auth context (5s timeout)
- `lib/supabaseClient.ts` - Supabase client factory
- `lib/supabaseServer.ts` - Server-side Supabase client
- `lib/supabase.ts` - Enhanced Supabase utilities with JWT verification
- `lib/neonClient.ts` - Neon database client

### **Security**
- `lib/security-monitor.ts` - Security event tracking
- `lib/security-response-system.ts` - Automated incident response
- `lib/admin-middleware.ts` - Admin route protection
- `lib/admin-security-integration.ts` - Security monitoring integration
- `lib/stripe-radar.ts` - Payment fraud detection

### **API Structure**
```
app/api/
├── auth/              # Login, signup endpoints
├── admin/             # Admin panel APIs (protected)
├── checkout/          # Stripe payment flows
├── dashboard/         # User data APIs
├── webhooks/          # Stripe webhooks
├── onboarding/        # Onboarding progress
└── user/              # User profile management
```

### **Page Structure**
```
app/
├── page.tsx           # Landing page (public)
├── auth/              # Login, signup, password reset
├── onboarding/        # 7-step onboarding flow
├── dashboard/         # Main app (requires auth + onboarding)
│   ├── ai-coach/
│   ├── calories/
│   ├── mindfulness/
│   ├── workouts/
│   ├── notes/
│   └── settings/
└── admin/             # Admin panel (role-protected)
```

---

## 🔐 **Environment Variables**

### **Critical for Auth** (app won't load without these):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co  # MUST end in .co not .com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                  # OR NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...                      # For admin operations
```

### **Critical for Database**:
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require  # Neon connection string
```

### **Required for Payments**:
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PATHFINDER_MONTHLY=price_...
STRIPE_PRICE_ID_PATHFINDER_YEARLY=price_...
```

### **Optional but Recommended**:
```bash
OPENAI_API_KEY=sk-...          # For AI coach
RESEND_API_KEY=re_...          # For emails
SENTRY_DSN=https://...         # Error monitoring
ADMIN_USER_IDS=uuid1,uuid2     # Comma-separated admin user IDs
```

---

## 🎨 **Design System**

### **Glass Morphism Theme**
- **Base**: Liquid glass design inspired by iOS 26
- **Colors**: Nature green (`#6DA06E`), Soft blue (`#7FB6E3`), Cream background (`#FDFBF7`)
- **Components**: `components/ui/glass-card.tsx`, `glass-button.tsx`
- **CSS Variables**: Defined in `app/globals.css` and `design/tokens.css`

### **Key Tailwind Extensions**:
```css
.glass-card          /* Main glass morphism card */
.glass-card-secondary /* Subtle variant */
.glass-button        /* Glass button with hover effects */
.glass-tint          /* Additional tint overlay */
```

---

## 🚨 **Common Issues & Solutions**

### **"Something went wrong" Error on Homepage**
**Cause**: AuthProvider hanging or Supabase connection failing
**Fix**: 
1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct (.co not .com)
2. Run `node scripts/test-supabase-connection.js`
3. Verify Supabase project is active (not paused)
4. Check browser console for actual error

### **Infinite Loading Spinner**
**Cause**: AuthProvider timeout not working or Supabase unreachable
**Fix**:
- AuthProvider has 5s timeout protection
- Public routes (`isPublicRoute`) should render immediately
- Check `middleware.ts` isn't blocking public routes

### **Build Fails on Vercel with `useAuth` Error**
**Cause**: Dashboard pages trying to prerender without AuthProvider
**Fix**: AuthProvider must be in `app/layout.tsx`, not removed

### **Supabase Connection Fails**
**Diagnostic**: `node scripts/test-supabase-connection.js`
**Common fixes**:
- Wrong URL (use `.co` not `.com`)
- Project paused/deleted - check Supabase dashboard
- Wrong API key - copy from Supabase Settings > API
- Network/DNS issue - check `nslookup PROJECT.supabase.co`

### **Database Migration Errors**
```bash
npm run db:migrate   # Run migrations
npm run db:test      # Test connection
```

---

## 🧪 **Testing Philosophy**

### **Coverage Requirements**:
- Functions: 70% minimum
- Lines: 70% minimum  
- Branches: 70% minimum

### **Test Structure**:
```
__tests__/           # Unit tests (Jest)
├── lib/            # Utility function tests
├── api/            # API route tests
└── components/     # React component tests

tests/e2e/          # E2E tests (Playwright)
├── auth.spec.ts
├── workout-recommendations.spec.ts
└── global-setup.ts
```

### **Running Single Test**:
```bash
npm test -- database.test.ts        # Jest
npx playwright test auth.spec.ts    # Playwright
```

---

## 📦 **Key Dependencies**

### **Critical**:
- `@supabase/ssr` - Server-side Supabase client
- `@supabase/supabase-js` - Supabase JavaScript client
- `stripe` - Payment processing
- `@neondatabase/serverless` - Neon database client
- `jose` - JWT verification
- `zod` - Schema validation

### **UI**:
- `@radix-ui/*` - Headless UI primitives (30+ components)
- `framer-motion` - Animations
- `lucide-react` - Icons
- `recharts` - Data visualization

---

## 🔄 **Onboarding Flow**

The 7-step onboarding is critical to the app:

1. **Step 1-2**: User goals and preferences
2. **Step 3-4**: Health data and fitness level
3. **Step 5-6**: Device integrations
4. **Step 7**: Payment selection (Explorer free vs Pathfinder paid)

**State Management**: 
- Client: `localStorage` for temporary state
- Server: `onboarding_progress` table in Neon
- Completion: Sets `onboarding_complete = true` in users table + `onb=1` cookie

---

## 🛠️ **Development Workflow**

1. **Start dev server**: `npm run dev`
2. **Make changes**
3. **Type check**: `npm run type-check` (or use watch mode)
4. **Lint**: `npm run lint:fix`
5. **Test**: `npm test` (unit) or `npm run test:e2e` (E2E)
6. **Build**: `npm run build` (verify no errors)
7. **Commit & Push**: Vercel auto-deploys from `main`

### **Before Pushing**:
```bash
npm run type-check && npm run lint && npm run build
```

---

## 📚 **Additional Documentation**

- `README.md` - Setup and deployment guide
- `TESTING.md` - Comprehensive testing documentation
- `TROUBLESHOOTING_LANDING_PAGE.md` - Auth/loading issues
- `documentation/` - Detailed feature docs
- `docs/` - Database migration guides

---

## ⚡ **Performance Notes**

- **Middleware**: Runs on every request - keep lightweight
- **AuthProvider**: 5-second timeout prevents blocking
- **Database**: Use connection pooling (Neon handles this)
- **Images**: Next.js Image component with WebP/AVIF
- **PWA**: Service worker caching configured in `next.config.js`

---

## 🔍 **Debugging Tips**

1. **Check Vercel logs**: Deployment tab in dashboard
2. **Local logs**: Browser console + terminal
3. **Database**: Use Neon SQL Editor for queries
4. **Supabase**: Check Auth logs in dashboard
5. **Stripe**: Use Stripe dashboard logs for webhooks

### **Enable Debug Mode**:
```bash
DEBUG=* npm run dev  # Enable all debug logs
```

---

**Last Updated**: 2025-01-05  
**Next.js Version**: 15.5.4  
**Node Version**: 18+
