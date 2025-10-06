# Supabase Keep-Alive Automation

## Overview

This project includes an automated system to prevent your Supabase project from pausing due to inactivity. A Vercel Cron Job pings your Supabase database every 6 hours.

## How It Works

1. **Cron Job**: Vercel runs `/api/cron/keep-alive` every 6 hours (at 00:00, 06:00, 12:00, 18:00 UTC)
2. **API Route**: Makes a simple query to Supabase to keep the connection active
3. **Health Check**: Verifies both database and auth services are responding

## Schedule

- **Frequency**: Every 6 hours (4 times per day)
- **Schedule**: `0 */6 * * *` (cron format)
- **Times**: 00:00, 06:00, 12:00, 18:00 UTC

## Setup Instructions

### 1. Vercel Configuration (Already Done)

The `vercel.json` file already includes the cron configuration:

```json
{
  "crons": [
    { "path": "/api/cron/keep-alive", "schedule": "0 */6 * * *" }
  ]
}
```

### 2. Optional: Add Cron Secret (Recommended for Production)

To secure the endpoint, add a `CRON_SECRET` environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secret (e.g., use `openssl rand -base64 32`)
   - **Environments**: Production, Preview, Development

3. The cron job will automatically use this secret to authenticate

### 3. Verify Setup

After deploying, check that the cron is working:

#### Option A: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/cron/keep-alive`
3. Look for successful responses every 6 hours

#### Option B: Manual Test
Visit: `https://your-domain.com/api/cron/keep-alive`

You should see a response like:
```json
{
  "success": true,
  "message": "Supabase project pinged successfully",
  "timestamp": "2024-12-14T12:00:00.000Z",
  "supabaseUrl": "https://fspoavmvfymlunmfubqp...",
  "healthCheck": "ok",
  "authCheck": "ok"
}
```

## Monitoring

### Check Cron Execution

In Vercel Dashboard:
- Go to Deployments → Select latest deployment
- Click "Functions" tab
- Look for `/api/cron/keep-alive` in the list
- Check execution logs and timestamps

### Troubleshooting

If the cron isn't running:

1. **Verify deployment**: Crons only work in production deployments
2. **Check Vercel plan**: Crons require Hobby plan or higher
3. **Review logs**: Look for errors in Vercel function logs
4. **Test manually**: Visit the endpoint directly to check for errors

## Why This Prevents Pausing

Supabase pauses projects after **7 days of inactivity**. Our cron runs **4 times per day**, which means:
- Maximum gap between pings: 6 hours
- Your project is accessed 28 times per week
- This is well above the threshold for "active" projects

## Cost Impact

- **Vercel**: Cron jobs are included in Hobby plan and above (no extra cost)
- **Supabase**: These are simple queries that use minimal resources (free tier safe)

## Advanced Options

### Change Frequency

Edit `vercel.json` to change how often the cron runs:

```json
// Every 4 hours
{ "path": "/api/cron/keep-alive", "schedule": "0 */4 * * *" }

// Every 12 hours
{ "path": "/api/cron/keep-alive", "schedule": "0 */12 * * *" }

// Every day at 8 AM UTC
{ "path": "/api/cron/keep-alive", "schedule": "0 8 * * *" }
```

### Add Email Notifications

To get notified if the cron fails, you can:
1. Use Vercel Monitoring
2. Add Sentry or similar error tracking
3. Set up custom alerts in your logging platform

## Security

- The endpoint is public but performs only read operations
- Optional `CRON_SECRET` adds authentication
- No sensitive data is exposed in responses
- Uses edge runtime for fast, lightweight execution

## Additional Notes

- The cron job uses minimal resources
- It's designed to fail gracefully if Supabase is down
- Logs provide visibility into execution status
- Can be manually triggered for testing

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify Supabase environment variables are correct
3. Test the endpoint manually
4. Review Supabase dashboard for connection history
