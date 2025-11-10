// pages/admin/SessionManagement.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { sessionService, recordingService, courseService, userService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import CreateSessionModal from '../../components/Session/CreateSessionModal.jsx'
import CreateRecordingModal from '../../components/Recording/CreateRecordingModal.jsx'
import {
  Video,
  Plus,
  Search,
  PlayCircle,
  Calendar,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  FileVideo,
  Upload,
  BarChart3,
  User,
  BookOpen
} from 'lucide-react'

const SessionManagement = () => {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState([])
  const [recordings, setRecordings] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false)
  const [showCreateRecordingModal, setShowCreateRecordingModal] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current user info
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
      setUserRole(user?.role || '')
      
      // Load data based on user role
      if (user?.role === 'admin') {
        const [sessionsData, recordingsData, coursesData, teachersData] = await Promise.all([
          sessionService.getAllSessions().catch(error => {
            console.error('Error loading sessions:', error)
            return []
          }),
          recordingService.getAllRecordings().catch(error => {
            console.error('Error loading recordings:', error)
            return []
          }),
          courseService.getAllCourses().catch(error => {
            console.error('Error loading courses:', error)
            return []
          }),
          userService.getUsersByRole('teacher').catch(error => {
            console.error('Error loading teachers:', error)
            return []
          })
        ])
        
        setSessions(sessionsData)
        setRecordings(recordingsData)
        setCourses(coursesData)
        setTeachers(teachersData)
        
      } else if (user?.role === 'teacher') {
        const [sessionsData, recordingsData, coursesData] = await Promise.all([
          sessionService.getSessionsByTeacher(user.uid).catch(error => {
            console.error('Error loading sessions:', error)
            return []
          }),
          recordingService.getRecordingsByTeacher(user.uid).catch(error => {
            console.error('Error loading recordings:', error)
            return []
          }),
          courseService.getCoursesByTeacher(user.uid).catch(error => {
            console.error('Error loading courses:', error)
            return []
          })
        ])
        
        setSessions(sessionsData)
        setRecordings(recordingsData)
        setCourses(coursesData)
        
      } else if (user?.role === 'student') {
        const [sessionsData, recordingsData, coursesData] = await Promise.all([
          sessionService.getPublishedSessions().catch(error => {
            console.error('Error loading sessions:', error)
            return []
          }),
          recordingService.getPublishedRecordings().catch(error => {
            console.error('Error loading recordings:', error)
            return []
          }),
          courseService.getAllCourses().catch(error => {
            console.error('Error loading courses:', error)
            return []
          })
        ])
        
        setSessions(sessionsData)
        setRecordings(recordingsData)
        setCourses(coursesData)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionCreated = () => {
    setShowCreateSessionModal(false)
    setSelectedItem(null)
    loadData()
  }

  const handleRecordingCreated = () => {
    setShowCreateRecordingModal(false)
    setSelectedItem(null)
    loadData()
  }

  const handleEditSession = (session) => {
    setSelectedItem(session)
    setShowCreateSessionModal(true)
  }

  const handleEditRecording = (recording) => {
    setSelectedItem(recording)
    setShowCreateRecordingModal(true)
  }

  const handleJoinSession = (session) => {
    if (session.meetLink) {
      window.open(session.meetLink, '_blank')
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
          isPublished: session.isPublished || false
        })

        await loadData()
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
        await loadData()
      } catch (error) {
        console.error('Error deleting session:', error)
        alert('Failed to delete session: ' + error.message)
      } finally {
        setActionLoading(prev => ({ ...prev, [sessionId]: false }))
      }
    }
  }

  const handleDeleteRecording = async (recordingId) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        setActionLoading(prev => ({ ...prev, [recordingId]: true }))
        await recordingService.deleteRecording(recordingId)
        await loadData()
      } catch (error) {
        console.error('Error deleting recording:', error)
        alert('Failed to delete recording: ' + error.message)
      } finally {
        setActionLoading(prev => ({ ...prev, [recordingId]: false }))
      }
    }
  }

  const handleStartSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }))
      await sessionService.updateSessionStatus(sessionId, 'live')
      await loadData()
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
      await loadData()
    } catch (error) {
      console.error('Error ending session:', error)
      alert('Failed to end session: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  const handlePublishSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }))
      await sessionService.updateSession(sessionId, { isPublished: true })
      await loadData()
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
      await loadData()
    } catch (error) {
      console.error('Error unpublishing session:', error)
      alert('Failed to unpublish session: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  const handlePublishRecording = async (recordingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [recordingId]: true }))
      await recordingService.updateRecording(recordingId, { isPublished: true })
      await loadData()
    } catch (error) {
      console.error('Error publishing recording:', error)
      alert('Failed to publish recording: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [recordingId]: false }))
    }
  }

  const handleUnpublishRecording = async (recordingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [recordingId]: true }))
      await recordingService.updateRecording(recordingId, { isPublished: false })
      await loadData()
    } catch (error) {
      console.error('Error unpublishing recording:', error)
      alert('Failed to unpublish recording: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [recordingId]: false }))
    }
  }

  const getAvailableTeachers = () => {
    return teachers
  }

  const getAvailableCourses = () => {
    return courses
  }

  // Filter data based on user role and search criteria
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

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = 
      recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      recording.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getDisplayData = () => {
    if (typeFilter === 'sessions') return filteredSessions
    if (typeFilter === 'recordings') return filteredRecordings
    return [...filteredSessions, ...filteredRecordings]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'live': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'recorded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return Calendar
      case 'live': return PlayCircle
      case 'completed': return CheckCircle
      case 'recorded': return FileVideo
      case 'available': return CheckCircle
      default: return Clock
    }
  }

  const getItemType = (item) => {
    return item.meetLink ? 'session' : 'recording'
  }

  // Check if user can modify the item
  const canModifyItem = (item) => {
    if (userRole === 'admin') return true
    if (userRole === 'teacher') {
      return item.instructorId === currentUser?.uid
    }
    return false
  }

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId)
    return course ? course.name : 'Unknown Course'
  }

  const getTeacherName = (teacherId) => {
    if (!teachers || userRole !== 'admin') return 'Unknown Teacher'
    const teacher = teachers.find(t => t.id === teacherId)
    return teacher ? teacher.displayName : 'Unknown Teacher'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const displayData = getDisplayData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {userRole === 'admin' && 'Session & Recording Management'}
            {userRole === 'teacher' && 'My Sessions & Recordings'}
            {userRole === 'student' && 'Available Sessions & Recordings'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {userRole === 'admin' && 'Manage all sessions and recordings across the platform'}
            {userRole === 'teacher' && 'Manage your teaching sessions and recordings'}
            {userRole === 'student' && 'View available sessions and recordings'}
          </p>
        </div>
        
        {/* Action Buttons based on role */}
        <div className="flex space-x-3">
          {(userRole === 'admin' || userRole === 'teacher') && (
            <>
              {userRole === 'admin' && (
                <Button 
                  onClick={() => {
                    setSelectedItem(null)
                    setShowCreateRecordingModal(true)
                  }}
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Recording
                </Button>
              )}
              <Button 
                onClick={() => {
                  setSelectedItem(null)
                  setShowCreateSessionModal(true)
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {userRole === 'student' ? 'Available Sessions' : 'Total Sessions'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {userRole === 'student' ? 'Available Recordings' : 'Total Recordings'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{recordings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessions.filter(s => s.status === 'live').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  userRole === 'student' 
                    ? "Search available sessions and recordings..." 
                    : "Search sessions and recordings..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="sessions">Sessions Only</option>
              <option value="recordings">Recordings Only</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="recorded">Recorded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayData.map((item) => {
          const itemType = getItemType(item)
          const isSession = itemType === 'session'
          const isRecording = itemType === 'recording'
          const StatusIcon = getStatusIcon(item.status)
          const isLive = item.status === 'live'
          const isUpcoming = item.status === 'scheduled'
          const hasRecording = item.recordingUrl || item.isRecorded
          const isPublished = item.isPublished
          const canModify = canModifyItem(item)

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {isSession && (
                        <Calendar className="h-4 w-4 text-blue-500" />
                      )}
                      {isRecording && (
                        <Video className="h-4 w-4 text-purple-500" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {isSession ? 'Session' : 'Recording'} • {item.status}
                      </span>
                      {!isPublished && userRole !== 'student' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">
                      {item.title || item.topic}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {item.instructorName || 'Unknown Instructor'}
                  </span>
                  {item.scheduledTime && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(item.scheduledTime).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-6">
                <div className="space-y-3">
                  {item.scheduledTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(item.scheduledTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {item.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.duration} min
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Course</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getCourseName(item.courseId)}
                    </span>
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Teacher</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getTeacherName(item.instructorId)}
                      </span>
                    </div>
                  )}

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
                  {/* Student/Viewer Actions */}
                  {(userRole === 'student' || !canModify) && (
                    <>
                      {isSession && isLive && (
                        <Button
                          onClick={() => handleJoinSession(item)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Join Live
                        </Button>
                      )}
                      
                      {isSession && isUpcoming && (
                        <Button
                          onClick={() => handleJoinSession(item)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Join Session
                        </Button>
                      )}

                      {hasRecording && (
                        <a
                          href={item.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            {isSession ? 'View Recording' : 'Watch Recording'}
                          </Button>
                        </a>
                      )}
                    </>
                  )}

                  {/* Admin/Teacher Management Actions */}
                  {canModify && (
                    <>
                      {isSession && isLive && (
                        <Button
                          onClick={() => handleJoinSession(item)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Join Live
                        </Button>
                      )}
                      
                      {isSession && isUpcoming && (
                        <Button
                          onClick={() => handleJoinSession(item)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}

                      {isSession && !hasRecording && item.status === 'completed' && (
                        <Button
                          onClick={() => handleAddRecording(item.id)}
                          disabled={actionLoading[item.id]}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          {actionLoading[item.id] ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <Video className="h-4 w-4 mr-2" />
                          )}
                          Add Recording
                        </Button>
                      )}

                      {hasRecording && (
                        <a
                          href={item.recordingUrl}
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
                      {isSession && (
                        <>
                          {isUpcoming && (
                            <Button
                              onClick={() => handleStartSession(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              Start
                            </Button>
                          )}
                          {isLive && (
                            <Button
                              onClick={() => handleEndSession(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              End
                            </Button>
                          )}
                          {!isPublished ? (
                            <Button
                              onClick={() => handlePublishSession(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              Publish
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleUnpublishSession(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              Unpublish
                            </Button>
                          )}
                        </>
                      )}

                      {/* Recording Controls */}
                      {isRecording && (
                        <>
                          {!isPublished ? (
                            <Button
                              onClick={() => handlePublishRecording(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              Publish
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleUnpublishRecording(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              Unpublish
                            </Button>
                          )}
                        </>
                      )}

                      {/* Edit Button */}
                      <Button
                        onClick={() => isSession ? handleEditSession(item) : handleEditRecording(item)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        onClick={() => isSession ? handleDeleteSession(item.id) : handleDeleteRecording(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {displayData.length === 0 && (
        <div className="text-center py-12">
          <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No sessions or recordings found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : userRole === 'student' 
                ? 'No published sessions or recordings available yet'
                : 'Get started by scheduling your first session or adding a recording'
            }
          </p>
          {(userRole === 'admin' || userRole === 'teacher') && (
            <div className="flex justify-center space-x-3">
              {userRole === 'admin' && (
                <Button 
                  onClick={() => setShowCreateRecordingModal(true)}
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Recording
                </Button>
              )}
              <Button 
                onClick={() => setShowCreateSessionModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <CreateSessionModal
          onClose={() => setShowCreateSessionModal(false)}
          onSuccess={handleSessionCreated}
          session={selectedItem}
          courses={getAvailableCourses()}
          teachers={getAvailableTeachers()}
          currentTeacher={currentUser}
          isAdmin={userRole === 'admin'}
        />
      )}

      {/* Create Recording Modal */}
      {showCreateRecordingModal && (
        <CreateRecordingModal
          onClose={() => setShowCreateRecordingModal(false)}
          onSuccess={handleRecordingCreated}
          recording={selectedItem}
          courses={getAvailableCourses()}
          teachers={getAvailableTeachers()}
          currentTeacher={currentUser}
          isAdmin={userRole === 'admin'}
        />
      )}
    </div>
  )
}

export default SessionManagement