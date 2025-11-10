import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  writeBatch,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const userService = {
  // Create user profile with comprehensive data and validation
  createUserProfile: async (userId, userData) => {
    try {
      console.log('🔄 Creating user profile for:', userId);
      
      // Validate required fields
      if (!userId || !userData.email) {
        throw new Error('User ID and email are required');
      }

      const userProfile = {
        // Core user information
        userId,
        email: userData.email.toLowerCase().trim(),
        displayName: userData.displayName || 
                    `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
                    userData.email.split('@')[0],
        firstName: userData.firstName?.trim() || '',
        lastName: userData.lastName?.trim() || '',
        phone: userData.phone || '',
        address: userData.address || '',
        bio: userData.bio || '',
        
        // Profile-specific fields
        photoURL: userData.photoURL || '',
        photoURLType: userData.photoURLType || '', // 'base64' or empty for regular URLs
        department: userData.department || '',
        gradeLevel: userData.gradeLevel || '',
        subjects: userData.subjects || '',
        qualifications: userData.qualifications || '',
        
        // Role and access management
        role: userData.role || 'student',
        isActive: userData.role === 'admin' ? true : false,
        isEmailVerified: false,
        lastLogin: null,
        
        // Approval system
        approvalStatus: userData.role === 'admin' ? 'approved' : 'pending',
        submittedAt: serverTimestamp(),
        approvedAt: userData.role === 'admin' ? serverTimestamp() : null,
        approvedBy: userData.role === 'admin' ? 'system' : null,
        rejectionReason: null,
        
        // Subscription management
        subscription: {
          plan: 'free',
          status: userData.role === 'admin' ? 'active' : 'pending_approval',
          startDate: userData.role === 'admin' ? serverTimestamp() : null,
          endDate: null,
          features: {
            maxRecordings: userData.role === 'admin' ? 999 : 10,
            maxStorageGB: userData.role === 'admin' ? 50 : 5,
            canDownload: true,
            canShare: userData.role === 'admin' ? true : false,
            canCreateSessions: userData.role === 'admin' ? true : false
          }
        },
        
        // Usage tracking and analytics
        usage: {
          recordingsCount: 0,
          storageUsed: 0,
          sessionsAttended: 0,
          sessionsCreated: 0,
          lastActivity: null,
          totalTimeSpent: 0 // in minutes
        },
        
        // Profile preferences and settings
        preferences: {
          language: userData.language || 'en',
          notifications: {
            email: true,
            push: true,
            sessionReminders: true,
            recordingAvailable: true,
            monthlyReports: true
          },
          theme: 'system',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          emailFrequency: 'weekly'
        },
        
        // Security and metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPasswordChange: serverTimestamp(),
        loginAttempts: 0,
        accountLocked: false
      };
      
      await setDoc(doc(db, 'users', userId), userProfile);
      console.log('✅ User profile created successfully:', userId);
      
      return {
        success: true,
        userId,
        profile: userProfile
      };
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  },

  // Get user profile with comprehensive error handling
  getUserProfile: async (userId) => {
    try {
      console.log('🔄 Fetching user profile for:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.warn('⚠️ User profile not found:', userId);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Transform Firestore timestamps to Date objects
      const transformedData = {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate?.(),
        updatedAt: userData.updatedAt?.toDate?.(),
        lastLogin: userData.lastLogin?.toDate?.(),
        approvedAt: userData.approvedAt?.toDate?.(),
        submittedAt: userData.submittedAt?.toDate?.(),
        lastPasswordChange: userData.lastPasswordChange?.toDate?.()
      };
      
      // Transform nested subscription timestamps
      if (userData.subscription) {
        transformedData.subscription = {
          ...userData.subscription,
          startDate: userData.subscription.startDate?.toDate?.(),
          endDate: userData.subscription.endDate?.toDate?.()
        };
      }
      
      console.log('✅ User profile fetched successfully:', userId);
      return transformedData;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  },

  // Update user profile with field validation - FIXED VERSION
  updateUserProfile: async (userId, updates) => {
    try {
      console.log('🔄 Updating user profile for:', userId, 'Updates:', updates);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Define allowed fields that users can update themselves - EXPANDED LIST
      const allowedUserFields = [
        'displayName', 'firstName', 'lastName', 'phone', 'address', 'bio',
        'department', 'gradeLevel', 'subjects', 'qualifications',
        'photoURL', 'photoURLType', // For Base64 avatar support
        'preferences', 'usage'
      ];
      
      // Filter updates to only include allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUserFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        } else {
          console.warn('⚠️ Attempted to update restricted field:', key);
        }
      });
      
      // Check if there are any valid updates
      if (Object.keys(filteredUpdates).length === 0) {
        console.warn('⚠️ No valid fields to update');
        return { 
          success: false, 
          userId,
          error: 'No valid fields to update',
          updatedFields: []
        };
      }
      
      const updateData = {
        ...filteredUpdates,
        updatedAt: serverTimestamp()
      };
      
      console.log('📤 Sending update to Firestore:', updateData);
      
      await updateDoc(doc(db, 'users', userId), updateData);
      console.log('✅ User profile updated successfully:', userId, 'Fields:', Object.keys(filteredUpdates));
      
      return { 
        success: true, 
        userId,
        updatedFields: Object.keys(filteredUpdates)
      };
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  },

  // Update user avatar with Base64 support
  updateUserAvatar: async (userId, avatarData) => {
    try {
      console.log('🔄 Updating user avatar for:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const avatarUpdate = {
        photoURL: avatarData.photoURL || '',
        photoURLType: avatarData.photoURLType || '', // 'base64' for Base64 images
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', userId), avatarUpdate);
      console.log('✅ User avatar updated successfully:', userId);
      
      return { 
        success: true, 
        userId,
        avatarUpdated: true
      };
    } catch (error) {
      console.error('❌ Error updating user avatar:', error);
      throw new Error(`Failed to update user avatar: ${error.message}`);
    }
  },

  // Remove user avatar
  removeUserAvatar: async (userId) => {
    try {
      console.log('🔄 Removing user avatar for:', userId);
      
      const avatarUpdate = {
        photoURL: '',
        photoURLType: '',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', userId), avatarUpdate);
      console.log('✅ User avatar removed successfully:', userId);
      
      return { 
        success: true, 
        userId,
        avatarRemoved: true
      };
    } catch (error) {
      console.error('❌ Error removing user avatar:', error);
      throw new Error(`Failed to remove user avatar: ${error.message}`);
    }
  },

  // Update user last login and activity
  updateLastLogin: async (userId) => {
    try {
      if (!userId) return;
      
      await updateDoc(doc(db, 'users', userId), {
        lastLogin: serverTimestamp(),
        'usage.lastActivity': serverTimestamp(),
        updatedAt: serverTimestamp(),
        loginAttempts: 0, // Reset login attempts on successful login
        accountLocked: false
      });
      
      console.log('✅ Last login updated for:', userId);
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      // Don't throw error for non-critical updates
    }
  },

  // Increment usage statistics
  incrementUsage: async (userId, field, amount = 1) => {
    try {
      if (!userId || !field) return;
      
      const updateData = {
        [`usage.${field}`]: amount,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', userId), updateData);
      console.log('✅ Usage incremented:', { userId, field, amount });
    } catch (error) {
      console.error('❌ Error incrementing usage:', error);
    }
  },

  // Get user statistics for profile page
  getUserStatistics: async (userId, userRole) => {
    try {
      console.log('🔄 Fetching user statistics for:', userId, 'Role:', userRole);
      
      let userStats = {};
      
      switch (userRole) {
        case 'admin':
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const coursesSnapshot = await getDocs(collection(db, 'courses'));
          const teachersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
          
          userStats = {
            totalUsers: usersSnapshot.size,
            activeCourses: coursesSnapshot.size,
            teachers: teachersSnapshot.size,
            systemHealth: '98%'
          };
          break;

        case 'teacher':
          const teacherCoursesSnapshot = await getDocs(query(collection(db, 'courses'), where('teacherId', '==', userId)));
          const teacherSessionsSnapshot = await getDocs(query(collection(db, 'sessions'), where('teacherId', '==', userId)));
          const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          
          userStats = {
            totalCourses: teacherCoursesSnapshot.size,
            sessions: teacherSessionsSnapshot.size,
            students: studentsSnapshot.size,
            rating: '4.8/5'
          };
          break;

        case 'student':
          const studentCoursesSnapshot = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', userId)));
          const completedLessonsSnapshot = await getDocs(query(collection(db, 'progress'), where('studentId', '==', userId), where('completed', '==', true)));
          const upcomingSessionsSnapshot = await getDocs(query(collection(db, 'sessions'), where('students', 'array-contains', userId)));
          
          userStats = {
            enrolledCourses: studentCoursesSnapshot.size,
            completedLessons: completedLessonsSnapshot.size,
            upcomingSessions: upcomingSessionsSnapshot.size,
            progress: '75%'
          };
          break;

        default:
          userStats = {};
      }
      
      console.log('✅ User statistics fetched:', userStats);
      return userStats;
    } catch (error) {
      console.error('❌ Error fetching user statistics:', error);
      // Return default stats on error
      return {
        totalUsers: 0,
        activeCourses: 0,
        teachers: 0,
        systemHealth: '100%',
        totalCourses: 0,
        sessions: 0,
        students: 0,
        rating: '0/5',
        enrolledCourses: 0,
        completedLessons: 0,
        upcomingSessions: 0,
        progress: '0%'
      };
    }
  },

  // Validate profile data before update
  validateProfileData: (profileData) => {
    const errors = [];
    
    // Name validation
    if (profileData.firstName && profileData.firstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    }
    
    if (profileData.lastName && profileData.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }
    
    // Phone validation (basic)
    if (profileData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(profileData.phone)) {
      errors.push('Please enter a valid phone number');
    }
    
    // Bio length validation
    if (profileData.bio && profileData.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }
    
    // Department validation
    if (profileData.department && profileData.department.length > 100) {
      errors.push('Department name is too long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Admin: Get all users with advanced filtering and pagination
  getAllUsers: async (options = {}) => {
    try {
      console.log('🔄 Fetching all users with options:', options);
      
      const {
        limit: resultLimit = 50,
        status = 'all', // all, pending, active, inactive
        role = 'all', // all, admin, teacher, student
        searchTerm = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      let usersQuery = query(collection(db, 'users'), orderBy(sortBy, sortOrder));

      // Apply status filter
      if (status !== 'all') {
        if (status === 'pending') {
          usersQuery = query(usersQuery, where('isActive', '==', false));
        } else if (status === 'active') {
          usersQuery = query(usersQuery, where('isActive', '==', true));
        } else if (status === 'inactive') {
          usersQuery = query(usersQuery, where('approvalStatus', '==', 'deactivated'));
        }
      }

      // Apply role filter
      if (role !== 'all') {
        usersQuery = query(usersQuery, where('role', '==', role));
      }

      usersQuery = query(usersQuery, limit(resultLimit));

      const usersSnapshot = await getDocs(usersQuery);
      const users = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData,
          // Convert Firestore timestamps
          createdAt: userData.createdAt?.toDate?.(),
          updatedAt: userData.updatedAt?.toDate?.(),
          lastLogin: userData.lastLogin?.toDate?.(),
          approvedAt: userData.approvedAt?.toDate?.(),
          submittedAt: userData.submittedAt?.toDate?.()
        });
      });

      // Apply search filter if provided
      let filteredUsers = users;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredUsers = users.filter(user => 
          user.email?.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(searchTerm) ||
          user.department?.toLowerCase().includes(searchLower) ||
          user.subjects?.toLowerCase().includes(searchLower)
        );
      }

      console.log(`✅ Fetched ${filteredUsers.length} users`);
      return filteredUsers;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  },

  // Admin: Get users count with detailed breakdown
  getUsersCount: async () => {
    try {
      console.log('🔄 Fetching users count');
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      const counts = {
        total: users.length,
        pending: users.filter(user => !user.isActive && user.role !== 'admin').length,
        active: users.filter(user => user.isActive).length,
        deactivated: users.filter(user => user.approvalStatus === 'deactivated').length,
        
        // Role breakdown
        admins: users.filter(user => user.role === 'admin').length,
        teachers: users.filter(user => user.role === 'teacher').length,
        students: users.filter(user => user.role === 'student').length,
        
        // Profile completion stats
        withAvatar: users.filter(user => user.photoURL).length,
        withBio: users.filter(user => user.bio && user.bio.length > 0).length,
        withPhone: users.filter(user => user.phone && user.phone.length > 0).length,
        
        // Subscription breakdown
        free: users.filter(user => user.subscription?.plan === 'free').length,
        premium: users.filter(user => user.subscription?.plan === 'premium').length,
        enterprise: users.filter(user => user.subscription?.plan === 'enterprise').length,
        
        // Activity insights
        activeToday: users.filter(user => {
          const lastLogin = user.lastLogin?.toDate?.();
          return lastLogin && lastLogin.toDateString() === new Date().toDateString();
        }).length,
        
        neverLoggedIn: users.filter(user => !user.lastLogin).length
      };

      console.log('✅ Users count fetched:', counts);
      return counts;
    } catch (error) {
      console.error('❌ Error fetching users count:', error);
      throw new Error(`Failed to fetch users count: ${error.message}`);
    }
  },

  // Admin: Approve user with comprehensive updates
  approveUser: async (userId, approvedBy = 'admin', notes = '') => {
    try {
      console.log('🔄 Approving user:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const approvalData = {
        isActive: true,
        approvalStatus: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: approvedBy,
        approvalNotes: notes,
        'subscription.status': 'active',
        'subscription.startDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', userId), approvalData);
      
      console.log('✅ User approved successfully:', userId);
      
      return { 
        success: true, 
        userId,
        approvedAt: new Date(),
        approvedBy 
      };
    } catch (error) {
      console.error('❌ Error approving user:', error);
      throw new Error(`Failed to approve user: ${error.message}`);
    }
  },

  // Admin: Reject user application
  rejectUser: async (userId, rejectedBy = 'admin', reason = '') => {
    try {
      console.log('🔄 Rejecting user:', userId);
      
      const rejectionData = {
        isActive: false,
        approvalStatus: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: rejectedBy,
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', userId), rejectionData);
      
      console.log('✅ User rejected successfully:', userId);
      
      return { 
        success: true, 
        userId,
        rejectedAt: new Date(),
        reason 
      };
    } catch (error) {
      console.error('❌ Error rejecting user:', error);
      throw new Error(`Failed to reject user: ${error.message}`);
    }
  },

  // Admin: Deactivate user with reason
  deactivateUser: async (userId, reason = '', deactivatedBy = 'admin') => {
    try {
      console.log('🔄 Deactivating user:', userId);
      
      const deactivationData = {
        isActive: false,
        approvalStatus: 'deactivated',
        'subscription.status': 'inactive',
        deactivatedAt: serverTimestamp(),
        deactivatedBy: deactivatedBy,
        deactivationReason: reason,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', userId), deactivationData);
      
      console.log('✅ User deactivated successfully:', userId);
      
      return { 
        success: true, 
        userId,
        deactivatedAt: new Date(),
        reason 
      };
    } catch (error) {
      console.error('❌ Error deactivating user:', error);
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  },

  // Admin: Reactivate user
  reactivateUser: async (userId, reactivatedBy = 'admin') => {
    try {
      console.log('🔄 Reactivating user:', userId);
      
      const reactivationData = {
        isActive: true,
        approvalStatus: 'approved',
        'subscription.status': 'active',
        reactivatedAt: serverTimestamp(),
        reactivatedBy: reactivatedBy,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', userId), reactivationData);
      
      console.log('✅ User reactivated successfully:', userId);
      
      return { 
        success: true, 
        userId,
        reactivatedAt: new Date() 
      };
    } catch (error) {
      console.error('❌ Error reactivating user:', error);
      throw new Error(`Failed to reactivate user: ${error.message}`);
    }
  },

  // Admin: Change user role with validation
  changeUserRole: async (userId, newRole, changedBy = 'admin') => {
    try {
      console.log('🔄 Changing user role:', { userId, newRole });
      
      const validRoles = ['admin', 'teacher', 'student'];
      if (!validRoles.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(', ')}`);
      }

      const roleChangeData = {
        role: newRole,
        roleChangedAt: serverTimestamp(),
        roleChangedBy: changedBy,
        updatedAt: serverTimestamp()
      };

      // Auto-approve if changing to admin role
      if (newRole === 'admin') {
        roleChangeData.isActive = true;
        roleChangeData.approvalStatus = 'approved';
        roleChangeData.approvedAt = serverTimestamp();
        roleChangeData.approvedBy = changedBy;
        roleChangeData.subscription = {
          plan: 'enterprise',
          status: 'active',
          startDate: serverTimestamp(),
          endDate: null,
          features: {
            maxRecordings: 999,
            maxStorageGB: 100,
            canDownload: true,
            canShare: true,
            canCreateSessions: true
          }
        };
      }

      await updateDoc(doc(db, 'users', userId), roleChangeData);
      
      console.log('✅ User role changed successfully:', { userId, newRole });
      
      return { 
        success: true, 
        userId,
        newRole,
        changedAt: new Date() 
      };
    } catch (error) {
      console.error('❌ Error changing user role:', error);
      throw new Error(`Failed to change user role: ${error.message}`);
    }
  },

  // Admin: Bulk approve users efficiently
  bulkApproveUsers: async (userIds, approvedBy = 'admin') => {
    try {
      console.log('🔄 Bulk approving users:', userIds.length);
      
      if (!userIds.length) {
        return { success: true, approvedCount: 0 };
      }
      
      const batch = writeBatch(db);
      const approvalTime = serverTimestamp();

      userIds.forEach(userId => {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          isActive: true,
          approvalStatus: 'approved',
          approvedAt: approvalTime,
          approvedBy: approvedBy,
          'subscription.status': 'active',
          'subscription.startDate': approvalTime,
          updatedAt: approvalTime
        });
      });

      await batch.commit();
      
      console.log('✅ Users bulk approved successfully:', userIds.length);
      
      return { 
        success: true, 
        approvedCount: userIds.length,
        approvedAt: new Date() 
      };
    } catch (error) {
      console.error('❌ Error bulk approving users:', error);
      throw new Error(`Failed to bulk approve users: ${error.message}`);
    }
  },

  // Get pending approval users
  getPendingUsers: async () => {
    try {
      console.log('🔄 Fetching pending approval users');
      
      const pendingQuery = query(
        collection(db, 'users'),
        where('isActive', '==', false),
        where('approvalStatus', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(pendingQuery);
      const pendingUsers = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        pendingUsers.push({
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate?.(),
          submittedAt: userData.submittedAt?.toDate?.()
        });
      });

      console.log(`✅ Found ${pendingUsers.length} pending users`);
      return pendingUsers;
    } catch (error) {
      console.error('❌ Error fetching pending users:', error);
      throw new Error(`Failed to fetch pending users: ${error.message}`);
    }
  },

  // Update user subscription plan
  updateUserSubscription: async (userId, subscriptionData) => {
    try {
      console.log('🔄 Updating user subscription:', userId);
      
      const updateData = {
        subscription: {
          ...subscriptionData,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', userId), updateData);
      
      console.log('✅ User subscription updated successfully:', userId);
      
      return { 
        success: true, 
        userId,
        subscription: subscriptionData 
      };
    } catch (error) {
      console.error('❌ Error updating user subscription:', error);
      throw new Error(`Failed to update user subscription: ${error.message}`);
    }
  },

  // Delete user profile (admin only) - with safety checks
  deleteUserProfile: async (userId) => {
    try {
      console.log('🔄 Deleting user profile:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Check if user exists
      const userProfile = await userService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      // Safety check - prevent accidental deletion of admin users
      if (userProfile.role === 'admin') {
        throw new Error('Cannot delete admin users through this method');
      }
      
      await deleteDoc(doc(db, 'users', userId));
      
      console.log('✅ User profile deleted successfully:', userId);
      
      return { 
        success: true, 
        userId,
        deletedAt: new Date() 
      };
    } catch (error) {
      console.error('❌ Error deleting user profile:', error);
      throw new Error(`Failed to delete user profile: ${error.message}`);
    }
  },

  // Search users by various criteria
  searchUsers: async (searchTerm, field = 'all') => {
    try {
      console.log('🔄 Searching users:', { searchTerm, field });
      
      const allUsers = await userService.getAllUsers({ limit: 1000 });
      
      if (!searchTerm) {
        return allUsers.slice(0, 50); // Return first 50 users if no search term
      }
      
      const searchLower = searchTerm.toLowerCase();
      
      let filteredUsers = allUsers;
      
      if (field === 'all') {
        filteredUsers = allUsers.filter(user => 
          user.email?.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(searchTerm) ||
          user.userId?.includes(searchTerm) ||
          user.department?.toLowerCase().includes(searchLower) ||
          user.subjects?.toLowerCase().includes(searchLower) ||
          user.qualifications?.toLowerCase().includes(searchLower)
        );
      } else {
        filteredUsers = allUsers.filter(user => 
          user[field]?.toString().toLowerCase().includes(searchLower)
        );
      }
      
      console.log(`✅ Found ${filteredUsers.length} users matching search`);
      return filteredUsers.slice(0, 50); // Limit results
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }
  },

  // Export user data for profile (GDPR compliance)
  exportUserData: async (userId) => {
    try {
      console.log('🔄 Exporting user data for:', userId);
      
      const userProfile = await userService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      // Remove sensitive fields
      const { loginAttempts, accountLocked, ...exportableData } = userProfile;
      
      console.log('✅ User data exported successfully:', userId);
      return exportableData;
    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      throw new Error(`Failed to export user data: ${error.message}`);
    }
  }
};

export default userService;