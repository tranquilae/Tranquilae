"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import Link from "next/link"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async () => {
    if (otp.length !== 6) return
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsVerified(true)
    setIsLoading(false)
  }

  const handleResend = async () => {
    // Simulate resend logic
    console.log("Resending OTP...")
  }

  if (isVerified) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <Card className="overflow-hidden glass-card border-0 shadow-2xl">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="p-6 md:p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Logo */}
                  <div className="mb-4">
                    <img 
                      src="/logo.svg" 
                      alt="Tranquilae" 
                      className="h-8 w-auto mx-auto" 
                    />
                  </div>

                  {/* Success State */}
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-2xl font-bold">Email verified successfully!</h1>
                    <p className="text-muted-foreground text-balance">
                      Your account is now verified. Welcome to Tranquilae!
                    </p>
                  </div>

                  <Button asChild className="w-full">
                    <Link href="/">Continue to Dashboard</Link>
                  </Button>
                </div>
              </div>
              
              {/* Hero Image Section */}
              <div className="relative hidden bg-gradient-to-br from-green-500/10 to-primary/20 md:block overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-primary/30" />
                <img
                  src="/chris-lee-70l1tDAI6rM.jpg"
                  alt="Welcome"
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">You're All Set!</h3>
                  <p className="text-white/90 drop-shadow-md leading-relaxed">
                    Your wellness journey begins now.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden glass-card border-0 shadow-2xl">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    <img 
                      src="/logo.svg" 
                      alt="Tranquilae" 
                      className="h-8 w-auto mx-auto" 
                    />
                  </div>
                  
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h1 className="text-2xl font-bold">Enter verification code</h1>
                  <p className="text-balance text-muted-foreground">
                    We've sent a 6-digit code to your email address
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex flex-col items-center space-y-4">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp}
                    className="flex justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                  
                  <p className="text-sm text-muted-foreground">
                    {6 - otp.length} digits remaining
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <Button 
                    onClick={handleVerify}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the code?
                    </p>
                    <button 
                      onClick={handleResend}
                      className="text-sm text-primary hover:underline"
                    >
                      Resend verification code
                    </button>
                  </div>

                  <div className="flex items-center justify-center">
                    <Link 
                      href="/auth/login" 
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hero Image Section */}
            <div className="relative hidden bg-gradient-to-br from-primary/5 to-secondary/10 md:block overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20" />
              <img
                src="/chris-lee-70l1tDAI6rM.jpg"
                alt="Verification"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Floating elements */}
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm" />
              <div className="absolute bottom-32 right-12 w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm" />
              <div className="absolute top-1/4 left-8 w-8 h-8 rounded-full bg-secondary/30 backdrop-blur-sm" />
              
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">Almost There!</h3>
                <p className="text-white/90 drop-shadow-md leading-relaxed">
                  Just one more step to secure your account and begin your wellness journey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-balance text-center text-xs text-muted-foreground mt-6 [&_a]:underline [&_a]:underline-offset-4 [&_a]:text-primary hover:[&_a]:text-primary/80">
          Need help? <Link href="/contact">Contact our support team</Link>
        </div>
      </div>
    </div>
  )
}
