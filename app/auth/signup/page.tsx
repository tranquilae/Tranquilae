import { AuthForm } from "@/components/auth-form"
import { EnvCheck } from "@/components/env-check"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cream relative overflow-hidden p-6 md:p-10">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-softblue-50/30 via-transparent to-nature-50/20" />
      
      {/* Floating glass elements */}
      <div className="absolute top-32 right-20 w-20 h-20 glass-card rounded-full opacity-25" />
      <div className="absolute bottom-32 left-16 w-28 h-28 glass-card rounded-full opacity-35" />
      <div className="absolute top-2/3 right-10 w-12 h-12 glass-card rounded-full opacity-45" />
      
      <div className="w-full max-w-sm md:max-w-4xl relative z-10">
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
