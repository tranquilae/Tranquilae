'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Activity,
  Heart,
  Zap,
  Clock,
  Users,
  Flame,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download,
  Filter,
  Share2,
} from 'lucide-react';

interface AnalyticsData {
  workoutStats: {
    totalWorkouts: number;
    totalDuration: number;
    caloriesBurned: number;
    avgHeartRate: number;
    streak: number;
    weeklyGoal: number;
    weeklyProgress: number;
  };
  progressData: Array<{
    date: string;
    workouts: number;
    duration: number;
    calories: number;
    weight?: number;
    mood?: number;
  }>;
  workoutDistribution: Array<{
    category: string;
    count: number;
    duration: number;
    calories: number;
    color: string;
  }>;
  performanceMetrics: Array<{
    metric: string;
    current: number;
    previous: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
    category: string;
    icon: string;
  }>;
  socialStats: {
    friendsCount: number;
    sharesCount: number;
    likesReceived: number;
    rank: number;
    leaderboard: Array<{
      rank: number;
      name: string;
      score: number;
      avatar: string;
    }>;
  };
}

interface ChartData {
  name: string;
  value: number;
  trend?: number;
  target?: number;
  date?: string;
}

export function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['workouts', 'duration', 'calories']);
  const [comparisonMode, setComparisonMode] = useState(false);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeRange, loadAnalyticsData]);

  const chartData = useMemo(() => {
    if (!data?.progressData) return [];
    return data.progressData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [data?.progressData]);

  const performanceData = useMemo(() => {
    if (!data?.performanceMetrics) return [];
    return data.performanceMetrics.map(metric => ({
      name: metric.metric,
      current: metric.current,
      previous: metric.previous,
      target: metric.target,
      improvement: ((metric.current - metric.previous) / metric.previous) * 100,
    }));
  }, [data?.performanceMetrics]);

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/export?timeRange=${timeRange}`, {
        method: 'GET',
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `tranquilae-analytics-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const shareProgress = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Tranquilae Progress',
          text: `I've completed ${data?.workoutStats.totalWorkouts} workouts and burned ${data?.workoutStats.caloriesBurned} calories!`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers without native sharing
        await navigator.clipboard.writeText(window.location.href);
        // Show toast notification
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center">
        <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Available</h3>
        <p className="text-gray-600 dark:text-gray-400">Complete your first workout to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your wellness journey with detailed insights and progress visualization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="glass-button px-4 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button onClick={exportData} className="glass-button p-2">
            <Download className="w-4 h-4" />
          </button>
          
          <button onClick={shareProgress} className="glass-button p-2">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.workoutStats.totalWorkouts}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Total Workouts</p>
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(data.workoutStats.weeklyProgress / data.workoutStats.weeklyGoal) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.workoutStats.weeklyProgress}/{data.workoutStats.weeklyGoal} this week
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.workoutStats.caloriesBurned.toLocaleString()}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Calories Burned</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {data.workoutStats.streak} day streak 🔥
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              +15%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(data.workoutStats.totalDuration / 60)}h
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Total Duration</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {Math.round(data.workoutStats.totalDuration / data.workoutStats.totalWorkouts)} min avg
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Activity className="w-4 h-4 mr-1" />
              Avg
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.workoutStats.avgHeartRate}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Avg Heart Rate</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Cardio zone: 65-75%
          </p>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Chart Type:</span>
            <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg">
              {[
                { type: 'line', icon: LineChartIcon },
                { type: 'area', icon: BarChart3 },
                { type: 'bar', icon: BarChart3 },
              ].map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type as any)}
                  className={`p-2 ${
                    chartType === type 
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Metrics:</span>
            {['workouts', 'duration', 'calories'].map((metric) => (
              <button
                key={metric}
                onClick={() => {
                  setSelectedMetrics(prev => 
                    prev.includes(metric) 
                      ? prev.filter(m => m !== metric)
                      : [...prev, metric]
                  )
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedMetrics.includes(metric)
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              comparisonMode
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Compare Periods
          </button>
        </div>
      </div>

      {/* Main Progress Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Progress Over Time
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis dataKey="date" stroke="rgba(156, 163, 175, 0.8)" />
                <YAxis stroke="rgba(156, 163, 175, 0.8)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                {selectedMetrics.includes('workouts') && (
                  <Line
                    type="monotone"
                    dataKey="workouts"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#7c3aed', strokeWidth: 2 }}
                  />
                )}
                {selectedMetrics.includes('duration') && (
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                  />
                )}
                {selectedMetrics.includes('calories') && (
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis dataKey="date" stroke="rgba(156, 163, 175, 0.8)" />
                <YAxis stroke="rgba(156, 163, 175, 0.8)" />
                <Tooltip />
                <Legend />
                {selectedMetrics.map((metric, index) => (
                  <Area
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stackId={index}
                    stroke={['#7c3aed', '#f59e0b', '#ef4444'][index]}
                    fill={['#7c3aed', '#f59e0b', '#ef4444'][index]}
                    fillOpacity={0.3}
                  />
                ))}
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis dataKey="date" stroke="rgba(156, 163, 175, 0.8)" />
                <YAxis stroke="rgba(156, 163, 175, 0.8)" />
                <Tooltip />
                <Legend />
                {selectedMetrics.map((metric, index) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    fill={['#7c3aed', '#f59e0b', '#ef4444'][index]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics and Workout Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performance Metrics
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis dataKey="name" stroke="rgba(156, 163, 175, 0.8)" />
                <YAxis stroke="rgba(156, 163, 175, 0.8)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#7c3aed" name="Current" radius={[2, 2, 0, 0]} />
                <Bar dataKey="previous" fill="#d1d5db" name="Previous" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} name="Target" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workout Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Workout Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.workoutDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {data.workoutDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Achievements and Social Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Achievements */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Achievements
            </h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {data.achievements.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Stats */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Social Stats
            </h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                #{data.socialStats.rank}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Global Rank</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {data.socialStats.friendsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {data.socialStats.likesReceived}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Top Friends
              </h4>
              <div className="space-y-2">
                {data.socialStats.leaderboard.slice(0, 3).map((friend) => (
                  <div key={friend.rank} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{friend.rank}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {friend.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {friend.score} points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
