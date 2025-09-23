import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ErrorBoundary>
          <Header />
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Footer />
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
