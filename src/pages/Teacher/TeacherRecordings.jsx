// pages/teacher/TeacherRecordings.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { recordingService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import CreateRecordingModal from '../../components/Recording/CreateRecordingModal.jsx'
import {
  Video,
  Plus,
  Search,
  Filter,
  PlayCircle,
  Eye,
  Edit,
  Download,
  Share,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react'

const TeacherRecordings = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
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
      loadRecordings()
    }
  }, [teacherId])

  const loadRecordings = async () => {
    try {
      setLoading(true)
      const allRecordings = await recordingService.getAllRecordings()
      // Filter recordings for this teacher
      const teacherRecordings = allRecordings.filter(recording => 
        recording.teacherId === teacherId || recording.createdBy === teacherId
      )
      setRecordings(teacherRecordings)
    } catch (error) {
      console.error('Error loading recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishRecording = async (recordingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [recordingId]: true }))
      await recordingService.publishRecording(recordingId)
      await loadRecordings()
    } catch (error) {
      console.error('Error publishing recording:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, [recordingId]: false }))
    }
  }

  const handleUnpublishRecording = async (recordingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [recordingId]: true }))
      await recordingService.unpublishRecording(recordingId)
      await loadRecordings()
    } catch (error) {
      console.error('Error unpublishing recording:', error)
    } finally {
      setActionLoading(prev => ({ ...prev, [recordingId]: false }))
    }
  }

  const handleDownloadRecording = async (recording) => {
    if (recording.downloadUrl) {
      window.open(recording.downloadUrl, '_blank')
    }
  }

  const handleShareRecording = async (recording) => {
    if (navigator.share && recording.recordingUrl) {
      try {
        await navigator.share({
          title: recording.title,
          text: recording.description,
          url: recording.recordingUrl,
        })
      } catch (error) {
        console.error('Error sharing recording:', error)
      }
    } else if (recording.recordingUrl) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(recording.recordingUrl)
      alert('Recording link copied to clipboard!')
    }
  }

  // Mobile-optimized click handler
  const handleCreateClick = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('📱 Create Recording button clicked')
    setShowCreateModal(true)
  }

  const handleRecordingCreated = () => {
    setShowCreateModal(false)
    loadRecordings()
  }

  const handleCloseModal = () => {
    console.log('📱 Closing modal')
    setShowCreateModal(false)
  }

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = 
      recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = 
      statusFilter === 'all' ||
      recording.status === statusFilter ||
      (statusFilter === 'published' && recording.isPublished) ||
      (statusFilter === 'unpublished' && !recording.isPublished)

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'recording': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'recording': return PlayCircle
      case 'processing': return Clock
      case 'failed': return XCircle
      default: return Video
    }
  }

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const stats = {
    total: recordings.length,
    published: recordings.filter(r => r.isPublished).length,
    totalViews: recordings.reduce((sum, r) => sum + (r.views || 0), 0),
    inProgress: recordings.filter(r => r.status === 'recording' || r.status === 'processing').length
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
      {/* Create Recording Modal */}
      {showCreateModal && (
        <CreateRecordingModal
          onClose={handleCloseModal}
          onSuccess={handleRecordingCreated}
        />
      )}

      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Recordings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage and publish your recording sessions
          </p>
        </div>
        
        {/* Mobile-optimized button */}
        <button 
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation"
          onClick={handleCreateClick}
          onTouchStart={(e) => e.currentTarget.classList.add('active:scale-95')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Recording
        </button>
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
              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
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
                placeholder="Search recordings..."
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
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="completed">Completed</option>
              <option value="recording">Recording</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Recordings List - Same layout as TeacherSessions */}
      <div className="space-y-4">
        {filteredRecordings.map((recording) => {
          const StatusIcon = getStatusIcon(recording.status)
          const isPublished = recording.isPublished
          const isProcessing = recording.status === 'processing'
          const isCompleted = recording.status === 'completed'
          
          return (
            <div
              key={recording.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      isCompleted ? 'bg-green-100 dark:bg-green-900/30' :
                      isProcessing ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <StatusIcon className={`h-6 w-6 ${
                        isCompleted ? 'text-green-600 dark:text-green-400' :
                        isProcessing ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {recording.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
                            {recording.status}
                          </span>
                          {isPublished && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Published
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm sm:text-base">
                        {recording.description || 'No description provided'}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {recording.createdAt ? new Date(recording.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatDuration(recording.duration)}
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          {recording.views || 0} views
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {formatFileSize(recording.fileSize)}
                        </span>
                      </div>

                      {/* Tags */}
                      {recording.tags && recording.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {recording.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {recording.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                              +{recording.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {recording.recordingUrl && (
                    <a
                      href={recording.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none"
                    >
                      <Button className="w-full sm:w-auto">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Watch
                      </Button>
                    </a>
                  )}
                  
                  <div className="flex space-x-2">
                    {recording.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadRecording(recording)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareRecording(recording)}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    
                    {isPublished ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpublishRecording(recording.id)}
                        disabled={actionLoading[recording.id]}
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePublishRecording(recording.id)}
                        disabled={actionLoading[recording.id] || recording.status !== 'completed'}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredRecordings.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Video className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No recordings found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first recording'
            }
          </p>
          <button 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation mx-auto"
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Recording
          </button>
        </div>
      )}
    </div>
  )
}

export default TeacherRecordings