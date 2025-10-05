import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Tranquilae® - AI-Powered Wellness Companion",
  description: "Transform your wellness journey with personalized nutrition tracking, fitness guidance, and mindfulness coaching powered by AI.",
  generator: "Tranquilae",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
