import { AuthForm } from "@/components/auth-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthForm 
          type="forgot-password"
          title="Forgot your password?"
          subtitle="Enter your email address and we'll send you a reset link"
        />
      </div>
    </div>
  )
}
