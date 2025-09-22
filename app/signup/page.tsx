"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/auth/signup")
  }, [router])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <p>Redirecting to signup...</p>
    </div>
  )
}
