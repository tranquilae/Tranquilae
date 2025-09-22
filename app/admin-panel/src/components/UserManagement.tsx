import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Key, Mail, Pause, Play, ChevronDown } from 'lucide-react';
import Modal from './ui/Modal';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  const users = [
    {
      id: 'u001',
      name: 'John Smith',
      email: 'john@example.com',
      plan: 'Pathfinder',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-15'
    },
    {
      id: 'u002',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      plan: 'Explorer',
      role: 'user',
      status: 'active',
      joinDate: '2024-02-03'
    },
    {
      id: 'u003',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      plan: 'Pathfinder',
      role: 'user',
      status: 'suspended',
      joinDate: '2024-01-28'
    }
  ];

  const handleAction = (user: any, action: string) => {
    setSelectedUser(user);
    setActionType(action);
    setActionModalOpen(true);
  };

  const confirmAction = () => {
    console.log(`${actionType} action for user:`, selectedUser);
    setActionModalOpen(false);
    setSelectedUser(null);
    setActionType('');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    
    return matchesSearch && matchesRole && matchesPlan;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user accounts, subscriptions, and permissions.</p>
      </div>

      {/* Search and Filters */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            <div className="relative">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Plans</option>
                <option value="Explorer">Explorer</option>
                <option value="Pathfinder">Pathfinder</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="p-6">
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">{user.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{user.id}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      user.plan === 'Pathfinder'
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300'
                        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                      {user.role}
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
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td className="p-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAction(user, 'edit')}
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit user"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleAction(user, 'reset-password')}
                        className="p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 transition-colors"
                        title="Reset password"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => handleAction(user, 'change-email')}
                        className="p-2 rounded-lg hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors"
                        title="Change email"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={() => handleAction(user, user.status === 'active' ? 'suspend' : 'activate')}
                        className="p-2 rounded-lg hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors"
                        title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                      >
                        {user.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => handleAction(user, 'delete')}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`Confirm ${actionType}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to {actionType} user "{selectedUser?.name}"?
          </p>
          {actionType === 'delete' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-300 font-medium">
                Warning: This action cannot be undone.
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                actionType === 'delete'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;