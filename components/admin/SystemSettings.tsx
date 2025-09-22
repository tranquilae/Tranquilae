'use client'

import React from 'react'
import { Settings, Database, Shield, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SystemSettings: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure system-wide settings and preferences. Super admin access only.</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardContent className="p-6 text-center">
            <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800 dark:text-white">Database</p>
            <p className="text-xs text-green-600">Healthy</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800 dark:text-white">Security</p>
            <p className="text-xs text-green-600">Protected</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardContent className="p-6 text-center">
            <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800 dark:text-white">Notifications</p>
            <p className="text-xs text-blue-600">Active</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800 dark:text-white">Backups</p>
            <p className="text-xs text-gray-600">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Admin Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/20 dark:bg-gray-800/20">
                <h4 className="font-medium text-gray-800 dark:text-white">Admin Users</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Admin accounts are managed via environment variables (ADMIN_USER_IDS).
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/20 dark:bg-gray-800/20">
                <h4 className="font-medium text-gray-800 dark:text-white">Security Policies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Row-level security and audit logging are active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Application Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/20 dark:bg-gray-800/20">
                <h4 className="font-medium text-gray-800 dark:text-white">Feature Flags</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI Coach, Integrations, and Premium features are enabled.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/20 dark:bg-gray-800/20">
                <h4 className="font-medium text-gray-800 dark:text-white">Rate Limiting</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  API rate limits are enforced via middleware.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-white">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Environment</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Version</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Last Deploy</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Health Status</h4>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <Card className="backdrop-blur-xl bg-orange-50/30 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/30">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800 dark:text-orange-300 mb-1">
                Super Admin Access Required
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                System settings can only be modified by super administrators. Changes to core system 
                configuration should be made carefully and tested in a non-production environment first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemSettings
