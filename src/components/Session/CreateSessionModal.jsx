import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';
import {
  X,
  Plus,
  Video,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  FileText,
  Globe,
  User,
  Link,
  BookOpen,
  Camera,
} from 'lucide-react';
import { db } from '../../config/firebase.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import Button from '../UI/Button.jsx';
import Select from '../UI/Select.jsx';
import { sessionService } from '../../services/sessionService.jsx'; // ✅ CHANGED: Use sessionService instead of recordingService

// ✅ FIX: Move CustomInput and CustomTextArea OUTSIDE the component to prevent re-renders
const CustomInput = React.forwardRef(
  ({ label, type = 'text', placeholder, error, disabled, icon: Icon, required, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label
          className={`block text-sm font-medium ${
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}
        >
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
          className={`w-full px-4 py-3 border rounded-2xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${Icon ? 'pl-10' : ''}`}
          placeholder={placeholder}
          disabled={disabled}
          ref={ref}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  )
);

// ✅ FIX: Move CustomTextArea outside too
const CustomTextArea = React.forwardRef(
  ({ label, placeholder, error, disabled, rows = 3, required, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label
          className={`block text-sm font-medium ${
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3 border rounded-2xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        ref={ref}
        {...props}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  )
);

const CreateSessionModal = ({
  onClose,
  onSuccess,
  session = null, // ✅ CHANGED: Accept session prop for editing
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);

  const isEditMode = Boolean(session);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: session?.title || session?.topic || '',
      description: session?.description || '',
      meetLink: session?.meetLink || '',
      scheduledTime: session?.scheduledTime ? new Date(session.scheduledTime).toISOString().slice(0, 16) : '',
      duration: session?.duration || 60,
      category: session?.category || 'lecture',
      visibility: session?.visibility || 'private',
      maxParticipants: session?.maxParticipants || 50,
      courseId: session?.courseId || 'general',
      enableRecording: session?.enableRecording ?? true,
    },
  });

  const watchedValues = watch();

  // ✅ FIX: Use proper dependencies and stable functions
  const validateScheduledTime = useCallback(
    (value) => {
      if (!value) return t('validation.required', { field: 'Scheduled time' });

      const selected = new Date(value);
      const now = new Date();

      if (isNaN(selected.getTime())) return t('validation.invalidDate', 'Invalid date');

      if (selected <= now) return t('validation.futureDate', 'Must be in the future');

      const oneYear = new Date();
      oneYear.setFullYear(now.getFullYear() + 1);
      if (selected > oneYear) return t('validation.tooFarFuture', 'Max 1 year ahead');

      return true;
    },
    [t]
  );

  // ✅ FIX: Stable callback functions with proper dependencies
  const handleDurationChange = useCallback((v) => {
    setValue('duration', Number(v), { shouldValidate: true });
  }, [setValue]);

  const handleCourseChange = useCallback((v) => {
    setValue('courseId', v, { shouldValidate: true });
  }, [setValue]);

  const handleCategoryChange = useCallback((v) => {
    setValue('category', v, { shouldValidate: true });
  }, [setValue]);

  const handleMaxParticipantsChange = useCallback((v) => {
    setValue('maxParticipants', v, { shouldValidate: true });
  }, [setValue]);

  const handleVisibilityChange = useCallback((v) => {
    setValue('visibility', v, { shouldValidate: true });
  }, [setValue]);

  const handleRecordingToggle = useCallback((e) => {
    setValue('enableRecording', e.target.checked, { shouldValidate: true });
  }, [setValue]);

  // ✅ FIX: Stable function for default time
  const getDefaultScheduledTime = useCallback(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  // Load courses with all subjects
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const subjects = [
          // Default/General category
          { id: 'general', name: 'General Session', category: 'general' },
          { id: 'english', name: 'English', category: 'general' },
          { id: 'english_literature', name: 'English Literature', category: 'general' },
          { id: 'english_language', name: 'English Language', category: 'general' },
          { id: 'communications', name: 'Communications', category: 'general' },
          
          // Mathematics
          { id: 'mathematics', name: 'Mathematics', category: 'math' },
          { id: 'algebra', name: 'Algebra', category: 'math' },
          { id: 'geometry', name: 'Geometry', category: 'math' },
          { id: 'calculus', name: 'Calculus', category: 'math' },
          { id: 'statistics', name: 'Statistics', category: 'math' },
          { id: 'trigonometry', name: 'Trigonometry', category: 'math' },
          { id: 'discrete_math', name: 'Discrete Mathematics', category: 'math' },
          
          // Sciences
          { id: 'physics', name: 'Physics', category: 'science' },
          { id: 'chemistry', name: 'Chemistry', category: 'science' },
          { id: 'biology', name: 'Biology', category: 'science' },
          { id: 'environmental_science', name: 'Environmental Science', category: 'science' },
          { id: 'earth_science', name: 'Earth Science', category: 'science' },
          { id: 'astronomy', name: 'Astronomy', category: 'science' },
          
          // Social Sciences
          { id: 'history', name: 'History', category: 'social_science' },
          { id: 'geography', name: 'Geography', category: 'social_science' },
          { id: 'civics', name: 'Civics', category: 'social_science' },
          { id: 'economics', name: 'Economics', category: 'social_science' },
          { id: 'political_science', name: 'Political Science', category: 'social_science' },
          { id: 'psychology', name: 'Psychology', category: 'social_science' },
          { id: 'sociology', name: 'Sociology', category: 'social_science' },
          
          // Languages
          { id: 'spanish', name: 'Spanish', category: 'languages' },
          { id: 'french', name: 'French', category: 'languages' },
          { id: 'german', name: 'German', category: 'languages' },
          { id: 'mandarin', name: 'Mandarin Chinese', category: 'languages' },
          { id: 'japanese', name: 'Japanese', category: 'languages' },
          { id: 'arabic', name: 'Arabic', category: 'languages' },
          { id: 'russian', name: 'Russian', category: 'languages' },
          
          // Arts & Humanities
          { id: 'art', name: 'Art', category: 'arts' },
          { id: 'music', name: 'Music', category: 'arts' },
          { id: 'drama', name: 'Drama', category: 'arts' },
          { id: 'dance', name: 'Dance', category: 'arts' },
          { id: 'philosophy', name: 'Philosophy', category: 'arts' },
          { id: 'religious_studies', name: 'Religious Studies', category: 'arts' },
          
          // Technology & Computer Science
          { id: 'computer_science', name: 'Computer Science', category: 'technology' },
          { id: 'programming', name: 'Programming', category: 'technology' },
          { id: 'web_development', name: 'Web Development', category: 'technology' },
          { id: 'data_science', name: 'Data Science', category: 'technology' },
          { id: 'artificial_intelligence', name: 'Artificial Intelligence', category: 'technology' },
          { id: 'cybersecurity', name: 'Cybersecurity', category: 'technology' },
          
          // Business & Career
          { id: 'business_studies', name: 'Business Studies', category: 'business' },
          { id: 'accounting', name: 'Accounting', category: 'business' },
          { id: 'marketing', name: 'Marketing', category: 'business' },
          { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'business' },
          { id: 'management', name: 'Management', category: 'business' },
          
          // Vocational & Life Skills
          { id: 'home_economics', name: 'Home Economics', category: 'vocational' },
          { id: 'physical_education', name: 'Physical Education', category: 'vocational' },
          { id: 'health_education', name: 'Health Education', category: 'vocational' },
          { id: 'career_guidance', name: 'Career Guidance', category: 'vocational' },
          { id: 'financial_literacy', name: 'Financial Literacy', category: 'vocational' },
        ];
        setAvailableCourses(subjects);
      } catch (err) {
        console.error('Error loading courses:', err);
        setAvailableCourses([{ id: 'general', name: 'General Session', category: 'general' }]);
      }
    };
    loadCourses();
  }, []);

  // Options with proper dependencies
  const categoryOptions = useMemo(
    () => [
      { value: 'lecture', label: t('session.categories.lecture', 'Lecture') },
      { value: 'tutorial', label: t('session.categories.tutorial', 'Tutorial') },
      { value: 'workshop', label: t('session.categories.workshop', 'Workshop') },
      { value: 'seminar', label: t('session.categories.seminar', 'Seminar') },
      { value: 'qna', label: t('session.categories.qna', 'Q&A Session') },
      { value: 'review', label: t('session.categories.review', 'Review Session') },
      { value: 'office_hours', label: t('session.categories.office_hours', 'Office Hours') },
      { value: 'group_study', label: t('session.categories.group_study', 'Group Study') },
    ],
    [t]
  );

  const visibilityOptions = useMemo(
    () => [
      { value: 'private', label: t('session.visibility.private', 'Private - Only invited') },
      { value: 'unlisted', label: t('session.visibility.unlisted', 'Unlisted - Anyone with link') },
      { value: 'public', label: t('session.visibility.public', 'Public - Visible to all') },
    ],
    [t]
  );

  const durationOptions = useMemo(
    () => [
      { value: 30, label: t('session.duration.30min', '30 minutes') },
      { value: 45, label: t('session.duration.45min', '45 minutes') },
      { value: 60, label: t('session.duration.1hour', '1 hour') },
      { value: 90, label: t('session.duration.1.5hour', '1.5 hours') },
      { value: 120, label: t('session.duration.2hour', '2 hours') },
      { value: 180, label: t('session.duration.3hour', '3 hours') },
    ],
    [t]
  );

  const participantsOptions = useMemo(
    () => [
      { value: 10, label: t('session.participants.10', '10 participants') },
      { value: 25, label: t('session.participants.25', '25 participants') },
      { value: 50, label: t('session.participants.50', '50 participants') },
      { value: 100, label: t('session.participants.100', '100 participants') },
      { value: 250, label: t('session.participants.250', '250 participants') },
      { value: 500, label: t('session.participants.500', '500 participants') },
    ],
    [t]
  );

  // Group courses by category for better organization
  const courseOptions = useMemo(() => {
    const groupedCourses = {};
    
    availableCourses.forEach(course => {
      if (!groupedCourses[course.category]) {
        groupedCourses[course.category] = [];
      }
      groupedCourses[course.category].push({
        value: course.id,
        label: course.name
      });
    });

    // Create options with group labels
    const options = [];
    
    // General category first
    if (groupedCourses.general) {
      options.push(...groupedCourses.general);
    }
    
    // Add other categories with separators
    const otherCategories = Object.keys(groupedCourses).filter(cat => cat !== 'general');
    
    otherCategories.forEach(category => {
      // Add separator
      options.push({
        value: `divider-${category}`,
        label: `--- ${category.toUpperCase().replace('_', ' ')} ---`,
        disabled: true
      });
      
      // Add courses for this category
      options.push(...groupedCourses[category]);
    });

    return options;
  }, [availableCourses]);

  // ✅ FIX: Stable component definitions using useMemo
  const RecordingGuide = useMemo(() => () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
        <Camera className="h-5 w-5 mr-2" />
        {t('session.recordingGuide.title', 'Recording Setup Guide')}
      </h4>
      <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">1</div>
          <p>{t('session.recordingGuide.step1', 'Start your Google Meet session at the scheduled time')}</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">2</div>
          <p>{t('session.recordingGuide.step2', 'Click "Record meeting" in Google Meet controls')}</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">3</div>
          <p>{t('session.recordingGuide.step3', 'Teach your session as normal')}</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">4</div>
          <p>{t('session.recordingGuide.step4', 'End meeting or stop recording when finished')}</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">5</div>
          <p>{t('session.recordingGuide.step5', 'Recording will be saved to Google Drive automatically')}</p>
        </div>
      </div>
    </div>
  ), [t]);

  const SessionCreationGuide = useMemo(() => () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
        {isEditMode 
          ? t('session.editGuide.title', 'Edit Session Details') 
          : t('session.creationGuide.title', 'How to Create a Google Meet Session')
        }
      </h4>
      <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">1</div>
          <p>
            {t('session.creationGuide.step1', 'Go to')}{' '}
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="underline">
              meet.google.com
            </a>
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">2</div>
          <p>{t('session.creationGuide.step2', 'Click "New meeting" → "Create a meeting for later"')}</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">3</div>
          <p>{t('session.creationGuide.step3', 'Copy the link and paste below')}</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">4</div>
          <p>{t('session.creationGuide.step4', 'Fill in details and schedule')}</p>
        </div>
      </div>
    </div>
  ), [t, isEditMode]);

  // ✅ CHANGED: Use sessionService instead of recordingService
  const createOrUpdateSession = async (data) => {
    console.log('📋 Creating/Updating session with data:', data);

    // Calculate session end time
    const startTime = new Date(data.scheduledTime);
    const sessionEndTime = new Date(startTime.getTime() + data.duration * 60000);

    const sessionData = {
      title: data.title?.trim() || 'Untitled Session',
      description: data.description?.trim() || '',
      meetLink: data.meetLink,
      scheduledTime: data.scheduledTime,
      sessionEndTime: sessionEndTime,
      duration: Number(data.duration) || 60,
      category: data.category,
      visibility: data.visibility,
      instructorId: user.uid,
      instructorEmail: user.email,
      instructorName: user.displayName || user.email,
      courseId: data.courseId || 'general',
      maxParticipants: Number(data.maxParticipants) || 50,
      enableRecording: data.enableRecording ?? true,
      isPublished: data.visibility === 'public',
      createdBy: user.uid,
    };

    console.log('🚀 Final session data for session service:', sessionData);

    if (isEditMode && session?.id) {
      // Update existing session
      return await sessionService.updateSession(session.id, sessionData);
    } else {
      // Create new session
      return await sessionService.createSession(sessionData);
    }
  };

  const mutation = useMutation(createOrUpdateSession, {
    onSuccess: (data) => {
      console.log('✅ Session created/updated successfully:', data);
      queryClient.invalidateQueries(['sessions', 'teacherSessions', 'publicSessions']);
      setSuccess(isEditMode 
        ? t('success.sessionUpdated', 'Session updated!') 
        : t('success.sessionCreated', 'Session created!')
      );
      setIsSubmitting(false);
      setTimeout(() => {
        onSuccess?.(data);
        onClose();
      }, 2000);
    },
    onError: (err) => {
      console.error('❌ Session creation/update error:', err);
      setError(err.message || (isEditMode 
        ? t('errors.sessionUpdateFailed', 'Failed to update session.') 
        : t('errors.sessionCreationFailed', 'Failed to create session.')
      ));
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const timeValid = validateScheduledTime(data.scheduledTime);
    if (timeValid !== true) {
      setError(timeValid);
      setIsSubmitting(false);
      return;
    }

    if (!data.courseId) data.courseId = 'general';

    try {
      await mutation.mutateAsync(data);
    } catch {
      // Error handled in onError
    }
  };

  const sessionSummary = useMemo(() => {
    const date = watchedValues.scheduledTime
      ? new Date(watchedValues.scheduledTime).toLocaleDateString()
      : '';
    const time = watchedValues.scheduledTime
      ? new Date(watchedValues.scheduledTime).toLocaleTimeString()
      : '';
    const course = availableCourses.find((c) => c.id === watchedValues.courseId)?.name || 'General Session';
    const recordingEnabled = watchedValues.enableRecording;

    return { 
      date, 
      time, 
      duration: watchedValues.duration, 
      participants: watchedValues.maxParticipants, 
      course,
      recordingEnabled 
    };
  }, [watchedValues, availableCourses]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && !isSubmitting && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isSubmitting]);

  // Reset form when session changes
  useEffect(() => {
    if (session) {
      reset({
        title: session.title || session.topic || '',
        description: session.description || '',
        meetLink: session.meetLink || '',
        scheduledTime: session.scheduledTime ? new Date(session.scheduledTime).toISOString().slice(0, 16) : '',
        duration: session.duration || 60,
        category: session.category || 'lecture',
        visibility: session.visibility || 'private',
        maxParticipants: session.maxParticipants || 50,
        courseId: session.courseId || 'general',
        enableRecording: session.enableRecording ?? true,
      });
    }
  }, [session, reset]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode 
                  ? t('session.editSession', 'Edit Session') 
                  : t('session.createNew', 'Create Google Meet Session')
                }
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditMode
                  ? t('session.editSubtitle', 'Update session details')
                  : t('session.createSubtitle', 'Schedule a new session for your students')
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <p className="text-green-700 dark:text-green-300 text-sm flex-1">{success}</p>
          </div>
        )}

        <div className="px-6 pt-4">
          <SessionCreationGuide />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
            <div className="lg:col-span-2">
              <CustomInput
                label={`${t('session.title', 'Session Title')} *`}
                placeholder={t('session.titlePlaceholder', 'Enter title...')}
                error={errors.title?.message}
                disabled={isSubmitting}
                required
                icon={FileText}
                {...register('title', {
                  required: t('validation.required', { field: 'Title' }),
                  minLength: { value: 3, message: t('validation.minLength', { min: 3 }) },
                  maxLength: { value: 100, message: t('validation.maxLength', { max: 100 }) },
                })}
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <CustomTextArea
                label={t('session.description', 'Description')}
                rows={3}
                placeholder={t('session.descriptionPlaceholder', 'Describe the session...')}
                error={errors.description?.message}
                disabled={isSubmitting}
                {...register('description', {
                  maxLength: { value: 500, message: t('validation.maxLength', { max: 500 }) },
                })}
              />
            </div>

            {/* Meet Link */}
            <div className="lg:col-span-2">
              <CustomInput
                label={`${t('session.meetLink', 'Google Meet Link')} *`}
                type="url"
                placeholder="https://meet.google.com/abc-def-ghi"
                error={errors.meetLink?.message}
                disabled={isSubmitting}
                icon={Link}
                required
                {...register('meetLink', {
                  required: t('validation.required', { field: 'Meet Link' }),
                  pattern: {
                    value: /^https:\/\/meet\.google\.com\/[a-z-]+$/,
                    message: t('validation.invalidMeetUrl', 'Invalid Meet link'),
                  },
                })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('session.meetLinkHelp', 'Copy from Google Meet → "Create for later"')}
              </p>
            </div>

            {/* Course */}
            <div className="lg:col-span-2">
              <Select
                label={`${t('session.course', 'Course/Subject')} *`}
                options={courseOptions}
                value={watchedValues.courseId}
                onChange={handleCourseChange}
                disabled={isSubmitting}
                error={errors.courseId?.message}
                icon={BookOpen}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('session.courseHelp', 'Select the subject or course for this session')}
              </p>
            </div>

            {/* Date & Time */}
            <div>
              <CustomInput
                label={`${t('session.scheduledTime', 'Date & Time')} *`}
                type="datetime-local"
                error={errors.scheduledTime?.message}
                disabled={isSubmitting}
                icon={Calendar}
                required
                min={getDefaultScheduledTime()}
                {...register('scheduledTime', {
                  required: t('validation.required', { field: 'Date & Time' }),
                  validate: { future: validateScheduledTime },
                })}
              />
            </div>

            {/* Duration */}
            <Select
              label={`${t('session.duration', 'Duration')} *`}
              options={durationOptions}
              value={watchedValues.duration}
              onChange={handleDurationChange}
              disabled={isSubmitting}
            />

            {/* Category */}
            <Select
              label={`${t('session.category', 'Category')} *`}
              options={categoryOptions}
              value={watchedValues.category}
              onChange={handleCategoryChange}
              disabled={isSubmitting}
            />

            {/* Max Participants */}
            <Select
              label={t('session.maxParticipants', 'Max Participants')}
              options={participantsOptions}
              value={watchedValues.maxParticipants}
              onChange={handleMaxParticipantsChange}
              disabled={isSubmitting}
            />

            {/* Visibility */}
            <Select
              label={`${t('session.visibility', 'Visibility')} *`}
              options={visibilityOptions}
              value={watchedValues.visibility}
              onChange={handleVisibilityChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Recording Settings */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-blue-500" />
              {t('session.recordingSettings', 'Recording Settings')}
            </h4>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('session.enableRecording', 'Enable Recording')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('session.recordingDescription', 'Recordings will be automatically saved to Google Drive')}
                </p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={watchedValues.enableRecording}
                    onChange={handleRecordingToggle}
                    disabled={isSubmitting}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {watchedValues.enableRecording && <RecordingGuide />}
          </div>

          {/* Instructor Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('session.instructorInfo', 'Instructor')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>{t('common.name', 'Name')}:</strong>{' '}
                  {user?.displayName || t('common.notSet', 'Not set')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>{t('common.email', 'Email')}:</strong> {user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {watchedValues.scheduledTime && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t('session.summary', 'Summary')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {sessionSummary.date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      <strong>{t('session.date', 'Date')}:</strong> {sessionSummary.date}
                    </span>
                  </div>
                )}
                {sessionSummary.time && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      <strong>{t('session.time', 'Time')}:</strong> {sessionSummary.time}
                    </span>
                  </div>
                )}
                {sessionSummary.duration && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      <strong>{t('session.duration', 'Duration')}:</strong>{' '}
                      {sessionSummary.duration} {t('session.minutes', 'min')}
                    </span>
                  </div>
                )}
                {sessionSummary.participants && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      <strong>{t('session.maxParticipants', 'Max')}:</strong> {sessionSummary.participants}
                    </span>
                  </div>
                )}
                {sessionSummary.course && (
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      <strong>{t('session.course', 'Course')}:</strong> {sessionSummary.course}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 md:col-span-2">
                  <Camera className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300">
                    <strong>{t('session.recording', 'Recording')}:</strong>{' '}
                    {sessionSummary.recordingEnabled 
                      ? t('session.recordingEnabled', 'Enabled') 
                      : t('session.recordingDisabled', 'Disabled')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isDirty && isEditMode) || !isValid}
              loading={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              icon={Plus}
            >
              {isSubmitting 
                ? (isEditMode ? t('session.updating', 'Updating...') : t('session.creating', 'Creating...'))
                : (isEditMode ? t('session.updateSession', 'Update Session') : t('session.createSession', 'Create Session'))
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(CreateSessionModal);