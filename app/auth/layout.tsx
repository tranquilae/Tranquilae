import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - Tranquilae®",
  description: "Sign in to your Tranquilae account or create a new one to start your wellness journey.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
