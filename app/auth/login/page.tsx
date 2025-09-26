import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cream relative overflow-hidden p-6 md:p-10">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-nature-50/30 via-transparent to-softblue-50/20" />
      
      {/* Floating glass elements */}
      <div className="absolute top-20 left-20 w-24 h-24 glass-card rounded-full opacity-30" />
      <div className="absolute bottom-20 right-20 w-32 h-32 glass-card rounded-full opacity-20" />
      <div className="absolute top-1/2 left-10 w-16 h-16 glass-card rounded-full opacity-40" />
      
      <div className="w-full max-w-sm md:max-w-4xl relative z-10">
        <AuthForm 
          type="login"
          title="Welcome back"
          subtitle="Sign in to your Tranquilae account"
        />
      </div>
    </div>
  )
}
