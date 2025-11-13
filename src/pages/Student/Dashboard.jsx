import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useInfiniteQuery, useQuery } from 'react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  recordingService,
  courseService,
  sessionService,
  userService
} from '../../services'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import Button from '../../components/UI/Button.jsx'
import Input from '../../components/UI/Input.jsx'

// Lazy load icons - only import what's needed
import { 
  BookOpen, Video, Users, Search, PlayCircle, Clock, Eye, 
  RefreshCw, CheckCircle, Calendar, TrendingUp, Star, 
  AlertCircle, ArrowRight, Crown, User, Filter, XCircle 
} from 'lucide-react'

// Constants - moved outside component to prevent recreation
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'title', label: 'Title' },
  { value: 'duration', label: 'Duration' },
  { value: 'views', label: 'Popularity' },
  { value: 'rating', label: 'Rating' }
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'lecture', label: 'Lectures' },
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'qna', label: 'Q&A Sessions' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'watched', label: 'Watched' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' }
]

// Helper functions - moved outside component
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
 
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDateTime = (date) => {
  if (!date) return { date: 'TBD', time: '', full: 'TBD' }
  const dateObj = new Date(date)
  return {
    date: dateObj.toLocaleDateString(),
    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: dateObj.toLocaleString()
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'from-green-500 to-emerald-500'
    case 'processing': return 'from-yellow-500 to-orange-500'
    case 'recording': return 'from-blue-500 to-cyan-500'
    case 'failed': return 'from-red-500 to-pink-500'
    default: return 'from-gray-500 to-gray-600'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return CheckCircle
    case 'processing': return Clock
    case 'recording': return PlayCircle
    case 'failed': return XCircle
    default: return Video
  }
}

const getProgressColor = (progress) => {
  if (progress >= 90) return 'from-green-500 to-emerald-500'
  if (progress >= 50) return 'from-yellow-500 to-orange-500'
  return 'from-blue-500 to-cyan-500'
}

// Optimized Recording Card Component
const RecordingCard = React.memo(({ 
  recording, 
  onWatch, 
  actionLoading,
  getTeacherName,
  teachers 
}) => {
  const StatusIcon = getStatusIcon(recording.status)
  const progress = recording.progress || (recording.watched ? 100 : 0)
  const teacherName = recording.instructorName || getTeacherName(recording.instructorId)
  
  return (
    <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 p-4 sm:p-6 shadow-lg sm:shadow-2xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getStatusColor(recording.status)} flex-shrink-0`}>
            <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-start justify-between mb-2 gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-2 flex-1">
                {recording.title}
                {recording.meetLink && (
                  <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full whitespace-nowrap">
                    Google Meet
                  </span>
                )}
              </h4>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {recording.watched && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {recording.isFeatured && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
           
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {recording.description || 'No description provided'}
            </p>

            {/* Instructor and Category */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
              {teacherName && (
                <span className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate">{teacherName}</span>
                </span>
              )}
              {recording.category && (
                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {recording.category}
                </span>
              )}
            </div>

            {/* Recording Details */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {recording.views || 0} views
              </span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(recording.duration)}
              </span>
              {recording.averageRating > 0 && (
                <span className="flex items-center">
                  <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                  {recording.averageRating.toFixed(1)}
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
                recording.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : recording.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {recording.status}
              </span>
            </div>

            {/* Progress Bar */}
            {progress > 0 && progress < 100 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {recording.tags && recording.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recording.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span
                    key={`tag-${recording.id}-${tagIndex}`}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
                {recording.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    +{recording.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 sm:ml-4">
          <Button
            size="sm"
            onClick={() => onWatch(recording)}
            disabled={actionLoading[recording.id]}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1 sm:flex-none text-xs sm:text-sm"
          >
            {actionLoading[recording.id] ? (
              <LoadingSpinner size="sm" className="mr-1" />
            ) : (
              <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            )}
            {recording.recordingUrl?.includes('drive.google.com') ? 'Watch on Drive' : 'Watch'}
          </Button>
        </div>
      </div>
    </div>
  )
})

// Session Card Component
const SessionCard = React.memo(({ 
  session, 
  onJoin, 
  getTeacherName, 
  teachers,
  type = 'teacher'
}) => {
  const dateTime = formatDateTime(session.scheduledTime)
  const teacherName = getTeacherName(session.createdBy)
  
  return (
    <div
      className="flex items-center p-3 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-lg border border-white/40 dark:border-gray-600/40 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-all duration-200 group cursor-pointer"
      onClick={() => onJoin(session)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {session.topic || session.title || 'Untitled Session'}
        </p>
        {type === 'teacher' && (
          <div className="flex items-center space-x-2 mt-1">
            <User className="h-3 w-3 text-gray-500" />
            <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
              {teacherName}
            </p>
          </div>
        )}
        <div className="flex items-center space-x-2 mt-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
            {dateTime.date} at {dateTime.time}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          type === 'teacher' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <PlayCircle className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
})

const StudentDashboard = () => {
  const { t } = useTranslation()
  const { user, userProfile, loading: authLoading } = useAuth()
 
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [actionLoading, setActionLoading] = useState({})
  const [showFilters, setShowFilters] = useState(false)

  const studentId = user?.uid
  const isApproved = userProfile?.isActive
  const studentName = userProfile?.displayName || user?.email?.split('@')[0]

  // Combined data fetching for sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery(
    ['studentSessions', studentId],
    async () => {
      const [recentSessions, teacherSessions] = await Promise.all([
        sessionService.getPublicSessions({
          status: 'scheduled',
          dateRange: 'upcoming',
          limit: 10
        }),
        sessionService.getTeacherSessionsForStudents({
          limit: 20,
          daysAhead: 30
        })
      ])
      return { recentSessions, teacherSessions }
    },
    {
      enabled: !!studentId && isApproved,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  )

  const recentSessions = sessionsData?.recentSessions || []
  const teacherSessions = sessionsData?.teacherSessions || []

  // Recordings query
  const {
    data: recordingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: recordingsLoading,
    error: recordingsError,
    refetch: refetchRecordings,
    isRefetching: isRefetchingRecordings
  } = useInfiniteQuery(
    ['studentRecordings', studentId, sortBy, sortOrder],
    ({ pageParam = null }) => recordingService.getAvailableRecordings({
      studentId,
      cursor: pageParam,
      limit: 12,
      sortBy,
      sortOrder
    }),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
      enabled: !!studentId && isApproved,
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  )

  // Courses query
  const {
    data: courses = [],
    isLoading: coursesLoading,
    error: coursesError
  } = useQuery(
    ['studentCourses', studentId],
    () => courseService.getPublishedCourses(20),
    {
      enabled: !!studentId && isApproved,
      staleTime: 10 * 60 * 1000,
    }
  )

  // Teachers query
  const {
    data: teachers = [],
    isLoading: teachersLoading,
    error: teachersError
  } = useQuery(
    ['teachers'],
    () => userService.getAllUsers({ role: 'teacher', status: 'active' }),
    {
      enabled: !!studentId && isApproved,
      select: (data) => data.filter(user => user.role === 'teacher' && user.isActive),
    }
  )

  // Use recordings directly
  const allRecordings = recordingsData?.pages.flatMap(page => page.recordings || []) || []

  // Optimized filtering with early returns
  const filteredRecordings = useMemo(() => {
    if (!allRecordings.length) return []

    let filtered = allRecordings

    // Apply search filter first (most expensive)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(recording => 
        recording.title?.toLowerCase().includes(searchLower) ||
        recording.description?.toLowerCase().includes(searchLower) ||
        recording.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        recording.instructorName?.toLowerCase().includes(searchLower)
      )
    }

    // Apply other filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(recording => 
        recording.status === statusFilter ||
        (statusFilter === 'watched' && recording.watched) ||
        (statusFilter === 'new' && !recording.watched)
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(recording => recording.category === categoryFilter)
    }

    if (teacherFilter !== 'all') {
      filtered = filtered.filter(recording => recording.instructorId === teacherFilter)
    }

    // Sort
    return filtered.sort((a, b) => {
      let aValue = a[sortBy] || 0
      let bValue = b[sortBy] || 0
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'scheduledTime') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })
  }, [allRecordings, searchTerm, statusFilter, categoryFilter, teacherFilter, sortBy, sortOrder])

  // Filter teacher sessions
  const filteredTeacherSessions = useMemo(() => {
    return teacherFilter === 'all' 
      ? teacherSessions 
      : teacherSessions.filter(session => session.createdBy === teacherFilter)
  }, [teacherSessions, teacherFilter])

  // Optimized stats calculation
  const stats = useMemo(() => {
    const completedRecordings = allRecordings.filter(r => r.watched).length
    const totalProgress = allRecordings.length > 0 
      ? Math.round((completedRecordings / allRecordings.length) * 100)
      : 0

    return {
      enrolledClasses: courses.length,
      availableRecordings: allRecordings.filter(r => r.isPublished && r.status === 'completed').length,
      teachers: teachers.length,
      totalWatchTime: allRecordings.reduce((sum, r) => sum + (r.duration || 0), 0),
      completedRecordings,
      upcomingSessions: recentSessions.length,
      teacherUpcomingSessions: filteredTeacherSessions.length,
      googleMeetSessions: allRecordings.filter(r => r.meetLink).length,
      totalProgress
    }
  }, [courses, allRecordings, teachers, recentSessions, filteredTeacherSessions])

  // Memoized teacher name function
  const getTeacherName = useCallback((teacherId) => {
    const teacher = teachers.find(t => t.uid === teacherId)
    return teacher?.displayName || teacher?.email?.split('@')[0] || 'Unknown Teacher'
  }, [teachers])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    refetchRecordings()
    // Sessions will refetch automatically due to query invalidation
  }, [refetchRecordings])

  // Recording watch handler
  const handleWatchRecording = useCallback((recording) => {
    if (recording.recordingUrl) {
      setActionLoading(prev => ({ ...prev, [recording.id]: true }))
      
      if (recording.recordingUrl.includes('drive.google.com')) {
        window.open(recording.recordingUrl, '_blank')
      }
      
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [recording.id]: false }))
      }, 1000)
    }
  }, [])

  // Session join handler
  const handleJoinSession = useCallback((session) => {
    if (session.meetLink || session.googleMeetLink) {
      window.open(session.meetLink || session.googleMeetLink, '_blank')
    }
  }, [])

  // Memoized stat cards
  const statCards = useMemo(() => [
    {
      id: 'enrolled-classes',
      name: 'Enrolled Classes',
      value: stats.enrolledClasses.toString(),
      icon: BookOpen,
      change: `${courses.filter(c => c.isPublished).length} active`,
      changeType: 'positive',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      description: 'Your learning journey',
      loading: coursesLoading
    },
    {
      id: 'available-recordings',
      name: 'Available Recordings',
      value: stats.availableRecordings.toString(),
      icon: Video,
      change: `${stats.completedRecordings} watched`,
      changeType: stats.completedRecordings > 0 ? 'positive' : 'neutral',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      description: 'Ready to watch',
      loading: recordingsLoading
    },
    {
      id: 'teachers',
      name: 'Teachers',
      value: stats.teachers.toString(),
      icon: Users,
      change: `${stats.teacherUpcomingSessions} upcoming`,
      changeType: 'neutral',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      description: 'Expert instructors',
      loading: teachersLoading
    },
    {
      id: 'learning-progress',
      name: 'Learning Progress',
      value: `${stats.totalProgress}%`,
      icon: TrendingUp,
      change: `${Math.round(stats.totalWatchTime / 3600)} hours watched`,
      changeType: stats.totalProgress > 50 ? 'positive' : 'neutral',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/10 to-red-500/10',
      description: 'Your overall progress',
      loading: recordingsLoading
    }
  ], [stats, courses, coursesLoading, recordingsLoading, teachersLoading])

  // Teacher options
  const teacherOptions = useMemo(() => [
    { value: 'all', label: 'All Teachers' },
    ...teachers.map(teacher => ({
      value: teacher.uid,
      label: teacher.displayName || teacher.email?.split('@')[0] || 'Unknown Teacher'
    }))
  ], [teachers])

  // Error state
  const error = recordingsError || coursesError || teachersError

  // Auth guard states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!studentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="text-center max-w-md p-8">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access the student dashboard.
          </p>
          <Button
            onClick={() => (window.location.href = '/login')}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
          >
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="text-center max-w-md p-8">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Pending Approval
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account is awaiting admin approval. You will be notified via email once approved.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Please contact the administrator if you have been waiting for more than 24 hours.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 min-h-screen">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2 sm:mb-3 break-words">
              Student Dashboard
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
              Access your classes, recordings, and learning materials
            </p>
            {studentName && (
              <div className="flex flex-col xs:flex-row xs:items-center mt-2 gap-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, <span className="font-semibold text-gray-800 dark:text-gray-200">{studentName}</span>
                </p>
                {userProfile?.subscription?.plan === 'premium' && (
                  <span className="px-2 py-1 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full flex items-center w-fit">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium Student
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefetchingRecordings}
              className="hidden lg:flex items-center text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetchingRecordings ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => (window.location.href = '/courses')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg text-sm w-full xs:w-auto justify-center"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Classes
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Refresh Button */}
      <div className="lg:hidden flex justify-center">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center w-full sm:w-auto justify-center text-sm"
          disabled={isRefetchingRecordings}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetchingRecordings ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-lg border border-red-200/50 dark:border-red-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm flex-1">
            Failed to load content. Please try refreshing.
          </p>
          <button
            onClick={handleRefresh}
            className="ml-2 sm:ml-4 text-red-500 hover:text-red-700 flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          
          return (
            <div
              key={stat.id}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 p-3 sm:p-4 lg:p-6 shadow-lg sm:shadow-2xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 hover:scale-105"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.bgColor} rounded-2xl sm:rounded-3xl`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {stat.changeType === 'positive' && (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    )}
                    <div className={`text-xs sm:text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                </div>
                {stat.loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 sm:h-7 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded mb-1 sm:mb-2" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      {stat.value}
                    </h3>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">
                      {stat.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                      {stat.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {/* Sessions Sidebar */}
        <div className="xl:col-span-1 space-y-4 sm:space-y-6">
          {/* Teacher Sessions */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 p-3 sm:p-4 lg:p-6 shadow-lg sm:shadow-2xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Teacher Sessions
              </h3>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              {filteredTeacherSessions.length > 0 ? (
                filteredTeacherSessions.slice(0, 5).map((session) => (
                  <SessionCard
                    key={`teacher-session-${session.id}`}
                    session={session}
                    onJoin={handleJoinSession}
                    getTeacherName={getTeacherName}
                    teachers={teachers}
                    type="teacher"
                  />
                ))
              ) : (
                <div className="text-center py-3 sm:py-4 text-gray-600 dark:text-gray-400">
                  <Users className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm">No teacher sessions</p>
                  <p className="text-xs mt-1">Check back later for updates</p>
                </div>
              )}
              {filteredTeacherSessions.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs sm:text-sm"
                  onClick={() => (window.location.href = '/sessions?view=teachers')}
                >
                  View All Teacher Sessions
                </Button>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 p-3 sm:p-4 lg:p-6 shadow-lg sm:shadow-2xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Your Upcoming Sessions
              </h3>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              {sessionsLoading ? (
                <div className="flex justify-center py-3 sm:py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <SessionCard
                    key={`recent-session-${session.id}`}
                    session={session}
                    onJoin={handleJoinSession}
                    getTeacherName={getTeacherName}
                    teachers={teachers}
                    type="recent"
                  />
                ))
              ) : (
                <div className="text-center py-3 sm:py-4 text-gray-600 dark:text-gray-400">
                  <Calendar className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm">No upcoming sessions</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs sm:text-sm"
                    onClick={() => (window.location.href = '/sessions')}
                  >
                    View All Sessions
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recordings Section */}
        <div className="xl:col-span-3 space-y-4 sm:space-y-6">
          {/* Search and Filters */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 p-3 sm:p-4 lg:p-6 shadow-lg sm:shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-3 sm:space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 border-white/40 dark:border-gray-600/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm"
                    placeholder="Search recordings by title, description, or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Filter Toggle for Mobile */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="lg:hidden text-sm w-full sm:w-auto justify-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters {showFilters ? '▲' : '▼'}
              </Button>

              {/* Filters */}
              <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
                <select
                  className="block w-full sm:w-auto px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 border-white/40 dark:border-gray-600/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                >
                  {teacherOptions.map(option => (
                    <option key={`teacher-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="block w-full sm:w-auto px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 border-white/40 dark:border-gray-600/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={`category-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="block w-full sm:w-auto px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 border-white/40 dark:border-gray-600/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={`status-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="block w-full sm:w-auto px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 border-white/40 dark:border-gray-600/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={`sort-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  variant="outline"
                  className="px-2 sm:px-3 text-xs sm:text-sm"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </Button>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  disabled={isRefetchingRecordings}
                  className="text-xs sm:text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetchingRecordings ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Recordings List */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Available Recordings
              </h3>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                {filteredRecordings.length} items
                {searchTerm && ` • matching "${searchTerm}"`}
                {teacherFilter !== 'all' && ` • by ${teacherOptions.find(t => t.value === teacherFilter)?.label}`}
              </span>
            </div>

            {recordingsLoading ? (
              <div className="flex justify-center items-center min-h-48 sm:min-h-64 bg-white/50 dark:bg-gray-800/50 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Loading recordings...
                  </p>
                </div>
              </div>
            ) : filteredRecordings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
                  {filteredRecordings.map((recording) => (
                    <RecordingCard
                      key={`recording-${recording.id}`}
                      recording={recording}
                      onWatch={handleWatchRecording}
                      actionLoading={actionLoading}
                      getTeacherName={getTeacherName}
                      teachers={teachers}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="flex justify-center mt-6 sm:mt-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="flex items-center text-sm"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Loading more recordings...
                        </>
                      ) : (
                        <>Load More Recordings</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 sm:py-12 bg-white/50 dark:bg-gray-800/50 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40">
                <Video className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || teacherFilter !== 'all'
                    ? 'No matching recordings'
                    : 'No recordings available'
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || teacherFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Enroll in a class to access recordings.'
                  }
                </p>
                <Button
                  onClick={() => (window.location.href = '/courses')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Classes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard