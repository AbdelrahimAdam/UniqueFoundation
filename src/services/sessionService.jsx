import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const sessionService = {
  // Create a new session with data structure that matches the modal
  createSession: async (sessionData) => {
    try {
      console.log('🔄 Creating session:', sessionData);
      
      // Map modal field names to session service field names
      const session = {
        // Session details - mapped from modal
        meetLink: sessionData.meetLink,
        topic: sessionData.title || sessionData.topic || 'Untitled Session', // Support both field names
        title: sessionData.title || sessionData.topic || 'Untitled Session', // Add title field for compatibility
        description: sessionData.description || '',
        date: Timestamp.fromDate(new Date(sessionData.scheduledTime || sessionData.date)),
        scheduledTime: Timestamp.fromDate(new Date(sessionData.scheduledTime || sessionData.date)),
        
        // Session settings from modal
        duration: sessionData.duration || 60,
        category: sessionData.category || 'lecture',
        visibility: sessionData.visibility || 'private',
        maxParticipants: sessionData.maxParticipants || 50,
        courseId: sessionData.courseId || 'general',
        enableRecording: sessionData.enableRecording ?? true,
        
        // Status and metadata
        isRecorded: false,
        recordingUrl: '',
        status: 'scheduled', // scheduled, live, completed, cancelled
        recordingStatus: sessionData.enableRecording ? 'not_started' : 'disabled',
        isPublished: (sessionData.visibility === 'public'),
        
        // Instructor information
        instructorId: sessionData.instructorId || sessionData.createdBy,
        instructorEmail: sessionData.instructorEmail,
        instructorName: sessionData.instructorName,
        createdBy: sessionData.instructorId || sessionData.createdBy,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sessionEndTime: sessionData.sessionEndTime ? 
          Timestamp.fromDate(new Date(sessionData.sessionEndTime)) : 
          Timestamp.fromDate(new Date((sessionData.scheduledTime ? new Date(sessionData.scheduledTime).getTime() : Date.now()) + (sessionData.duration || 60) * 60000)),
        
        // Analytics
        participants: [],
        participantCount: 0,
        participantEmails: sessionData.participantEmails || [],
        
        // Course relation
        courseName: sessionData.courseName || ''
      };
      
      // Remove any undefined values that could cause Firebase errors
      Object.keys(session).forEach(key => {
        if (session[key] === undefined) {
          delete session[key];
        }
      });
      
      const docRef = await addDoc(collection(db, 'sessions'), session);
      console.log('✅ Session created successfully:', docRef.id);
      
      return { 
        success: true, 
        id: docRef.id, 
        ...session 
      };
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  },

  // Create session recording - method expected by the modal
  createSessionRecording: async (sessionData) => {
    try {
      console.log('🔄 Creating session recording:', sessionData);
      
      // Ensure sessionId is provided and valid
      if (!sessionData.sessionId) {
        throw new Error('sessionId is required for recording');
      }
      
      // Use the main createSession method but ensure recording fields are set
      const recordingSessionData = {
        ...sessionData,
        enableRecording: true,
        recordingStatus: 'not_started'
      };
      
      return await sessionService.createSession(recordingSessionData);
    } catch (error) {
      console.error('❌ Error creating session recording:', error);
      throw new Error(`Failed to create session recording: ${error.message}`);
    }
  },

  // Get all sessions with comprehensive filtering
  getAllSessions: async (options = {}) => {
    try {
      console.log('🔄 Fetching all sessions');
      
      const {
        limit: resultLimit = 50,
        status = 'all', // all, scheduled, live, completed, cancelled
        isRecorded = 'all', // all, recorded, not_recorded
        dateRange = 'all', // all, upcoming, past
        instructorId = null
      } = options;

      let sessionsQuery = query(collection(db, 'sessions'), orderBy('scheduledTime', 'desc'));

      // Apply status filter
      if (status !== 'all') {
        sessionsQuery = query(sessionsQuery, where('status', '==', status));
      }

      // Apply recording filter
      if (isRecorded !== 'all') {
        sessionsQuery = query(sessionsQuery, where('isRecorded', '==', (isRecorded === 'recorded')));
      }

      // Apply instructor filter
      if (instructorId) {
        sessionsQuery = query(sessionsQuery, where('instructorId', '==', instructorId));
      }

      // Apply date range filter
      if (dateRange === 'upcoming') {
        sessionsQuery = query(sessionsQuery, where('scheduledTime', '>=', Timestamp.now()));
      } else if (dateRange === 'past') {
        sessionsQuery = query(sessionsQuery, where('scheduledTime', '<', Timestamp.now()));
      }

      // Apply limit if specified
      if (resultLimit && resultLimit > 0) {
        sessionsQuery = query(sessionsQuery, limit(resultLimit));
      }

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          // Convert Firestore timestamps to Date objects
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          sessionEndTime: sessionData.sessionEndTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }
  },

  // NEW: Get public sessions for students to view teacher sessions
  getPublicSessions: async (options = {}) => {
    try {
      console.log('🔄 Fetching public sessions for students');
      
      const {
        limit: resultLimit = 50,
        status = 'scheduled', // Default to scheduled sessions
        dateRange = 'upcoming', // Default to upcoming sessions
        instructorId = null
      } = options;

      let sessionsQuery = query(
        collection(db, 'sessions'),
        where('isPublished', '==', true),
        where('status', '==', status),
        orderBy('scheduledTime', 'asc')
      );

      // Apply date range filter
      if (dateRange === 'upcoming') {
        sessionsQuery = query(sessionsQuery, where('scheduledTime', '>=', Timestamp.now()));
      } else if (dateRange === 'past') {
        sessionsQuery = query(sessionsQuery, where('scheduledTime', '<', Timestamp.now()));
      }

      // Apply instructor filter
      if (instructorId) {
        sessionsQuery = query(sessionsQuery, where('instructorId', '==', instructorId));
      }

      // Apply limit if specified
      if (resultLimit && resultLimit > 0) {
        sessionsQuery = query(sessionsQuery, limit(resultLimit));
      }

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          sessionEndTime: sessionData.sessionEndTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} public sessions for students`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching public sessions:', error);
      throw new Error(`Failed to fetch public sessions: ${error.message}`);
    }
  },

  // NEW: Get teacher sessions specifically for student dashboard
  getTeacherSessionsForStudents: async (options = {}) => {
    try {
      console.log('🔄 Fetching teacher sessions for students');
      
      const {
        limit: resultLimit = 20,
        daysAhead = 30 // Default to next 30 days
      } = options;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('isPublished', '==', true),
        where('status', '==', 'scheduled'),
        where('scheduledTime', '>=', Timestamp.fromDate(startDate)),
        where('scheduledTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('scheduledTime', 'asc'),
        limit(resultLimit)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          sessionEndTime: sessionData.sessionEndTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} teacher sessions for students`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching teacher sessions for students:', error);
      throw new Error(`Failed to fetch teacher sessions for students: ${error.message}`);
    }
  },

  // Get sessions for a specific course
  getCourseSessions: async (courseId, options = {}) => {
    try {
      console.log('🔄 Fetching course sessions:', courseId);
      
      const {
        limit: resultLimit = 50
      } = options;

      let sessionsQuery = query(
        collection(db, 'sessions'), 
        where('courseId', '==', courseId),
        orderBy('scheduledTime', 'desc')
      );

      // Apply limit if specified
      if (resultLimit && resultLimit > 0) {
        sessionsQuery = query(sessionsQuery, limit(resultLimit));
      }
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({ 
          id: doc.id, 
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} sessions for course: ${courseId}`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching course sessions:', error);
      throw new Error(`Failed to fetch course sessions: ${error.message}`);
    }
  },

  // Get upcoming sessions for students
  getUpcomingSessions: async (resultLimit = 20) => {
    try {
      console.log('🔄 Fetching upcoming sessions with limit:', resultLimit);
      
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('scheduledTime', '>=', Timestamp.now()),
        where('status', 'in', ['scheduled', 'live']),
        orderBy('scheduledTime', 'asc'),
        limit(resultLimit)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} upcoming sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching upcoming sessions:', error);
      throw new Error(`Failed to fetch upcoming sessions: ${error.message}`);
    }
  },

  // Get upcoming sessions for a specific instructor
  getInstructorUpcomingSessions: async (instructorId, options = {}) => {
    try {
      console.log('🔄 Fetching instructor upcoming sessions:', instructorId);
      
      const {
        limit: resultLimit = 10,
        daysAhead = 7
      } = options;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      let sessionsQuery = query(
        collection(db, 'sessions'),
        where('instructorId', '==', instructorId),
        where('scheduledTime', '>=', Timestamp.fromDate(startDate)),
        where('scheduledTime', '<=', Timestamp.fromDate(endDate)),
        where('status', 'in', ['scheduled', 'live']),
        orderBy('scheduledTime', 'asc')
      );

      if (resultLimit && resultLimit > 0) {
        sessionsQuery = query(sessionsQuery, limit(resultLimit));
      }

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} upcoming sessions for instructor`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching instructor upcoming sessions:', error);
      throw new Error(`Failed to fetch instructor upcoming sessions: ${error.message}`);
    }
  },

  // Get instructor sessions (all)
  getInstructorSessions: async (instructorId, options = {}) => {
    try {
      console.log('🔄 Fetching instructor sessions:', instructorId);
      
      const {
        limit: resultLimit = 50,
        status = 'all'
      } = options;

      let sessionsQuery = query(
        collection(db, 'sessions'),
        where('instructorId', '==', instructorId),
        orderBy('scheduledTime', 'desc')
      );

      if (status !== 'all') {
        sessionsQuery = query(sessionsQuery, where('status', '==', status));
      }

      if (resultLimit && resultLimit > 0) {
        sessionsQuery = query(sessionsQuery, limit(resultLimit));
      }

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} sessions for instructor`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching instructor sessions:', error);
      throw new Error(`Failed to fetch instructor sessions: ${error.message}`);
    }
  },

  // Get recorded sessions
  getRecordedSessions: async (resultLimit = 20) => {
    try {
      console.log('🔄 Fetching recorded sessions');
      
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('isRecorded', '==', true),
        orderBy('scheduledTime', 'desc'),
        limit(resultLimit)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = [];
      sessionsSnapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          date: sessionData.date?.toDate?.(),
          scheduledTime: sessionData.scheduledTime?.toDate?.(),
          createdAt: sessionData.createdAt?.toDate?.(),
          updatedAt: sessionData.updatedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${sessions.length} recorded sessions`);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching recorded sessions:', error);
      throw new Error(`Failed to fetch recorded sessions: ${error.message}`);
    }
  },

  // Get session by ID
  getSessionById: async (sessionId) => {
    try {
      console.log('🔄 Fetching session:', sessionId);
      
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
      
      if (!sessionDoc.exists()) {
        console.warn('⚠️ Session not found:', sessionId);
        return null;
      }
      
      const sessionData = sessionDoc.data();
      console.log('✅ Session fetched successfully:', sessionId);
      
      return {
        id: sessionDoc.id,
        ...sessionData,
        date: sessionData.date?.toDate?.(),
        scheduledTime: sessionData.scheduledTime?.toDate?.(),
        sessionEndTime: sessionData.sessionEndTime?.toDate?.(),
        createdAt: sessionData.createdAt?.toDate?.(),
        updatedAt: sessionData.updatedAt?.toDate?.()
      };
    } catch (error) {
      console.error('❌ Error fetching session:', error);
      throw new Error(`Failed to fetch session: ${error.message}`);
    }
  },

  // Update session with comprehensive validation
  updateSession: async (sessionId, updates) => {
    try {
      console.log('🔄 Updating session:', sessionId);
      
      const allowedFields = [
        'meetLink', 'topic', 'title', 'description', 'scheduledTime', 'date', 'status', 
        'courseId', 'courseName', 'duration', 'category', 'visibility', 'maxParticipants',
        'enableRecording', 'recordingStatus', 'isPublished', 'sessionEndTime'
      ];
      
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
      
      // Convert date to timestamp if provided
      if (updates.scheduledTime && updates.scheduledTime instanceof Date) {
        updateData.scheduledTime = Timestamp.fromDate(updates.scheduledTime);
      }
      if (updates.date && updates.date instanceof Date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }
      if (updates.sessionEndTime && updates.sessionEndTime instanceof Date) {
        updateData.sessionEndTime = Timestamp.fromDate(updates.sessionEndTime);
      }
      
      await updateDoc(doc(db, 'sessions', sessionId), updateData);
      console.log('✅ Session updated successfully:', sessionId);
      
      return { 
        success: true, 
        sessionId,
        updates: filteredUpdates 
      };
    } catch (error) {
      console.error('❌ Error updating session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  },

  // Mark session as recorded with URL
  markAsRecorded: async (sessionId, recordingUrl) => {
    try {
      console.log('🔄 Marking session as recorded:', sessionId);
      
      const updateData = {
        isRecorded: true,
        recordingUrl: recordingUrl,
        recordingStatus: 'completed',
        status: 'completed',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'sessions', sessionId), updateData);
      console.log('✅ Session marked as recorded:', sessionId);
      
      return { 
        success: true, 
        sessionId,
        recordingUrl 
      };
    } catch (error) {
      console.error('❌ Error marking session as recorded:', error);
      throw new Error(`Failed to mark session as recorded: ${error.message}`);
    }
  },

  // Remove recording from session
  removeRecording: async (sessionId) => {
    try {
      console.log('🔄 Removing recording from session:', sessionId);
      
      const updateData = {
        isRecorded: false,
        recordingUrl: '',
        recordingStatus: 'disabled',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'sessions', sessionId), updateData);
      console.log('✅ Recording removed from session:', sessionId);
      
      return { 
        success: true, 
        sessionId 
      };
    } catch (error) {
      console.error('❌ Error removing recording:', error);
      throw new Error(`Failed to remove recording: ${error.message}`);
    }
  },

  // Update session status
  updateSessionStatus: async (sessionId, status) => {
    try {
      console.log('🔄 Updating session status:', { sessionId, status });
      
      const validStatuses = ['scheduled', 'live', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: status,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Session status updated:', { sessionId, status });
      
      return { 
        success: true, 
        sessionId,
        status 
      };
    } catch (error) {
      console.error('❌ Error updating session status:', error);
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  },

  // Add participant to session
  addParticipant: async (sessionId, participantId, participantData = {}) => {
    try {
      console.log('🔄 Adding participant to session:', { sessionId, participantId });
      
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      const participant = {
        id: participantId,
        joinedAt: serverTimestamp(),
        ...participantData
      };
      
      // Update participants array and count
      const updatedParticipants = [...(session.participants || []), participant];
      const updatedEmails = [...new Set([...(session.participantEmails || []), participantData.email].filter(Boolean))];
      
      await updateDoc(doc(db, 'sessions', sessionId), {
        participants: updatedParticipants,
        participantCount: updatedParticipants.length,
        participantEmails: updatedEmails,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Participant added to session:', { sessionId, participantId });
      
      return { 
        success: true, 
        sessionId,
        participantId,
        participantCount: updatedParticipants.length 
      };
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      throw new Error(`Failed to add participant: ${error.message}`);
    }
  },

  // Delete session with validation
  deleteSession: async (sessionId) => {
    try {
      console.log('🔄 Deleting session:', sessionId);
      
      // Check if session exists
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Prevent deletion of sessions with recordings (optional safety check)
      if (session.isRecorded) {
        console.warn('⚠️ Attempting to delete session with recording:', sessionId);
        // You might want to prompt for confirmation in the UI instead
      }
      
      await deleteDoc(doc(db, 'sessions', sessionId));
      console.log('✅ Session deleted successfully:', sessionId);
      
      return { 
        success: true, 
        sessionId,
        hadRecording: session.isRecorded 
      };
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  },

  // Get session statistics
  getSessionStats: async (instructorId = null) => {
    try {
      console.log('🔄 Fetching session statistics');
      
      const options = instructorId ? { instructorId } : {};
      const [allSessions, upcomingSessions, recordedSessions] = await Promise.all([
        sessionService.getAllSessions({ ...options, limit: 1000 }),
        sessionService.getUpcomingSessions(1000),
        sessionService.getRecordedSessions(1000)
      ]);

      // Filter by instructor if specified
      const filteredSessions = instructorId 
        ? allSessions.filter(session => session.instructorId === instructorId)
        : allSessions;
      
      const filteredUpcoming = instructorId
        ? upcomingSessions.filter(session => session.instructorId === instructorId)
        : upcomingSessions;
      
      const filteredRecorded = instructorId
        ? recordedSessions.filter(session => session.instructorId === instructorId)
        : recordedSessions;

      const stats = {
        total: filteredSessions.length,
        upcoming: filteredUpcoming.length,
        recorded: filteredRecorded.length,
        live: filteredSessions.filter(s => s.status === 'live').length,
        completed: filteredSessions.filter(s => s.status === 'completed').length,
        cancelled: filteredSessions.filter(s => s.status === 'cancelled').length,
        
        // Average participants (if available)
        averageParticipants: filteredSessions.length > 0 
          ? filteredSessions.reduce((sum, session) => sum + (session.participantCount || 0), 0) / filteredSessions.length
          : 0,
          
        // Recent activity
        recentSessions: filteredSessions.slice(0, 5)
      };
      
      console.log('✅ Session statistics fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching session statistics:', error);
      throw new Error(`Failed to fetch session statistics: ${error.message}`);
    }
  },

  // Get instructor session statistics (alias for getSessionStats with instructorId)
  getInstructorSessionStats: async (instructorId) => {
    return sessionService.getSessionStats(instructorId);
  }
};

export default sessionService;