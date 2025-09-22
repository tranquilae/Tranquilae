'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminDashboard from '@/components/admin/AdminDashboard'
import UserManagement from '@/components/admin/UserManagement'
import SubscriptionManagement from '@/components/admin/SubscriptionManagement'
import ContentAI from '@/components/admin/ContentAI'
import AuditLogs from '@/components/admin/AuditLogs'
import SystemSettings from '@/components/admin/SystemSettings'
import { supabase } from '@/lib/supabase'
import { logSecurityEvent } from '@/lib/supabase-logger'

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'super_admin' | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/auth/login?redirectTo=/admin')
          return
        }

        setUser(user)

        // Check admin access via API
        const response = await fetch('/api/admin/auth/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 403) {
          router.push('/403')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to verify admin access')
        }

        const data = await response.json()
        
        if (!data.isAdmin) {
          router.push('/403')
          return
        }

        setUserRole(data.role || 'admin')

        // Log admin login
        await logSecurityEvent({
          event_type: 'LOGIN',
          user_id: user.id,
          success: true,
          metadata: { admin_panel: true, role: data.role }
        })

      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth/login?redirectTo=/admin')
      } finally {
        setLoading(false)
      }
    }

    // Handle navigation events from dashboard quick actions
    const handleNavigation = (event: any) => {
      setActiveSection(event.detail)
    }

    window.addEventListener('admin:navigate', handleNavigation)
    
    checkAuth()

    return () => {
      window.removeEventListener('admin:navigate', handleNavigation)
    }
  }, [router])

  const handleLogout = async () => {
    if (user) {
      await logSecurityEvent({
        event_type: 'LOGOUT',
        user_id: user.id,
        success: true,
        metadata: { admin_panel: true }
      })
    }
    
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />
      case 'users':
        return <UserManagement />
      case 'subscriptions':
        return <SubscriptionManagement />
      case 'content':
        return <ContentAI />
      case 'logs':
        return <AuditLogs />
      case 'settings':
        return userRole === 'super_admin' ? <SystemSettings /> : <AdminDashboard />
      default:
        return <AdminDashboard />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          userRole={userRole || 'admin'}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
          user={user}
        />
        
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
