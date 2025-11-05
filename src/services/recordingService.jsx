import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Constants for Google Meet integration
const GOOGLE_DRIVE_BASE_URL = 'https://drive.google.com/file/d/';
const MEET_RECORDINGS_FOLDER = 'Meet Recordings';
const RECORDING_PROCESSING_TIME = 30; // minutes

// Utility functions
const generateSessionId = () => `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const sanitizeRecordingData = (data) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

const convertToTimestamp = (date) => {
  if (!date) return null;
  if (date instanceof Date) return Timestamp.fromDate(date);
  if (typeof date === 'string') return Timestamp.fromDate(new Date(date));
  return date;
};

export const recordingService = {
  // Create a new recording with Google Meet integration
  createRecording: async (recordingData) => {
    try {
      console.log('🔄 Creating recording with Google Meet integration:', recordingData.title);
      
      // Validate required fields for Google Meet workflow
      if (!recordingData.title || !recordingData.instructorId || !recordingData.instructorEmail) {
        throw new Error('Recording title, instructor ID, and instructor email are required');
      }

      // ✅ FIX: Generate sessionId if not provided
      const sessionId = recordingData.sessionId || generateSessionId();

      const recording = {
        // Core recording information
        title: recordingData.title.trim(),
        description: recordingData.description || '',
        sessionId: sessionId,
        
        // Google Meet Integration
        meetLink: recordingData.meetLink || '',
        instructorEmail: recordingData.instructorEmail,
        driveFileId: recordingData.driveFileId || '',
        driveFolder: MEET_RECORDINGS_FOLDER,
        
        // Recording content (Google Drive based)
        recordingUrl: recordingData.recordingUrl || '',
        thumbnailUrl: recordingData.thumbnailUrl || '',
        duration: recordingData.duration || 0,
        fileSize: recordingData.fileSize || 0,
        quality: recordingData.quality || '720p',
        format: recordingData.format || 'mp4',
        
        // Google Meet Session Information
        scheduledTime: convertToTimestamp(recordingData.scheduledTime) || serverTimestamp(),
        sessionEndTime: convertToTimestamp(recordingData.sessionEndTime),
        actualStartTime: convertToTimestamp(recordingData.actualStartTime),
        actualEndTime: convertToTimestamp(recordingData.actualEndTime),
        
        // Status and visibility
        status: recordingData.status || 'scheduled',
        recordingStatus: recordingData.recordingStatus || 'not_started',
        isPublished: recordingData.isPublished ?? false,
        isFeatured: recordingData.isFeatured ?? false,
        visibility: recordingData.visibility || 'private',
        
        // Ownership and access
        createdBy: recordingData.createdBy || recordingData.instructorId,
        instructorId: recordingData.instructorId,
        instructorName: recordingData.instructorName || '',
        courseId: recordingData.courseId || 'general',
        
        // Google Meet Participants
        participantEmails: recordingData.participantEmails || [],
        attendeeCount: recordingData.attendeeCount || 0,
        maxParticipants: recordingData.maxParticipants || 50,
        
        // Metadata and analytics
        views: 0,
        likes: 0,
        dislikes: 0,
        averageRating: 0,
        totalRatings: 0,
        downloadCount: 0,
        shareCount: 0,
        
        // Categorization
        category: recordingData.category || 'lecture',
        tags: recordingData.tags || [],
        language: recordingData.language || 'en',
        level: recordingData.level || 'beginner',
        
        // Student progress tracking
        studentProgress: {},
        completedBy: [],
        
        // Timestamps and metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: recordingData.isPublished ? serverTimestamp() : null,
        recordingAvailableFrom: convertToTimestamp(recordingData.recordingAvailableFrom),
        
        // Google Meet Recording Metadata
        recordingStartedAt: convertToTimestamp(recordingData.recordingStartedAt),
        recordingEndedAt: convertToTimestamp(recordingData.recordingEndedAt),
        processingStatus: 'pending',
        processingProgress: 0,
        errorMessage: null,
        
        // SEO and discoverability
        slug: recordingData.slug || recordingData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        metaTitle: recordingData.metaTitle || recordingData.title,
        metaDescription: recordingData.metaDescription || recordingData.description?.substring(0, 160) || '',
        
        // Access control
        allowedUsers: recordingData.allowedUsers || [],
        accessCode: recordingData.accessCode || null,
        requiresApproval: recordingData.requiresApproval ?? false,

        // Recording settings
        enableRecording: recordingData.enableRecording ?? true
      };

      // ✅ FIX: Sanitize data to remove undefined values
      const sanitizedRecording = sanitizeRecordingData(recording);

      console.log('📝 Final recording data to save:', sanitizedRecording);

      const docRef = await addDoc(collection(db, 'recordings'), sanitizedRecording);
      console.log('✅ Recording created successfully with Google Meet integration:', docRef.id);
      
      return {
        success: true,
        id: docRef.id,
        ...sanitizedRecording
      };
    } catch (error) {
      console.error('❌ Error creating recording:', error);
      throw new Error(`Failed to create recording: ${error.message}`);
    }
  },

  // Simplified session creation method specifically for CreateSessionModal
  createSessionRecording: async (sessionData) => {
    try {
      console.log('🔄 Creating session recording:', sessionData.title);
      
      // ✅ FIX: Generate sessionId if not provided
      const sessionId = sessionData.sessionId || generateSessionId();

      const recordingData = {
        sessionId: sessionId,
        title: sessionData.title,
        description: sessionData.description,
        meetLink: sessionData.meetLink,
        instructorId: sessionData.instructorId,
        instructorEmail: sessionData.instructorEmail,
        instructorName: sessionData.instructorName,
        scheduledTime: sessionData.scheduledTime,
        sessionEndTime: sessionData.sessionEndTime,
        duration: sessionData.duration,
        category: sessionData.category,
        visibility: sessionData.visibility,
        courseId: sessionData.courseId,
        maxParticipants: sessionData.maxParticipants,
        enableRecording: sessionData.enableRecording,
        status: 'scheduled',
        recordingStatus: sessionData.enableRecording ? 'not_started' : 'disabled',
        isPublished: sessionData.visibility === 'public',
        createdBy: sessionData.createdBy
      };

      return await recordingService.createRecording(recordingData);
    } catch (error) {
      console.error('❌ Error creating session recording:', error);
      throw new Error(`Failed to create session recording: ${error.message}`);
    }
  },

  // Create recording from Google Meet session
  createRecordingFromMeetSession: async (sessionData) => {
    try {
      console.log('🔄 Creating recording from Google Meet session:', sessionData.title);
      
      const recordingData = {
        title: sessionData.title,
        description: sessionData.description,
        meetLink: sessionData.meetLink,
        instructorId: sessionData.instructorId,
        instructorEmail: sessionData.instructorEmail,
        instructorName: sessionData.instructorName,
        scheduledTime: sessionData.scheduledTime,
        sessionEndTime: sessionData.sessionEndTime,
        participantEmails: sessionData.participantEmails || [],
        courseId: sessionData.courseId,
        status: 'scheduled',
        recordingStatus: 'not_started'
      };

      return await recordingService.createRecording(recordingData);
    } catch (error) {
      console.error('❌ Error creating recording from Meet session:', error);
      throw new Error(`Failed to create recording from Meet session: ${error.message}`);
    }
  },

  // Start a recording session (mark as live)
  startRecordingSession: async (recordingId) => {
    try {
      console.log('🔄 Starting recording session:', recordingId);
      
      const updateData = {
        status: 'live',
        recordingStatus: 'recording',
        actualStartTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording session started successfully:', recordingId);
      
      return {
        success: true,
        recordingId,
        status: 'live',
        recordingStatus: 'recording'
      };
    } catch (error) {
      console.error('❌ Error starting recording session:', error);
      throw new Error(`Failed to start recording session: ${error.message}`);
    }
  },

  // End a recording session (mark as completed)
  endRecordingSession: async (recordingId) => {
    try {
      console.log('🔄 Ending recording session:', recordingId);
      
      const updateData = {
        status: 'completed',
        recordingStatus: 'processing',
        actualEndTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording session ended successfully:', recordingId);
      
      return {
        success: true,
        recordingId,
        status: 'completed',
        recordingStatus: 'processing'
      };
    } catch (error) {
      console.error('❌ Error ending recording session:', error);
      throw new Error(`Failed to end recording session: ${error.message}`);
    }
  },

  // Update recording with Google Drive link after manual recording
  updateWithDriveRecording: async (recordingId, driveData) => {
    try {
      console.log('🔄 Updating recording with Google Drive data:', recordingId);
      
      if (!recordingId || !driveData.recordingUrl) {
        throw new Error('Recording ID and Google Drive URL are required');
      }

      const driveFileId = recordingService.extractDriveFileId(driveData.recordingUrl);
      
      const updateData = {
        recordingUrl: driveData.recordingUrl,
        driveFileId: driveFileId,
        recordingStatus: 'available',
        status: 'recorded',
        recordingAvailableFrom: serverTimestamp(),
        processingStatus: 'completed',
        processingProgress: 100,
        duration: driveData.duration || 0,
        fileSize: driveData.fileSize || 0,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording updated with Google Drive data successfully:', recordingId);
      
      return {
        success: true,
        recordingId,
        driveFileId,
        recordingUrl: driveData.recordingUrl
      };
    } catch (error) {
      console.error('❌ Error updating recording with Drive data:', error);
      throw new Error(`Failed to update recording with Drive data: ${error.message}`);
    }
  },

  // Quick method to add recording URL
  addRecordingUrl: async (recordingId, recordingUrl) => {
    try {
      console.log('🔄 Adding recording URL:', recordingId);
      
      if (!recordingId || !recordingUrl) {
        throw new Error('Recording ID and URL are required');
      }

      const driveFileId = recordingService.extractDriveFileId(recordingUrl);
      const updateData = {
        recordingUrl: recordingUrl,
        driveFileId: driveFileId,
        recordingStatus: 'available',
        status: 'recorded',
        recordingAvailableFrom: serverTimestamp(),
        processingStatus: 'completed',
        processingProgress: 100,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording URL added successfully:', recordingId);
      
      return {
        success: true,
        recordingId,
        recordingUrl
      };
    } catch (error) {
      console.error('❌ Error adding recording URL:', error);
      throw new Error(`Failed to add recording URL: ${error.message}`);
    }
  },

  // Extract Google Drive file ID from URL
  extractDriveFileId: (driveUrl) => {
    try {
      if (!driveUrl) return '';
      const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
      const match = driveUrl.match(regex);
      return match ? match[1] : '';
    } catch (error) {
      console.error('❌ Error extracting Drive file ID:', error);
      return '';
    }
  },

  // Generate Google Drive URL from file ID
  generateDriveUrl: (fileId) => {
    return fileId ? `${GOOGLE_DRIVE_BASE_URL}${fileId}/view` : '';
  },

  // Update recording status during live session
  updateRecordingStatus: async (recordingId, status, additionalData = {}) => {
    try {
      console.log('🔄 Updating recording status:', { recordingId, status });
      
      const updateData = {
        status: status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      // Add timestamp based on status
      switch (status) {
        case 'live':
          updateData.actualStartTime = serverTimestamp();
          updateData.recordingStatus = 'recording';
          break;
        case 'completed':
          updateData.actualEndTime = serverTimestamp();
          updateData.recordingStatus = 'processing';
          break;
        case 'recorded':
          updateData.recordingStatus = 'available';
          break;
      }

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording status updated successfully:', { recordingId, status });
      
      return {
        success: true,
        recordingId,
        status,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error updating recording status:', error);
      throw new Error(`Failed to update recording status: ${error.message}`);
    }
  },

  // Get sessions that need recording management
  getSessionsForRecordingManagement: async (instructorId) => {
    try {
      console.log('🔄 Fetching sessions for recording management:', instructorId);
      
      const recordingsQuery = query(
        collection(db, 'recordings'),
        where('instructorId', '==', instructorId),
        where('status', 'in', ['scheduled', 'live', 'completed']),
        where('recordingStatus', 'in', ['not_started', 'recording', 'processing']),
        orderBy('scheduledTime', 'desc')
      );

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          scheduledTime: recordingData.scheduledTime?.toDate?.(),
          actualStartTime: recordingData.actualStartTime?.toDate?.(),
          actualEndTime: recordingData.actualEndTime?.toDate?.(),
          recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.()
        };
      });

      console.log(`✅ Found ${recordings.length} sessions for recording management`);
      return recordings;
    } catch (error) {
      console.error('❌ Error fetching sessions for recording management:', error);
      throw new Error(`Failed to fetch sessions for recording management: ${error.message}`);
    }
  },

  // Get recordings that need recording links (for manual processing)
  getRecordingsNeedingLinks: async (instructorId = null) => {
    try {
      console.log('🔄 Fetching recordings needing Drive links');
      
      let recordingsQuery = query(
        collection(db, 'recordings'),
        where('status', '==', 'completed'),
        where('recordingStatus', 'in', ['processing', 'not_started']),
        where('recordingUrl', '==', ''),
        orderBy('actualEndTime', 'desc')
      );

      if (instructorId) {
        recordingsQuery = query(recordingsQuery, where('instructorId', '==', instructorId));
      }

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          scheduledTime: recordingData.scheduledTime?.toDate?.(),
          actualEndTime: recordingData.actualEndTime?.toDate?.()
        };
      });

      console.log(`✅ Found ${recordings.length} recordings needing Drive links`);
      return recordings;
    } catch (error) {
      console.error('❌ Error fetching recordings needing links:', error);
      throw new Error(`Failed to fetch recordings needing links: ${error.message}`);
    }
  },

  // Get instructor's Google Meet recordings
  getInstructorMeetRecordings: async (instructorEmail, options = {}) => {
    try {
      console.log('🔄 Fetching instructor Meet recordings:', instructorEmail);
      
      const {
        status = 'all',
        recordingStatus = 'all',
        limit: resultLimit = 50,
        cursor = null
      } = options;

      let recordingsQuery = query(
        collection(db, 'recordings'),
        where('instructorEmail', '==', instructorEmail),
        orderBy('scheduledTime', 'desc')
      );

      // Apply status filter
      if (status !== 'all') {
        recordingsQuery = query(recordingsQuery, where('status', '==', status));
      }

      // Apply recording status filter
      if (recordingStatus !== 'all') {
        recordingsQuery = query(recordingsQuery, where('recordingStatus', '==', recordingStatus));
      }

      // Apply pagination
      if (cursor) {
        recordingsQuery = query(recordingsQuery, startAfter(cursor), limit(resultLimit));
      } else {
        recordingsQuery = query(recordingsQuery, limit(resultLimit));
      }

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          scheduledTime: recordingData.scheduledTime?.toDate?.(),
          actualStartTime: recordingData.actualStartTime?.toDate?.(),
          actualEndTime: recordingData.actualEndTime?.toDate?.(),
          recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.()
        };
      });

      const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      console.log(`✅ Fetched ${recordings.length} Meet recordings for instructor`);
      return {
        recordings,
        nextCursor: nextCursor || undefined
      };
    } catch (error) {
      console.error('❌ Error fetching instructor Meet recordings:', error);
      throw new Error(`Failed to fetch instructor Meet recordings: ${error.message}`);
    }
  },

  // Get upcoming Google Meet sessions
  getUpcomingMeetSessions: async (instructorId, daysAhead = 7) => {
    try {
      console.log('🔄 Fetching upcoming Meet sessions');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const recordingsQuery = query(
        collection(db, 'recordings'),
        where('instructorId', '==', instructorId),
        where('scheduledTime', '>=', Timestamp.fromDate(startDate)),
        where('scheduledTime', '<=', Timestamp.fromDate(endDate)),
        where('status', 'in', ['scheduled', 'live']),
        orderBy('scheduledTime', 'asc')
      );

      const snapshot = await getDocs(recordingsQuery);
      const sessions = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          scheduledTime: recordingData.scheduledTime?.toDate?.(),
          sessionEndTime: recordingData.sessionEndTime?.toDate?.(),
          createdAt: recordingData.createdAt?.toDate?.()
        };
      });

      console.log(`✅ Found ${sessions.length} upcoming Meet sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching upcoming Meet sessions:', error);
      throw new Error(`Failed to fetch upcoming Meet sessions: ${error.message}`);
    }
  },

  // Get recording by ID with enhanced Google Meet data
  getRecordingById: async (recordingId) => {
    try {
      console.log('🔄 Fetching recording with Meet data:', recordingId);
      
      if (!recordingId) {
        throw new Error('Recording ID is required');
      }

      const recordingDoc = await getDoc(doc(db, 'recordings', recordingId));
      
      if (!recordingDoc.exists()) {
        console.warn('⚠️ Recording not found:', recordingId);
        return null;
      }

      const recordingData = recordingDoc.data();
      
      // Transform Firestore timestamps to Date objects
      const transformedRecording = {
        id: recordingDoc.id,
        ...recordingData,
        createdAt: recordingData.createdAt?.toDate?.(),
        updatedAt: recordingData.updatedAt?.toDate?.(),
        publishedAt: recordingData.publishedAt?.toDate?.(),
        scheduledTime: recordingData.scheduledTime?.toDate?.(),
        sessionEndTime: recordingData.sessionEndTime?.toDate?.(),
        actualStartTime: recordingData.actualStartTime?.toDate?.(),
        actualEndTime: recordingData.actualEndTime?.toDate?.(),
        recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.(),
        recordingStartedAt: recordingData.recordingStartedAt?.toDate?.(),
        recordingEndedAt: recordingData.recordingEndedAt?.toDate?.()
      };

      // Check if recording is currently live
      transformedRecording.isLive = recordingService.isRecordingLive(transformedRecording);

      console.log('✅ Recording with Meet data fetched successfully:', recordingId);
      return transformedRecording;
    } catch (error) {
      console.error('❌ Error fetching recording:', error);
      throw new Error(`Failed to fetch recording: ${error.message}`);
    }
  },

  // Check if recording is currently live
  isRecordingLive: (recording) => {
    if (!recording) return false;
    const now = new Date();
    const scheduledTime = recording.scheduledTime;
    const sessionEndTime = recording.sessionEndTime;
    
    return scheduledTime && sessionEndTime && 
           now >= scheduledTime && now <= sessionEndTime &&
           recording.status === 'live';
  },

  // Check if session should be started based on current time
  shouldStartSession: (recording) => {
    if (!recording) return false;
    const now = new Date();
    const scheduledTime = recording.scheduledTime;
    
    return scheduledTime && now >= scheduledTime && recording.status === 'scheduled';
  },

  // Check if session should be ended based on current time
  shouldEndSession: (recording) => {
    if (!recording) return false;
    const now = new Date();
    const sessionEndTime = recording.sessionEndTime;
    
    return sessionEndTime && now >= sessionEndTime && recording.status === 'live';
  },

  // Get available recordings for students (with Google Drive links)
  getAvailableRecordings: async (options = {}) => {
    try {
      console.log('🔄 Fetching available recordings with Drive links');
      
      const {
        studentId,
        cursor = null,
        limit: resultLimit = 12,
        category = 'all',
        instructorId = null,
        sortBy = 'recordingAvailableFrom',
        sortOrder = 'desc'
      } = options;

      let recordingsQuery = query(
        collection(db, 'recordings'),
        where('isPublished', '==', true),
        where('recordingStatus', '==', 'available'),
        where('recordingUrl', '!=', ''),
        orderBy(sortBy, sortOrder)
      );

      // Apply category filter
      if (category !== 'all') {
        recordingsQuery = query(recordingsQuery, where('category', '==', category));
      }

      // Apply instructor filter
      if (instructorId) {
        recordingsQuery = query(recordingsQuery, where('instructorId', '==', instructorId));
      }

      // Apply pagination
      if (cursor) {
        recordingsQuery = query(recordingsQuery, startAfter(cursor), limit(resultLimit));
      } else {
        recordingsQuery = query(recordingsQuery, limit(resultLimit));
      }

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        
        // Check if student has watched this recording
        const watched = studentId ? 
          recordingData.studentProgress?.[studentId]?.watched || false :
          false;
        
        const progress = studentId ?
          recordingData.studentProgress?.[studentId]?.progress || 0 :
          0;

        return {
          id: doc.id,
          ...recordingData,
          watched,
          progress,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          publishedAt: recordingData.publishedAt?.toDate?.(),
          recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.()
        };
      });

      const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      console.log(`✅ Fetched ${recordings.length} available recordings with Drive links`);
      return {
        recordings,
        nextCursor: nextCursor || undefined
      };
    } catch (error) {
      console.error('❌ Error fetching available recordings:', error);
      throw new Error(`Failed to fetch available recordings: ${error.message}`);
    }
  },

  // Get recordings for a specific teacher
  getTeacherRecordings: async (options = {}) => {
    try {
      console.log('🔄 Fetching teacher recordings with options:', options);
      
      const {
        teacherId,
        cursor = null,
        limit: resultLimit = 12,
        status = 'all',
        isPublished = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      if (!teacherId) {
        throw new Error('Teacher ID is required');
      }

      let recordingsQuery = query(
        collection(db, 'recordings'),
        where('instructorId', '==', teacherId),
        orderBy(sortBy, sortOrder)
      );

      // Apply status filter
      if (status !== 'all') {
        recordingsQuery = query(recordingsQuery, where('status', '==', status));
      }

      // Apply published filter
      if (isPublished !== 'all') {
        recordingsQuery = query(recordingsQuery, where('isPublished', '==', (isPublished === 'published')));
      }

      // Apply pagination
      if (cursor) {
        recordingsQuery = query(recordingsQuery, startAfter(cursor), limit(resultLimit));
      } else {
        recordingsQuery = query(recordingsQuery, limit(resultLimit));
      }

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          publishedAt: recordingData.publishedAt?.toDate?.(),
          scheduledTime: recordingData.scheduledTime?.toDate?.(),
          actualStartTime: recordingData.actualStartTime?.toDate?.(),
          actualEndTime: recordingData.actualEndTime?.toDate?.()
        };
      });

      // Get next cursor for pagination
      const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      console.log(`✅ Fetched ${recordings.length} teacher recordings`);
      return {
        recordings,
        nextCursor: nextCursor || undefined
      };
    } catch (error) {
      console.error('❌ Error fetching teacher recordings:', error);
      throw new Error(`Failed to fetch teacher recordings: ${error.message}`);
    }
  },

  // Get recordings for students (published and accessible)
  getStudentRecordings: async (options = {}) => {
    try {
      console.log('🔄 Fetching student recordings with options:', options);
      
      const {
        studentId,
        cursor = null,
        limit: resultLimit = 12,
        status = 'completed',
        category = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        enrolledCourses = []
      } = options;

      let recordingsQuery = query(
        collection(db, 'recordings'),
        where('isPublished', '==', true),
        where('status', '==', 'completed'),
        orderBy(sortBy, sortOrder)
      );

      // Apply category filter
      if (category !== 'all') {
        recordingsQuery = query(recordingsQuery, where('category', '==', category));
      }

      // Filter by enrolled courses if provided
      if (enrolledCourses && enrolledCourses.length > 0) {
        recordingsQuery = query(recordingsQuery, where('courseId', 'in', enrolledCourses));
      }

      // Apply pagination
      if (cursor) {
        recordingsQuery = query(recordingsQuery, startAfter(cursor), limit(resultLimit));
      } else {
        recordingsQuery = query(recordingsQuery, limit(resultLimit));
      }

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        
        // Check if student has watched this recording
        const watched = studentId ? 
          recordingData.studentProgress?.[studentId]?.watched || false :
          false;
        
        const progress = studentId ?
          recordingData.studentProgress?.[studentId]?.progress || 0 :
          0;

        return {
          id: doc.id,
          ...recordingData,
          watched,
          progress,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          publishedAt: recordingData.publishedAt?.toDate?.(),
          recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.()
        };
      });

      // Get next cursor for pagination
      const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      console.log(`✅ Fetched ${recordings.length} student recordings`);
      return {
        recordings,
        nextCursor: nextCursor || undefined
      };
    } catch (error) {
      console.error('❌ Error fetching student recordings:', error);
      throw new Error(`Failed to fetch student recordings: ${error.message}`);
    }
  },

  // Get all recordings with advanced filtering
  getAllRecordings: async (options = {}) => {
    try {
      console.log('🔄 Fetching all recordings with options:', options);
      
      const {
        limit: resultLimit = 50,
        status = 'all',
        isPublished = 'all',
        category = 'all',
        instructorId = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        searchTerm = ''
      } = options;

      let recordingsQuery = query(collection(db, 'recordings'), orderBy(sortBy, sortOrder));

      // Apply status filter
      if (status !== 'all') {
        recordingsQuery = query(recordingsQuery, where('status', '==', status));
      }

      // Apply published filter
      if (isPublished !== 'all') {
        recordingsQuery = query(recordingsQuery, where('isPublished', '==', (isPublished === 'published')));
      }

      // Apply category filter
      if (category !== 'all') {
        recordingsQuery = query(recordingsQuery, where('category', '==', category));
      }

      // Apply instructor filter
      if (instructorId) {
        recordingsQuery = query(recordingsQuery, where('instructorId', '==', instructorId));
      }

      recordingsQuery = query(recordingsQuery, limit(resultLimit));

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          publishedAt: recordingData.publishedAt?.toDate?.(),
          scheduledTime: recordingData.scheduledTime?.toDate?.(),
          actualStartTime: recordingData.actualStartTime?.toDate?.(),
          actualEndTime: recordingData.actualEndTime?.toDate?.()
        };
      });

      // Apply search filter if provided
      let filteredRecordings = recordings;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredRecordings = recordings.filter(recording => 
          recording.title?.toLowerCase().includes(searchLower) ||
          recording.description?.toLowerCase().includes(searchLower) ||
          recording.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          recording.instructorName?.toLowerCase().includes(searchLower)
        );
      }

      console.log(`✅ Fetched ${filteredRecordings.length} recordings`);
      return filteredRecordings;
    } catch (error) {
      console.error('❌ Error fetching recordings:', error);
      throw new Error(`Failed to fetch recordings: ${error.message}`);
    }
  },

  // Get featured recordings
  getFeaturedRecordings: async (limit = 10) => {
    try {
      console.log('🔄 Fetching featured recordings');
      
      const recordingsQuery = query(
        collection(db, 'recordings'),
        where('isPublished', '==', true),
        where('isFeatured', '==', true),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          publishedAt: recordingData.publishedAt?.toDate?.(),
          recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.()
        };
      });

      console.log(`✅ Fetched ${recordings.length} featured recordings`);
      return recordings;
    } catch (error) {
      console.error('❌ Error fetching featured recordings:', error);
      throw new Error(`Failed to fetch featured recordings: ${error.message}`);
    }
  },

  // Get recordings by course
  getCourseRecordings: async (courseId, options = {}) => {
    try {
      console.log('🔄 Fetching course recordings:', courseId);
      
      const {
        limit: resultLimit = 50,
        status = 'completed',
        isPublished = true
      } = options;

      let recordingsQuery = query(
        collection(db, 'recordings'),
        where('courseId', '==', courseId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      if (isPublished !== 'all') {
        recordingsQuery = query(recordingsQuery, where('isPublished', '==', isPublished));
      }

      recordingsQuery = query(recordingsQuery, limit(resultLimit));

      const snapshot = await getDocs(recordingsQuery);
      const recordings = snapshot.docs.map(doc => {
        const recordingData = doc.data();
        return {
          id: doc.id,
          ...recordingData,
          createdAt: recordingData.createdAt?.toDate?.(),
          updatedAt: recordingData.updatedAt?.toDate?.(),
          publishedAt: recordingData.publishedAt?.toDate?.(),
          recordingAvailableFrom: recordingData.recordingAvailableFrom?.toDate?.()
        };
      });

      console.log(`✅ Fetched ${recordings.length} recordings for course: ${courseId}`);
      return recordings;
    } catch (error) {
      console.error('❌ Error fetching course recordings:', error);
      throw new Error(`Failed to fetch course recordings: ${error.message}`);
    }
  },

  // Update recording with enhanced validation for Google Meet
  updateRecording: async (recordingId, updates) => {
    try {
      console.log('🔄 Updating recording with Meet validation:', recordingId);
      
      if (!recordingId) {
        throw new Error('Recording ID is required');
      }

      // Define allowed fields for update
      const allowedFields = [
        'title', 'description', 'meetLink', 'recordingUrl', 'thumbnailUrl', 'duration',
        'fileSize', 'quality', 'format', 'status', 'recordingStatus', 'isPublished', 
        'isFeatured', 'visibility', 'category', 'tags', 'language', 'level', 'metaTitle',
        'metaDescription', 'processingStatus', 'processingProgress', 'errorMessage',
        'requiresApproval', 'accessCode', 'allowedUsers', 'driveFileId', 'instructorEmail',
        'participantEmails', 'attendeeCount', 'scheduledTime', 'sessionEndTime',
        'actualStartTime', 'actualEndTime', 'recordingAvailableFrom', 'maxParticipants',
        'enableRecording'
      ];

      // Filter updates to only include allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      const updateData = {
        ...filteredUpdates,
        updatedAt: serverTimestamp()
      };

      // Handle Drive file ID extraction if recording URL is updated
      if (updates.recordingUrl && !updates.driveFileId) {
        const driveFileId = recordingService.extractDriveFileId(updates.recordingUrl);
        if (driveFileId) {
          updateData.driveFileId = driveFileId;
          updateData.recordingStatus = 'available';
        }
      }

      // Handle publication timestamp
      if (updates.isPublished && !updates.publishedAt) {
        const recording = await recordingService.getRecordingById(recordingId);
        if (recording && !recording.publishedAt) {
          updateData.publishedAt = serverTimestamp();
        }
      }

      // Sanitize update data
      const sanitizedUpdateData = sanitizeRecordingData(updateData);

      await updateDoc(doc(db, 'recordings', recordingId), sanitizedUpdateData);
      console.log('✅ Recording updated successfully with Meet data:', recordingId);
      
      return {
        success: true,
        recordingId,
        updatedFields: Object.keys(filteredUpdates)
      };
    } catch (error) {
      console.error('❌ Error updating recording:', error);
      throw new Error(`Failed to update recording: ${error.message}`);
    }
  },

  // Update student progress for a recording
  updateStudentProgress: async (recordingId, studentId, progressData) => {
    try {
      console.log('🔄 Updating student progress:', { recordingId, studentId });
      
      const updateData = {
        [`studentProgress.${studentId}`]: {
          progress: progressData.progress || 0,
          watched: progressData.watched || false,
          lastWatched: serverTimestamp(),
          completedAt: progressData.progress >= 95 ? serverTimestamp() : null,
          ...progressData
        },
        updatedAt: serverTimestamp()
      };

      // If student completed watching, add to completedBy array
      if (progressData.progress >= 95) {
        const recording = await recordingService.getRecordingById(recordingId);
        const completedBy = recording.completedBy || [];
        if (!completedBy.includes(studentId)) {
          updateData.completedBy = arrayUnion(studentId);
        }
      }

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Student progress updated successfully');
      
      return {
        success: true,
        recordingId,
        studentId,
        progress: progressData.progress
      };
    } catch (error) {
      console.error('❌ Error updating student progress:', error);
      throw new Error(`Failed to update student progress: ${error.message}`);
    }
  },

  // Increment recording views
  incrementRecordingViews: async (recordingId) => {
    try {
      const recording = await recordingService.getRecordingById(recordingId);
      if (!recording) return;

      const newViews = (recording.views || 0) + 1;
      
      await updateDoc(doc(db, 'recordings', recordingId), {
        views: newViews,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Recording views incremented:', { recordingId, newViews });
    } catch (error) {
      console.error('❌ Error incrementing recording views:', error);
      // Don't throw error for non-critical updates
    }
  },

  // Update recording rating
  updateRecordingRating: async (recordingId, rating, studentId) => {
    try {
      console.log('🔄 Updating recording rating:', { recordingId, rating });
      
      const recording = await recordingService.getRecordingById(recordingId);
      if (!recording) {
        throw new Error('Recording not found');
      }

      // Calculate new average rating
      const totalRatings = (recording.totalRatings || 0) + 1;
      const averageRating = ((recording.averageRating || 0) * (totalRatings - 1) + rating) / totalRatings;

      const updateData = {
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        updatedAt: serverTimestamp()
      };

      // Store individual rating if student ID provided
      if (studentId) {
        updateData[`ratings.${studentId}`] = {
          rating,
          ratedAt: serverTimestamp()
        };
      }

      await updateDoc(doc(db, 'recordings', recordingId), updateData);

      console.log('✅ Recording rating updated:', { recordingId, averageRating, totalRatings });
      
      return {
        success: true,
        recordingId,
        averageRating,
        totalRatings
      };
    } catch (error) {
      console.error('❌ Error updating recording rating:', error);
      throw new Error(`Failed to update recording rating: ${error.message}`);
    }
  },

  // Publish recording
  publishRecording: async (recordingId) => {
    try {
      console.log('🔄 Publishing recording:', recordingId);
      
      const updateData = {
        isPublished: true,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording published successfully:', recordingId);
      
      return {
        success: true,
        recordingId,
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error publishing recording:', error);
      throw new Error(`Failed to publish recording: ${error.message}`);
    }
  },

  // Unpublish recording
  unpublishRecording: async (recordingId) => {
    try {
      console.log('🔄 Unpublishing recording:', recordingId);
      
      const updateData = {
        isPublished: false,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'recordings', recordingId), updateData);
      console.log('✅ Recording unpublished successfully:', recordingId);
      
      return {
        success: true,
        recordingId
      };
    } catch (error) {
      console.error('❌ Error unpublishing recording:', error);
      throw new Error(`Failed to unpublish recording: ${error.message}`);
    }
  },

  // Delete recording (soft delete by unpublishing)
  deleteRecording: async (recordingId) => {
    try {
      console.log('🔄 Deleting recording:', recordingId);
      
      // Instead of hard delete, we unpublish the recording
      return await recordingService.unpublishRecording(recordingId);
    } catch (error) {
      console.error('❌ Error deleting recording:', error);
      throw new Error(`Failed to delete recording: ${error.message}`);
    }
  },

  // Hard delete recording (admin only - use with caution)
  hardDeleteRecording: async (recordingId) => {
    try {
      console.log('🔄 Hard deleting recording:', recordingId);
      
      // Check if recording exists
      const recording = await recordingService.getRecordingById(recordingId);
      if (!recording) {
        throw new Error('Recording not found');
      }

      await deleteDoc(doc(db, 'recordings', recordingId));
      console.log('✅ Recording hard deleted successfully:', recordingId);
      
      return {
        success: true,
        recordingId,
        deletedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error hard deleting recording:', error);
      throw new Error(`Failed to hard delete recording: ${error.message}`);
    }
  },

  // Search recordings with advanced filtering
  searchRecordings: async (searchTerm, filters = {}) => {
    try {
      console.log('🔄 Searching recordings:', { searchTerm, filters });
      
      const {
        category = 'all',
        level = 'all',
        status = 'completed',
        minDuration = null,
        maxDuration = null,
        minRating = null,
        sortBy = 'relevance'
      } = filters;

      // Get all published recordings first
      let recordings = await recordingService.getAllRecordings({
        status: 'completed',
        isPublished: true,
        limit: 1000
      });

      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        recordings = recordings.filter(recording => 
          recording.title?.toLowerCase().includes(searchLower) ||
          recording.description?.toLowerCase().includes(searchLower) ||
          recording.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          recording.instructorName?.toLowerCase().includes(searchLower) ||
          recording.category?.toLowerCase().includes(searchLower)
        );
      }

      // Apply category filter
      if (category !== 'all') {
        recordings = recordings.filter(recording => recording.category === category);
      }

      // Apply level filter
      if (level !== 'all') {
        recordings = recordings.filter(recording => recording.level === level);
      }

      // Apply duration filters
      if (minDuration !== null) {
        recordings = recordings.filter(recording => recording.duration >= minDuration);
      }
      if (maxDuration !== null) {
        recordings = recordings.filter(recording => recording.duration <= maxDuration);
      }

      // Apply rating filter
      if (minRating !== null) {
        recordings = recordings.filter(recording => recording.averageRating >= minRating);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          recordings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'popular':
          recordings.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case 'rating':
          recordings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
        case 'duration':
          recordings.sort((a, b) => (b.duration || 0) - (a.duration || 0));
          break;
        case 'relevance':
        default:
          // Default sorting by relevance (featured first, then by views)
          recordings.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return (b.views || 0) - (a.views || 0);
          });
          break;
      }

      console.log(`✅ Found ${recordings.length} recordings matching search criteria`);
      return recordings;
    } catch (error) {
      console.error('❌ Error searching recordings:', error);
      throw new Error(`Failed to search recordings: ${error.message}`);
    }
  },

  // Get recording statistics with Google Meet data
  getRecordingStats: async (instructorId = null) => {
    try {
      console.log('🔄 Fetching recording statistics with Meet data');
      
      let baseQuery = collection(db, 'recordings');
      if (instructorId) {
        baseQuery = query(baseQuery, where('instructorId', '==', instructorId));
      }

      const [
        totalRecordingsCount,
        publishedRecordingsCount,
        availableRecordingsCount,
        scheduledSessionsCount,
        allRecordings
      ] = await Promise.all([
        getCountFromServer(baseQuery),
        getCountFromServer(query(baseQuery, where('isPublished', '==', true))),
        getCountFromServer(query(baseQuery, where('recordingStatus', '==', 'available'))),
        getCountFromServer(query(baseQuery, where('status', '==', 'scheduled'))),
        recordingService.getAllRecordings({ limit: 1000, instructorId })
      ]);

      const stats = {
        total: totalRecordingsCount.data().count,
        published: publishedRecordingsCount.data().count,
        available: availableRecordingsCount.data().count,
        scheduled: scheduledSessionsCount.data().count,
        processing: allRecordings.filter(r => r.recordingStatus === 'processing').length,
        
        // Calculate additional metrics
        totalViews: allRecordings.reduce((sum, recording) => sum + (recording.views || 0), 0),
        totalDuration: allRecordings.reduce((sum, recording) => sum + (recording.duration || 0), 0),
        averageRating: allRecordings.length > 0 
          ? allRecordings.reduce((sum, recording) => sum + (recording.averageRating || 0), 0) / allRecordings.length
          : 0,
        
        // Google Meet specific stats
        totalMeetSessions: allRecordings.filter(r => r.meetLink).length,
        recordedSessions: allRecordings.filter(r => r.recordingStatus === 'available').length,
        upcomingSessions: allRecordings.filter(r => r.status === 'scheduled').length,
        
        // Status distribution
        statuses: allRecordings.reduce((acc, recording) => {
          const status = recording.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        
        // Recording status distribution
        recordingStatuses: allRecordings.reduce((acc, recording) => {
          const status = recording.recordingStatus || 'not_started';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      };

      console.log('✅ Recording statistics with Meet data fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching recording statistics:', error);
      throw new Error(`Failed to fetch recording statistics: ${error.message}`);
    }
  },

  // Get total recordings count
  getTotalRecordings: async () => {
    try {
      console.log('🔄 Getting total recordings count');
      const coll = collection(db, 'recordings');
      const snapshot = await getCountFromServer(coll);
      const count = snapshot.data().count;
      console.log('✅ Total recordings count:', count);
      return count;
    } catch (error) {
      console.error('❌ Error getting recordings count:', error);
      return 0;
    }
  },

  // Bulk update recordings (admin only)
  bulkUpdateRecordings: async (recordingIds, updates) => {
    try {
      console.log('🔄 Bulk updating recordings:', { recordingIds: recordingIds.length, updates });
      
      if (!recordingIds.length) {
        return { success: true, updatedCount: 0 };
      }
      
      const batch = writeBatch(db);
      const updateTime = serverTimestamp();

      recordingIds.forEach(recordingId => {
        const recordingRef = doc(db, 'recordings', recordingId);
        batch.update(recordingRef, {
          ...updates,
          updatedAt: updateTime
        });
      });

      await batch.commit();
      console.log('✅ Recordings bulk updated successfully:', recordingIds.length);
      
      return { 
        success: true, 
        updatedCount: recordingIds.length,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error bulk updating recordings:', error);
      throw new Error(`Failed to bulk update recordings: ${error.message}`);
    }
  },

  // Validate recording data before creation/update
  validateRecordingData: (recordingData, isUpdate = false) => {
    const errors = [];

    if (!isUpdate || recordingData.title !== undefined) {
      if (!recordingData.title || recordingData.title.trim().length === 0) {
        errors.push('Recording title is required');
      }
      if (recordingData.title && recordingData.title.length > 100) {
        errors.push('Recording title must be less than 100 characters');
      }
    }

    if (recordingData.description && recordingData.description.length > 2000) {
      errors.push('Recording description must be less than 2000 characters');
    }

    if (recordingData.duration !== undefined && recordingData.duration < 0) {
      errors.push('Duration cannot be negative');
    }

    if (recordingData.fileSize !== undefined && recordingData.fileSize < 0) {
      errors.push('File size cannot be negative');
    }

    if (recordingData.tags && recordingData.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    // Google Meet specific validations
    if (recordingData.meetLink && !recordingData.meetLink.includes('meet.google.com')) {
      errors.push('Invalid Google Meet link');
    }

    if (recordingData.recordingUrl && !recordingService.recordingWorkflow.validateDriveUrl(recordingData.recordingUrl)) {
      errors.push('Invalid Google Drive recording URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Manual workflow helper methods
  recordingWorkflow: {
    // Steps for instructors to follow
    getRecordingSteps: () => [
      "1. Create Google Meet session manually",
      "2. Save Meet link in your platform",
      "3. Start session at scheduled time",
      "4. Click 'Record meeting' in Google Meet",
      "5. Teach your session",
      "6. End meeting or stop recording",
      "7. Wait for recording to process (5-60 minutes)",
      "8. Find recording in Google Drive 'Meet Recordings' folder",
      "9. Get shareable link and update in platform"
    ],

    // Steps to get shareable link from Google Drive
    getShareableLinkSteps: () => [
      "1. Go to drive.google.com",
      "2. Navigate to 'Meet Recordings' folder",
      "3. Find your recording file",
      "4. Right-click → 'Share'",
      "5. Set permission to 'Anyone with link can view'",
      "6. Copy the shareable link",
      "7. Paste in your platform to update the session"
    ],

    // Validate Google Drive URL
    validateDriveUrl: (url) => {
      return url && url.includes('drive.google.com') && url.includes('/file/d/');
    },

    // Check if recording should be available based on processing time
    shouldRecordingBeAvailable: (recording) => {
      if (!recording?.actualEndTime) return false;
      
      const endTime = new Date(recording.actualEndTime);
      const now = new Date();
      const timeDiff = (now - endTime) / (1000 * 60); // difference in minutes
      
      return timeDiff >= RECORDING_PROCESSING_TIME;
    }
  }
};

export default recordingService;