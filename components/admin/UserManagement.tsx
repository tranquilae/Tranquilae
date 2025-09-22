'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Edit, Trash2, Key, Mail, Pause, Play, ChevronDown, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface User {
  id: string
  name?: string
  email: string
  plan: 'explorer' | 'pathfinder'
  role: 'user' | 'admin' | 'super_admin'
  status: 'active' | 'suspended'
  onboarding_complete: boolean
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

interface ActionModalState {
  isOpen: boolean
  type: string
  user: User | null
  data?: any
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    type: '',
    user: null
  })
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 50,
    hasMore: false
  })

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: filterRole,
        plan: filterPlan,
        status: filterStatus,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, filterRole, filterPlan, filterStatus])

  const handleAction = (user: User, action: string) => {
    setActionModal({
      isOpen: true,
      type: action,
      user,
      data: action === 'edit' ? { ...user } : {}
    })
  }

  const confirmAction = async () => {
    if (!actionModal.user) return

    try {
      setLoading(true)
      let response: Response

      switch (actionModal.type) {
        case 'edit':
          response = await fetch(`/api/admin/users/${actionModal.user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actionModal.data)
          })
          break

        case 'suspend':
        case 'activate':
          response = await fetch(`/api/admin/users/${actionModal.user.id}/suspend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: actionModal.type,
              reason: actionModal.data?.reason 
            })
          })
          break

        case 'reset-password':
          response = await fetch(`/api/admin/users/${actionModal.user.id}/password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          break

        case 'change-email':
          response = await fetch(`/api/admin/users/${actionModal.user.id}/change-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newEmail: actionModal.data?.newEmail })
          })
          break

        case 'delete':
          response = await fetch(`/api/admin/users/${actionModal.user.id}`, {
            method: 'DELETE'
          })
          break

        default:
          return
      }

      if (response.ok) {
        const result = await response.json()
        console.log('Action completed:', result)
        await fetchUsers() // Refresh the list
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
      setActionModal({ isOpen: false, type: '', user: null })
    }
  }

  const closeModal = () => {
    setActionModal({ isOpen: false, type: '', user: null })
  }

  const updateModalData = (field: string, value: any) => {
    setActionModal(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }))
  }

  const getActionTitle = (type: string) => {
    switch (type) {
      case 'edit': return 'Edit User'
      case 'suspend': return 'Suspend User'
      case 'activate': return 'Activate User'
      case 'reset-password': return 'Reset Password'
      case 'change-email': return 'Change Email'
      case 'delete': return 'Delete User'
      default: return 'Confirm Action'
    }
  }

  const renderActionModalContent = () => {
    const { type, user, data } = actionModal
    if (!user) return null

    switch (type) {
      case 'edit':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={data?.name || ''}
                onChange={(e) => updateModalData('name', e.target.value)}
                placeholder="Enter user name"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={data?.role || user.role} onValueChange={(value) => updateModalData('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <Select value={data?.plan || user.plan} onValueChange={(value) => updateModalData('plan', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="explorer">Explorer</SelectItem>
                  <SelectItem value="pathfinder">Pathfinder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={data?.status || user.status} onValueChange={(value) => updateModalData('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'suspend':
      case 'activate':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to {type} user "{user.name || user.email}"?
            </p>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={data?.reason || ''}
                onChange={(e) => updateModalData('reason', e.target.value)}
                placeholder={`Enter reason for ${type}...`}
                rows={3}
              />
            </div>
          </div>
        )

      case 'change-email':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Current email: {user.email}
            </p>
            <div>
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={data?.newEmail || ''}
                onChange={(e) => updateModalData('newEmail', e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
          </div>
        )

      case 'reset-password':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              A password reset email will be sent to {user.email}. The user will receive a secure link to reset their password.
            </p>
          </div>
        )

      case 'delete':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete user "{user.name || user.email}"?
            </p>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-300 font-medium">
                ⚠️ Warning: This action cannot be undone.
              </p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                All user data, including subscriptions and onboarding progress, will be permanently deleted.
              </p>
            </div>
          </div>
        )

      default:
        return (
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to perform this action?
          </p>
        )
    }
  }

  if (loading && users.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user accounts, subscriptions, and permissions.</p>
        </div>
        <Button
          onClick={fetchUsers}
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>

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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">User</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Plan</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Role</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Status</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Join Date</th>
                  <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="p-6">
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-white">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{user.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        user.plan === 'pathfinder'
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300'
                          : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        user.status === 'active'
                          ? 'bg-green-200/50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-6 text-gray-600 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-6">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAction(user, 'edit')}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          onClick={() => handleAction(user, 'reset-password')}
                          size="sm"
                          variant="ghost"
                          className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20"
                        >
                          <Key size={16} />
                        </Button>
                        <Button
                          onClick={() => handleAction(user, 'change-email')}
                          size="sm"
                          variant="ghost"
                          className="text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
                        >
                          <Mail size={16} />
                        </Button>
                        <Button
                          onClick={() => handleAction(user, user.status === 'active' ? 'suspend' : 'activate')}
                          size="sm"
                          variant="ghost"
                          className="text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
                        >
                          {user.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                        </Button>
                        <Button
                          onClick={() => handleAction(user, 'delete')}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 dark:text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria.</p>
            </div>
          )}

          {/* Pagination info */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {users.length} of {pagination.total} users
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={actionModal.isOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle(actionModal.type)}</DialogTitle>
            <DialogDescription>
              {actionModal.type === 'delete' && 'This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          {renderActionModalContent()}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAction} 
              disabled={loading}
              className={actionModal.type === 'delete' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement
