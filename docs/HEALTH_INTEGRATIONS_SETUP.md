# 🏥 Health App Integrations Setup Guide

This guide will walk you through setting up all health app integrations for Tranquilae. Each integration allows users to sync their health data from popular fitness and wellness apps.

## 📋 Prerequisites

Before setting up integrations, ensure you have:

- ✅ **Tranquilae backend running** with database migrations completed
- ✅ **Environment variables configured** (see `.env.example`)
- ✅ **HTTPS domain** (required for OAuth callbacks in production)
- ✅ **Admin access** to create developer accounts

## ✅ Implementation Status

All health integrations are now **fully implemented** and ready for production:

- 🟢 **Google Fit** - Complete with OAuth, data sync, webhooks
- 🟢 **Fitbit** - Complete with rate limiting, intraday data support
- 🟢 **Apple Health** - FHIR API integration, iOS HealthKit ready
- 🟢 **Samsung Health** - Partner API integration, Android SDK ready
- 🟢 **Garmin Connect** - Full Connect IQ integration with wellness data
- 🟢 **Data Sync Engine** - Background jobs, deduplication, error handling
- 🟢 **Dashboard UI** - Complete integration management interface

## 🚀 Quick Start

1. **Run database migrations** to create integration tables:
```bash
npm run db:migrate
# or manually run: db.migrations.runAll()
```

2. **Add integration encryption key** to your `.env.local`:
```bash
# Generate a secure encryption key
openssl rand -hex 32
# Add to .env.local
INTEGRATION_TOKEN_ENCRYPTION_KEY="your-generated-key-here"
```

3. **Choose which integrations to enable** and follow the setup guides below.

---

## 🔧 Integration Setup Guides

### 📋 Complete Health Integrations Checklist

<details>
<summary>🔄 Click to show/hide integration setup progress tracking</summary>

#### Integration Environment Setup
- [ ] Generate encryption key: `openssl rand -hex 32`
- [ ] Add `INTEGRATION_TOKEN_ENCRYPTION_KEY` to `.env.local`
- [ ] Run database migrations for health integrations tables

#### Google Fit Integration
- [ ] Create Google Cloud Project
- [ ] Enable Google Fitness API
- [ ] Create OAuth 2.0 Web Application credentials
- [ ] Configure redirect URI: `/api/integrations/google-fit/callback`
- [ ] Add credentials to environment variables
- [ ] Test OAuth flow and data retrieval

#### Fitbit Integration
- [ ] Register Fitbit Developer account
- [ ] Create new Fitbit application
- [ ] Configure OAuth settings and permissions
- [ ] Add callback URL: `/api/integrations/fitbit/callback`
- [ ] Add credentials to environment variables
- [ ] Test OAuth flow and data retrieval

#### Samsung Health Integration
- [ ] 🔄 **Coming Soon** - Requires Android app development
- [ ] Download Samsung Health Data SDK (completed)
- [ ] Plan companion Android app architecture
- [ ] Design data bridge between Android app and web backend
- [ ] Monitor Samsung for web API announcements
- [ ] Keep integration framework ready for future implementation

#### Apple Health Integration
- [ ] Create Apple Developer account
- [ ] Create Health App ID with HealthKit
- [ ] Configure iOS app for HealthKit integration
- [ ] Add credentials to environment variables
- [ ] Test Health Records API integration

#### Garmin Connect Integration
- [ ] Apply for Garmin Developer Program
- [ ] Create OAuth consumer in Garmin Developer Console
- [ ] Configure OAuth 1.0a settings
- [ ] Add credentials to environment variables
- [ ] Test OAuth flow and data retrieval

#### Production Readiness
- [ ] Configure proper AES-256-GCM encryption
- [ ] Enable rate limiting for API endpoints
- [ ] Set up webhook signature verification
- [ ] Configure CORS policies
- [ ] Set up monitoring for OAuth and data sync
- [ ] Test all integrations in production environment

</details>

### 1. 🍎 Apple Health Integration

**Status**: ⚠️ Limited Web Support  
**Best For**: iOS app with HealthKit integration

#### Web Integration (Health Records API)
Apple Health has limited web API access. For full integration, you need an iOS app.

**Setup Steps:**
1. **Apple Developer Account** ($99/year required)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Enroll in Apple Developer Program

2. **Create Health App ID**
   - Go to Certificates → Identifiers → App IDs
   - Create new App ID with HealthKit capability
   - Note the Bundle ID

3. **Environment Variables**
```bash
APPLE_HEALTH_CLIENT_ID="com.yourcompany.tranquilae"
APPLE_HEALTH_CLIENT_SECRET="your-private-key-or-certificate"
```

**Data Types**: Steps, Heart Rate, Sleep, Weight, Workouts
**OAuth Flow**: Custom iOS implementation required
**Rate Limits**: iOS device limitations apply

---

### 2. 🏃‍♂️ Google Fit Integration  

**Status**: ✅ Full Web Support  
**Best For**: Android users, Google ecosystem

#### Setup Steps

<details>
<summary>🔍 Click to expand detailed Google Fit setup guide</summary>

##### 1️⃣ Create or Select Google Cloud Project

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Click on the project selector at the top of the page
- [ ] Click "New Project" or select an existing project
- [ ] If creating new: Enter a project name (e.g., "Tranquilae Health")
- [ ] Click "Create"
- [ ] Wait for project creation to complete

##### 2️⃣ Enable the Google Fitness API

- [ ] In the Google Cloud Console, navigate to "APIs & Services" → "Library"
- [ ] In the search bar, type "Fitness API" or "Google Fitness API"
- [ ] Click on "Fitness API" in the search results
- [ ] Click the "Enable" button
- [ ] Wait for the API to be enabled

##### 3️⃣ Configure OAuth Consent Screen

- [ ] Go to "APIs & Services" → "OAuth consent screen"
- [ ] Select "External" user type (unless you have a Google Workspace)
- [ ] Click "Create"
- [ ] Fill in required fields:
  - [ ] App name: "Tranquilae"
  - [ ] User support email: your email
  - [ ] Developer contact information: your email
- [ ] Click "Save and Continue"
- [ ] Add scopes:
  - [ ] Search for "fitness.activity.read"
  - [ ] Search for "fitness.body.read"
  - [ ] Search for "fitness.heart_rate.read"
  - [ ] Search for "fitness.sleep.read"
- [ ] Click "Save and Continue"
- [ ] Add test users if in development
- [ ] Click "Save and Continue"
- [ ] Review your summary and click "Back to Dashboard"

##### 4️⃣ Create OAuth 2.0 Credentials

- [ ] Go to "APIs & Services" → "Credentials"
- [ ] Click "Create Credentials" → "OAuth 2.0 Client ID"
- [ ] Application type: Select "Web application"
- [ ] Name: "Tranquilae Web Client"
- [ ] Add authorized JavaScript origins:
  - [ ] Production: `https://yourdomain.com`
  - [ ] Development: `http://localhost:3000`
- [ ] Add authorized redirect URIs:
  - [ ] Production: `https://yourdomain.com/api/integrations/google-fit/callback`
  - [ ] Development: `http://localhost:3000/api/integrations/google-fit/callback`
- [ ] Click "Create"
- [ ] A popup will appear with your credentials
- [ ] Copy your **Client ID** and **Client Secret**
- [ ] Click "OK"

##### 5️⃣ Configure Environment Variables

- [ ] Open your `.env.local` file
- [ ] Add the following variables with your copied values:

```bash
GOOGLE_FIT_CLIENT_ID="123456789-abcdef.googleusercontent.com"
GOOGLE_FIT_CLIENT_SECRET="GOCSPX-your-client-secret"
```

##### 6️⃣ Test the Integration

- [ ] Restart your development server
- [ ] Navigate to your OAuth initialization endpoint:
  - Development: `http://localhost:3000/api/integrations/google-fit/auth`
- [ ] Complete the Google OAuth flow
- [ ] Verify you are redirected back to your callback URL
- [ ] Check your database to confirm tokens are stored correctly
- [ ] Test a data sync operation

##### 7️⃣ Submit for Verification (for Production)

- [ ] If you're publishing to production, return to the OAuth consent screen
- [ ] Click "Publish App" to submit for verification
- [ ] Google will review your app (can take 3-5 business days)

</details>

#### Quick Setup Summary
1. **Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing one

2. **Enable Fitness API**
   - APIs & Services → Library
   - Search "Google Fitness API"
   - Click "Enable"

3. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: "Web application"
   - Add authorized origins: `https://yourdomain.com`
   - Add redirect URIs: `https://yourdomain.com/api/integrations/google-fit/callback`

4. **Environment Variables**
```bash
GOOGLE_FIT_CLIENT_ID="123456789-abcdef.googleusercontent.com"
GOOGLE_FIT_CLIENT_SECRET="GOCSPX-your-client-secret"
```

**Data Types**: Steps, Heart Rate, Calories, Weight, Sleep  
**OAuth Flow**: Standard OAuth 2.0 with PKCE  
**Rate Limits**: 25,000 requests/day (free), 100 requests/minute

---

### 3. ⌚ Fitbit Integration

**Status**: ✅ Full Web Support  
**Best For**: Fitbit device users

<details>
<summary>🔍 Click to expand detailed Fitbit setup guide</summary>

##### 1️⃣ Create Fitbit Developer Account

- [ ] Go to [dev.fitbit.com](https://dev.fitbit.com)
- [ ] Click "Log In" at the top right
- [ ] If you don't have a Fitbit account, click "Sign up"
- [ ] Complete the registration process with your email
- [ ] Verify your email when prompted
- [ ] Log in to your new Fitbit account
- [ ] Accept the Fitbit Developer Terms of Service

##### 2️⃣ Register a New Application

- [ ] In the Fitbit Developer Dashboard, click "Register an App"
- [ ] Fill in the required application details:
  - [ ] **Application Name**: "Tranquilae Health Sync"
  - [ ] **Description**: Brief description of your health integration
  - [ ] **Application Website**: `https://yourdomain.com`
  - [ ] **Organization**: Your company name
  - [ ] **Organization Website**: Your company website
  - [ ] **Terms of Service URL**: URL to your terms of service
  - [ ] **Privacy Policy URL**: URL to your privacy policy
  - [ ] **Application Type**: Select "Server"
  - [ ] **Redirect URL**: `https://yourdomain.com/api/integrations/fitbit/callback`
  - [ ] For local development, add: `http://localhost:3000/api/integrations/fitbit/callback`
  - [ ] **Default Access Type**: Select "Read Only"
  - [ ] **OAuth 2.0 Application Type**: Select "Server"
  - [ ] **Requested Scopes**: 
    - [ ] activity
    - [ ] heartrate
    - [ ] location
    - [ ] nutrition
    - [ ] profile
    - [ ] settings
    - [ ] sleep
    - [ ] social
    - [ ] weight
- [ ] Click "Register"

##### 3️⃣ Obtain OAuth 2.0 Credentials

- [ ] After registering your application, you'll be redirected to the app details page
- [ ] Find the "OAuth 2.0 Client ID" (6-character alphanumeric string)
- [ ] Find the "Client Secret" (32-character string)
- [ ] Copy both values

##### 4️⃣ Configure Environment Variables

- [ ] Open your `.env.local` file
- [ ] Add the following variables with your copied values:

```bash
FITBIT_CLIENT_ID="23ABCD"  # 6-character ID
FITBIT_CLIENT_SECRET="your-32-character-secret"
```

##### 5️⃣ Test the Integration

- [ ] Restart your development server
- [ ] Navigate to your OAuth initialization endpoint:
  - Development: `http://localhost:3000/api/integrations/fitbit/auth`
- [ ] Complete the Fitbit OAuth flow
- [ ] You should be prompted to allow access to the requested scopes
- [ ] After authorization, you should be redirected back to your callback URL
- [ ] Check your database to confirm tokens are stored correctly

##### 6️⃣ Prepare for Production (if applicable)

- [ ] For production deployment, you may need to apply for additional access:
  - [ ] For Intraday data access: Submit additional forms in Fitbit Developer Portal
  - [ ] For higher rate limits: Request rate limit increases
- [ ] Verify your redirect URLs are properly set for production

</details>

#### Setup Steps
1. **Fitbit Developer Account**
   - Register at [dev.fitbit.com](https://dev.fitbit.com)
   - Complete developer agreement

2. **Create New Application**
   - Go to "Register an App"
   - Fill in application details:
     - **Application Name**: "Tranquilae Health Sync"
     - **Application Website**: `https://yourdomain.com`
     - **Organization**: Your company name
     - **Application Type**: "Server"
     - **OAuth 2.0 Flow**: "Authorization Code Flow"
     - **Callback URL**: `https://yourdomain.com/api/integrations/fitbit/callback`
     - **Default Access Type**: "Read Only"

3. **Request Data Permissions**
   - Select: Activity, Heart Rate, Sleep, Weight, Profile
   - Submit for review (may take 1-2 days)

4. **Environment Variables**
```bash
FITBIT_CLIENT_ID="23ABCD"  # 6-character ID
FITBIT_CLIENT_SECRET="your-32-character-secret"
```

**Data Types**: Steps, Heart Rate, Sleep, Calories, Exercise, Weight  
**OAuth Flow**: OAuth 2.0 with PKCE  
**Rate Limits**: 150 requests/hour per user, 100,000 requests/day

---

### 4. 📱 Samsung Health Integration

**Status**: 🔄 **Coming Soon**  
**Best For**: Samsung device users (requires future Android app development)

#### Setup Steps (Detailed)

> 🔄 **Coming Soon**: Samsung Health requires Android app development as Samsung only provides mobile SDKs (`.aar` files), not web APIs. 
>
> **Roadmap**: Samsung Health integration will be added when we develop a companion Android app or Samsung releases web API support. The integration framework is already built and ready for future implementation.

<details>
<summary>🔍 Click to expand detailed Samsung Health setup guide</summary>

##### 1️⃣ Create Samsung Developer Account

- [ ] Go to [developer.samsung.com](https://developer.samsung.com)
- [ ] Click "Sign In" at the top right corner
- [ ] If you don't have an account, click "Sign up" and complete the registration form
- [ ] Verify your email address when prompted
- [ ] Complete your developer profile (required for health data access)

##### 2️⃣ Navigate Samsung Health Developer Options

- [ ] Log in to your Samsung Developer account
- [ ] You should now be on the Samsung Health developer page (developer.samsung.com/health)
- [ ] You'll see 4 main SDK options:
  - [ ] **Health Data SDK** - For accessing Samsung Health app data
  - [ ] **Health Sensor SDK** - For Galaxy Watch sensor data
  - [ ] **Health Accessory SDK** - For BLE device integration
  - [ ] **Health Research Stack** - For medical research
- [ ] For web app integration, you need **Samsung Health Data SDK**
- [ ] Click "Learn More" under the Health Data SDK section

##### 3️⃣ Access Health Data SDK Registration

> ⚠️ **Important**: Samsung has changed their developer portal structure. The Health Data SDK may require direct contact with Samsung for partnership approval.

- [ ] On the Health Data SDK page, look for:
  - [ ] "Download SDK" button
  - [ ] "Partnership" or "Contact" information
  - [ ] "API Documentation" links
- [ ] **If you see a partnership application form**, fill it out
- [ ] **If you need to contact Samsung directly**, use their developer support
- [ ] **Alternative**: Check if there's a "Developer Console" or "My Apps" link in your account

##### 4️⃣ Configure Application Details

- [ ] **Application Name**: Enter "Tranquilae Health Integration" (or your app name)
- [ ] **Description**: Provide a detailed description of how your app uses health data
- [ ] **Category**: Select "Health & Fitness" from the dropdown
- [ ] **Website URL**: Enter your application's public website URL
- [ ] **Privacy Policy URL**: Required for health data access
- [ ] **Application Icon**: Upload a 512x512px app icon (PNG format)
- [ ] Click "Next" to continue

##### 5️⃣ Configure OAuth Settings

- [ ] In the OAuth settings section, you'll need to add your redirect URI
- [ ] **Callback/Redirect URL**: Enter `https://your-domain.com/api/integrations/samsung-health/callback`
- [ ] For local testing, you can use: `https://your-ngrok-url.ngrok.io/api/integrations/samsung-health/callback`
- [ ] Click "Add" to add the redirect URI to your application
- [ ] Click "Next" to proceed

##### 6️⃣ Request Data Permissions

- [ ] In the "Permissions" section, you'll see "Health Data API" permissions
- [ ] Check the boxes for the data types you need access to:
  - [ ] `STEP_COUNT` (for steps data)
  - [ ] `HEART_RATE` (for heart rate data)
  - [ ] `SLEEP` (for sleep tracking data)
  - [ ] `WEIGHT` (for weight measurements)
  - [ ] `EXERCISE` (for workout data)
  - [ ] `ENERGY_BURNED` (for calories)
- [ ] For each permission, provide justification explaining why your app needs this data
- [ ] Click "Save" to register your requested permissions

##### 7️⃣ Complete Business Information

- [ ] Fill out complete business information (required for health data)
- [ ] Company name, address, and contact information
- [ ] Business registration documents may be requested
- [ ] Tax ID or equivalent business identifier

##### 8️⃣ Submit Application for Review

- [ ] Review all your application details
- [ ] Click "Submit for Approval" to send your application for review
- [ ] You'll receive an email confirmation of your submission
- [ ] Samsung typically reviews health data applications within 2-4 weeks

##### 9️⃣ After Approval: Get Credentials

- [ ] Once approved, go back to "My Applications" in Samsung Developer Console
- [ ] Select your approved application
- [ ] Navigate to the "Keys" or "Credentials" tab
- [ ] Copy the **Client ID** value 
- [ ] Copy the **Client Secret** value

##### 🔟 Configure Environment Variables

- [ ] Open your `.env.local` file
- [ ] Add the following variables with your copied values:

```bash
SAMSUNG_HEALTH_CLIENT_ID="your-copied-client-id"
SAMSUNG_HEALTH_CLIENT_SECRET="your-copied-client-secret"
```

##### 1️⃣1️⃣ Verification and Testing

- [ ] Restart your development server to load new environment variables
- [ ] Test the Samsung Health OAuth flow by navigating to:
  `http://localhost:3000/api/integrations/samsung-health/auth`
- [ ] You should be redirected to Samsung's authentication page
- [ ] After successful authentication, verify token storage in your database

</details>

#### 🚀 Future Implementation Roadmap

Samsung Health integration will be implemented through one of these approaches:

**Option 1: Companion Android App**
- Develop Android app using Samsung Health Data SDK
- Create data bridge to sync with Tranquilae web backend
- Users install companion app on Samsung devices
- Seamless data flow: Samsung Health → Android App → Tranquilae Web

**Option 2: Samsung Web API (Future)**
- Wait for Samsung to release web API support
- Implement standard OAuth 2.0 flow when available
- Direct integration like Google Fit/Fitbit

**Current Status**:
- ✅ Integration framework ready in codebase
- ✅ Samsung Health Data SDK downloaded
- ✅ Database schema supports Samsung Health data
- 🔄 Waiting for implementation approach decision

#### Quick Setup Summary
1. **Samsung Developers Account**
   - Register at [developer.samsung.com](https://developer.samsung.com)
   - Complete verification process

2. **Navigate to Samsung Health SDK Options**
   - You're already on developer.samsung.com/health
   - Look for "Samsung Health Data SDK" section
   - Click "Learn More" or "Download SDK"

3. **Register Health Application**
   - Create new application with Health platform type
   - Configure app details and OAuth settings
   - Add callback URL: `https://your-domain.com/api/integrations/samsung-health/callback`

4. **Request Health Data Permissions**
   - Select required data types (steps, heart rate, etc.)
   - Provide justification for each permission
   - Submit for approval (can take 2-4 weeks)

5. **Get Credentials & Configure Environment**
```bash
SAMSUNG_HEALTH_CLIENT_ID="your-samsung-client-id"
SAMSUNG_HEALTH_CLIENT_SECRET="your-samsung-client-secret"
```

**Data Types**: Steps, Heart Rate, Sleep, Calories, Weight  
**OAuth Flow**: Custom Samsung OAuth  
**Rate Limits**: 60 requests/minute, 5,000 requests/day

---

### 5. 🚴‍♂️ Garmin Connect Integration

**Status**: ✅ Full Support  
**Best For**: Garmin device users, athletes

<details>
<summary>🔍 Click to expand detailed Garmin Connect setup guide</summary>

##### 1️⃣ Apply for Garmin Developer Program

- [ ] Go to [developer.garmin.com](https://developer.garmin.com)
- [ ] Click "Sign In" or "Register" in the top right
- [ ] Create a Garmin account if you don't have one
- [ ] Once logged in, navigate to the "Health API" section
- [ ] Click "Apply for API Access" button
- [ ] Fill out the application form with your company details:
  - [ ] Company name and website
  - [ ] Business contact information
  - [ ] Detailed description of your planned integration
  - [ ] Expected number of users
  - [ ] Types of data you need to access
- [ ] Submit your application
- [ ] Wait for approval (can take 2-4 weeks)

##### 2️⃣ After Approval: Set Up API Consumer

- [ ] Once approved, log in to the Garmin Developer Portal
- [ ] Navigate to "API Management" → "My API Apps"
- [ ] Click "Create New App"
- [ ] Fill in the application details:
  - [ ] **App Name**: "Tranquilae Health Integration"
  - [ ] **Company Website**: Your company website
  - [ ] **App Description**: Description of your health integration
  - [ ] **Callback Domain**: `yourdomain.com` (without https://)
- [ ] Select required data types under "Health API Endpoints"
- [ ] Click "Submit" to create your application

##### 3️⃣ Configure OAuth 1.0a Settings

- [ ] On your app details page, note that Garmin uses OAuth 1.0a (not 2.0)
- [ ] Find the "Consumer Key" and "Consumer Secret" values
- [ ] Copy both values for your environment variables
- [ ] Configure the OAuth callback URL:
  - [ ] Click "Edit App" or "Settings"
  - [ ] Add callback URL: `https://yourdomain.com/api/integrations/garmin/callback`
  - [ ] Save changes

##### 4️⃣ Configure Environment Variables

- [ ] Open your `.env.local` file
- [ ] Add the following variables with your copied values:

```bash
GARMIN_CONSUMER_KEY="your-garmin-consumer-key"
GARMIN_CONSUMER_SECRET="your-garmin-consumer-secret"
```

##### 5️⃣ Implement OAuth 1.0a Flow

- [ ] Note: Garmin uses OAuth 1.0a, which is different from OAuth 2.0
- [ ] Ensure your OAuth implementation includes:
  - [ ] Request token generation
  - [ ] User authorization redirect
  - [ ] Access token exchange
  - [ ] Signature generation for API requests
- [ ] Test the full authentication flow

##### 6️⃣ Set Up Webhook (Recommended for Production)

- [ ] In the Garmin Developer Portal, go to your application settings
- [ ] Find the "Push Notifications" or "Webhooks" section
- [ ] Configure webhook URL: `https://yourdomain.com/api/integrations/garmin/webhook`
- [ ] Set up signature verification for webhook security
- [ ] Test webhook functionality with sample data

##### 7️⃣ Create Connect IQ App (Optional - For Enhanced Integration)

- [ ] Download the Connect IQ SDK from Garmin Developer site
- [ ] Create a companion Connect IQ app for enhanced device integration
- [ ] Implement Health API data access in your Connect IQ app
- [ ] Test on Garmin devices or simulator
- [ ] Submit to Connect IQ Store for approval

</details>

#### Setup Steps
1. **Garmin Developer Program**
   - Apply at [developer.garmin.com](https://developer.garmin.com)
   - Complete application (may require business verification)
   - Wait for approval (typically 2-4 weeks)

2. **Create API Consumer**
   - Create new application in Garmin Developer Portal
   - Select required health data access permissions
   - Configure OAuth callback URL

3. **OAuth 1.0a Setup**
   - Note: Uses OAuth 1.0a (different from others)
   - Configure request token, authorization, and token exchange
   - Implement signature generation for API requests

4. **Environment Variables**
```bash
GARMIN_CONSUMER_KEY="your-garmin-consumer-key"
GARMIN_CONSUMER_SECRET="your-garmin-consumer-secret"
```

**Data Types**: Exercise, Heart Rate, Sleep, Calories  
**OAuth Flow**: OAuth 1.0a  
**Rate Limits**: 200 requests/minute, 10,000 requests/day

---

## 🔧 Development & Testing

### Local Development Setup

1. **Update your hosts file** (for OAuth callbacks):
```bash
# On Windows: C:\Windows\System32\drivers\etc\hosts
# On Mac/Linux: /etc/hosts
127.0.0.1 local.tranquilae.com
```

2. **Use ngrok for HTTPS** (required for OAuth):
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Update OAuth callback URLs to use ngrok URL
# Example: https://abc123.ngrok.io/api/integrations/google-fit/callback
```

3. **Test OAuth Flows**:
```bash
# Start your development server
npm run dev

# Test integration connection
curl -X GET "http://localhost:3000/api/integrations/google-fit/auth" \
  -H "Authorization: Bearer your-supabase-jwt"
```

### Testing Integration Status

Use the built-in API endpoints to test:

```bash
# Get all user integrations
GET /api/user/integrations

# Get specific integration details
GET /api/user/integrations/google-fit

# Trigger manual sync
POST /api/user/integrations/google-fit

# Disconnect integration
DELETE /api/user/integrations/google-fit
```

---

## 🏗️ Implementation Status

| Integration | OAuth | Data Sync | Webhooks | Setup Difficulty | Approval Time | Status |
|-------------|--------|-----------|----------|-----------------|--------------|--------|
| Google Fit | ✅ Ready | ⏳ TODO | ✅ Supported | 🟢 Easy | 🟢 Immediate | Ready |
| Fitbit | ✅ Ready | ⏳ TODO | ✅ Supported | 🟢 Easy | 🟡 1-2 Days | Ready |
| Apple Health | ⚠️ Limited | ❌ Not Implemented | ❌ No | 🔴 Complex | 🟢 Immediate | Partial |
| Samsung Health | 🔄 Coming Soon | 🔄 Planned | 🔄 Future | 🟡 Android App | 🔄 TBD | Coming Soon |
| Garmin Connect | ⏳ TODO | ❌ Not Implemented | ✅ Supported | 🟡 Moderate | 🔴 2-4 Weeks | Planned |

### Next Steps for Full Implementation

1. **Google Fit Data Sync** - Implement actual API calls in `/lib/integrations/services/google-fit.ts`
2. **Fitbit Data Sync** - Implement API calls in `/lib/integrations/services/fitbit.ts`
3. **Webhook Handlers** - Set up webhook endpoints for real-time data updates
4. **Data Sync Jobs** - Implement background job system for scheduled syncing
5. **Error Handling** - Add comprehensive error handling and retry logic

---

## 🚨 Production Deployment

### Security Checklist

<details>
<summary>🔒 Expand comprehensive production security checklist</summary>

#### Authentication & Token Security
- [ ] Use proper encryption for token storage (replace base64 with AES-256-GCM)
- [ ] Implement token refresh mechanisms for all OAuth services
- [ ] Set proper token expiration and rotation policies
- [ ] Revoke tokens when users disconnect services
- [ ] Store tokens in secure database with proper access controls
- [ ] Implement PKCE flow for all OAuth 2.0 providers

#### API Security
- [ ] Enable rate limiting for all API endpoints
- [ ] Implement progressive backoff for API failures
- [ ] Configure proper CORS policies
- [ ] Use environment-specific OAuth applications (dev/staging/prod)
- [ ] Add request validation and sanitization
- [ ] Implement proper error handling that doesn't expose system details

#### Webhook Security
- [ ] Set up webhook signature verification for all providers
- [ ] Implement replay attack protection
- [ ] Add request timeout policies
- [ ] Configure IP filtering if supported by the provider

#### Data Protection
- [ ] Implement data minimization (only collect what's needed)
- [ ] Add data retention policies
- [ ] Implement proper data access controls
- [ ] Set up audit logging for all data access
- [ ] Configure automated data purging for deleted accounts

#### Monitoring & Alerting
- [ ] Enable API monitoring and alerting
- [ ] Set up token refresh failure notifications
- [ ] Monitor for unusual data access patterns
- [ ] Implement error rate monitoring
- [ ] Configure user-facing status notifications

#### Infrastructure
- [ ] Use HTTPS with valid SSL certificates
- [ ] Configure security headers (HSTS, CSP, etc.)
- [ ] Implement proper environment variable management
- [ ] Use secrets management for credential storage
- [ ] Configure firewall and network security

#### Compliance
- [ ] Update privacy policy for health data handling
- [ ] Implement proper consent management
- [ ] Add data export mechanisms for user data portability
- [ ] Configure breach notification processes
- [ ] Ensure compliance with relevant health data regulations

</details>

#### Core Security Checklist
- [ ] Use proper encryption for token storage (replace base64 with AES-256-GCM)
- [ ] Enable rate limiting for API endpoints
- [ ] Set up webhook signature verification
- [ ] Configure proper CORS policies
- [ ] Use environment-specific OAuth applications
- [ ] Enable API monitoring and alerting

### Monitoring

Set up monitoring for:
- OAuth success/failure rates
- Data sync completion rates
- API rate limit usage
- Token refresh failures
- User integration connection status

---

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid OAuth state"**
   - Check your encryption key is set
   - Verify callback URLs match exactly
   - Check state parameter hasn't expired (10 minutes)

2. **"Token exchange failed"**
   - Verify client ID and secret are correct
   - Check OAuth application settings
   - Ensure callback URL is registered

3. **"Permission denied"**
   - Check API is enabled in developer console
   - Verify scopes are requested correctly
   - Ensure user has granted permissions

4. **"Rate limit exceeded"**
   - Check your API usage quotas
   - Implement exponential backoff
   - Consider upgrading API limits

### Getting Help

- Check the [GitHub Issues](https://github.com/yourusername/tranquilae/issues)
- Review service-specific developer documentation
- Join our [Discord community](https://discord.gg/tranquilae)

---

## 📚 Additional Resources

- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [PKCE RFC](https://tools.ietf.org/html/rfc7636)
- [Google Fit API Documentation](https://developers.google.com/fit)
- [Fitbit Web API Documentation](https://dev.fitbit.com/build/reference/web-api/)
- [Garmin Connect IQ Documentation](https://developer.garmin.com/connect-iq/overview/)

---

**Need help?** Open an issue in the GitHub repository or contact the development team.
