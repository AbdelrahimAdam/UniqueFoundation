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
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const courseService = {
  // Get all published courses (specifically for student dashboard)
  getPublishedCourses: async (options = {}) => {
    try {
      console.log('🔄 Fetching published courses');
      
      const {
        limit: resultLimit = 20,
        category = 'all',
        level = 'all',
        instructorId = null
      } = options;

      let coursesQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Apply category filter
      if (category && category !== 'all') {
        coursesQuery = query(coursesQuery, where('category', '==', category));
      }

      // Apply level filter
      if (level && level !== 'all') {
        coursesQuery = query(coursesQuery, where('level', '==', level));
      }

      // Apply instructor filter
      if (instructorId) {
        coursesQuery = query(coursesQuery, where('instructorId', '==', instructorId));
      }

      // Apply limit
      if (resultLimit && resultLimit > 0) {
        coursesQuery = query(coursesQuery, limit(resultLimit));
      }

      const coursesSnapshot = await getDocs(coursesQuery);
      const courses = [];
      
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        courses.push({
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${courses.length} published courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching published courses:', error);
      throw new Error(`Failed to fetch published courses: ${error.message}`);
    }
  },

  // Get all available courses for students to browse
  getAllCourses: async (options = {}) => {
    try {
      console.log('🔄 Fetching all courses');
      
      const {
        limit: resultLimit = 50,
        category = 'all',
        level = 'all',
        isPublished = true
      } = options;

      let coursesQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Apply category filter
      if (category !== 'all') {
        coursesQuery = query(coursesQuery, where('category', '==', category));
      }

      // Apply level filter
      if (level !== 'all') {
        coursesQuery = query(coursesQuery, where('level', '==', level));
      }

      // Apply limit
      if (resultLimit && resultLimit > 0) {
        coursesQuery = query(coursesQuery, limit(resultLimit));
      }

      const coursesSnapshot = await getDocs(coursesQuery);
      const courses = [];
      
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        courses.push({
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${courses.length} courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  },

  // Get courses that a student is enrolled in
  getEnrolledCourses: async (studentId, options = {}) => {
    try {
      console.log('🔄 Fetching enrolled courses for student:', studentId);
      
      if (!studentId) {
        throw new Error('Student ID is required');
      }

      const {
        limit: resultLimit = 50,
        status = 'all' // all, active, completed
      } = options;

      // Build query based on status
      let enrollmentsQuery;
      if (status === 'all') {
        enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', studentId),
          orderBy('enrolledAt', 'desc')
        );
      } else {
        enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', studentId),
          where('status', '==', status),
          orderBy('enrolledAt', 'desc')
        );
      }

      // Apply limit
      if (resultLimit && resultLimit > 0) {
        enrollmentsQuery = query(enrollmentsQuery, limit(resultLimit));
      }

      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrolledCourses = [];

      // Get course details for each enrollment
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollmentData = enrollmentDoc.data();
        const courseId = enrollmentData.courseId;
        
        try {
          const courseDoc = await getDoc(doc(db, 'courses', courseId));
          if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            enrolledCourses.push({
              id: courseDoc.id,
              ...courseData,
              enrollmentId: enrollmentDoc.id,
              enrollmentStatus: enrollmentData.status,
              enrolledAt: enrollmentData.enrolledAt?.toDate?.(),
              progress: enrollmentData.progress || 0,
              lastAccessed: enrollmentData.lastAccessed?.toDate?.(),
              completedAt: enrollmentData.completedAt?.toDate?.(),
              createdAt: courseData.createdAt?.toDate?.(),
              updatedAt: courseData.updatedAt?.toDate?.()
            });
          }
        } catch (error) {
          console.warn(`Course ${courseId} not found or inaccessible`);
        }
      }

      console.log(`✅ Fetched ${enrolledCourses.length} enrolled courses`);
      return enrolledCourses;
    } catch (error) {
      console.error('❌ Error fetching enrolled courses:', error);
      throw new Error(`Failed to fetch enrolled courses: ${error.message}`);
    }
  },

  // Get course by ID with detailed information
  getCourseById: async (courseId, studentId = null) => {
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
      
      // Check if course is published before returning
      if (!courseData.isPublished) {
        console.warn('⚠️ Course is not published:', courseId);
        return null;
      }

      const course = {
        id: courseDoc.id,
        ...courseData,
        createdAt: courseData.createdAt?.toDate?.(),
        updatedAt: courseData.updatedAt?.toDate?.(),
        publishedAt: courseData.publishedAt?.toDate?.()
      };

      // Get enrollment status if student ID provided
      if (studentId) {
        try {
          const enrollmentQuery = query(
            collection(db, 'enrollments'),
            where('studentId', '==', studentId),
            where('courseId', '==', courseId)
          );
          const enrollmentSnapshot = await getDocs(enrollmentQuery);
          
          if (!enrollmentSnapshot.empty) {
            const enrollmentData = enrollmentSnapshot.docs[0].data();
            course.enrollment = {
              id: enrollmentSnapshot.docs[0].id,
              status: enrollmentData.status,
              enrolledAt: enrollmentData.enrolledAt?.toDate?.(),
              progress: enrollmentData.progress || 0,
              lastAccessed: enrollmentData.lastAccessed?.toDate?.(),
              completedAt: enrollmentData.completedAt?.toDate?.(),
              completedModules: enrollmentData.completedModules || 0,
              totalModules: enrollmentData.totalModules || 0
            };
          }
        } catch (error) {
          console.warn('Error fetching enrollment status:', error);
        }
      }

      console.log('✅ Course fetched successfully:', courseId);
      return course;
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
  },

  // Enroll student in a course
  enrollInCourse: async (courseId, studentId, studentData = {}) => {
    try {
      console.log('🔄 Enrolling student in course:', { courseId, studentId });
      
      if (!courseId || !studentId) {
        throw new Error('Course ID and Student ID are required');
      }

      // Check if course exists and is published
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }

      const courseData = courseDoc.data();
      if (!courseData.isPublished) {
        throw new Error('Course is not available for enrollment');
      }

      // Check if already enrolled
      const enrollmentQuery = query(
        collection(db, 'enrollments'),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId)
      );
      const existingEnrollment = await getDocs(enrollmentQuery);
      
      if (!existingEnrollment.empty) {
        const existingData = existingEnrollment.docs[0].data();
        throw new Error(`Already enrolled in this course (Status: ${existingData.status})`);
      }

      // Get total modules for the course
      const modulesQuery = query(
        collection(db, 'modules'),
        where('courseId', '==', courseId),
        where('isPublished', '==', true)
      );
      const modulesSnapshot = await getDocs(modulesQuery);
      const totalModules = modulesSnapshot.size;

      // Create enrollment
      const enrollment = {
        courseId: courseId,
        studentId: studentId,
        studentEmail: studentData.email || '',
        studentName: studentData.name || '',
        status: 'active',
        progress: 0,
        enrolledAt: serverTimestamp(),
        lastAccessed: serverTimestamp(),
        completedAt: null,
        totalModules: totalModules,
        completedModules: 0,
        updatedAt: serverTimestamp()
      };

      const enrollmentRef = await addDoc(collection(db, 'enrollments'), enrollment);

      // Update course enrollment count
      await updateDoc(doc(db, 'courses', courseId), {
        enrolledStudents: arrayUnion(studentId),
        totalEnrollments: (courseData.totalEnrollments || 0) + 1,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Student enrolled successfully:', enrollmentRef.id);
      
      return {
        success: true,
        enrollmentId: enrollmentRef.id,
        course: {
          id: courseId,
          title: courseData.title,
          instructorName: courseData.instructorName,
          totalModules: totalModules
        }
      };
    } catch (error) {
      console.error('❌ Error enrolling in course:', error);
      throw new Error(`Failed to enroll in course: ${error.message}`);
    }
  },

  // Update course progress
  updateCourseProgress: async (enrollmentId, progressData) => {
    try {
      console.log('🔄 Updating course progress:', enrollmentId);
      
      const updateData = {
        progress: Math.min(Math.max(progressData.progress || 0, 0), 100),
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Update completed modules if provided
      if (progressData.completedModules !== undefined) {
        updateData.completedModules = Math.max(0, progressData.completedModules);
      }

      // Mark as completed if progress is 100%
      if (updateData.progress >= 100) {
        updateData.status = 'completed';
        updateData.completedAt = serverTimestamp();
        updateData.progress = 100; // Ensure exactly 100%
      }

      await updateDoc(doc(db, 'enrollments', enrollmentId), updateData);
      
      console.log('✅ Course progress updated:', enrollmentId);
      
      return {
        success: true,
        enrollmentId,
        progress: updateData.progress,
        status: updateData.status
      };
    } catch (error) {
      console.error('❌ Error updating course progress:', error);
      throw new Error(`Failed to update course progress: ${error.message}`);
    }
  },

  // Get course modules and content
  getCourseModules: async (courseId, studentId = null) => {
    try {
      console.log('🔄 Fetching course modules:', courseId);
      
      const modulesQuery = query(
        collection(db, 'modules'),
        where('courseId', '==', courseId),
        where('isPublished', '==', true),
        orderBy('order', 'asc')
      );

      const modulesSnapshot = await getDocs(modulesQuery);
      const modules = [];
      
      modulesSnapshot.forEach(doc => {
        const moduleData = doc.data();
        modules.push({
          id: doc.id,
          ...moduleData,
          createdAt: moduleData.createdAt?.toDate?.(),
          updatedAt: moduleData.updatedAt?.toDate?.(),
          isCompleted: false // Default value
        });
      });

      // Get student's completed modules if studentId provided
      if (studentId) {
        try {
          const enrollmentQuery = query(
            collection(db, 'enrollments'),
            where('studentId', '==', studentId),
            where('courseId', '==', courseId)
          );
          const enrollmentSnapshot = await getDocs(enrollmentQuery);
          
          if (!enrollmentSnapshot.empty) {
            const enrollmentData = enrollmentSnapshot.docs[0].data();
            const completedModules = enrollmentData.completedModules || [];
            
            // Mark completed modules
            modules.forEach(module => {
              module.isCompleted = completedModules.includes(module.id);
            });
          }
        } catch (error) {
          console.warn('Error fetching completed modules:', error);
        }
      }

      console.log(`✅ Fetched ${modules.length} modules for course: ${courseId}`);
      return modules;
    } catch (error) {
      console.error('❌ Error fetching course modules:', error);
      throw new Error(`Failed to fetch course modules: ${error.message}`);
    }
  },

  // Search courses
  searchCourses: async (searchTerm, filters = {}) => {
    try {
      console.log('🔄 Searching courses:', { searchTerm, filters });
      
      const allCourses = await courseService.getAllCourses({ limit: 1000 });
      
      if (!searchTerm && Object.keys(filters).length === 0) {
        return allCourses.slice(0, 50);
      }

      let filteredCourses = allCourses;

      // Apply search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredCourses = filteredCourses.filter(course =>
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower) ||
          course.instructorName?.toLowerCase().includes(searchLower) ||
          course.category?.toLowerCase().includes(searchLower) ||
          (course.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.category === filters.category);
      }

      if (filters.level && filters.level !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.level === filters.level);
      }

      if (filters.difficulty && filters.difficulty !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.difficulty === filters.difficulty);
      }

      if (filters.instructorId) {
        filteredCourses = filteredCourses.filter(course => course.instructorId === filters.instructorId);
      }

      console.log(`✅ Found ${filteredCourses.length} courses matching search criteria`);
      return filteredCourses.slice(0, 50);
    } catch (error) {
      console.error('❌ Error searching courses:', error);
      throw new Error(`Failed to search courses: ${error.message}`);
    }
  },

  // Get featured courses
  getFeaturedCourses: async (limit = 10) => {
    try {
      console.log('🔄 Fetching featured courses');
      
      const featuredQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        where('isFeatured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const coursesSnapshot = await getDocs(featuredQuery);
      const courses = [];
      
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        courses.push({
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${courses.length} featured courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching featured courses:', error);
      // Fallback to recent published courses
      return courseService.getPublishedCourses({ limit });
    }
  },

  // Get popular courses (most enrolled)
  getPopularCourses: async (limit = 10) => {
    try {
      console.log('🔄 Fetching popular courses');
      
      const popularQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        orderBy('totalEnrollments', 'desc'),
        limit(limit)
      );

      const coursesSnapshot = await getDocs(popularQuery);
      const courses = [];
      
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        courses.push({
          id: doc.id,
          ...courseData,
          createdAt: courseData.createdAt?.toDate?.(),
          updatedAt: courseData.updatedAt?.toDate?.(),
          publishedAt: courseData.publishedAt?.toDate?.()
        });
      });

      console.log(`✅ Fetched ${courses.length} popular courses`);
      return courses;
    } catch (error) {
      console.error('❌ Error fetching popular courses:', error);
      // Fallback to regular courses if sorting fails
      return courseService.getPublishedCourses({ limit });
    }
  },

  // Unenroll from course
  unenrollFromCourse: async (enrollmentId, courseId, studentId) => {
    try {
      console.log('🔄 Unenrolling from course:', { enrollmentId, courseId, studentId });
      
      // Delete enrollment
      await deleteDoc(doc(db, 'enrollments', enrollmentId));

      // Update course enrollment count
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        await updateDoc(doc(db, 'courses', courseId), {
          enrolledStudents: arrayRemove(studentId),
          totalEnrollments: Math.max((courseData.totalEnrollments || 1) - 1, 0),
          updatedAt: serverTimestamp()
        });
      }

      console.log('✅ Successfully unenrolled from course');
      
      return {
        success: true,
        enrollmentId,
        courseId
      };
    } catch (error) {
      console.error('❌ Error unenrolling from course:', error);
      throw new Error(`Failed to unenroll from course: ${error.message}`);
    }
  },

  // Get student course statistics
  getStudentCourseStats: async (studentId) => {
    try {
      console.log('🔄 Fetching student course stats:', studentId);
      
      const [enrolledCourses, allCourses] = await Promise.all([
        courseService.getEnrolledCourses(studentId, { limit: 1000 }),
        courseService.getPublishedCourses({ limit: 1000 })
      ]);

      const completedCourses = enrolledCourses.filter(course => course.enrollmentStatus === 'completed');
      const inProgressCourses = enrolledCourses.filter(course => course.enrollmentStatus === 'active');

      const stats = {
        totalEnrolled: enrolledCourses.length,
        totalAvailable: allCourses.length,
        completedCourses: completedCourses.length,
        inProgressCourses: inProgressCourses.length,
        averageProgress: enrolledCourses.length > 0 
          ? Math.round(enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / enrolledCourses.length)
          : 0,
        recentEnrollments: enrolledCourses.slice(0, 5),
        totalLearningTime: enrolledCourses.reduce((total, course) => total + (course.estimatedDuration || 0), 0)
      };

      console.log('✅ Student course stats fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching student course stats:', error);
      throw new Error(`Failed to fetch student course stats: ${error.message}`);
    }
  },

  // Mark module as completed
  markModuleCompleted: async (enrollmentId, moduleId, courseId, studentId) => {
    try {
      console.log('🔄 Marking module as completed:', { enrollmentId, moduleId });
      
      // Get current enrollment data
      const enrollmentDoc = await getDoc(doc(db, 'enrollments', enrollmentId));
      if (!enrollmentDoc.exists()) {
        throw new Error('Enrollment not found');
      }

      const enrollmentData = enrollmentDoc.data();
      const completedModules = enrollmentData.completedModules || [];
      
      // Check if module is already completed
      if (completedModules.includes(moduleId)) {
        return { success: true, alreadyCompleted: true };
      }

      // Add module to completed modules
      const newCompletedModules = [...completedModules, moduleId];
      
      // Calculate new progress
      const totalModules = enrollmentData.totalModules || 1;
      const newProgress = Math.round((newCompletedModules.length / totalModules) * 100);

      // Update enrollment
      await updateDoc(doc(db, 'enrollments', enrollmentId), {
        completedModules: newCompletedModules,
        progress: newProgress,
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(newProgress >= 100 ? {
          status: 'completed',
          completedAt: serverTimestamp()
        } : {})
      });

      console.log('✅ Module marked as completed');
      
      return {
        success: true,
        progress: newProgress,
        completedModules: newCompletedModules.length,
        totalModules: totalModules,
        isCourseCompleted: newProgress >= 100
      };
    } catch (error) {
      console.error('❌ Error marking module as completed:', error);
      throw new Error(`Failed to mark module as completed: ${error.message}`);
    }
  }
};

export default courseService;