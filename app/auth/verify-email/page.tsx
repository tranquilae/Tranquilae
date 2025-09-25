'use client';

import { AuthForm } from "@/components/auth-form"

// Prevent prerendering of auth pages
export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthForm 
          type="verify-email"
          title="Verify your email"
          subtitle="Check your inbox for a verification link"
        />
      </div>
    </div>
  )
}
