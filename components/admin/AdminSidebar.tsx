'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Brain, 
  FileText, 
  Settings, 
  Moon, 
  Sun,
  Menu,
  X,
  Leaf,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  darkMode: boolean
  toggleDarkMode: () => void
  userRole: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  onLogout: () => void
  user: any
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  setActiveSection,
  darkMode,
  toggleDarkMode,
  userRole,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  user
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'content', label: 'Content & AI', icon: Brain },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
    ...(userRole === 'super_admin' ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-lg border border-white/20"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 z-40 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="h-full backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border-r border-white/20 dark:border-gray-700/30 flex flex-col">
          <div className="p-6 flex-1">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tranquilae</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</p>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-6 p-3 rounded-xl bg-white/20 dark:bg-gray-800/20">
              <div className="text-sm">
                <div className="font-medium text-gray-800 dark:text-white truncate">
                  {user?.email}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {userRole.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400 shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="p-6 space-y-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Logout Button */}
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar
