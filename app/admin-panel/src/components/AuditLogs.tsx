import React, { useState } from 'react';
import { Filter, Download, Search } from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterAdmin, setFilterAdmin] = useState('all');

  const logs = [
    {
      id: 'log_001',
      action: 'User Plan Downgrade',
      performedBy: 'admin@tranquilae.com',
      targetUser: 'john@example.com',
      timestamp: '2024-01-20T14:30:00Z',
      details: 'Changed plan from Pathfinder to Explorer',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'log_002',
      action: 'Password Reset',
      performedBy: 'admin@tranquilae.com',
      targetUser: 'sarah@example.com',
      timestamp: '2024-01-20T13:45:00Z',
      details: 'Password reset initiated for user',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'log_003',
      action: 'User Suspension',
      performedBy: 'superadmin@tranquilae.com',
      targetUser: 'mike@example.com',
      timestamp: '2024-01-20T12:15:00Z',
      details: 'User account suspended due to policy violation',
      ipAddress: '192.168.1.101'
    },
    {
      id: 'log_004',
      action: 'System Settings Update',
      performedBy: 'superadmin@tranquilae.com',
      targetUser: null,
      timestamp: '2024-01-20T10:00:00Z',
      details: 'Updated maintenance mode settings',
      ipAddress: '192.168.1.101'
    },
    {
      id: 'log_005',
      action: 'Content Approval',
      performedBy: 'admin@tranquilae.com',
      targetUser: null,
      timestamp: '2024-01-20T09:30:00Z',
      details: 'Approved AI-generated meditation content',
      ipAddress: '192.168.1.100'
    }
  ];

  const getActionColor = (action: string) => {
    const actionType = action.toLowerCase();
    if (actionType.includes('delete') || actionType.includes('suspend') || actionType.includes('ban')) {
      return 'bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
    if (actionType.includes('create') || actionType.includes('approve') || actionType.includes('upgrade')) {
      return 'bg-green-200/50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    }
    if (actionType.includes('update') || actionType.includes('modify') || actionType.includes('change')) {
      return 'bg-blue-200/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    }
    return 'bg-gray-200/50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetUser && log.targetUser.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesAdmin = filterAdmin === 'all' || log.performedBy === filterAdmin;
    
    return matchesSearch && matchesAction && matchesAdmin;
  });

  const uniqueAdmins = Array.from(new Set(logs.map(log => log.performedBy)));
  const uniqueActions = Array.from(new Set(logs.map(log => log.action.split(' ')[0])));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Track all administrative actions and system events.</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
          <Download size={16} />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search logs by action, admin, user, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-3 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="px-4 py-3 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Admins</option>
              {uniqueAdmins.map(admin => (
                <option key={admin} value={admin}>{admin}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Action</th>
                <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Performed By</th>
                <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Target User</th>
                <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Timestamp</th>
                <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">Details</th>
                <th className="text-left p-6 text-gray-800 dark:text-white font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-800 dark:text-white font-medium">{log.performedBy}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-800 dark:text-white">
                      {log.targetUser || <span className="text-gray-500 italic">System</span>}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-600 dark:text-gray-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                      {log.ipAddress}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No logs found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{logs.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Actions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{uniqueAdmins.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Admins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {logs.filter(log => log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Last 24h</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {logs.filter(log => log.action.toLowerCase().includes('user')).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">User Actions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;