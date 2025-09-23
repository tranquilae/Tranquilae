"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden glass-card border-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Logo */}
                <div className="mb-4">
                  <Logo className="h-8 w-auto" />
                </div>

                {/* Success Icon */}
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">Account created successfully!</h1>
                  <p className="text-muted-foreground text-balance">
                    Welcome to Tranquilae! Your wellness journey starts now. We've sent a verification email to your inbox.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-4 w-full">
                  <Button asChild className="w-full">
                    <Link href="/auth/verify-otp">
                      Enter Verification Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/">
                      Continue to Dashboard
                    </Link>
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Didn't receive an email? Check your spam folder or</p>
                  <button className="text-primary hover:underline">
                    resend verification email
                  </button>
                </div>
              </div>
            </div>
            
            {/* Hero Image Section */}
            <div className="relative hidden bg-gradient-to-br from-green-500/10 to-primary/20 md:block">
              <img
                src="/chris-lee-70l1tDAI6rM.jpg"
                alt="Welcome to Tranquilae"
                className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Welcome to Your Journey</h3>
                <p className="text-white/80">You're now part of a community focused on mindful wellness.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-balance text-center text-xs text-muted-foreground mt-6 [&_a]:underline [&_a]:underline-offset-4 [&_a]:text-primary hover:[&_a]:text-primary/80">
          Need help? <Link href="/contact">Contact our support team</Link> or visit our <Link href="/help">Help Center</Link>.
        </div>
      </div>
    </div>
  )
}
