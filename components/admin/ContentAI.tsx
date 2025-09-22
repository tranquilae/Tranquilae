'use client'

import React from 'react'
import { Brain, Settings, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ContentAI: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Content & AI Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage AI coach settings and content moderation.</p>
      </div>

      {/* AI Coach Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
              <Brain className="w-5 h-5" />
              <span>AI Coach Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">Active</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI responses enabled</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">This month:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">2,543 requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">47,457</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '5%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
              <Settings className="w-5 h-5" />
              <span>Model Config</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">GPT-4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Temperature:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">0.7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Max tokens:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">2048</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future AI management features */}
      <Card className="backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-white">AI Management Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              AI Management Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Advanced AI coaching settings, content moderation tools, and prompt management will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ContentAI
