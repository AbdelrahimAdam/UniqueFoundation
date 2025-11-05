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
  Users
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

  const teacherId = user?.uid

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

  const handleRecordingCreated = () => {
    setShowCreateModal(false)
    loadRecordings()
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
      case 'completed': return 'from-green-500 to-emerald-500'
      case 'recording': return 'from-blue-500 to-cyan-500'
      case 'processing': return 'from-yellow-500 to-orange-500'
      case 'failed': return 'from-red-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Recordings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and publish your recording sessions
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Recording
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{recordings.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recordings.filter(r => r.isPublished).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recordings.reduce((sum, r) => sum + (r.views || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recordings.filter(r => r.status === 'recording' || r.status === 'processing').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecordings.map((recording) => {
          const StatusIcon = getStatusIcon(recording.status)
          
          return (
            <div
              key={recording.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Recording Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">
                      {recording.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {recording.description || 'No description provided'}
                    </p>
                  </div>
                  <div className={`ml-3 p-2 rounded-lg bg-gradient-to-br ${getStatusColor(recording.status)}`}>
                    <StatusIcon className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {recording.views || 0} views
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(recording.duration)}
                  </span>
                  {recording.isPublished && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                      Published
                    </span>
                  )}
                </div>
              </div>

              {/* Recording Details */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">File Size</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatFileSize(recording.fileSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(recording.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`text-sm font-medium capitalize ${
                      recording.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      recording.status === 'recording' ? 'text-blue-600 dark:text-blue-400' :
                      recording.status === 'processing' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {recording.status}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {recording.recordingUrl && (
                    <a
                      href={recording.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Watch
                      </Button>
                    </a>
                  )}
                  
                  {recording.isPublished ? (
                    <Button
                      variant="outline"
                      onClick={() => handleUnpublishRecording(recording.id)}
                      disabled={actionLoading[recording.id]}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePublishRecording(recording.id)}
                      disabled={actionLoading[recording.id]}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
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

      {filteredRecordings.length === 0 && (
        <div className="text-center py-12">
          <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No recordings found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first recording'
            }
          </p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Recording
          </Button>
        </div>
      )}

      {/* Create Recording Modal */}
      {showCreateModal && (
        <CreateRecordingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleRecordingCreated}
        />
      )}
    </div>
  )
}

export default TeacherRecordings