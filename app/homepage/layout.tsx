import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tranquilae - Your Personal Health, Fitness & Mindfulness Companion",
  description:
    "Track your health. Connect your wearables. Get AI-powered coaching. Start your wellness journey with Tranquilae.",
}

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
