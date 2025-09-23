# Tranquilae Environment Setup Script
Write-Host "🌿 Tranquilae Environment Setup" -ForegroundColor Green

Write-Host "`n📋 You need to gather these keys from your Supabase Dashboard:"
Write-Host "   Go to: https://supabase.com/dashboard/project/fspoavmvfymlunmfubqp/settings/api"

Write-Host "`n🔑 Keys to copy:"
Write-Host "   1. ANON (public) key - this is your publishable key"
Write-Host "   2. SERVICE_ROLE key - this is your secret key (click eye icon to reveal)"

Write-Host "`n📝 Environment Variables needed in Vercel:"
Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://fspoavmvfymlunmfubqp.supabase.co"
Write-Host "   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[YOUR_ANON_KEY]"
Write-Host "   SUPABASE_SECRET_KEY=[YOUR_SERVICE_ROLE_KEY]"

Write-Host "`n🚀 Next Steps:"
Write-Host "   1. Copy your real Supabase keys"
Write-Host "   2. Update .env.local with real keys"
Write-Host "   3. Set environment variables in Vercel dashboard"
Write-Host "   4. Deploy to Vercel"

Write-Host "`n🌐 Vercel Dashboard: https://vercel.com/dashboard"

# Prompt for keys
Write-Host "`n💡 Would you like me to help update your .env.local file?"
$updateLocal = Read-Host "Enter 'y' to continue, 'n' to skip"

if ($updateLocal -eq 'y' -or $updateLocal -eq 'Y') {
    Write-Host "`nPaste your ANON key (publishable key):"
    $anonKey = Read-Host -AsSecureString
    $anonKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($anonKey))
    
    Write-Host "`nPaste your SERVICE_ROLE key (secret key):"
    $serviceKey = Read-Host -AsSecureString  
    $serviceKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceKey))
    
    # Update .env.local
    $envContent = @"
# 🌿 Tranquilae - Local Environment Variables
# Updated with real Supabase keys

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://tranquilae.com"

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL="https://fspoavmvfymlunmfubqp.supabase.co"

# 🔑 REAL SUPABASE API KEYS
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="$anonKeyPlain"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$anonKeyPlain"
SUPABASE_SECRET_KEY="$serviceKeyPlain"
SUPABASE_SERVICE_ROLE_KEY="$serviceKeyPlain"

# Development Settings
NODE_ENV="development"
"@
    
    $envContent | Set-Content -Path ".env.local"
    Write-Host "`n✅ Updated .env.local with your real keys!" -ForegroundColor Green
    
    Write-Host "`n📋 Copy these for Vercel (Environment Variables):"
    Write-Host "NEXT_PUBLIC_SUPABASE_URL=https://fspoavmvfymlunmfubqp.supabase.co"
    Write-Host "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$anonKeyPlain"
    Write-Host "SUPABASE_SECRET_KEY=$serviceKeyPlain"
}

Write-Host "`n🎯 Final Steps:"
Write-Host "   1. Go to Vercel Dashboard: https://vercel.com/dashboard"
Write-Host "   2. Find your Tranquilae project" 
Write-Host "   3. Go to Settings > Environment Variables"
Write-Host "   4. Add the environment variables shown above"
Write-Host "   5. Redeploy your project"
