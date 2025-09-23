'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './auth-provider'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: string[]
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login',
  allowedRoles = []
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return // Wait for auth to load

    // Check if authentication is required
    if (requireAuth && !user) {
      console.log(`AuthGuard - Redirecting unauthenticated user from ${pathname}`)
      const redirectUrl = new URL(redirectTo, window.location.origin)
      redirectUrl.searchParams.set('redirectTo', pathname)
      router.push(redirectUrl.toString())
      return
    }

    // Check role-based access (if roles are specified)
    if (user && allowedRoles.length > 0) {
      // You can extend this with actual role checking from user metadata
      // const userRole = user.user_metadata?.role || 'user'
      // if (!allowedRoles.includes(userRole)) {
      //   router.push('/access-denied')
      //   return
      // }
    }
  }, [user, loading, router, pathname, requireAuth, redirectTo, allowedRoles])

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render children if auth is required but user is not authenticated
  if (requireAuth && !user) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}

// Convenience wrapper for pages that require authentication
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Partial<AuthGuardProps>
) {
  return function GuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
