import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { 
  X, 
  Upload, 
  Video, 
  Calendar, 
  Clock, 
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
  ExternalLink,
  Download,
  Link,
  Globe,
  User,
  BookOpen
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import Button from '../UI/Button.jsx'
import Select from '../UI/Select.jsx'
import { recordingService } from '../../services/recordingService.jsx'

// ✅ FIX: Move CustomInput and CustomTextArea OUTSIDE the component
const CustomInput = React.forwardRef(({ 
  label, 
  type = 'text', 
  placeholder, 
  error, 
  disabled, 
  icon: Icon, 
  suffix,
  required,
  autoFocus = false,
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          className={`w-full px-4 py-3 border ${
            error 
              ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
          } rounded-2xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${Icon ? 'pl-10' : ''} ${suffix ? 'pr-16' : ''}`}
          placeholder={placeholder}
          disabled={disabled}
          ref={ref}
          autoFocus={autoFocus}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{suffix}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
})

// ✅ FIX: Move CustomTextArea outside too
const CustomTextArea = React.forwardRef(({ 
  label, 
  placeholder, 
  error, 
  disabled, 
  rows = 3,
  required,
  autoFocus = false,
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3 border ${
          error 
            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
        } rounded-2xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        placeholder={placeholder}
        disabled={disabled}
        ref={ref}
        autoFocus={autoFocus}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
})

const CreateRecordingModal = ({ 
  onClose, 
  onSuccess,
  sessionId = null,
  initialData = {} 
}) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedSession, setSelectedSession] = useState(null)
  const [driveLinkPreview, setDriveLinkPreview] = useState('')
  const [workflowStep, setWorkflowStep] = useState(0)

  // Refs for focus management
  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const recordingUrlRef = useRef(null)

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    reset,
    trigger
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      sessionId: sessionId || initialData.sessionId || '',
      meetLink: initialData.meetLink || '',
      recordingUrl: initialData.recordingUrl || '',
      duration: initialData.duration || 0,
      fileSize: initialData.fileSize || 0,
      quality: initialData.quality || '720p',
      visibility: initialData.visibility || 'private',
      category: initialData.category || 'english',
      tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''), // ✅ FIX: Convert array to string
      instructorEmail: user?.email || '',
      instructorName: user?.displayName || '',
      ...initialData
    }
  })

  // Watch form values for real-time validation
  const watchedValues = watch()

  // ✅ FIX: Stable callback functions
  const handleSessionChange = useCallback((sessionId) => {
    console.log('Session selected:', sessionId)
    const session = sessions.find(s => s.id === sessionId)
    setSelectedSession(session)
    
    // Auto-fill form with session data
    if (session) {
      setValue('title', session.title || `Recording - ${session.scheduledTime?.toLocaleDateString()}`, { shouldValidate: true })
      setValue('meetLink', session.meetLink, { shouldValidate: true })
      setValue('instructorEmail', session.instructorEmail, { shouldValidate: true })
      setValue('sessionId', sessionId, { shouldValidate: true })
      setValue('category', session.category || 'english', { shouldValidate: true })
      
      // Focus on title field after session selection
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus()
        }
      }, 100)
    }
  }, [sessions, setValue])

  const handleDurationChange = useCallback((duration) => {
    const minutes = parseInt(duration) || 0
    setValue('duration', minutes, { shouldValidate: true })
    
    // Estimate file size based on duration and quality
    if (minutes > 0) {
      const qualityMultiplier = {
        '360p': 50,
        '480p': 100,
        '720p': 250,
        '1080p': 500,
        '4k': 1000
      }[watchedValues.quality] || 250
      
      const estimatedSizeMB = Math.round((minutes / 60) * qualityMultiplier)
      setValue('fileSize', estimatedSizeMB, { shouldValidate: true })
    }
  }, [setValue, watchedValues.quality])

  const handleQualityChange = useCallback((quality) => {
    setValue('quality', quality, { shouldValidate: true })
    
    // Recalculate file size if duration is set
    if (watchedValues.duration) {
      handleDurationChange(watchedValues.duration)
    }
  }, [setValue, watchedValues.duration, handleDurationChange])

  const handleCategoryChange = useCallback((value) => {
    setValue('category', value, { shouldValidate: true })
  }, [setValue])

  const handleVisibilityChange = useCallback((value) => {
    setValue('visibility', value, { shouldValidate: true })
  }, [setValue])

  // Load available Google Meet sessions for selection
  useEffect(() => {
    loadMeetSessions()
  }, [])

  // Update selected session when sessionId changes
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId)
      setSelectedSession(session)
      if (session) {
        setValue('title', session.title || session.topic, { shouldValidate: true })
        setValue('meetLink', session.meetLink, { shouldValidate: true })
        setValue('instructorEmail', session.instructorEmail, { shouldValidate: true })
        setValue('category', session.category || 'english', { shouldValidate: true })
      }
    }
  }, [sessionId, sessions, setValue])

  // Update drive link preview when URL changes
  useEffect(() => {
    if (watchedValues.recordingUrl) {
      validateAndPreviewDriveLink(watchedValues.recordingUrl)
    } else {
      setDriveLinkPreview('')
    }
  }, [watchedValues.recordingUrl])

  // Auto-calculate duration and file size when Google Drive link is added
  useEffect(() => {
    if (driveLinkPreview.isValid) {
      // Set default duration to 60 minutes if not set
      if (!watchedValues.duration || watchedValues.duration === 0) {
        setValue('duration', 60, { shouldValidate: true })
      }
      
      // Auto-calculate file size based on duration and quality
      if (watchedValues.duration > 0) {
        handleDurationChange(watchedValues.duration)
      }
    }
  }, [driveLinkPreview.isValid, watchedValues.duration, watchedValues.quality, setValue, handleDurationChange])

  // Load Google Meet sessions that need recording links
  const loadMeetSessions = async () => {
    try {
      setLoadingSessions(true)
      setError('')
      
      // Use the recording service to get sessions
      const sessionsData = await recordingService.getSessionsForRecordingManagement(user.uid)
      
      console.log('Loaded Google Meet sessions:', sessionsData)
      setSessions(sessionsData)
      
      if (sessionsData.length === 0 && !sessionId) {
        setError('No Google Meet sessions found. You can still create a recording without a session.')
      }
    } catch (error) {
      console.error('Error loading Google Meet sessions:', error)
      setError('Failed to load Google Meet sessions. You can still create a recording manually.')
    } finally {
      setLoadingSessions(false)
    }
  }

  // Validate Google Drive link and create preview
  const validateAndPreviewDriveLink = (url) => {
    try {
      const isValid = recordingService.recordingWorkflow.validateDriveUrl(url)
      
      if (isValid) {
        const fileId = recordingService.extractDriveFileId(url)
        const previewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        const viewUrl = `https://drive.google.com/file/d/${fileId}/view`
        
        setDriveLinkPreview({
          isValid: true,
          fileId,
          previewUrl,
          downloadUrl,
          viewUrl,
          type: 'google_drive'
        })
      } else {
        setDriveLinkPreview({
          isValid: false,
          error: 'Please enter a valid Google Drive link (should start with https://drive.google.com/file/d/)'
        })
      }
    } catch (error) {
      setDriveLinkPreview({
        isValid: false,
        error: 'Invalid URL format'
      })
    }
  }

  // ✅ FIX: Properly handle tags conversion and sessionId
  const processTags = (tags) => {
    if (!tags) return []
    if (Array.isArray(tags)) return tags
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }
    return []
  }

  // Create recording using the recording service
  const createRecording = async (recordingData) => {
    try {
      // ✅ FIX: Process tags properly and handle empty sessionId
      const processedTags = processTags(recordingData.tags)
      
      // Prepare recording data for the service
      const recordingPayload = {
        title: recordingData.title,
        description: recordingData.description,
        meetLink: recordingData.meetLink || '', // ✅ FIX: Ensure it's never undefined
        recordingUrl: recordingData.recordingUrl,
        duration: parseInt(recordingData.duration) || 0,
        fileSize: parseInt(recordingData.fileSize) || 0,
        quality: recordingData.quality,
        visibility: recordingData.visibility,
        category: recordingData.category,
        tags: processedTags, // ✅ FIX: Use processed tags
        instructorId: user.uid,
        instructorEmail: user.email,
        instructorName: user.displayName || user.email,
        status: 'recorded',
        recordingStatus: 'available',
        isPublished: recordingData.visibility === 'public',
        recordingAvailableFrom: new Date(),
        courseId: 'general'
      }

      // ✅ FIX: Only include sessionId if it exists and is not empty
      if (recordingData.sessionId) {
        recordingPayload.sessionId = recordingData.sessionId
      }

      console.log('Creating recording with payload:', recordingPayload)

      // Always create new recording using the service
      return await recordingService.createRecording(recordingPayload)
    } catch (error) {
      console.error('Error creating recording:', error)
      throw new Error(error.message || 'Failed to create recording')
    }
  }

  const createRecordingMutation = useMutation(
    (recordingData) => createRecording(recordingData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['recordings'])
        queryClient.invalidateQueries(['sessions'])
        queryClient.invalidateQueries(['teacherRecordings'])
        queryClient.invalidateQueries(['studentRecordings'])
        queryClient.invalidateQueries(['instructorMeetRecordings'])
        
        setSuccess('Recording saved successfully! Students can now access the Google Drive link.')
        setIsSubmitting(false)
        
        setTimeout(() => {
          onSuccess?.(data)
          onClose()
        }, 2000)
      },
      onError: (error) => {
        console.error('Failed to create recording:', error)
        setError(error.message || 'Failed to save recording. Please try again.')
        setIsSubmitting(false)
        setUploadProgress(0)
      }
    }
  )

  const simulateUploadProgress = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    return interval
  }

  const onSubmit = async (data) => {
    try {
      setError('')
      setSuccess('')
      setIsSubmitting(true)
      
      // Simulate upload progress
      const progressInterval = simulateUploadProgress()
      
      // Validate Google Drive URL
      if (!data.recordingUrl) {
        throw new Error('Google Drive link is required')
      }

      if (!driveLinkPreview.isValid) {
        throw new Error('Please enter a valid Google Drive link')
      }

      // Validate required fields
      if (!data.title.trim()) {
        throw new Error('Recording title is required')
      }

      // ✅ FIX: Make meetLink optional but ensure it's not undefined
      if (!data.meetLink) {
        data.meetLink = '' // Set to empty string instead of undefined
      }

      // Create recording using the service
      const result = await createRecordingMutation.mutateAsync(data)
      
      // Complete upload progress
      clearInterval(progressInterval)
      setUploadProgress(100)

      return result
    } catch (error) {
      console.error('Error creating recording:', error)
      setError(error.message || 'Failed to save recording. Please try again.')
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0:00'
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:00`
    }
    return `${mins}:00`
  }

  const getSessionOptions = () => {
    return sessions.map(session => ({
      value: session.id,
      label: `${session.title} - ${session.scheduledTime?.toLocaleDateString()}`,
      disabled: session.recordingStatus === 'available'
    }))
  }

  // ✅ FIX: Memoized options
  const categoryOptions = useMemo(() => [
    { value: 'english', label: 'English' },
    { value: 'english_literature', label: 'English Literature' },
    { value: 'english_language', label: 'English Language' },
    { value: 'communications', label: 'Communications' },
    { value: 'general', label: 'General Session' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'algebra', label: 'Algebra' },
    { value: 'geometry', label: 'Geometry' },
    { value: 'calculus', label: 'Calculus' },
    { value: 'statistics', label: 'Statistics' },
    { value: 'trigonometry', label: 'Trigonometry' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'environmental_science', label: 'Environmental Science' },
    { value: 'earth_science', label: 'Earth Science' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'civics', label: 'Civics' },
    { value: 'economics', label: 'Economics' },
    { value: 'political_science', label: 'Political Science' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'mandarin', label: 'Mandarin Chinese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'drama', label: 'Drama' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'computer_science', label: 'Computer Science' },
    { value: 'programming', label: 'Programming' },
    { value: 'web_development', label: 'Web Development' },
    { value: 'data_science', label: 'Data Science' },
    { value: 'business_studies', label: 'Business Studies' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'physical_education', label: 'Physical Education' },
    { value: 'health_education', label: 'Health Education' },
    { value: 'career_guidance', label: 'Career Guidance' }
  ], [])

  const qualityOptions = useMemo(() => [
    { value: '360p', label: '360p - Mobile (Low Quality)' },
    { value: '480p', label: '480p - Standard Definition' },
    { value: '720p', label: '720p - High Definition' },
    { value: '1080p', label: '1080p - Full HD' },
    { value: '4k', label: '4K - Ultra HD' }
  ], [])

  const visibilityOptions = useMemo(() => [
    { value: 'private', label: 'Private - Only me' },
    { value: 'unlisted', label: 'Unlisted - Anyone with link' },
    { value: 'public', label: 'Public - Visible to all students' }
  ], [])

  // ✅ FIX: Memoized WorkflowSteps component
  const WorkflowSteps = useMemo(() => () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
        Google Meet Recording Workflow
      </h4>
      <div className="space-y-2">
        {recordingService.recordingWorkflow.getRecordingSteps().map((step, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              index <= workflowStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
            }`}>
              {index + 1}
            </div>
            <p className={`text-sm ${
              index <= workflowStep 
                ? 'text-blue-800 dark:text-blue-200' 
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  ), [workflowStep])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Recording
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Link your Google Drive recording (session is optional)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        {isSubmitting && (
          <div className="px-6 pt-4">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
              {uploadProgress < 100 ? 'Saving recording to database...' : 'Recording saved successfully!'}
            </p>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3 animate-slide-down">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start space-x-3 animate-slide-down">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-300 text-sm flex-1">{success}</p>
          </div>
        )}

        {/* Workflow Steps */}
        <div className="px-6 pt-4">
          <WorkflowSteps />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Session Selection - Now Optional */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Link to Google Meet Session (Optional)
            </label>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading Google Meet sessions...</span>
              </div>
            ) : sessions.length === 0 && !sessionId ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  No Google Meet sessions found. You can create a standalone recording without linking to a session.
                </p>
              </div>
            ) : (
              <Select
                options={getSessionOptions()}
                value={watchedValues.sessionId}
                onChange={handleSessionChange}
                placeholder="Select a Google Meet session (optional)..."
                disabled={isSubmitting || !!sessionId}
                error={errors.sessionId?.message}
              />
            )}
            
            {selectedSession && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedSession.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{selectedSession.scheduledTime?.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{selectedSession.scheduledTime?.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{selectedSession.instructorName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span className="capitalize">{selectedSession.status}</span>
                      </div>
                    </div>
                    {selectedSession.meetLink && (
                      <div className="mt-2">
                        <a
                          href={selectedSession.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Link size={14} />
                          <span>Join Google Meet</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div className="lg:col-span-2">
              <CustomInput
                label="Recording Title *"
                type="text"
                placeholder="Enter recording title..."
                error={errors.title?.message}
                disabled={isSubmitting}
                required
                icon={FileText}
                autoFocus={!selectedSession}
                ref={titleRef}
                {...register('title', { 
                  required: 'Recording title is required',
                  minLength: {
                    value: 3,
                    message: 'Title must be at least 3 characters'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Title cannot exceed 100 characters'
                  }
                })}
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <CustomTextArea
                label="Description"
                rows={3}
                placeholder="Describe the recording content..."
                error={errors.description?.message}
                disabled={isSubmitting}
                ref={descriptionRef}
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Description cannot exceed 500 characters'
                  }
                })}
              />
            </div>

            {/* Google Meet Link - Now Optional */}
            <div>
              <CustomInput
                label="Google Meet Link (Optional)"
                type="url"
                placeholder="https://meet.google.com/..."
                error={errors.meetLink?.message}
                disabled={isSubmitting || !!selectedSession}
                icon={Video}
                {...register('meetLink', {
                  pattern: {
                    value: /https:\/\/meet\.google\.com\/[a-z-]+/,
                    message: 'Please enter a valid Google Meet link'
                  }
                })}
              />
            </div>

            {/* Category */}
            <Select
              label="Subject *"
              options={categoryOptions}
              value={watchedValues.category}
              onChange={handleCategoryChange}
              disabled={isSubmitting}
              error={errors.category?.message}
              icon={BookOpen}
            />

            {/* Google Drive URL */}
            <div className="lg:col-span-2">
              <CustomInput
                label="Google Drive Recording Link *"
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                error={errors.recordingUrl?.message || (driveLinkPreview.error && !driveLinkPreview.isValid)}
                disabled={isSubmitting}
                icon={Download}
                required
                ref={recordingUrlRef}
                autoFocus={!!selectedSession}
                {...register('recordingUrl', {
                  required: 'Google Drive link is required',
                  pattern: {
                    value: /https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/,
                    message: 'Please enter a valid Google Drive link'
                  }
                })}
              />
              
              {/* Google Drive Link Preview */}
              {driveLinkPreview.isValid && (
                <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Valid Google Drive Link
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          File ID: {driveLinkPreview.fileId}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={driveLinkPreview.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span>View</span>
                      </a>
                      <a
                        href={driveLinkPreview.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {driveLinkPreview.error && !driveLinkPreview.isValid && watchedValues.recordingUrl && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {driveLinkPreview.error}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>How to get your Google Drive link:</strong><br/>
                  1. Go to drive.google.com<br/>
                  2. Find your recording in "Meet Recordings" folder<br/>
                  3. Right-click → "Share" → "Copy link"<br/>
                  4. Paste the link above
                </p>
              </div>
            </div>

            {/* Duration & Quality */}
            <div>
              <CustomInput
                label="Duration (minutes) *"
                type="number"
                placeholder="Duration in minutes"
                min="1"
                max="480"
                error={errors.duration?.message}
                disabled={isSubmitting}
                suffix="minutes"
                icon={Clock}
                {...register('duration', {
                  required: 'Duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 minute' },
                  max: { value: 480, message: 'Duration cannot exceed 8 hours' }
                })}
                onChange={(e) => handleDurationChange(e.target.value)}
              />
            </div>

            <Select
              label="Quality"
              options={qualityOptions}
              value={watchedValues.quality}
              onChange={handleQualityChange}
              disabled={isSubmitting}
              error={errors.quality?.message}
            />

            {/* File Size & Visibility */}
            <div>
              <CustomInput
                label="File Size (MB)"
                type="number"
                placeholder="File size in MB"
                min="0"
                error={errors.fileSize?.message}
                disabled={true}
                suffix="MB"
                {...register('fileSize')}
              />
              {watchedValues.fileSize > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatFileSize(watchedValues.fileSize * 1024 * 1024)} • Auto-calculated
                </p>
              )}
            </div>

            <Select
              label="Visibility *"
              options={visibilityOptions}
              value={watchedValues.visibility}
              onChange={handleVisibilityChange}
              disabled={isSubmitting}
              error={errors.visibility?.message}
            />
          </div>

          {/* Tags */}
          <div>
            <CustomInput
              label="Tags"
              type="text"
              placeholder="math, algebra, lecture (comma separated)"
              error={errors.tags?.message}
              disabled={isSubmitting}
              {...register('tags', {
                validate: (value) => {
                  if (!value) return true
                  // ✅ FIX: Handle both string and array types
                  const tags = typeof value === 'string' 
                    ? value.split(',').map(tag => tag.trim()).filter(Boolean)
                    : Array.isArray(value) ? value : []
                  
                  if (tags.length > 10) {
                    return 'Maximum 10 tags allowed'
                  }
                  if (tags.some(tag => tag.length > 20)) {
                    return 'Each tag must be less than 20 characters'
                  }
                  return true
                }
              })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add relevant tags to help students find this recording
            </p>
          </div>

          {/* Summary */}
          {(watchedValues.duration > 0 || watchedValues.fileSize > 0) && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recording Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {watchedValues.duration > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Duration: {formatDuration(watchedValues.duration)}
                    </span>
                  </div>
                )}
                {watchedValues.fileSize > 0 && (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Size: {formatFileSize(watchedValues.fileSize * 1024 * 1024)}
                    </span>
                  </div>
                )}
                {watchedValues.quality && (
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Quality: {watchedValues.quality.toUpperCase()}
                    </span>
                  </div>
                )}
                {watchedValues.category && (
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Subject: {categoryOptions.find(cat => cat.value === watchedValues.category)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || !isValid || !driveLinkPreview.isValid}
              loading={isSubmitting}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              icon={Upload}
            >
              {isSubmitting ? 'Saving...' : 'Save Recording'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRecordingModal