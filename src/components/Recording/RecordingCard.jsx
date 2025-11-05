import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Play, Calendar, Clock, Users, Eye } from 'lucide-react'
import { format, formatDuration, intervalToDuration } from 'date-fns'

const RecordingCard = ({ recording, isTeacher = false }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const handleCardClick = () => {
    navigate(`/recording/${recording.id}`)
  }

  const formatVideoDuration = (seconds) => {
    if (!seconds) return '--:--'
    
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
    const hours = duration.hours || 0
    const minutes = duration.minutes || 0
    const secs = duration.seconds || 0

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'recording': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        {recording.thumbnailUrl ? (
          <img 
            src={recording.thumbnailUrl} 
            alt={recording.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <Play size={48} className="text-white" />
          </div>
        )}
        
        {/* Duration badge */}
        {recording.metadata?.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {formatVideoDuration(recording.metadata.duration)}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
            {t(`recording.status.${recording.status}`)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {recording.title}
        </h3>
        
        {recording.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {recording.description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar size={16} className="mr-2" />
            <span>
              {format(new Date(recording.createdAt), 'PPP', { locale: i18n.language })}
            </span>
          </div>

          <div className="flex items-center">
            <Users size={16} className="mr-2" />
            <span>{recording.teacherName}</span>
          </div>

          {recording.metadata?.views !== undefined && (
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{t('recording.views', { count: recording.metadata.views })}</span>
            </div>
          )}

          {recording.metadata?.size > 0 && (
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>
                {(recording.metadata.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          )}
        </div>

        {/* Teacher actions */}
        {isTeacher && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2 rtl:space-x-reverse">
            {!recording.isPublished && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                {t('recording.draft')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordingCard