import React, { useState } from 'react';
import { Key, Globe, Bell, Database, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [showApiKey, setShowApiKey] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const webhookLogs = [
    {
      id: 'wh_001',
      type: 'stripe.customer.subscription.created',
      status: 'success',
      timestamp: '2024-01-20T14:30:00Z',
      responseTime: '245ms'
    },
    {
      id: 'wh_002',
      type: 'stripe.invoice.payment_failed',
      status: 'failed',
      timestamp: '2024-01-20T13:45:00Z',
      responseTime: '1.2s',
      error: 'User not found in database'
    },
    {
      id: 'wh_003',
      type: 'stripe.customer.subscription.updated',
      status: 'success',
      timestamp: '2024-01-20T12:15:00Z',
      responseTime: '189ms'
    }
  ];

  const supabaseLogs = [
    {
      id: 'sb_001',
      type: 'auth.login.success',
      user: 'john@example.com',
      timestamp: '2024-01-20T14:35:00Z',
      location: 'New York, US'
    },
    {
      id: 'sb_002',
      type: 'auth.login.failed',
      user: 'attacker@suspicious.com',
      timestamp: '2024-01-20T14:20:00Z',
      location: 'Unknown',
      reason: 'Invalid credentials'
    },
    {
      id: 'sb_003',
      type: 'auth.signup.success',
      user: 'sarah@example.com',
      timestamp: '2024-01-20T13:45:00Z',
      location: 'London, UK'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-200/50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'failed':
        return 'bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-200/50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-200/50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage API keys, system settings, and monitor logs.</p>
      </div>

      {/* Warning Banner */}
      <div className="backdrop-blur-xl bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-200/50 dark:border-red-800/50 p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Super Admin Only</h3>
            <p className="text-red-700 dark:text-red-400 text-sm">These settings can affect the entire system. Make changes carefully.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-2">
        <div className="flex space-x-1">
          {[
            { id: 'api', label: 'API Keys', icon: Key },
            { id: 'system', label: 'System Settings', icon: Globe },
            { id: 'webhooks', label: 'Webhook Logs', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Environment Variables</h2>
            <div className="space-y-4">
              {[
                { key: 'STRIPE_SECRET_KEY', value: 'sk_live_***************', sensitive: true },
                { key: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJ***************', sensitive: true },
                { key: 'OPENAI_API_KEY', value: 'sk-***************', sensitive: true },
                { key: 'APP_ENV', value: 'production', sensitive: false },
                { key: 'LOG_LEVEL', value: 'info', sensitive: false }
              ].map((env) => (
                <div key={env.key} className="flex items-center justify-between p-4 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-white">{env.key}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {env.sensitive && !showApiKey ? '••••••••••••••••' : env.value}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {env.sensitive && (
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                    <button className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Application Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Maintenance Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Temporarily disable app access for maintenance</p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Push Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable system-wide push notifications</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex justify-end">
                <button className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Logs Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Stripe Webhook Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Event Type</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Status</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Timestamp</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Response Time</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="p-6">
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                          {log.type}
                        </code>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-6 text-gray-600 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-6 text-gray-600 dark:text-gray-400 font-mono text-sm">
                        {log.responseTime}
                      </td>
                      <td className="p-6">
                        {log.error && (
                          <span className="text-red-600 dark:text-red-400 text-sm">{log.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Supabase Event Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Event Type</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">User</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Timestamp</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Location</th>
                    <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {supabaseLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          log.type.includes('success') 
                            ? getStatusColor('success') 
                            : log.type.includes('failed') 
                              ? getStatusColor('failed') 
                              : getStatusColor('default')
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="p-6 text-gray-800 dark:text-white">{log.user}</td>
                      <td className="p-6 text-gray-600 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-6 text-gray-600 dark:text-gray-400">{log.location}</td>
                      <td className="p-6">
                        {log.reason && (
                          <span className="text-red-600 dark:text-red-400 text-sm">{log.reason}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;