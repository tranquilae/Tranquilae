import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthForm 
          type="login"
          title="Welcome back"
          subtitle="Sign in to your Tranquilae account"
        />
      </div>
    </div>
  )
}
