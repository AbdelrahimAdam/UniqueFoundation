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
  getCountFromServer
} from 'firebase/firestore'
import { db } from '../config/firebase'

const courseService = {
  // Create a new course with comprehensive validation
  createCourse: async (courseData) => {
    try {
      console.log('🔄 Creating course:', courseData.title);
      
      // Validate required fields
      if (!courseData.title || !courseData.createdBy) {
        throw new Error('Course title and creator are required');
      }

      const course = {
        // Core course information
        title: courseData.title.trim(),
        description: courseData.description || '',
        shortDescription: courseData.shortDescription || courseData.description?.substring(0, 150) || '',
        
        // Course metadata
        category: courseData.category || 'general',
        level: courseData.level || 'beginner', // beginner, intermediate, advanced
        language: courseData.language || 'en',
        tags: courseData.tags || [],
        
        // Media and assets
        thumbnailUrl: courseData.thumbnailUrl || '',
        promoVideoUrl: courseData.promoVideoUrl || '',
        
        // Pricing and access
        isFree: courseData.isFree ?? true,
        price: courseData.price || 0,
        currency: courseData.currency || 'USD',
        accessType: courseData.accessType || 'public', // public, private, enrolled
        
        // Status and visibility
        isPublished: courseData.isPublished ?? false,
        isFeatured: courseData.isFeatured ?? false,
        status: courseData.status || 'draft', // draft, published, archived
        
        // Instructor information
        instructorId: courseData.instructorId,
        instructorName: courseData.instructorName,
        instructorBio: courseData.instructorBio || '',
        
        // Course structure
        sections: courseData.sections || [],
        totalLessons: courseData.totalLessons || 0,
        totalDuration: courseData.totalDuration || 0, // in minutes
        resources: courseData.resources || [],
        
        // Analytics and engagement
        studentsEnrolled: 0,
        totalRatings: 0,
        averageRating: 0,
        completionRate: 0,
        totalViews: 0,
        
        // Requirements and outcomes
        requirements: courseData.requirements || [],
        learningOutcomes: courseData.learningOutcomes || [],
        targetAudience: courseData.targetAudience || [],
        
        // Timestamps and metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
        createdBy: courseData.createdBy,
        
        // SEO and discoverability
        slug: courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        metaTitle: courseData.metaTitle || courseData.title,
        metaDescription: courseData.metaDescription || courseData.description?.substring(0, 160) || '',
        
        // Settings and configuration
        settings: {
          allowDownloads: courseData.settings?.allowDownloads ?? true,
          enableDiscussions: courseData.settings?.enableDiscussions ?? true,
          enableCertificates: courseData.settings?.enableCertificates ?? false,
          requiresApproval: courseData.settings?.requiresApproval ?? false,
          maxStudents: courseData.settings?.maxStudents || 0, // 0 = unlimited
          ...courseData.settings
        }
      };

      const docRef = await addDoc(collection(db, 'courses'), course);
      console.log('✅ Course created successfully:', docRef.id);
      
      return {
        success: true,
        id: docRef.id,
        ...course
      };
    } catch (error) {
      console.error('❌ Error creating course:', error);
      throw new Error(`Failed to create course: ${error.message}`);
    }
  },

  // Get course by ID with comprehensive data
  getCourseById: async (courseId) => {
    try {
      console.log('🔄 Fetching course:', courseId);
      
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      
      if (!courseDoc.exists()) {
        console.warn('⚠️ Course not found:', courseId);
        return null;
      }

      const courseData = courseDoc.data();
      
      // Transform Firestore timestamps to Date objects
      const transformedCourse = {
        id: courseDoc.id,
        ...courseData,
        createdAt: courseData.createdAt?.toDate?.(),
        updatedAt: courseData.updatedAt?.toDate?.(),
        publishedAt: courseData.publishedAt?.toDate?.()
      };

      console.log('✅ Course fetched successfully:', courseId);
      return transformedCourse;
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
  },

  // Get all courses with advanced filtering and pagination
  getAllCourses: async (options = {}) => {
    try {
      console.log('🔄 Fetching all courses with options:', options);
      
      const {
        limit: resultLimit = 50,
        status = 'all', // all, published, draft, archived
        category = 'all',
        level = 'all',
        isFeatured = 'all', // all, featured, not_featured
        instructorId = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        searchTerm = ''
      } = options;

      let coursesQuery = query(collection(db, 'courses'), orderBy(sortBy, sortOrder));

      // Apply status filter
      if (status !== 'all') {
        if (status === 'published') {
          coursesQuery = query(coursesQuery, where('isPublished', '==', true));
        } else if (status === 'draft') {
          coursesQuery = query(coursesQuery, where('isPublished', '==', false));
        } else if (status === 'archived') {
          coursesQuery = query(coursesQuery, where('status', '==', 'archived'));
        }
      }

      // Apply category filter
      if (category !== 'all') {
        coursesQuery = query(coursesQuery, where('category', '==', category));
      }

      // Apply level filter
      if (level !== 'all') {
        coursesQuery = query(coursesQuery, where('level', '==', level));
      }

      // Apply featured filter
      if (isFeatured !== 'all') {
        coursesQuery = query(coursesQuery, where('isFeatured', '==', (isFeatured === 'featured')));
      }

      // Apply instructor filter
      if (instructorId) {
        coursesQuery = query(coursesQuery, where('instructorId', '==', instructorId));
      }

      coursesQuery = query(coursesQuery, limit(resultLimit));

      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => {
        const courseData = doc.data();
        return {
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        };
      });

      // Apply search filter if provided
      let filteredCourses = courses;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredCourses = courses.filter(course => 
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower) ||
          course.shortDescription?.toLowerCase().includes(searchLower) ||
          course.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          course.instructorName?.toLowerCase().includes(searchLower)
        );
      }

      console.log(`✅ Fetched ${filteredCourses.length} courses`);
      return filteredCourses;
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  },

  // Get published courses for students - FIXED VERSION
  getPublishedCourses: async (resultLimit = 20) => {
    try {
      console.log('🔄 Fetching published courses');
      
      const coursesQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        where('status', '!=', 'archived'),
        orderBy('createdAt', 'desc'),
        limit(resultLimit)
      );

      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => {
        const courseData = doc.data();
        return {
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        };
      });

      console.log(`✅ Fetched ${courses.length} published courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching published courses:', error);
      throw new Error(`Failed to fetch published courses: ${error.message}`);
    }
  },

  // Get student courses (enrolled or available)
  getStudentCourses: async (studentId = null, options = {}) => {
    try {
      console.log('🔄 Fetching student courses:', { studentId });
      
      const {
        limit: resultLimit = 20,
        type = 'all' // all, enrolled, available
      } = options;

      // For now, return all published courses
      // In a real app, you would filter by student enrollment
      const coursesQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        where('status', '!=', 'archived'),
        orderBy('createdAt', 'desc'),
        limit(resultLimit)
      );

      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => {
        const courseData = doc.data();
        
        // Check if student is enrolled (placeholder logic)
        const isEnrolled = studentId ? 
          courseData.enrolledStudents?.includes(studentId) || false :
          false;

        return {
          id: doc.id,
          ...courseData,
          isEnrolled,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        };
      });

      // Filter by enrollment type if specified
      let filteredCourses = courses;
      if (type === 'enrolled') {
        filteredCourses = courses.filter(course => course.isEnrolled);
      } else if (type === 'available') {
        filteredCourses = courses.filter(course => !course.isEnrolled);
      }

      console.log(`✅ Fetched ${filteredCourses.length} student courses`);
      return filteredCourses;
    } catch (error) {
      console.error('❌ Error fetching student courses:', error);
      throw new Error(`Failed to fetch student courses: ${error.message}`);
    }
  },

  // Get featured courses
  getFeaturedCourses: async (resultLimit = 10) => {
    try {
      console.log('🔄 Fetching featured courses');
      
      const coursesQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        where('isFeatured', '==', true),
        where('status', '!=', 'archived'),
        orderBy('createdAt', 'desc'),
        limit(resultLimit)
      );

      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => {
        const courseData = doc.data();
        return {
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        };
      });

      console.log(`✅ Fetched ${courses.length} featured courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching featured courses:', error);
      throw new Error(`Failed to fetch featured courses: ${error.message}`);
    }
  },

  // Get courses by instructor
  getCoursesByInstructor: async (instructorId, options = {}) => {
    try {
      console.log('🔄 Fetching courses by instructor:', instructorId);
      
      const {
        limit: resultLimit = 50,
        status = 'all'
      } = options;

      let coursesQuery = query(
        collection(db, 'courses'),
        where('instructorId', '==', instructorId),
        orderBy('createdAt', 'desc')
      );

      if (status !== 'all') {
        if (status === 'published') {
          coursesQuery = query(coursesQuery, where('isPublished', '==', true));
        } else if (status === 'draft') {
          coursesQuery = query(coursesQuery, where('isPublished', '==', false));
        }
      }

      coursesQuery = query(coursesQuery, limit(resultLimit));

      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => {
        const courseData = doc.data();
        return {
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        };
      });

      console.log(`✅ Fetched ${courses.length} courses for instructor: ${instructorId}`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching instructor courses:', error);
      throw new Error(`Failed to fetch instructor courses: ${error.message}`);
    }
  },

  // Update course with comprehensive validation
  updateCourse: async (courseId, updates) => {
    try {
      console.log('🔄 Updating course:', courseId);
      
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      // Define allowed fields for update
      const allowedFields = [
        'title', 'description', 'shortDescription', 'category', 'level', 'language',
        'tags', 'thumbnailUrl', 'promoVideoUrl', 'isFree', 'price', 'currency',
        'accessType', 'isPublished', 'isFeatured', 'status', 'instructorName',
        'instructorBio', 'sections', 'totalLessons', 'totalDuration', 'resources',
        'requirements', 'learningOutcomes', 'targetAudience', 'slug',
        'metaTitle', 'metaDescription', 'settings'
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

      // Handle publication timestamp
      if (updates.isPublished && !updates.publishedAt) {
        const course = await courseService.getCourseById(courseId);
        if (course && !course.publishedAt) {
          updateData.publishedAt = serverTimestamp();
        }
      }

      await updateDoc(doc(db, 'courses', courseId), updateData);
      console.log('✅ Course updated successfully:', courseId);
      
      return {
        success: true,
        courseId,
        updatedFields: Object.keys(filteredUpdates)
      };
    } catch (error) {
      console.error('❌ Error updating course:', error);
      throw new Error(`Failed to update course: ${error.message}`);
    }
  },

  // Publish course
  publishCourse: async (courseId) => {
    try {
      console.log('🔄 Publishing course:', courseId);
      
      const updateData = {
        isPublished: true,
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'courses', courseId), updateData);
      console.log('✅ Course published successfully:', courseId);
      
      return {
        success: true,
        courseId,
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error publishing course:', error);
      throw new Error(`Failed to publish course: ${error.message}`);
    }
  },

  // Unpublish course
  unpublishCourse: async (courseId) => {
    try {
      console.log('🔄 Unpublishing course:', courseId);
      
      const updateData = {
        isPublished: false,
        status: 'draft',
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'courses', courseId), updateData);
      console.log('✅ Course unpublished successfully:', courseId);
      
      return {
        success: true,
        courseId
      };
    } catch (error) {
      console.error('❌ Error unpublishing course:', error);
      throw new Error(`Failed to unpublish course: ${error.message}`);
    }
  },

  // Archive course
  archiveCourse: async (courseId) => {
    try {
      console.log('🔄 Archiving course:', courseId);
      
      const updateData = {
        status: 'archived',
        isPublished: false,
        isFeatured: false,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'courses', courseId), updateData);
      console.log('✅ Course archived successfully:', courseId);
      
      return {
        success: true,
        courseId,
        archivedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error archiving course:', error);
      throw new Error(`Failed to archive course: ${error.message}`);
    }
  },

  // Delete course (soft delete by archiving)
  deleteCourse: async (courseId) => {
    try {
      console.log('🔄 Deleting course:', courseId);
      
      // Instead of hard delete, we archive the course
      return await courseService.archiveCourse(courseId);
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  },

  // Update course enrollment count
  updateEnrollmentCount: async (courseId, change = 1) => {
    try {
      console.log('🔄 Updating enrollment count for course:', courseId);
      
      const course = await courseService.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const newCount = (course.studentsEnrolled || 0) + change;
      
      await updateDoc(doc(db, 'courses', courseId), {
        studentsEnrolled: newCount,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Enrollment count updated:', { courseId, newCount });
      
      return {
        success: true,
        courseId,
        studentsEnrolled: newCount
      };
    } catch (error) {
      console.error('❌ Error updating enrollment count:', error);
      throw new Error(`Failed to update enrollment count: ${error.message}`);
    }
  },

  // Update course rating
  updateCourseRating: async (courseId, newRating) => {
    try {
      console.log('🔄 Updating course rating:', { courseId, newRating });
      
      const course = await courseService.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const totalRatings = (course.totalRatings || 0) + 1;
      const averageRating = ((course.averageRating || 0) * (totalRatings - 1) + newRating) / totalRatings;

      await updateDoc(doc(db, 'courses', courseId), {
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        updatedAt: serverTimestamp()
      });

      console.log('✅ Course rating updated:', { courseId, averageRating, totalRatings });
      
      return {
        success: true,
        courseId,
        averageRating,
        totalRatings
      };
    } catch (error) {
      console.error('❌ Error updating course rating:', error);
      throw new Error(`Failed to update course rating: ${error.message}`);
    }
  },

  // Increment course views
  incrementCourseViews: async (courseId) => {
    try {
      const course = await courseService.getCourseById(courseId);
      if (!course) return;

      const newViews = (course.totalViews || 0) + 1;
      
      await updateDoc(doc(db, 'courses', courseId), {
        totalViews: newViews,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Course views incremented:', { courseId, newViews });
    } catch (error) {
      console.error('❌ Error incrementing course views:', error);
      // Don't throw error for non-critical updates
    }
  },

  // Get courses by category
  getCoursesByCategory: async (category, resultLimit = 20) => {
    try {
      console.log('🔄 Fetching courses by category:', category);
      
      const coursesQuery = query(
        collection(db, 'courses'),
        where('category', '==', category),
        where('isPublished', '==', true),
        where('status', '!=', 'archived'),
        orderBy('createdAt', 'desc'),
        limit(resultLimit)
      );

      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => {
        const courseData = doc.data();
        return {
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        };
      });

      console.log(`✅ Fetched ${courses.length} courses in category: ${category}`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching courses by category:', error);
      throw new Error(`Failed to fetch courses by category: ${error.message}`);
    }
  },

  // Get course statistics
  getCourseStats: async () => {
    try {
      console.log('🔄 Fetching course statistics');
      
      const [
        totalCoursesCount,
        publishedCoursesCount,
        draftCoursesCount,
        archivedCoursesCount,
        featuredCoursesCount,
        allCourses
      ] = await Promise.all([
        getCountFromServer(collection(db, 'courses')),
        getCountFromServer(query(collection(db, 'courses'), where('isPublished', '==', true))),
        getCountFromServer(query(collection(db, 'courses'), where('isPublished', '==', false))),
        getCountFromServer(query(collection(db, 'courses'), where('status', '==', 'archived'))),
        getCountFromServer(query(collection(db, 'courses'), where('isFeatured', '==', true))),
        courseService.getAllCourses({ limit: 1000 })
      ]);

      const stats = {
        total: totalCoursesCount.data().count,
        published: publishedCoursesCount.data().count,
        draft: draftCoursesCount.data().count,
        archived: archivedCoursesCount.data().count,
        featured: featuredCoursesCount.data().count,
        
        // Calculate additional metrics from course data
        totalStudents: allCourses.reduce((sum, course) => sum + (course.studentsEnrolled || 0), 0),
        totalRevenue: allCourses.reduce((sum, course) => {
          if (!course.isFree) {
            return sum + (course.price || 0) * (course.studentsEnrolled || 0);
          }
          return sum;
        }, 0),
        averageRating: allCourses.length > 0 
          ? allCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / allCourses.length
          : 0,
        
        // Category distribution
        categories: allCourses.reduce((acc, course) => {
          const category = course.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        
        // Level distribution
        levels: allCourses.reduce((acc, course) => {
          const level = course.level || 'unknown';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {})
      };

      console.log('✅ Course statistics fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching course statistics:', error);
      throw new Error(`Failed to fetch course statistics: ${error.message}`);
    }
  },

  // Get total courses count
  getTotalCourses: async () => {
    try {
      console.log('🔄 Getting total courses count');
      const coll = collection(db, 'courses');
      const snapshot = await getCountFromServer(coll);
      const count = snapshot.data().count;
      console.log('✅ Total courses count:', count);
      return count;
    } catch (error) {
      console.error('❌ Error getting courses count:', error);
      return 0;
    }
  },

  // Validate course data before creation/update
  validateCourseData: (courseData, isUpdate = false) => {
    const errors = [];

    if (!isUpdate || courseData.title !== undefined) {
      if (!courseData.title || courseData.title.trim().length === 0) {
        errors.push('Course title is required');
      }
      if (courseData.title && courseData.title.length > 100) {
        errors.push('Course title must be less than 100 characters');
      }
    }

    if (courseData.description && courseData.description.length > 2000) {
      errors.push('Course description must be less than 2000 characters');
    }

    if (courseData.price !== undefined && courseData.price < 0) {
      errors.push('Course price cannot be negative');
    }

    if (courseData.totalDuration !== undefined && courseData.totalDuration < 0) {
      errors.push('Total duration cannot be negative');
    }

    if (courseData.tags && courseData.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Named exports for individual functions
export const createCourse = courseService.createCourse;
export const getCourseById = courseService.getCourseById;
export const getAllCourses = courseService.getAllCourses;
export const getPublishedCourses = courseService.getPublishedCourses;
export const getStudentCourses = courseService.getStudentCourses;
export const getFeaturedCourses = courseService.getFeaturedCourses;
export const getCoursesByInstructor = courseService.getCoursesByInstructor;
export const updateCourse = courseService.updateCourse;
export const publishCourse = courseService.publishCourse;
export const unpublishCourse = courseService.unpublishCourse;
export const archiveCourse = courseService.archiveCourse;
export const deleteCourse = courseService.deleteCourse;
export const updateEnrollmentCount = courseService.updateEnrollmentCount;
export const updateCourseRating = courseService.updateCourseRating;
export const incrementCourseViews = courseService.incrementCourseViews;
export const getCoursesByCategory = courseService.getCoursesByCategory;
export const getCourseStats = courseService.getCourseStats;
export const getTotalCourses = courseService.getTotalCourses;
export const validateCourseData = courseService.validateCourseData;

// Default export for the entire service
export default courseService;