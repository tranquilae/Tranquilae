'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {children}
      </div>
    </ThemeProvider>
  )
}
