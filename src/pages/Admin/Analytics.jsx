// pages/admin/Analytics.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { userService, courseService, sessionService, recordingService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import {
  Users,
  BookOpen,
  Video,
  TrendingUp,
  Download,
  Calendar,
  BarChart3,
  Eye,
  Clock,
  DollarSign,
  UserPlus,
  Bookmark
} from 'lucide-react'

const Analytics = () => {
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState({})
  const [timeRange, setTimeRange] = useState('30days')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const [users, courses, sessions, recordings] = await Promise.all([
        userService.getAllUsers(),
        courseService.getAllCourses(),
        sessionService.getAllSessions(),
        recordingService.getAllRecordings()
      ])

      // Calculate analytics data
      const now = new Date()
      const timeRangeMs = {
        '7days': 7 * 24 * 60 * 60 * 1000,
        '30days': 30 * 24 * 60 * 60 * 1000,
        '90days': 90 * 24 * 60 * 60 * 1000
      }[timeRange]

      const recentUsers = users.filter(user => 
        user.createdAt && (now - new Date(user.createdAt)) < timeRangeMs
      )

      const recentSessions = sessions.filter(session =>
        session.createdAt && (now - new Date(session.createdAt)) < timeRangeMs
      )

      const totalWatchTime = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)
      const storageUsed = recordings.reduce((sum, r) => sum + (r.fileSize || 0), 0)

      setAnalytics({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalSessions: sessions.length,
        totalRecordings: recordings.length,
        newUsers: recentUsers.length,
        activeSessions: sessions.filter(s => s.status === 'live').length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        totalWatchTime,
        storageUsed,
        userGrowth: recentUsers.length,
        sessionGrowth: recentSessions.length,
        userDistribution: {
          students: users.filter(u => u.role === 'student').length,
          teachers: users.filter(u => u.role === 'teacher').length,
          admins: users.filter(u => u.role === 'admin').length
        }
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detailed insights and platform metrics
          </p>
        </div>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalUsers)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                +{analytics.userGrowth} new
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalCourses)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Active learning
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalSessions)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {analytics.activeSessions} live
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatFileSize(analytics.storageUsed * 1024 * 1024)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Recordings & files
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Students</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.userDistribution?.students || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Teachers</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.userDistribution?.teachers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Admins</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.userDistribution?.admins || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Session Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Session Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Watch Time</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDuration(analytics.totalWatchTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Video className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed Sessions</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.completedSessions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Recordings</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.totalRecordings}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Growth Metrics ({timeRange.replace('days', ' days')})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              +{analytics.userGrowth}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">New Users</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              +{analytics.sessionGrowth}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">New Sessions</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bookmark className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((analytics.completedSessions / Math.max(analytics.totalSessions, 1)) * 100)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics