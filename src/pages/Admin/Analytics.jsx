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
  Bookmark,
  PieChart,
  PlayCircle,
  FileVideo,
  Server
} from 'lucide-react'

const Analytics = () => {
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState({})
  const [timeRange, setTimeRange] = useState('30days')
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const [users, courses, sessions, recordings] = await Promise.all([
        userService.getAllUsers().catch(() => []),
        courseService.getAllCourses().catch(() => []),
        sessionService.getAllSessions().catch(() => []),
        recordingService.getAllRecordings().catch(() => [])
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

      const recentRecordings = recordings.filter(recording =>
        recording.createdAt && (now - new Date(recording.createdAt)) < timeRangeMs
      )

      const totalWatchTime = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)
      const storageUsed = recordings.reduce((sum, r) => sum + (r.fileSize || 0), 0) * 1024 * 1024 // Convert MB to bytes

      // Calculate engagement metrics
      const totalStudents = users.filter(u => u.role === 'student').length
      const activeStudents = users.filter(u => u.role === 'student' && u.lastLogin && 
        (now - new Date(u.lastLogin)) < 7 * 24 * 60 * 60 * 1000).length

      setAnalytics({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalSessions: sessions.length,
        totalRecordings: recordings.length,
        newUsers: recentUsers.length,
        activeSessions: sessions.filter(s => s.status === 'live').length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
        totalWatchTime,
        storageUsed,
        userGrowth: recentUsers.length,
        sessionGrowth: recentSessions.length,
        recordingGrowth: recentRecordings.length,
        activeStudents,
        engagementRate: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0,
        userDistribution: {
          students: users.filter(u => u.role === 'student').length,
          teachers: users.filter(u => u.role === 'teacher').length,
          admins: users.filter(u => u.role === 'admin').length
        },
        sessionDistribution: {
          scheduled: sessions.filter(s => s.status === 'scheduled').length,
          live: sessions.filter(s => s.status === 'live').length,
          completed: sessions.filter(s => s.status === 'completed').length
        }
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const handleExportReport = async () => {
    try {
      setExportLoading(true)
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create and download CSV
      const csvContent = [
        ['Metric', 'Value', 'Time Range'],
        ['Total Users', analytics.totalUsers, timeRange],
        ['Total Courses', analytics.totalCourses, timeRange],
        ['Total Sessions', analytics.totalSessions, timeRange],
        ['Total Recordings', analytics.totalRecordings, timeRange],
        ['New Users', analytics.newUsers, timeRange],
        ['Active Sessions', analytics.activeSessions, timeRange],
        ['Completed Sessions', analytics.completedSessions, timeRange],
        ['Total Watch Time (minutes)', analytics.totalWatchTime, timeRange],
        ['Storage Used', formatFileSize(analytics.storageUsed), timeRange]
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error exporting report:', error)
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Fixed for mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
            Platform Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Detailed insights and platform metrics
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={exportLoading}
            className="w-full sm:w-auto justify-center"
          >
            {exportLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {exportLoading ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Key Metrics - Improved responsive grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(analytics.totalUsers)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analytics.userGrowth} new
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Courses Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Courses</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(analytics.totalCourses)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Active learning
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 ml-3">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Sessions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(analytics.totalSessions)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                <PlayCircle className="h-3 w-3 mr-1" />
                {analytics.activeSessions} live
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-3">
              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Storage Used Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Storage Used</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatFileSize(analytics.storageUsed)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recordings & files
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0 ml-3">
              <Server className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics - Improved responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-5 w-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              User Distribution
            </h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Students</span>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white block">
                  {analytics.userDistribution?.students || 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {analytics.totalUsers ? Math.round((analytics.userDistribution?.students / analytics.totalUsers) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Teachers</span>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white block">
                  {analytics.userDistribution?.teachers || 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {analytics.totalUsers ? Math.round((analytics.userDistribution?.teachers / analytics.totalUsers) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Admins</span>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white block">
                  {analytics.userDistribution?.admins || 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {analytics.totalUsers ? Math.round((analytics.userDistribution?.admins / analytics.totalUsers) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Session Analytics
            </h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Watch Time</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right">
                {formatDuration(analytics.totalWatchTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Video className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed Sessions</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.completedSessions || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileVideo className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Recordings</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.totalRecordings || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Scheduled Sessions</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {analytics.scheduledSessions || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Growth Metrics ({timeRange.replace('days', ' days')})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                +{analytics.userGrowth || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">New Users</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Video className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                +{analytics.sessionGrowth || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">New Sessions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {Math.round((analytics.completedSessions / Math.max(analytics.totalSessions, 1)) * 100)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Completion Rate</p>
            </div>
          </div>
          
          {/* Additional Metrics */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analytics.engagementRate || 0)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Engagement</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  +{analytics.recordingGrowth || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">New Recordings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg sm:text-2xl font-bold">{analytics.activeSessions || 0}</p>
            <p className="text-xs sm:text-sm opacity-90">Live Now</p>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold">{analytics.activeStudents || 0}</p>
            <p className="text-xs sm:text-sm opacity-90">Active Students</p>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold">{analytics.totalRecordings || 0}</p>
            <p className="text-xs sm:text-sm opacity-90">Recordings</p>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold">
              {analytics.totalCourses ? Math.round(analytics.totalUsers / analytics.totalCourses) : 0}
            </p>
            <p className="text-xs sm:text-sm opacity-90">Users/Course</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics