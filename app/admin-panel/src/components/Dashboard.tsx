import React from 'react';
import { Users, CreditCard, AlertTriangle, Activity, Plus, RefreshCw, Eye } from 'lucide-react';
import StatsCard from './ui/StatsCard';
import QuickAction from './ui/QuickAction';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '12,543',
      change: '+12%',
      isPositive: true,
      icon: Users,
      description: 'Active users this month'
    },
    {
      title: 'Pathfinder Users',
      value: '3,241',
      change: '+8%',
      isPositive: true,
      icon: Activity,
      description: 'Premium subscribers'
    },
    {
      title: 'Failed Payments',
      value: '23',
      change: '-4%',
      isPositive: true,
      icon: CreditCard,
      description: 'Requires attention'
    },
    {
      title: 'System Alerts',
      value: '7',
      change: '+2',
      isPositive: false,
      icon: AlertTriangle,
      description: 'Active alerts'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Admin',
      description: 'Create new admin account',
      icon: Plus,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Sync Stripe',
      description: 'Sync payment data',
      icon: RefreshCw,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'View Logs',
      description: 'Check system logs',
      icon: Eye,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'User subscription upgraded', user: 'john@example.com', time: '5 minutes ago' },
            { action: 'New user registered', user: 'sarah@example.com', time: '12 minutes ago' },
            { action: 'Payment failed', user: 'mike@example.com', time: '23 minutes ago' },
            { action: 'Admin logged in', user: 'admin@tranquilae.com', time: '1 hour ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{activity.action}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.user}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;