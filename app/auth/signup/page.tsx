import { AuthForm } from "@/components/auth-form"
import { EnvCheck } from "@/components/env-check"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthForm 
          type="signup"
          title="Create your account"
          subtitle="Join Tranquilae and start your wellness journey"
        />
      </div>
      <EnvCheck />
    </div>
  )
}
