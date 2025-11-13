// pages/teacher/TeacherSessions.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { sessionService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import CreateSessionModal from "../../components/Session/CreateSessionModal.jsx";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  PlayCircle,
  Clock,
  Users,
  Video,
  CheckCircle,
  XCircle,
  MoreVertical,
  Link,
  Eye
} from 'lucide-react'

const TeacherSessions = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const teacherId = user?.uid

  // Detect mobile and handle body scroll
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle body scroll when modal is open
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [showCreateModal])

  useEffect(() => {
    if (teacherId) {
      loadSessions()
    }
  }, [teacherId])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const allSessions = await sessionService.getAllSessions()
      // Filter sessions for this teacher
      const teacherSessions = allSessions.filter(session => 
        session.createdBy === teacherId || session.teacherId === teacherId
      )
      setSessions(teacherSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = (session) => {
    if (session.meetLink || session.googleMeetLink) {
      window.open(session.meetLink || session.googleMeetLink, '_blank')
    }
  }

  const handleSessionCreated = () => {
    loadSessions() // Reload sessions after creation
    setShowCreateModal(false)
  }

  // Mobile-optimized click handler
  const handleScheduleClick = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('📱 Schedule Session button clicked')
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    console.log('📱 Closing modal')
    setShowCreateModal(false)
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
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
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
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
    <div className="space-y-6">
      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={handleCloseModal}
          onSuccess={handleSessionCreated}
        />
      )}

      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Sessions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage your teaching sessions and Google Meet links
          </p>
        </div>
        
        {/* Mobile-optimized button */}
        <button 
          className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation"
          onClick={handleScheduleClick}
          onTouchStart={(e) => e.currentTarget.classList.add('active:scale-95')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </button>
        
        {/* Alternative: Your Button component with mobile fixes */}
        {/* <Button 
          className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:scale-95 touch-manipulation"
          onClick={handleScheduleClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button> */}
      </div>

      {/* Stats - Mobile responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.scheduled}</p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Live</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.live}</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => {
          const StatusIcon = getStatusIcon(session.status)
          const isLive = session.status === 'live'
          const isUpcoming = session.status === 'scheduled'
          const hasRecording = session.recordingUrl

          return (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      isLive ? 'bg-red-100 dark:bg-red-900/30' :
                      isUpcoming ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <StatusIcon className={`h-6 w-6 ${
                        isLive ? 'text-red-600 dark:text-red-400' :
                        isUpcoming ? 'text-blue-600 dark:text-blue-400' :
                        'text-green-600 dark:text-green-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {session.title || session.topic}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)} self-start sm:self-auto`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm sm:text-base">
                        {session.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {session.scheduledTime ? new Date(session.scheduledTime).toLocaleDateString() : 'TBD'}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {session.scheduledTime ? new Date(session.scheduledTime).toLocaleTimeString() : 'TBD'}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {session.participantsCount || 0} participants
                        </span>
                      </div>

                      {session.meetLink && (
                        <div className="flex items-center space-x-2 mt-3">
                          <Link className="h-4 w-4 text-blue-500" />
                          <a
                            href={session.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            Google Meet Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {(isLive || isUpcoming) && (
                    <Button
                      onClick={() => handleJoinSession(session)}
                      className={isLive 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {isLive ? 'Join Live' : 'Join'}
                    </Button>
                  )}
                  
                  {hasRecording && (
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Recording
                      </Button>
                    </a>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Calendar className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No sessions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by scheduling your first session'
            }
          </p>
          <button 
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation mx-auto"
            onClick={handleScheduleClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </button>
        </div>
      )}
    </div>
  )
}

export default TeacherSessions