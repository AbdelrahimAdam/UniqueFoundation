// pages/teacher/TeacherDashboard.js
import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { recordingService } from '../../services/recordingService.jsx'
import { sessionService } from '../../services/sessionService.jsx'
import {
  Plus,
  Video,
  Users,
  BarChart3,
  Clock,
  TrendingUp,
  RefreshCw,
  Calendar,
  BookOpen
} from 'lucide-react'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'

const TeacherDashboard = () => {
  const { t } = useTranslation()
  const { user, userProfile } = useAuth()
  
  const [stats, setStats] = useState({
    totalRecordings: 0,
    published: 0,
    inProgress: 0,
    totalViews: 0
  })
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const teacherId = user?.uid

  useEffect(() => {
    if (teacherId) {
      loadDashboardData()
    }
  }, [teacherId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load teacher recordings and sessions
      const [recordings, sessions] = await Promise.all([
        recordingService.getAllRecordings(),
        sessionService.getAllSessions({ limit: 5 })
      ])

      // Filter for this teacher
      const teacherRecordings = recordings.filter(recording => 
        recording.teacherId === teacherId || recording.createdBy === teacherId
      )
      
      const teacherSessions = sessions.filter(session => 
        session.createdBy === teacherId || session.teacherId === teacherId
      )

      // Calculate stats
      setStats({
        totalRecordings: teacherRecordings.length,
        published: teacherRecordings.filter(r => r.isPublished).length,
        inProgress: teacherRecordings.filter(r => 
          r.status === 'recording' || r.status === 'processing'
        ).length,
        totalViews: teacherRecordings.reduce((sum, r) => sum + (r.views || 0), 0)
      })

      setRecentSessions(teacherSessions)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: t('teacher.stats.totalRecordings', 'Total Recordings'),
      value: stats.totalRecordings.toString(),
      icon: Video,
      change: `${stats.published} published`,
      changeType: 'positive',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: t('teacher.stats.published', 'Published'),
      value: stats.published.toString(),
      icon: Users,
      change: `${Math.round((stats.published / Math.max(stats.totalRecordings, 1)) * 100)}% of total`,
      changeType: 'positive',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: t('teacher.stats.totalViews', 'Total Views'),
      value: stats.totalViews.toString(),
      icon: BarChart3,
      change: '+12% this week',
      changeType: 'positive',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: t('teacher.stats.inProgress', 'In Progress'),
      value: stats.inProgress.toString(),
      icon: Clock,
      change: 'Active recordings',
      changeType: stats.inProgress > 0 ? 'warning' : 'neutral',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const quickActions = [
    {
      title: t('recording.createNew', 'Create Recording'),
      description: 'Start a new recording session',
      icon: Plus,
      action: () => window.location.href = '/teacher/recordings/create'
    },
    {
      title: t('teacher.actions.manageStudents', 'Manage Students'),
      description: 'View and manage your students',
      icon: Users,
      action: () => window.location.href = '/teacher/students'
    },
    {
      title: t('teacher.actions.viewAnalytics', 'View Analytics'),
      description: 'Detailed performance insights',
      icon: BarChart3,
      action: () => window.location.href = '/teacher/analytics'
    }
  ]

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('teacher.dashboard.title', 'Teacher Dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {userProfile?.displayName || 'Teacher'}
          </p>
        </div>
        <Button
          onClick={loadDashboardData}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {stat.changeType === 'positive' && (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {stat.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.change}
              </p>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.title}
                    onClick={action.action}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200"
                  >
                    <Icon className="h-6 w-6 text-blue-500 mb-2" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Sessions
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.topic}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.date?.toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    session.status === 'completed' ? 'bg-green-500' :
                    session.status === 'live' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <BookOpen className="mx-auto h-8 w-8 mb-2" />
                <p>No recent sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard