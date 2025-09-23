# 🏥 Health Integrations Environment Setup

## Auto-Detection System

Your Tranquilae app now has an **auto-detection system** that automatically enables health integrations when you add the proper environment variables. No code changes needed!

## Current Status

Run this command to check your current integration status:
```bash
node scripts/test-health-integrations.js
```

## Environment Variables Setup

### 🔐 Required Base Configuration

Add this to your `.env.local` (and Vercel environment variables):

```bash
# Health Integration Token Encryption Key (REQUIRED)
# Generate with: openssl rand -hex 32
INTEGRATION_TOKEN_ENCRYPTION_KEY="your-64-character-hex-encryption-key"
```

### 📱 Health Service Credentials

Add the credentials for the services you want to enable:

#### ✅ Google Fit (Ready)
```bash
GOOGLE_FIT_CLIENT_ID="your-google-client-id.googleusercontent.com"
GOOGLE_FIT_CLIENT_SECRET="GOCSPX-your-google-client-secret"
```

#### ✅ Fitbit (Ready)  
```bash
FITBIT_CLIENT_ID="your-6-character-fitbit-id"
FITBIT_CLIENT_SECRET="your-32-character-fitbit-secret"
```

#### 🔄 Apple Health (Coming Soon - will auto-enable when you add these)
```bash
APPLE_HEALTH_CLIENT_ID="your-apple-health-client-id"
APPLE_HEALTH_CLIENT_SECRET="your-apple-health-client-secret"
```

#### 🔄 Samsung Health (Coming Soon - will auto-enable when you add these)
```bash
SAMSUNG_HEALTH_CLIENT_ID="your-samsung-health-client-id"
SAMSUNG_HEALTH_CLIENT_SECRET="your-samsung-health-client-secret"
```

#### 🔄 Garmin Connect (Coming Soon - will auto-enable when you add these)
```bash
GARMIN_CONSUMER_KEY="your-garmin-consumer-key"
GARMIN_CONSUMER_SECRET="your-garmin-consumer-secret"
```

## How Auto-Detection Works

1. **Environment Validation**: The system checks if credentials are properly configured
2. **Dynamic UI**: Dashboard shows "Coming Soon" for unconfigured services
3. **Automatic Activation**: When you add valid credentials, services automatically become available
4. **No Restarts Needed**: Changes in Vercel environment variables are detected on next request

## Testing the System

1. **Local Development**:
   ```bash
   # Add credentials to .env.local
   echo "GOOGLE_FIT_CLIENT_ID=your-actual-id" >> .env.local
   echo "GOOGLE_FIT_CLIENT_SECRET=your-actual-secret" >> .env.local
   
   # Restart dev server
   npm run dev
   
   # Check dashboard - Google Fit should now show "Connect" instead of "Coming Soon"
   ```

2. **Vercel Deployment**:
   ```bash
   # Add environment variables in Vercel dashboard
   # Next deployment will automatically enable the configured services
   ```

## Development Logging

In development mode, the app logs integration status:
- Check browser console for integration updates
- Look for "🏥 Health Integrations Updated" messages
- Run the test script to see detailed status

## Production Deployment

When you deploy to Vercel:
1. Add environment variables in Vercel dashboard  
2. Deploy your app
3. Configured integrations will automatically be available
4. Users will see enabled services immediately

## Troubleshooting

**Integration still shows "Coming Soon"?**
- Check environment variables are set correctly (not empty, not just "#")
- Ensure INTEGRATION_TOKEN_ENCRYPTION_KEY is set
- Restart development server
- Check browser console for error messages

**Need help with OAuth setup?**
- Refer to `docs/HEALTH_INTEGRATIONS_SETUP.md` for detailed setup guides
- Each service has step-by-step instructions for getting credentials
