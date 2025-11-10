// components/Recording/RecordingList.jsx
import React, { useState } from 'react'
import { recordingService } from '../../services'
import Button from '../UI/Button.jsx'
import LoadingSpinner from '../UI/LoadingSpinner.jsx'
import {
  Video,
  Eye,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileVideo
} from 'lucide-react'

const RecordingList = ({ recordings, searchTerm, statusFilter, onEdit, onRefresh, courses }) => {
  const [actionLoading, setActionLoading] = useState({})

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'recorded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'recorded': return FileVideo
      case 'available': return CheckCircle
      case 'processing': return Clock
      default: return FileVideo
    }
  }

  const handleDeleteRecording = async (recordingId) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        setActionLoading(prev => ({ ...prev, [recordingId]: true }))
        await recordingService.deleteRecording(recordingId)
        onRefresh()
      } catch (error) {
        console.error('Error deleting recording:', error)
        alert('Failed to delete recording: ' + error.message)
      } finally {
        setActionLoading(prev => ({ ...prev, [recordingId]: false }))
      }
    }
  }

  const handlePublishRecording = async (recordingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [recordingId]: true }))
      await recordingService.updateRecording(recordingId, { isPublished: true })
      onRefresh()
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
      onRefresh()
    } catch (error) {
      console.error('Error unpublishing recording:', error)
      alert('Failed to unpublish recording: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [recordingId]: false }))
    }
  }

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId)
    return course ? course.name : 'Unknown Course'
  }

  const handleDownloadRecording = (recording) => {
    if (recording.recordingUrl) {
      window.open(recording.recordingUrl, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recordings</h2>
      
      {filteredRecordings.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recordings found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'No recordings have been added yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecordings.map((recording) => {
            const StatusIcon = getStatusIcon(recording.status)
            const isPublished = recording.isPublished
            const hasRecording = recording.recordingUrl

            return (
              <div
                key={recording.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Video className="h-4 w-4 text-purple-500" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
                          Recording • {recording.status}
                        </span>
                        {!isPublished && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Draft
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">
                        {recording.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                        {recording.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      {recording.instructorName || 'Unknown Instructor'}
                    </span>
                    {recording.createdAt && (
                      <span className="flex items-center">
                        {new Date(recording.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    {recording.duration && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {recording.duration} min
                        </span>
                      </div>
                    )}

                    {recording.fileSize && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">File Size</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {recording.fileSize} MB
                        </span>
                      </div>
                    )}

                    {recording.quality && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Quality</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {recording.quality}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Course</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getCourseName(recording.courseId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Availability</span>
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
                    {hasRecording && (
                      <>
                        <a
                          href={recording.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </a>
                        <Button
                          onClick={() => handleDownloadRecording(recording)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}

                    {/* Publication Controls */}
                    {!isPublished ? (
                      <Button
                        onClick={() => handlePublishRecording(recording.id)}
                        variant="outline"
                        size="sm"
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUnpublishRecording(recording.id)}
                        variant="outline"
                        size="sm"
                      >
                        Unpublish
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      onClick={() => onEdit(recording)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      onClick={() => handleDeleteRecording(recording.id)}
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

export default RecordingList