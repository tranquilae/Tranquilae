'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, AlertCircle, CheckCircle, Clock, RefreshCw, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface Subscription {
  id: string
  user_id: string
  user_name: string
  user_email: string
  plan: 'explorer' | 'pathfinder'
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  stripe_subscription_id?: string
  stripe_customer_id?: string
  trial_end?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

interface ActionModalState {
  isOpen: boolean
  type: string
  subscription: Subscription | null
  data?: any
}

const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'success' | 'syncing' | 'error'>('success')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    type: '',
    subscription: null
  })
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 50,
    hasMore: false
  })

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        plan: filterPlan,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      })

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch subscriptions')
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [filterStatus, filterPlan])

  const handleSync = async () => {
    setSyncStatus('syncing')
    try {
      const response = await fetch('/api/admin/stripe/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Sync result:', result)
        setSyncStatus('success')
        await fetchSubscriptions() // Refresh data
      } else {
        const error = await response.json()
        console.error('Sync failed:', error)
        setSyncStatus('error')
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
    }

    // Reset status after 3 seconds if successful
    setTimeout(() => {
      if (syncStatus !== 'syncing') {
        setSyncStatus('success')
      }
    }, 3000)
  }

  const handleAction = (subscription: Subscription, action: string) => {
    setActionModal({
      isOpen: true,
      type: action,
      subscription,
      data: action === 'upgrade' ? { newPlan: subscription.plan === 'explorer' ? 'pathfinder' : 'explorer' } : {}
    })
  }

  const confirmAction = async () => {
    if (!actionModal.subscription) return

    try {
      setLoading(true)
      let response: Response

      switch (actionModal.type) {
        case 'upgrade':
        case 'downgrade':
          response = await fetch(`/api/admin/subscriptions/${actionModal.subscription.id}/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              newPlan: actionModal.data?.newPlan,
              reason: actionModal.data?.reason
            })
          })
          break

        default:
          return
      }

      if (response.ok) {
        const result = await response.json()
        console.log('Action completed:', result)
        await fetchSubscriptions() // Refresh the list
      } else {
        const error = await response.json()
        console.error('Action failed:', error)
        alert(`Action failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Action error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
      setActionModal({ isOpen: false, type: '', subscription: null })
    }
  }

  const closeModal = () => {
    setActionModal({ isOpen: false, type: '', subscription: null })
  }

  const updateModalData = (field: string, value: any) => {
    setActionModal(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200/50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'trialing':
        return 'bg-blue-200/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'past_due':
        return 'bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'canceled':
        return 'bg-gray-200/50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
      case 'incomplete':
        return 'bg-orange-200/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-gray-200/50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="animate-spin" size={20} />
      case 'success':
        return <CheckCircle size={20} />
      case 'error':
        return <AlertCircle size={20} />
      default:
        return <RefreshCw size={20} />
    }
  }

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-500'
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getSyncStatusMessage = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing with Stripe...'
      case 'success':
        return 'All subscriptions are synced'
      case 'error':
        return 'Sync failed - some subscriptions may be out of date'
      default:
        return 'Ready to sync'
    }
  }

  const formatAmount = (subscription: Subscription) => {
    if (subscription.plan === 'explorer') return 'Free'
    if (subscription.plan === 'pathfinder') return '£9.99'
    return 'Unknown'
  }

  if (loading && subscriptions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Subscription Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user subscriptions and payment data.</p>
        </div>
        <Button
          onClick={fetchSubscriptions}
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stripe Sync Status */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSyncStatusColor()}`}>
                <div className="text-white">
                  {getSyncStatusIcon()}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Stripe Sync Status
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {getSyncStatusMessage()}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              <span>Sync Now</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div>
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Plan Filter</Label>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="explorer">Explorer</SelectItem>
                  <SelectItem value="pathfinder">Pathfinder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-white">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">User</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Plan</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Status</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Amount</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Next Billing</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="p-6">
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-white">{subscription.user_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{subscription.user_email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{subscription.user_id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        subscription.plan === 'pathfinder'
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300'
                          : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(subscription.status)}`}>
                        {subscription.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6 text-gray-800 dark:text-white font-medium">
                      {formatAmount(subscription)}
                    </td>
                    <td className="p-6 text-gray-600 dark:text-gray-400">
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td className="p-6">
                      <div className="flex space-x-2">
                        {subscription.plan === 'explorer' ? (
                          <Button
                            onClick={() => handleAction(subscription, 'upgrade')}
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600 text-white flex items-center space-x-1"
                          >
                            <ArrowUp size={14} />
                            <span>Upgrade</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleAction(subscription, 'downgrade')}
                            size="sm"
                            variant="outline"
                            className="flex items-center space-x-1"
                          >
                            <ArrowDown size={14} />
                            <span>Downgrade</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscriptions.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No subscriptions found matching your criteria.</p>
            </div>
          )}

          {/* Pagination info */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {subscriptions.length} of {pagination.total} subscriptions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Manual Pathfinder Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Override Stripe and manually assign Pathfinder plan to a user.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="User email"
                className="w-full"
              />
              <Button className="w-full bg-purple-500 hover:bg-purple-600">
                Assign Pathfinder
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Trial Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Extend or remove trial periods for users.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="User email"
                className="w-full"
              />
              <div className="flex space-x-2">
                <Button className="flex-1 bg-green-500 hover:bg-green-600">
                  Extend Trial
                </Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600">
                  End Trial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Modal */}
      <Dialog open={actionModal.isOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === 'upgrade' ? 'Upgrade Plan' : 'Downgrade Plan'}
            </DialogTitle>
            <DialogDescription>
              {actionModal.subscription && (
                <>
                  {actionModal.type === 'upgrade' 
                    ? `Upgrade ${actionModal.subscription.user_email} from Explorer to Pathfinder plan`
                    : `Downgrade ${actionModal.subscription.user_email} from Pathfinder to Explorer plan`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={actionModal.data?.reason || ''}
                onChange={(e) => updateModalData('reason', e.target.value)}
                placeholder="Enter reason for plan change..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubscriptionManagement
