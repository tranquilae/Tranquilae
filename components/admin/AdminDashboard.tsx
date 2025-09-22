'use client'

import React, { useState, useEffect } from 'react'
import { Users, CreditCard, AlertTriangle, Activity, Plus, RefreshCw, Eye, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  total_users: number
  active_users: number
  suspended_users: number
  pathfinder_users: number
  explorer_users: number
  active_subscriptions: number
  trial_subscriptions: number
  failed_payments: number
  recent_signups: number
}

interface RecentActivity {
  id: string
  event_type: string
  user_id?: string
  event_data: any
  created_at: string
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity/recent')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchDashboardData()
      setLoading(false)
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const statsCards = stats ? [
    {
      title: 'Total Users',
      value: stats.total_users.toLocaleString(),
      change: `+${stats.recent_signups}`,
      changeLabel: 'this month',
      isPositive: true,
      icon: Users,
      description: 'Registered users'
    },
    {
      title: 'Pathfinder Users',
      value: stats.pathfinder_users.toLocaleString(),
      change: `${((stats.pathfinder_users / stats.total_users) * 100).toFixed(1)}%`,
      changeLabel: 'conversion rate',
      isPositive: true,
      icon: TrendingUp,
      description: 'Premium subscribers'
    },
    {
      title: 'Active Subscriptions',
      value: stats.active_subscriptions.toLocaleString(),
      change: `${stats.trial_subscriptions}`,
      changeLabel: 'in trial',
      isPositive: true,
      icon: CreditCard,
      description: 'Paying customers'
    },
    {
      title: 'Failed Payments',
      value: stats.failed_payments.toString(),
      change: stats.failed_payments > 0 ? 'Attention needed' : 'All clear',
      changeLabel: '',
      isPositive: stats.failed_payments === 0,
      icon: AlertTriangle,
      description: 'Past due accounts'
    }
  ] : []

  const quickActions = [
    {
      title: 'Sync Stripe Data',
      description: 'Update subscription statuses',
      icon: RefreshCw,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      action: async () => {
        try {
          await fetch('/api/admin/stripe/sync', { method: 'POST' })
          await handleRefresh()
        } catch (error) {
          console.error('Stripe sync error:', error)
        }
      }
    },
    {
      title: 'View Recent Logs',
      description: 'Check system activity',
      icon: Eye,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      action: () => {
        // This will be handled by the parent component
        window.dispatchEvent(new CustomEvent('admin:navigate', { detail: 'logs' }))
      }
    },
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      action: () => {
        window.dispatchEvent(new CustomEvent('admin:navigate', { detail: 'users' }))
      }
    }
  ]

  const formatActivityDescription = (activity: RecentActivity) => {
    switch (activity.event_type) {
      case 'LOGIN':
        return `User signed in${activity.event_data?.admin_panel ? ' (Admin Panel)' : ''}`
      case 'LOGOUT':
        return `User signed out${activity.event_data?.admin_panel ? ' (Admin Panel)' : ''}`
      case 'SIGNUP':
        return 'New user registration'
      case 'SUBSCRIPTION_CREATED':
        return `Subscription created for ${activity.event_data?.plan || 'unknown'} plan`
      case 'SUBSCRIPTION_UPDATED':
        return `Subscription updated`
      case 'PAYMENT_SUCCESS':
        return `Payment processed (${activity.event_data?.amount || 'unknown'})`
      case 'PAYMENT_FAILURE':
        return `Payment failed: ${activity.event_data?.error || 'Unknown error'}`
      case 'USER_SUSPENDED':
        return 'User account suspended'
      case 'USER_DELETED':
        return 'User account deleted'
      default:
        return activity.event_type.replace('_', ' ').toLowerCase()
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className={`text-sm font-medium ${
                        stat.isPositive 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                      {stat.changeLabel && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">{stat.changeLabel}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Card 
                key={index} 
                className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30 cursor-pointer hover:bg-white/40 dark:hover:bg-gray-900/40 transition-all duration-200"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{action.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
            <Clock className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.slice(0, 5).map((activity, index) => (
              <div key={activity.id || index} className="flex items-center justify-between py-3 border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatActivityDescription(activity)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.user_id ? `User: ${activity.user_id.slice(0, 8)}...` : 'System event'}
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
            )) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No recent activity to display
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
