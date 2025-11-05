// pages/admin/SessionManagement.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { sessionService, recordingService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import CreateSessionModal from '../../components/Session/CreateSessionModal.jsx'
import {
  Video,
  Plus,
  Search,
  Filter,
  PlayCircle,
  Calendar,
  Clock,
  Users,
  Eye,
  Edit,
  MoreVertical,
  Download,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

const SessionManagement = () => {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const sessionsData = await sessionService.getAllSessions()
      setSessions(sessionsData)
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

  const handleAddRecording = async (sessionId) => {
    const recordingUrl = prompt('Enter Google Drive recording URL:')
    if (recordingUrl) {
      try {
        setActionLoading(prev => ({ ...prev, [sessionId]: true }))
        await recordingService.updateWithDriveRecording(sessionId, {
          recordingUrl,
          duration: 60,
          fileSize: 250
        })
        await loadSessions()
      } catch (error) {
        console.error('Error adding recording:', error)
        alert('Failed to add recording')
      } finally {
        setActionLoading(prev => ({ ...prev, [sessionId]: false }))
      }
    }
  }

  const handleSessionCreated = () => {
    setShowCreateModal(false)
    loadSessions()
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Google Meet sessions and recordings
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
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

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSessions.map((session) => {
          const StatusIcon = getStatusIcon(session.status)
          const isLive = session.status === 'live'
          const isUpcoming = session.status === 'scheduled'
          const hasRecording = session.recordingUrl

          return (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Session Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">
                      {session.title || session.topic}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {session.description}
                    </p>
                  </div>
                  <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {session.instructorName || 'Unknown'}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {session.scheduledTime ? new Date(session.scheduledTime).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>

              {/* Session Details */}
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.scheduledTime ? new Date(session.scheduledTime).toLocaleTimeString() : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.duration ? `${session.duration} min` : 'Not set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Recording</span>
                    <span className={`text-sm font-medium ${
                      hasRecording 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {hasRecording ? 'Available' : 'Not available'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-6">
                  {isLive && (
                    <Button
                      onClick={() => handleJoinSession(session)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Join Live
                    </Button>
                  )}
                  
                  {isUpcoming && (
                    <Button
                      onClick={() => handleJoinSession(session)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  )}

                  {!hasRecording && session.status === 'completed' && (
                    <Button
                      onClick={() => handleAddRecording(session.id)}
                      disabled={actionLoading[session.id]}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {actionLoading[session.id] ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Video className="h-4 w-4 mr-2" />
                      )}
                      Add Recording
                    </Button>
                  )}

                  {hasRecording && (
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Recording
                      </Button>
                    </a>
                  )}

                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No sessions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by scheduling your first session'
            }
          </p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSessionCreated}
        />
      )}
    </div>
  )
}

export default SessionManagement