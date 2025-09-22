import React, { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const SubscriptionManagement: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState('success');

  const subscriptions = [
    {
      id: 'sub_001',
      userId: 'u001',
      userName: 'John Smith',
      email: 'john@example.com',
      plan: 'Pathfinder',
      status: 'active',
      startDate: '2024-01-15',
      nextBilling: '2024-02-15',
      amount: '$9.99',
      stripeId: 'sub_1234567890'
    },
    {
      id: 'sub_002',
      userId: 'u002',
      userName: 'Sarah Johnson',
      email: 'sarah@example.com',
      plan: 'Explorer',
      status: 'trial',
      startDate: '2024-02-03',
      nextBilling: '2024-02-10',
      amount: 'Free',
      stripeId: null
    },
    {
      id: 'sub_003',
      userId: 'u003',
      userName: 'Mike Wilson',
      email: 'mike@example.com',
      plan: 'Pathfinder',
      status: 'past_due',
      startDate: '2024-01-28',
      nextBilling: '2024-02-28',
      amount: '$9.99',
      stripeId: 'sub_0987654321'
    }
  ];

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200/50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'trial':
        return 'bg-blue-200/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'past_due':
        return 'bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'canceled':
        return 'bg-gray-200/50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-200/50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="animate-spin" size={20} />;
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <RefreshCw size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Subscription Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user subscriptions and payment data.</p>
      </div>

      {/* Stripe Sync Status */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              syncStatus === 'success' ? 'bg-green-500' :
              syncStatus === 'syncing' ? 'bg-blue-500' : 'bg-red-500'
            }`}>
              <div className="text-white">
                {getSyncStatusIcon()}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Stripe Sync Status
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {syncStatus === 'success' ? 'All subscriptions are synced' :
                 syncStatus === 'syncing' ? 'Syncing with Stripe...' :
                 'Sync failed - some subscriptions may be out of date'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">All Subscriptions</h2>
        </div>
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
                      <div className="font-semibold text-gray-800 dark:text-white">{subscription.userName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{subscription.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{subscription.userId}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      subscription.plan === 'Pathfinder'
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300'
                        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300'
                    }`}>
                      {subscription.plan}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-6 text-gray-800 dark:text-white font-medium">
                    {subscription.amount}
                  </td>
                  <td className="p-6 text-gray-600 dark:text-gray-400">
                    {new Date(subscription.nextBilling).toLocaleDateString()}
                  </td>
                  <td className="p-6">
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 transition-colors">
                        Upgrade
                      </button>
                      <button className="px-3 py-1 text-sm rounded-lg bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30 transition-colors">
                        Extend Trial
                      </button>
                      <button className="px-3 py-1 text-sm rounded-lg bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Manual Pathfinder Assignment</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Override Stripe and manually assign Pathfinder plan to a user.
          </p>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="User email"
              className="w-full px-3 py-2 rounded-lg backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors">
              Assign Pathfinder
            </button>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Trial Management</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Extend or remove trial periods for users.
          </p>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="User email"
              className="w-full px-3 py-2 rounded-lg backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <div className="flex space-x-2">
              <button className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors">
                Extend Trial
              </button>
              <button className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
                End Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;