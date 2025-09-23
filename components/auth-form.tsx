"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/logo"
import { supabase } from "@/lib/supabase"

interface AuthFormProps extends React.ComponentProps<"div"> {
  type: "login" | "signup" | "forgot-password" | "reset-password" | "verify-email"
  title: string
  subtitle: string
}

export function AuthForm({ className, type, title, subtitle, ...props }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    
    try {
      switch (type) {
        case "signup":
          const signupData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            firstName: formData.get('first-name') as string,
            lastName: formData.get('last-name') as string,
          }
          
          // Check if passwords match
          const confirmPassword = formData.get('confirm-password') as string
          if (signupData.password !== confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
          }
          
          const signupResponse = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
          })
          
          const signupResult = await signupResponse.json()
          
          if (!signupResponse.ok) {
            setError(signupResult.error || 'Signup failed')
          } else {
            router.push("/auth/signup-success")
          }
          break
          
        case "login":
          const loginData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
          }
          
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
          })
          
          const loginResult = await loginResponse.json()
          
          console.log('🔍 Full Login API response:', loginResult)
          
          if (!loginResponse.ok) {
            setError(loginResult.error || 'Login failed')
          } else {
            // Set the session in Supabase client
            if (loginResult.session) {
              console.log('🔒 Setting session in Supabase client')
              
              // Use setSession to properly initialize the client-side session
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: loginResult.session.access_token,
                refresh_token: loginResult.session.refresh_token
              })
              
              if (setSessionError) {
                console.error('❌ Error setting session:', setSessionError)
                setError('Failed to establish session. Please try again.')
                return
              }
              
              // Verify session was set and wait for it to be fully initialized
              await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
              const { data: { session }, error: verifyError } = await supabase.auth.getSession()
              console.log('🔍 Session verification:', session ? 'Session set successfully' : 'Session not found', verifyError)
              
              if (!session) {
                console.error('❌ Session verification failed')
                setError('Authentication successful but session not established. Please try again.')
                return
              }
            }
            
            // Check URL params for redirect destination first
            const urlParams = new URLSearchParams(window.location.search)
            const urlRedirectTo = urlParams.get('redirectTo')
            
            // Use redirectTo from URL, then API response, then default
            const redirectPath = urlRedirectTo || loginResult.redirectTo || '/dashboard'
            console.log('🎯 Frontend: Redirecting to:', redirectPath, {
              fromUrl: urlRedirectTo,
              fromAPI: loginResult.redirectTo,
              userOnboarded: loginResult.user?.onboardingComplete
            })
            
            // Allow a moment for the session to fully initialize
            setTimeout(() => {
              try {
                router.push(redirectPath)
                console.log('✅ Navigation initiated to:', redirectPath)
              } catch (routerError) {
                console.error('❌ router.push failed:', routerError)
                console.log('🔄 Falling back to window.location.href')
                window.location.href = redirectPath
              }
            }, 250) // Small delay to ensure session is fully set
          }
          break
          
        case "forgot-password":
          const resetEmail = formData.get('email') as string
          
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            resetEmail,
            {
              redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?redirect_to=/auth/reset-password`,
            }
          )
          
          if (resetError) {
            setError(resetError.message)
          } else {
            router.push("/auth/verify-email")
          }
          break
          
        case "reset-password":
          const newPassword = formData.get('password') as string
          const confirmNewPassword = formData.get('confirm-password') as string
          
          if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
          }
          
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          })
          
          if (updateError) {
            setError(updateError.message)
          } else {
            router.push("/auth/login")
          }
          break
          
        default:
          break
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
    
    setIsLoading(false)
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden glass-card border-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    <Logo className="h-8 w-auto" />
                  </div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  <p className="text-balance text-muted-foreground">{subtitle}</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

              {/* Login Form */}
              {type === "login" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/auth/forgot-password" className="ml-auto text-sm underline-offset-2 hover:underline text-primary">
                        Forgot your password?
                      </Link>
                    </div>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </>
              )}

              {/* Signup Form */}
              {type === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" name="first-name" type="text" placeholder="John" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" name="last-name" type="text" placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </>
              )}

              {/* Forgot Password Form */}
              {type === "forgot-password" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <div className="text-center">
                    <Link href="/auth/login" className="text-sm text-primary hover:underline">
                      Back to Sign In
                    </Link>
                  </div>
                </>
              )}

              {/* Reset Password Form */}
              {type === "reset-password" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </>
              )}

              {/* Email Verification */}
              {type === "verify-email" && (
                <>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="w-full">
                    Resend Verification Email
                  </Button>
                  <div className="text-center">
                    <Link href="/auth/login" className="text-sm text-primary hover:underline">
                      Back to Sign In
                    </Link>
                  </div>
                </>
              )}

              {/* Social Login (only for login and signup) */}
              {(type === "login" || type === "signup") && (
                <>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Button variant="outline" className="w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">Continue with Apple</span>
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">Continue with Google</span>
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">Continue with Facebook</span>
                    </Button>
                  </div>
                </>
              )}

              {/* Footer Links */}
              <div className="text-center text-sm">
                {type === "login" && (
                  <>
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-primary hover:underline underline-offset-4">
                      Sign up
                    </Link>
                  </>
                )}
                {type === "signup" && (
                  <>
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary hover:underline underline-offset-4">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </form>
          
          {/* Hero Image Section */}
          <div className="relative hidden bg-gradient-to-br from-primary/5 to-secondary/10 md:block overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20" />
            <img
              src="/chris-lee-70l1tDAI6rM.jpg"
              alt="Tranquilae Wellness"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Floating elements */}
            <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm" />
            <div className="absolute bottom-32 right-12 w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm" />
            <div className="absolute top-1/4 left-8 w-8 h-8 rounded-full bg-secondary/30 backdrop-blur-sm" />
            
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">Transform Your Wellness Journey</h3>
              <p className="text-white/90 drop-shadow-md leading-relaxed">
                Join thousands discovering balance through AI-powered insights and personalized wellness coaching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:text-primary hover:[&_a]:text-primary/80">
        By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </div>
    </div>
  )
}
