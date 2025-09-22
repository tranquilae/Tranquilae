'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, Calendar, User, Database, Shield, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface AuditLog {
  id: string
  event_type: string
  user_id?: string
  admin_id?: string
  table_name?: string
  event_data: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    event_type: '',
    user_id: '',
    admin_id: '',
    table_name: '',
    start_date: '',
    end_date: ''
  })
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 100,
    hasMore: false
  })

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      })

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!params.get(key)) {
          params.delete(key)
        }
      })

      const response = await fetch(`/api/admin/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch audit logs')
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, offset: 0 })) // Reset to first page
  }

  const clearFilters = () => {
    setFilters({
      event_type: '',
      user_id: '',
      admin_id: '',
      table_name: '',
      start_date: '',
      end_date: ''
    })
  }

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('LOGIN') || eventType.includes('LOGOUT')) {
      return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
    }
    if (eventType.includes('DELETE') || eventType.includes('SUSPENDED')) {
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
    }
    if (eventType.includes('CREATE') || eventType.includes('INSERT')) {
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
    }
    if (eventType.includes('UPDATE') || eventType.includes('MODIFIED')) {
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
    }
    if (eventType.includes('UNAUTHORIZED') || eventType.includes('FAILED')) {
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
    }
    if (eventType.includes('PAYMENT') || eventType.includes('SUBSCRIPTION')) {
      return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
    }
    return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300'
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('LOGIN') || eventType.includes('LOGOUT')) {
      return <User size={14} />
    }
    if (eventType.includes('DB_') || eventType.includes('DATABASE')) {
      return <Database size={14} />
    }
    if (eventType.includes('UNAUTHORIZED') || eventType.includes('SECURITY')) {
      return <Shield size={14} />
    }
    return <Calendar size={14} />
  }

  const formatEventDescription = (log: AuditLog) => {
    const { event_type, event_data } = log
    
    // Format common event types
    switch (event_type) {
      case 'LOGIN':
        return event_data?.admin_panel ? 'Admin panel login' : 'User login'
      case 'LOGOUT':
        return event_data?.admin_panel ? 'Admin panel logout' : 'User logout'
      case 'DB_SELECT':
        return `Database query on ${log.table_name || 'unknown table'}`
      case 'DB_INSERT':
        return `Record created in ${log.table_name || 'unknown table'}`
      case 'DB_UPDATE':
        return `Record updated in ${log.table_name || 'unknown table'}`
      case 'DB_DELETE':
        return `Record deleted from ${log.table_name || 'unknown table'}`
      case 'UNAUTHORIZED_ACCESS':
        return `Unauthorized access attempt: ${event_data?.error || 'Unknown'}`
      case 'SUBSCRIPTION_UPDATED':
        return `Subscription updated: ${event_data?.old_plan || 'unknown'} → ${event_data?.new_plan || 'unknown'}`
      case 'PAYMENT_SUCCESS':
        return `Payment successful: ${event_data?.amount || 'unknown amount'}`
      case 'PAYMENT_FAILURE':
        return `Payment failed: ${event_data?.error || 'Unknown error'}`
      default:
        return event_type.replace(/_/g, ' ').toLowerCase()
    }
  }

  const loadMore = async () => {
    if (!pagination.hasMore || loading) return
    
    setLoading(true)
    const newOffset = pagination.offset + pagination.limit
    
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: pagination.limit.toString(),
        offset: newOffset.toString()
      })

      Object.keys(filters).forEach(key => {
        if (!params.get(key)) {
          params.delete(key)
        }
      })

      const response = await fetch(`/api/admin/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(prev => [...prev, ...data.logs])
        setPagination({ ...data.pagination, offset: newOffset })
      }
    } catch (error) {
      console.error('Error loading more logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && logs.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor all system activities and admin actions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchLogs}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Event Type</Label>
              <Input
                placeholder="e.g., LOGIN, UPDATE"
                value={filters.event_type}
                onChange={(e) => updateFilter('event_type', e.target.value)}
              />
            </div>

            <div>
              <Label>User ID</Label>
              <Input
                placeholder="User UUID"
                value={filters.user_id}
                onChange={(e) => updateFilter('user_id', e.target.value)}
              />
            </div>

            <div>
              <Label>Admin ID</Label>
              <Input
                placeholder="Admin UUID"
                value={filters.admin_id}
                onChange={(e) => updateFilter('admin_id', e.target.value)}
              />
            </div>

            <div>
              <Label>Table</Label>
              <Select value={filters.table_name} onValueChange={(value) => updateFilter('table_name', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tables</SelectItem>
                  <SelectItem value="users">users</SelectItem>
                  <SelectItem value="subscriptions">subscriptions</SelectItem>
                  <SelectItem value="audit_logs">audit_logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => updateFilter('start_date', e.target.value)}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => updateFilter('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {logs.length} of {pagination.total} logs
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(log.event_type)}`}>
                        {getEventIcon(log.event_type)}
                        <span>{log.event_type}</span>
                      </span>
                      
                      {log.table_name && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                          {log.table_name}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-800 dark:text-white font-medium">
                      {formatEventDescription(log)}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.user_id && (
                        <span>User: {log.user_id.slice(0, 8)}...</span>
                      )}
                      {log.admin_id && (
                        <span>Admin: {log.admin_id.slice(0, 8)}...</span>
                      )}
                      {log.ip_address && (
                        <span>IP: {log.ip_address}</span>
                      )}
                    </div>

                    {/* Event Data (collapsed by default) */}
                    {log.event_data && Object.keys(log.event_data).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                          View details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.event_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 text-right ml-4">
                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                    <div>{new Date(log.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {logs.length === 0 && !loading && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No audit logs found matching your criteria.</p>
            </div>
          )}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
              <Button onClick={loadMore} disabled={loading} variant="outline">
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {logs.length} of {pagination.total} audit logs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogs
