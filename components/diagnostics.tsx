'use client'

import { useEffect, useState } from 'react'

export function Diagnostics() {
  const [diagnostics, setDiagnostics] = useState<string[]>([])

  useEffect(() => {
    const results: string[] = []
    
    // Check if we're in browser
    results.push(`Environment: ${typeof window !== 'undefined' ? 'Browser' : 'Server'}`)
    
    // Check CSS variables
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement)
      const primary = root.getPropertyValue('--primary')
      results.push(`CSS Variables loaded: ${primary ? 'Yes' : 'No'}`)
    }
    
    // Check environment variables
    results.push(`Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}`)
    results.push(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}`)
    
    // Check if images load
    if (typeof window !== 'undefined') {
      const testImg = new Image()
      testImg.onload = () => {
        setDiagnostics(prev => [...prev, 'Logo loads: Yes'])
      }
      testImg.onerror = () => {
        setDiagnostics(prev => [...prev, 'Logo loads: No'])
      }
      testImg.src = '/logo.svg'
    }
    
    setDiagnostics(results)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <div className="font-bold mb-2">🔍 Diagnostics</div>
      {diagnostics.map((diag, i) => (
        <div key={i}>{diag}</div>
      ))}
    </div>
  )
}
