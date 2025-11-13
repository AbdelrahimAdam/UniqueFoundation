import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { sessionService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import {
  Calendar,
  PlayCircle,
  Clock,
  Users,
  Video,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  BookOpen,
  RefreshCw
} from 'lucide-react'

const StudentSessions = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const studentId = user?.uid

  useEffect(() => {
    if (studentId) {
      loadSessions()
    }
  }, [studentId])

  const loadSessions = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      const sessionsData = await sessionService.getPublicSessions()
      setSessions(sessionsData)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleJoinSession = (session) => {
    if (session.meetLink || session.googleMeetLink) {
      window.open(session.meetLink || session.googleMeetLink, '_blank')
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      session.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'live': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return Calendar
      case 'live': return PlayCircle
      case 'completed': return CheckCircle
      default: return Clock
    }
  }

  const stats = {
    upcoming: sessions.filter(s => s.status === 'scheduled').length,
    live: sessions.filter(s => s.status === 'live').length,
    completed: sessions.filter(s => s.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
            Learning Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Join live sessions and access recordings
          </p>
        </div>
        <Button 
          onClick={() => loadSessions(true)} 
          variant="outline" 
          disabled={refreshing}
          className="w-full sm:w-auto justify-center text-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Upcoming
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.upcoming}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-3">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Live Now
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.live}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0 ml-3">
              <PlayCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Completed
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-3">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 sm:space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Sessions</option>
              <option value="scheduled">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" className="text-sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredSessions.map((session) => {
          const StatusIcon = getStatusIcon(session.status)
          const isLive = session.status === 'live'
          const isUpcoming = session.status === 'scheduled'
          const hasRecording = session.recordingUrl

          return (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                    isLive ? 'bg-red-100 dark:bg-red-900/30' :
                    isUpcoming ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <StatusIcon className={`h-4 w-4 sm:h-6 sm:w-6 ${
                      isLive ? 'text-red-600 dark:text-red-400' :
                      isUpcoming ? 'text-blue-600 dark:text-blue-400' :
                      'text-green-600 dark:text-green-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-2 flex-1">
                        {session.title || session.topic}
                      </h3>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)} whitespace-nowrap flex-shrink-0`}>
                        {session.status}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {session.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{session.instructorName}</span>
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {session.scheduledTime ? new Date(session.scheduledTime).toLocaleDateString() : 'TBD'}
                        </span>
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {session.scheduledTime ? new Date(session.scheduledTime).toLocaleTimeString() : 'TBD'}
                        </span>
                      </span>
                    </div>

                    {hasRecording && (
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Recording available
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row lg:flex-col xl:flex-row gap-2 justify-end">
                  {(isLive || isUpcoming) && (
                    <Button
                      onClick={() => handleJoinSession(session)}
                      className={`text-xs sm:text-sm ${
                        isLive 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {isLive ? 'Join Live' : 'Join'}
                    </Button>
                  )}
                  
                  {hasRecording && session.status === 'completed' && (
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 xs:flex-none"
                    >
                      <Button variant="outline" className="w-full text-xs sm:text-sm">
                        <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Watch Recording
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Calendar className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No sessions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 sm:mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No sessions are currently available'
            }
          </p>
          <Button 
            onClick={() => loadSessions(true)} 
            variant="outline" 
            className="text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Sessions
          </Button>
        </div>
      )}
    </div>
  )
}

export default StudentSessions