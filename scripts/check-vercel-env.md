# Vercel Environment Variables Setup

## Required Environment Variables for Production

Make sure these are set in your Vercel Dashboard:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://fspoavmvfymlunmfubqp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_i490cr3a929wFuz286rVKA_3EbsFJ7N
SUPABASE_SECRET_KEY=sb_secret_VbdqLvMbmhNLKSiiYo__WA_mCE52Lg2
```

### Database (Neon)
```
DATABASE_URL=your-neon-connection-string
```

### Admin Access (Optional)
```
ADMIN_USER_IDS=your-user-id-here
```

## How to Set in Vercel

1. Go to https://vercel.com/dashboard
2. Select your Tranquilae project
3. Go to Settings > Environment Variables
4. Add each variable:
   - Key: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: The value from above
   - Environments: Check "Production", "Preview", and "Development"
5. Click "Save"

## How to Check Current Values

Run this in PowerShell:
```powershell
vercel env ls
```

## How to Pull Vercel Env to Local
```powershell
vercel env pull .env.local
```

## Important Notes

- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-side only
- After adding variables, you need to redeploy
- The `.env` file in the repo should NOT have real values (only comments)
- Real values go in `.env.local` (local) or Vercel Dashboard (production)

## Test Your Setup

1. Local: `npm run dev` and check console for Supabase config
2. Production: Check build logs in Vercel for any Supabase errors
3. Runtime: Try to sign up / log in

## Troubleshooting

If login still fails:
1. Check Supabase project is not paused (supabase.com/dashboard)
2. Verify URL is HTTPS not HTTP
3. Check keys are not placeholder values
4. Make sure keys match your Supabase project
5. Check Vercel deployment logs for errors
