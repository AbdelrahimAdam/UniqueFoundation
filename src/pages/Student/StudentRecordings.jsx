import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { recordingService, sessionService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'

// Lazy load icons - only import what's needed
import { Video, Search, Eye, Clock, Users, Download, Star, Calendar, 
  Check, PlayCircle, Filter, SortAsc, AlertCircle, RefreshCw, 
  ExternalLink, Radio, UserPlus, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Constants
const CONTENT_TYPES = {
  RECORDINGS: 'recordings',
  UPCOMING: 'upcoming', 
  LIVE: 'live'
}

const SORT_OPTIONS = {
  CREATED_AT: 'createdAt',
  TITLE: 'title',
  DURATION: 'duration',
  VIEWS: 'views',
  SCHEDULED_TIME: 'scheduledTime'
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'lecture', label: 'Lectures' },
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'qna', label: 'Q&A Sessions' }
]

// Helper functions - moved outside component to prevent recreation
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatDateTime = (date) => {
  if (!date) return 'TBD'
  try {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return 'Invalid Date'
  }
}

const getDriveFileId = (url) => {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

// Pre-optimized card components with forwardRef
const RecordingCard = React.memo(forwardRef(({ recording, onWatch, onDownload, index }, ref) => {
  const isDrive = !!getDriveFileId(recording.recordingUrl)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: Math.min(index * 0.03, 0.3), // Cap delay to prevent long staggered animations
        type: "spring",
        stiffness: 400,
        damping: 40
      }}
      className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      {/* Thumbnail Section */}
      <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-500 to-cyan-500 relative overflow-hidden">
        {recording.thumbnailUrl ? (
          <>
            <img 
              src={recording.thumbnailUrl} 
              alt={recording.title}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                <Video className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-80" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
            <Video className="h-10 w-10 sm:h-16 sm:w-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
          <span className="px-2 sm:px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
            {formatDuration(recording.duration)}
          </span>
        </div>
        
        {recording.watched && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <span className="px-2 sm:px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Watched
            </span>
          </div>
        )}
        
        {isDrive && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
            <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Drive
            </span>
          </div>
        )}

        {/* Hover Overlay - Only render if needed */}
        {isDrive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-40">
            <button
              onClick={() => onWatch(recording)}
              className="p-3 sm:p-4 bg-white bg-opacity-20 rounded-full backdrop-blur-sm hover:bg-opacity-30 transition-all transform hover:scale-110"
              title="Watch on Google Drive"
            >
              <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-2 flex-1">
            {recording.title}
          </h3>
          {recording.isFeatured && (
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current ml-2 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {recording.description || 'No description available'}
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{recording.instructorName}</span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              {recording.views || 0}
            </span>
          </div>
          {recording.category && (
            <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-xs rounded-full capitalize whitespace-nowrap">
              {recording.category}
            </span>
          )}
        </div>
        
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {recording.createdAt ? new Date(recording.createdAt).toLocaleDateString() : 'Unknown date'}
          </span>
          <div className="flex gap-2">
            <Button 
              onClick={() => onWatch(recording)} 
              size="sm" 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs sm:text-sm"
            >
              <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
              Watch
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDownload(recording)}
              title="Download video"
              className="text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}))

const SessionCard = React.memo(forwardRef(({ session, onJoin, index, type }, ref) => {
  const isLive = type === CONTENT_TYPES.LIVE
  const isUpcoming = type === CONTENT_TYPES.UPCOMING
  
  const gradient = isLive 
    ? 'from-red-500 to-pink-600' 
    : 'from-orange-400 to-yellow-500'
  
  const borderColor = isLive 
    ? 'border-l-red-500' 
    : 'border-l-orange-500'
  
  const Icon = isLive ? Radio : Calendar
  const statusText = isLive ? 'Live Now' : 'Upcoming'
  const buttonText = isLive ? 'Join Live' : 'Join Session'
  
  const ButtonIcon = isLive ? Radio : UserPlus

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: Math.min(index * 0.03, 0.3),
        type: "spring",
        stiffness: 400,
        damping: 40
      }}
      className={`group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4 ${borderColor} ${isLive ? 'animate-pulse' : ''}`}
    >
      {/* Header Section */}
      <div className={`h-40 sm:h-48 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="w-full h-full flex items-center justify-center">
          <Icon className={`h-10 w-10 sm:h-16 sm:w-16 text-white opacity-80 ${isLive ? 'animate-pulse' : ''}`} />
        </div>
        
        {/* Badges */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
          <span className="px-2 sm:px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
            {formatDuration(session.duration || 60)}
          </span>
        </div>
        
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <span className={`px-2 sm:px-3 py-1 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-orange-500'} text-white rounded-full text-xs font-medium flex items-center gap-1`}>
            {isLive && <Zap className="h-3 w-3" />}
            {statusText}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-2">
          {session.title || session.topic}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {session.description || (isLive ? 'Live session in progress' : 'Live session coming soon')}
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{session.instructorName}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{formatDateTime(session.scheduledTime)}</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {session.courseName || 'General Session'}
          </span>
          <Button 
            size="sm" 
            onClick={() => onJoin(session)}
            className={`bg-gradient-to-r text-xs sm:text-sm ${
              isLive 
                ? 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse' 
                : 'from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600'
            }`}
          >
            <ButtonIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
            {buttonText}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}))

const StudentRecordings = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [recordings, setRecordings] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [liveSessions, setLiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.CREATED_AT)
  const [activeTab, setActiveTab] = useState(CONTENT_TYPES.RECORDINGS)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const studentId = user?.uid
  const abortControllerRef = useRef(null)

  // Memoized stats calculation - simplified
  const stats = useMemo(() => {
    const totalRecordings = recordings.length
    const totalDuration = recordings.reduce((sum, rec) => sum + (rec.duration || 0), 0)
    const totalViews = recordings.reduce((sum, rec) => sum + (rec.views || 0), 0)
    const completedRecordings = recordings.filter(rec => rec.progress >= 95).length
    
    return {
      totalRecordings,
      totalDuration: formatDuration(totalDuration),
      totalViews,
      completedRecordings,
      completionRate: totalRecordings > 0 ? Math.round((completedRecordings / totalRecordings) * 100) : 0,
      upcomingCount: upcomingSessions.length,
      liveCount: liveSessions.length
    }
  }, [recordings, upcomingSessions, liveSessions])

  // Optimized content filtering and sorting
  const filteredContent = useMemo(() => {
    // Early return if no content
    if (!recordings.length && !upcomingSessions.length && !liveSessions.length) {
      return []
    }

    let content = []

    // Filter by active tab first to avoid processing unnecessary data
    switch (activeTab) {
      case CONTENT_TYPES.RECORDINGS:
        content = recordings.map(rec => ({ ...rec, type: CONTENT_TYPES.RECORDINGS, sortDate: rec.createdAt }))
        break
      case CONTENT_TYPES.UPCOMING:
        content = upcomingSessions.map(session => ({ ...session, type: CONTENT_TYPES.UPCOMING, duration: session.duration || 60, sortDate: session.scheduledTime }))
        break
      case CONTENT_TYPES.LIVE:
        content = liveSessions.map(session => ({ ...session, type: CONTENT_TYPES.LIVE, duration: session.duration || 60, sortDate: session.actualStartTime || session.scheduledTime }))
        break
      default:
        return []
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      content = content.filter(item => {
        return (
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.instructorName?.toLowerCase().includes(searchLower) ||
          (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
        )
      })
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      content = content.filter(item => item.category === categoryFilter)
    }

    // Sort content
    if (content.length > 0) {
      content.sort((a, b) => {
        switch (sortBy) {
          case SORT_OPTIONS.TITLE:
            return (a.title || '').localeCompare(b.title || '')
          case SORT_OPTIONS.DURATION:
            return (b.duration || 0) - (a.duration || 0)
          case SORT_OPTIONS.VIEWS:
            return (b.views || 0) - (a.views || 0)
          case SORT_OPTIONS.SCHEDULED_TIME:
            return new Date(a.sortDate || 0) - new Date(b.sortDate || 0)
          case SORT_OPTIONS.CREATED_AT:
          default:
            return new Date(b.sortDate || 0) - new Date(a.sortDate || 0)
        }
      })
    }

    return content
  }, [recordings, upcomingSessions, liveSessions, activeTab, searchTerm, categoryFilter, sortBy])

  // Content actions - properly memoized
  const watchInDrive = useCallback(async (recording) => {
    const fileId = getDriveFileId(recording.recordingUrl)
    if (!fileId) {
      alert('Invalid Google Drive link')
      return
    }

    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')

    // Track viewing progress
    if (recording.id && studentId) {
      try {
        await Promise.allSettled([
          recordingService.incrementRecordingViews(recording.id),
          recordingService.updateStudentProgress(recording.id, studentId, {
            progress: 5,
            lastWatched: new Date()
          })
        ])
      } catch (err) {
        console.warn('Progress tracking failed:', err)
      }
    }
  }, [studentId])

  const downloadVideo = useCallback((recording) => {
    const fileId = getDriveFileId(recording.recordingUrl)
    if (!fileId) {
      alert('Cannot download: Invalid video URL')
      return
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${recording.title || 'recording'}.mp4`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const joinLiveSession = useCallback(async (session) => {
    if (!session.meetLink) {
      alert('No meeting link available')
      return
    }

    try {
      await sessionService.addParticipant(session.id, studentId, {
        email: user?.email,
        name: user?.displayName || 'Student',
        joinedAt: new Date()
      })
    } catch (err) {
      console.warn('Failed to register participation:', err)
    }

    window.open(session.meetLink, '_blank', 'noopener,noreferrer')
  }, [studentId, user])

  // Fixed data loading with proper cleanup
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (!studentId) return

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError(null)

      // Parallel data fetching with error handling
      const [recordingsResult, upcomingResult, liveResult] = await Promise.allSettled([
        recordingService.getAvailableRecordings({ studentId, limit: 50 }),
        sessionService.getTeacherSessionsForStudents({ limit: 20, daysAhead: 30 }),
        sessionService.getAllSessions({ status: 'live', limit: 20 })
      ])

      // Check if request was cancelled
      if (signal.aborted) return

      // Process recordings
      if (recordingsResult.status === 'fulfilled') {
        const recordingsData = Array.isArray(recordingsResult.value.recordings) 
          ? recordingsResult.value.recordings 
          : []
        setRecordings(recordingsData)
      } else {
        console.warn('Recordings fetch failed:', recordingsResult.reason)
        setRecordings([])
      }

      // Process upcoming sessions
      if (upcomingResult.status === 'fulfilled') {
        setUpcomingSessions(upcomingResult.value)
      } else {
        console.warn('Upcoming sessions fetch failed:', upcomingResult.reason)
        setUpcomingSessions([])
      }

      // Process live sessions
      if (liveResult.status === 'fulfilled') {
        setLiveSessions(liveResult.value)
      } else {
        console.warn('Live sessions fetch failed:', liveResult.reason)
        setLiveSessions([])
      }

    } catch (err) {
      if (signal.aborted) return
      
      console.error('Data loading error:', err)
      setError('Failed to load content. Please try refreshing.')
    } finally {
      if (!signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [studentId])

  // Initial data load with cleanup
  useEffect(() => {
    if (studentId) {
      loadAllData()
    }

    // Cleanup function to cancel ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [studentId, loadAllData])

  // Static configurations
  const tabs = useMemo(() => [
    { key: CONTENT_TYPES.RECORDINGS, label: 'Recordings', icon: Video, count: recordings.length },
    { key: CONTENT_TYPES.UPCOMING, label: 'Upcoming', icon: Calendar, count: upcomingSessions.length },
    { key: CONTENT_TYPES.LIVE, label: 'Live', icon: Radio, count: liveSessions.length }
  ], [recordings.length, upcomingSessions.length, liveSessions.length])

  const sortOptions = useMemo(() => [
    { value: SORT_OPTIONS.CREATED_AT, label: 'Newest First' },
    { value: SORT_OPTIONS.VIEWS, label: 'Most Popular' },
    { value: SORT_OPTIONS.DURATION, label: 'Longest' },
    { value: SORT_OPTIONS.TITLE, label: 'Title A-Z' },
    { value: SORT_OPTIONS.SCHEDULED_TIME, label: 'Soonest First' }
  ], [])

  const statCards = useMemo(() => [
    { label: 'Total Recordings', value: stats.totalRecordings, icon: Video, color: 'blue' },
    { label: 'Completed', value: stats.completedRecordings, percent: stats.completionRate, icon: Check, color: 'green' },
    { label: 'Total Watch Time', value: stats.totalDuration, icon: Clock, color: 'purple' }
  ], [stats])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 dark:text-gray-400">Loading your learning content...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <Video className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <span className="break-words">Learning Content</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Watch recordings on Google Drive, join live sessions, and track your progress
          </p>
        </div>
        
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => loadAllData(true)} 
            variant="outline" 
            disabled={refreshing}
            className="flex-1 sm:flex-none justify-center text-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3"
        >
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <Button 
              onClick={() => loadAllData(true)} 
              size="sm" 
              variant="outline" 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-50 text-xs"
            >
              Try Again
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                {stat.percent !== undefined && (
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                    {stat.percent}% completed
                  </p>
                )}
              </div>
              <div className={`p-2 sm:p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex-shrink-0 ml-3`}>
                <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {tab.label}
                <span className={`ml-1 sm:ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recordings, sessions, instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-sm"
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 sm:flex-none min-w-[140px]">
                <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredContent.map((item, index) => {
              if (item.type === CONTENT_TYPES.RECORDINGS) {
                return (
                  <RecordingCard 
                    key={item.id} 
                    recording={item} 
                    index={index}
                    onWatch={watchInDrive}
                    onDownload={downloadVideo}
                  />
                )
              } else if (item.type === CONTENT_TYPES.UPCOMING || item.type === CONTENT_TYPES.LIVE) {
                return (
                  <SessionCard 
                    key={item.id} 
                    session={item} 
                    index={index} 
                    type={item.type}
                    onJoin={joinLiveSession}
                  />
                )
              }
              return null
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16"
          >
            {activeTab === CONTENT_TYPES.RECORDINGS && (
              <Video className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
            )}
            {activeTab === CONTENT_TYPES.UPCOMING && (
              <Calendar className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
            )}
            {activeTab === CONTENT_TYPES.LIVE && (
              <Radio className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
            )}
            
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab} found
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters to find more content.' 
                : `No ${activeTab} are currently available. Check back later for new content.`
              }
            </p>
            
            <Button 
              onClick={() => loadAllData(true)} 
              variant="outline"
              className="text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Content
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default React.memo(StudentRecordings)