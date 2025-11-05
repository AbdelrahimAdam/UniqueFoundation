// pages/student/StudentCourses.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { courseService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import {
  BookOpen,
  Search,
  Filter,
  Users,
  Clock,
  Star,
  PlayCircle,
  Bookmark,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react'

const StudentCourses = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const studentId = user?.uid

  useEffect(() => {
    if (studentId) {
      loadCourses()
    }
  }, [studentId])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const [allCourses, enrolled] = await Promise.all([
        courseService.getPublishedCourses(),
        courseService.getEnrolledCourses(studentId)
      ])
      setCourses(allCourses)
      setEnrolledCourses(enrolled)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollCourse = async (courseId) => {
    try {
      await courseService.enrollStudent(courseId, studentId)
      await loadCourses() // Refresh the list
    } catch (error) {
      console.error('Error enrolling in course:', error)
      alert('Failed to enroll in course')
    }
  }

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(course => course.id === courseId)
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = 
      categoryFilter === 'all' ||
      course.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const stats = {
    enrolled: enrolledCourses.length,
    completed: enrolledCourses.filter(c => c.progress === 100).length,
    inProgress: enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Courses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover and enroll in new learning opportunities
          </p>
        </div>
        <Button onClick={loadCourses} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enrolled}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="language">Language</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const enrolled = isEnrolled(course.id)
          
          return (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Course Image */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 relative">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white opacity-80" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  {enrolled ? (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                      Enrolled
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                      Available
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                    {formatDuration(course.duration)}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2 flex-1">
                    {course.title}
                  </h3>
                  {course.isFeatured && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current ml-2" />
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {course.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.studentsCount || 0} students
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {course.lessonsCount || 0} lessons
                    </span>
                  </div>
                  {course.level && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {course.level}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {course.instructorName?.charAt(0) || 'I'}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {course.instructorName}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    {enrolled ? (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleEnrollCourse(course.id)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        Enroll Now
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No courses are currently available'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default StudentCourses