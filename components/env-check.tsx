'use client'

import { useEffect, useState } from 'react'

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<{
    url: boolean
    key: boolean
    keyValue: string
  }>({ url: false, key: false, keyValue: '' })

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setEnvStatus({
      url: !!url,
      key: !!key,
      keyValue: key?.substring(0, 20) + '...' || 'NOT SET'
    })
  }, [])

  // Only show in development or if there are issues
  if (process.env.NODE_ENV === 'production' && envStatus.url && envStatus.key) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg text-sm max-w-xs z-50">
      <div className="font-bold mb-2">🚨 Environment Check</div>
      <div>SUPABASE_URL: {envStatus.url ? '✅' : '❌'}</div>
      <div>SUPABASE_KEY: {envStatus.key ? '✅' : '❌'}</div>
      <div className="text-xs mt-2">Key: {envStatus.keyValue}</div>
      {!envStatus.key && (
        <div className="text-xs mt-2">
          Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment
        </div>
      )}
    </div>
  )
}
