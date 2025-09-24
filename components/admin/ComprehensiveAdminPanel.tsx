'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  Users,
  Shield,
  Settings,
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff,
  Ban,
  UserCheck,
  Mail,
  MessageSquare,
  Flag,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  Smartphone,
  Globe,
  Database,
  Server,
  Zap,
  DollarSign,
  CreditCard,
  BarChart3,
  PieChart,
  LineChart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  plan: 'explorer' | 'pathfinder';
  status: 'active' | 'suspended' | 'banned';
  emailVerified: boolean;
  lastActive: string;
  createdAt: string;
  totalWorkouts: number;
  subscriptionStatus?: string;
  location?: string;
  deviceInfo?: string;
  riskScore: number;
  reportCount: number;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  activeSubscriptions: number;
  systemHealth: number;
  errorRate: number;
  responseTime: number;
  storageUsed: number;
  bandwidthUsed: number;
}

interface ContentReport {
  id: string;
  type: 'user' | 'workout' | 'comment';
  reportedBy: string;
  targetId: string;
  targetTitle: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  actions?: string[];
}

export function ComprehensiveAdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'system' | 'analytics'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersResponse, reportsResponse, metricsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/reports'),
        fetch('/api/admin/metrics'),
      ]);

      const [usersData, reportsData, metricsData] = await Promise.all([
        usersResponse.json(),
        reportsResponse.json(),
        metricsResponse.json(),
      ]);

      if (usersData.success) setUsers(usersData.data);
      if (reportsData.success) setReports(reportsData.data);
      if (metricsData.success) setMetrics(metricsData.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        selectedFilter === 'all' ||
        (selectedFilter === 'active' && user.status === 'active') ||
        (selectedFilter === 'suspended' && user.status === 'suspended') ||
        (selectedFilter === 'high-risk' && user.riskScore > 70) ||
        (selectedFilter === 'new' && new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, selectedFilter]);

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'activate' | 'delete') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadAdminData();
      }
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'escalate') => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadAdminData();
      }
    } catch (error) {
      console.error('Failed to perform report action:', error);
    }
  };

  const exportData = async (type: 'users' | 'reports' | 'metrics') => {
    try {
      const response = await fetch(`/api/admin/export/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive platform administration and monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAdminData()}
              className="glass-button p-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => exportData(activeTab === 'users' ? 'users' : 'metrics')}
              className="glass-button px-4 py-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'content', label: 'Content Moderation', icon: Shield },
              { id: 'system', label: 'System Health', icon: Server },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +{metrics.newUsersToday} today
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.totalUsers.toLocaleString()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Total Users</p>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.activeUsers.toLocaleString()} active
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +12% MoM
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${metrics.totalRevenue.toLocaleString()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Total Revenue</p>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.activeSubscriptions} active subscriptions
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className={`text-sm ${
                    metrics.systemHealth > 95 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {metrics.systemHealth}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.responseTime}ms
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Avg Response</p>
                <div className="mt-2 text-xs text-gray-500">
                  {metrics.errorRate}% error rate
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {((metrics.storageUsed / 1000000000) * 100).toFixed(1)}% used
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(metrics.storageUsed / 1000000000).toFixed(1)}GB
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Storage Used</p>
                <div className="mt-2 text-xs text-gray-500">
                  {(metrics.bandwidthUsed / 1000000).toFixed(1)}MB bandwidth
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  High Priority Reports
                </h3>
                <div className="space-y-3">
                  {reports.filter(r => r.severity === 'high' || r.severity === 'critical').slice(0, 5).map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-4 h-4 ${
                          report.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {report.targetTitle}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.reason} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReportAction(report.id, 'resolve')}
                          className="text-green-600 hover:text-green-800 p-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          className="text-gray-600 hover:text-gray-800 p-1"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Recent User Activity
                </h3>
                <div className="space-y-3">
                  {users.filter(u => u.riskScore > 50).slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Risk Score: {user.riskScore} • {user.reportCount} reports
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="text-orange-600 hover:text-orange-800 p-1"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Controls */}
            <div className="glass-card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="suspended">Suspended</option>
                    <option value="high-risk">High Risk</option>
                    <option value="new">New (7 days)</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedUsers.length > 0 && (
                    <>
                      <button
                        onClick={() => selectedUsers.forEach(id => handleUserAction(id, 'suspend'))}
                        className="px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg text-sm"
                      >
                        Suspend Selected ({selectedUsers.length})
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                      >
                        Clear
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => exportData('users')}
                    className="glass-button px-4 py-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Plan & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.plan === 'pathfinder'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            }`}>
                              {user.plan}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : user.status === 'suspended'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {user.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex flex-col gap-1">
                            <span>{user.totalWorkouts} workouts</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Last active: {new Date(user.lastActive).toLocaleDateString()}
                            </span>
                            {user.location && (
                              <span className="text-xs text-gray-400 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {user.location}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              user.riskScore > 70 ? 'bg-red-500' :
                              user.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <span className={`text-sm font-medium ${
                              user.riskScore > 70 ? 'text-red-600 dark:text-red-400' :
                              user.riskScore > 40 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {user.riskScore}
                            </span>
                            {user.reportCount > 0 && (
                              <span className="ml-2 text-xs text-red-500">
                                ({user.reportCount} reports)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate')}
                              className={`p-1 rounded ${
                                user.status === 'active'
                                  ? 'text-orange-600 hover:text-orange-800'
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {user.status === 'active' ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'ban')}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-blue-600 hover:text-blue-800">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-gray-800">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Content Moderation Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Pending Reports', count: reports.filter(r => r.status === 'pending').length, color: 'yellow' },
                { label: 'High Priority', count: reports.filter(r => r.severity === 'high' || r.severity === 'critical').length, color: 'red' },
                { label: 'Resolved Today', count: reports.filter(r => r.status === 'resolved' && new Date(r.reviewedAt!).toDateString() === new Date().toDateString()).length, color: 'green' },
                { label: 'Total Reports', count: reports.length, color: 'blue' },
              ].map(({ label, count, color }) => (
                <div key={label} className="glass-card p-6">
                  <div className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.id} className={`p-4 border rounded-lg ${
                    report.severity === 'critical' ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' :
                    report.severity === 'high' ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20' :
                    'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Flag className={`w-4 h-4 ${
                            report.severity === 'critical' ? 'text-red-600' :
                            report.severity === 'high' ? 'text-orange-600' :
                            report.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                          }`} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {report.targetTitle}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            report.status === 'resolved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Reason:</strong> {report.reason}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Reported by: {report.reportedBy}</span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          {report.reviewedBy && (
                            <span>Reviewed by: {report.reviewedBy}</span>
                          )}
                        </div>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleReportAction(report.id, 'resolve')}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'escalate')}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm"
                          >
                            Escalate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                    <span className={`text-sm font-medium ${
                      metrics.systemHealth > 95 ? 'text-green-600' : 
                      metrics.systemHealth > 85 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metrics.systemHealth}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                    <span className={`text-sm font-medium ${
                      metrics.errorRate < 1 ? 'text-green-600' : 
                      metrics.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metrics.errorRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className={`text-sm font-medium ${
                      metrics.responseTime < 200 ? 'text-green-600' : 
                      metrics.responseTime < 500 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metrics.responseTime}ms
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Resource Usage
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                      <span className="text-sm font-medium">
                        {(metrics.storageUsed / 1000000000).toFixed(1)}GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(metrics.storageUsed / 10000000000) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Bandwidth</span>
                      <span className="text-sm font-medium">
                        {(metrics.bandwidthUsed / 1000000).toFixed(1)}MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(metrics.bandwidthUsed / 100000000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full glass-button py-2 text-left">
                    <Database className="w-4 h-4 inline mr-2" />
                    Database Backup
                  </button>
                  <button className="w-full glass-button py-2 text-left">
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Clear Cache
                  </button>
                  <button className="w-full glass-button py-2 text-left">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Deploy Update
                  </button>
                  <button className="w-full glass-button py-2 text-left">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    System Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  User Growth Trends
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart visualization would be rendered here</p>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Revenue Analytics
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <LineChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Revenue chart would be rendered here</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Platform Engagement Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {metrics?.activeUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    4.2
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    73%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    12.5%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
