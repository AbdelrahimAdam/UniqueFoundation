// components/Session/SessionList.jsx
import React, { useState } from 'react'
import { sessionService, recordingService } from '../../services'
import Button from '../UI/Button.jsx'
import LoadingSpinner from '../UI/LoadingSpinner.jsx'
import {
  Calendar,
  PlayCircle,
  Users,
  Edit,
  Trash2,
  Video,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

const SessionList = ({ sessions, searchTerm, statusFilter, onEdit, onRefresh, courses }) => {
  const [actionLoading, setActionLoading] = useState({})

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

  const handleJoinSession = (session) => {
    if (session.meetLink) {
      window.open(session.meetLink, '_blank')
    }
  }

  const handleStartSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }))
      await sessionService.updateSessionStatus(sessionId, 'live')
      onRefresh()
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start session: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  const handleEndSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }))
      await sessionService.updateSessionStatus(sessionId, 'completed')
      onRefresh()
    } catch (error) {
      console.error('Error ending session:', error)
      alert('Failed to end session: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  const handleAddRecording = async (sessionId) => {
    const recordingUrl = prompt('Enter Google Drive recording URL:')
    if (recordingUrl) {
      try {
        setActionLoading(prev => ({ ...prev, [sessionId]: true }))
        
        const session = sessions.find(s => s.id === sessionId)
        if (!session) {
          throw new Error('Session not found')
        }

        // Update session in sessions collection
        await sessionService.markAsRecorded(sessionId, recordingUrl)
        
        // Also create a recording entry
        await recordingService.createRecording({
          title: `${session.title} - Recording`,
          description: `Recording of ${session.title}`,
          recordingUrl: recordingUrl,
          duration: session.duration || 60,
          fileSize: 250,
          quality: '1080p',
          courseId: session.courseId,
          instructorId: session.instructorId,
          instructorEmail: session.instructorEmail,
          instructorName: session.instructorName,
          visibility: session.visibility || 'public',
          category: session.category || 'general',
          status: 'recorded',
          recordingStatus: 'available',
          isPublished: true
        })

        onRefresh()
      } catch (error) {
        console.error('Error adding recording:', error)
        alert('Failed to add recording: ' + error.message)
      } finally {
        setActionLoading(prev => ({ ...prev, [sessionId]: false }))
      }
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        setActionLoading(prev => ({ ...prev, [sessionId]: true }))
        await sessionService.deleteSession(sessionId)
        onRefresh()
      } catch (error) {
        console.error('Error deleting session:', error)
        alert('Failed to delete session: ' + error.message)
      } finally {
        setActionLoading(prev => ({ ...prev, [sessionId]: false }))
      }
    }
  }

  const handlePublishSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }))
      await sessionService.updateSession(sessionId, { isPublished: true })
      onRefresh()
    } catch (error) {
      console.error('Error publishing session:', error)
      alert('Failed to publish session: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  const handleUnpublishSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }))
      await sessionService.updateSession(sessionId, { isPublished: false })
      onRefresh()
    } catch (error) {
      console.error('Error unpublishing session:', error)
      alert('Failed to unpublish session: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId)
    return course ? course.name : 'Unknown Course'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sessions</h2>
      
      {filteredSessions.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'No sessions have been scheduled yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const StatusIcon = getStatusIcon(session.status)
            const isLive = session.status === 'live'
            const isUpcoming = session.status === 'scheduled'
            const hasRecording = session.recordingUrl || session.isRecorded
            const isPublished = session.isPublished

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          Session • {session.status}
                        </span>
                        {!isPublished && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Draft
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">
                        {session.title || session.topic}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                        {session.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {session.instructorName || 'Unknown'}
                    </span>
                    {session.scheduledTime && (
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(session.scheduledTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    {session.scheduledTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(session.scheduledTime).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {session.duration && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.duration} min
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Course</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getCourseName(session.courseId)}
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
                  <div className="flex flex-wrap gap-2 mt-6">
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

                    {/* Session Controls */}
                    {isUpcoming && (
                      <Button
                        onClick={() => handleStartSession(session.id)}
                        variant="outline"
                        size="sm"
                      >
                        Start
                      </Button>
                    )}
                    {isLive && (
                      <Button
                        onClick={() => handleEndSession(session.id)}
                        variant="outline"
                        size="sm"
                      >
                        End
                      </Button>
                    )}
                    {!isPublished ? (
                      <Button
                        onClick={() => handlePublishSession(session.id)}
                        variant="outline"
                        size="sm"
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUnpublishSession(session.id)}
                        variant="outline"
                        size="sm"
                      >
                        Unpublish
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      onClick={() => onEdit(session)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      onClick={() => handleDeleteSession(session.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SessionList