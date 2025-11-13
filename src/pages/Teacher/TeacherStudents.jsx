// pages/teacher/TeacherStudents.js
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { userService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import {
  Users,
  Search,
  Filter,
  Mail,
  MessageCircle,
  Eye,
  MoreVertical,
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Calendar,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Star
} from 'lucide-react'

const TeacherStudents = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  const teacherId = user?.uid

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (teacherId) {
      loadStudents()
    }
  }, [teacherId])

  const loadStudents = async () => {
    try {
      setLoading(true)
      // In a real app, you'd have a service to get teacher's students
      const allUsers = await userService.getAllUsers()
      const teacherStudents = allUsers.filter(user => 
        user.role === 'student' && user.isActive
      )
      
      // Add mock data for demonstration
      const enhancedStudents = teacherStudents.map(student => ({
        ...student,
        enrolledCourses: student.enrolledCourses || Math.floor(Math.random() * 5) + 1,
        completedSessions: student.completedSessions || Math.floor(Math.random() * 20),
        attendanceRate: student.attendanceRate || Math.floor(Math.random() * 30) + 70,
        performance: student.performance || (Math.random() * 20 + 80).toFixed(1),
        lastSession: student.lastSession || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        joinDate: student.createdAt || new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      }))
      
      setStudents(enhancedStudents)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = (student) => {
    // Implement message functionality
    console.log('Message student:', student.email)
  }

  const handleViewProfile = (student) => {
    // Implement view profile functionality
    console.log('View student profile:', student.id)
  }

  const handleCallStudent = (student) => {
    // Implement call functionality
    console.log('Call student:', student.phone)
  }

  // Mobile-optimized click handlers
  const handleActionClick = (action, student, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    switch (action) {
      case 'message':
        handleSendMessage(student)
        break
      case 'profile':
        handleViewProfile(student)
        break
      case 'call':
        handleCallStudent(student)
        break
      default:
        break
    }
  }

  const filteredStudents = students.filter(student =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400'
    if (performance >= 80) return 'text-yellow-600 dark:text-yellow-400'
    if (performance >= 70) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (attendance >= 80) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    if (attendance >= 70) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  const getStatusColor = (lastLogin) => {
    const lastActive = lastLogin ? Date.now() - new Date(lastLogin).getTime() : Infinity
    if (lastActive < 24 * 60 * 60 * 1000) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (lastActive < 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }

  const getStatusText = (lastLogin) => {
    const lastActive = lastLogin ? Date.now() - new Date(lastLogin).getTime() : Infinity
    if (lastActive < 24 * 60 * 60 * 1000) return 'Active Today'
    if (lastActive < 7 * 24 * 60 * 60 * 1000) return 'Active This Week'
    return 'Inactive'
  }

  const stats = {
    total: students.length,
    active: students.filter(s => s.lastLogin && (Date.now() - new Date(s.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000).length,
    newThisWeek: students.filter(s => s.joinDate && (Date.now() - new Date(s.joinDate).getTime()) < 7 * 24 * 60 * 60 * 1000).length,
    highPerformers: students.filter(s => s.performance >= 90).length
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
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Students</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage and communicate with your students
          </p>
        </div>
        
        {/* Mobile-optimized button */}
        <button 
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation"
          onClick={() => console.log('Message all students')}
        >
          <Mail className="h-4 w-4 mr-2" />
          Message All
        </button>
      </div>

      {/* Stats - Mobile responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active This Week</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">New This Week</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.newThisWeek}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">High Performers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.highPerformers}</p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New This Week</option>
              <option value="high">High Performers</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Students List - Same layout as other pages */}
      <div className="space-y-4">
        {filteredStudents.map((student) => {
          const isActive = student.lastLogin && (Date.now() - new Date(student.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000
          const isHighPerformer = student.performance >= 90
          
          return (
            <div
              key={student.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl">
                        {student.displayName?.charAt(0)?.toUpperCase() || student.email?.charAt(0)?.toUpperCase()}
                      </div>
                      {isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {student.displayName || 'No Name'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.lastLogin)}`}>
                            {getStatusText(student.lastLogin)}
                          </span>
                          {isHighPerformer && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              <Star className="h-3 w-3 inline mr-1" />
                              Top Performer
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                            {student.attendanceRate}% Attendance
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm sm:text-base">
                        {student.email}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {student.enrolledCourses || 0} courses
                        </span>
                        <span className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          {student.completedSessions || 0} sessions
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className={getPerformanceColor(student.performance)}>
                            {student.performance}% avg
                          </span>
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Joined {student.joinDate ? new Date(student.joinDate).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>

                      {/* Contact Info */}
                      {(student.phone || student.location) && (
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          {student.phone && (
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {student.phone}
                            </span>
                          )}
                          {student.location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {student.location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    onClick={(e) => handleActionClick('message', student, e)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleActionClick('profile', student, e)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {student.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleActionClick('call', student, e)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Users className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'You currently have no students assigned to your courses'
            }
          </p>
          <button 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation mx-auto"
            onClick={() => console.log('Import students')}
          >
            <Users className="h-4 w-4 mr-2" />
            Import Students
          </button>
        </div>
      )}
    </div>
  )
}

export default TeacherStudents