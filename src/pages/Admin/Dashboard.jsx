import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Video,
  BookOpen,
  BarChart3,
  Check,
  X,
  Plus,
  Eye,
  Clock,
  Zap,
  Settings,
  RefreshCw,
  AlertCircle,
  Database,
  Calendar,
  FileText,
  Download,
  Upload,
  Activity,
  Link,
  Globe,
  User,
  PieChart,
  TrendingUp,
  Server
} from 'lucide-react'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'

// Lazy load heavy components
const CreateSessionModal = lazy(() => import('../../components/Session/CreateSessionModal.jsx'))

// Services
import userService from "../../services/userService.jsx"
import sessionService from "../../services/sessionService.jsx"
import { recordingService } from '../../services/recordingService.jsx'
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  onSnapshot,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from '../../config/firebase.jsx'

// Constants
const TABS = ['dashboard', 'users', 'courses', 'sessions', 'analytics']

const AdminDashboard = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [recordings, setRecordings] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalCourses: 0,
    totalRecordings: 0,
    pendingUsers: 0,
    storageUsed: 0,
    totalDuration: 0,
    meetSessions: 0,
    recordedSessions: 0,
    upcomingSessions: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [error, setError] = useState(null)
  const [indexError, setIndexError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false)

  // Helper functions
  const formatTimeAgo = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Optimized data loading with error boundaries
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setStatsLoading(true)
      setError(null)
      setIndexError(null)
     
      // Load data in sequence to avoid overwhelming the database
      await loadUsers()
      await loadCourses()
      await loadRecordingsAndSessions()
      await loadStats()
      await loadRecentActivities()
    } catch (error) {
      console.error('Error loading data:', error)
      if (error.message?.includes('index') || error.code === 'failed-precondition') {
        setIndexError('Some advanced features require Firestore indexes. Basic data is loaded.')
      } else {
        setError('Failed to load dashboard data. Please try refreshing the page.')
      }
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }, [])

  // Combined recordings and sessions loading
  const loadRecordingsAndSessions = useCallback(async () => {
    try {
      // FIX: Ensure recordings are properly published and available to students
      const [recordingsSnapshot, sessionsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'recordings'),
          where('isPublished', '==', true), // CRITICAL: Only get published recordings
          where('status', '==', 'completed'), // CRITICAL: Only completed recordings
          orderBy('createdAt', 'desc'),
          limit(50)
        )),
        getDocs(query(
          collection(db, 'sessions'),
          where('status', 'in', ['scheduled', 'live']),
          orderBy('scheduledTime', 'desc'),
          limit(50)
        ))
      ])

      const recordingsData = recordingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        duration: doc.data().duration || 0,
        fileSize: doc.data().fileSize || 0
      }))

      const sessionsData = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime?.toDate?.(),
        sessionEndTime: doc.data().sessionEndTime?.toDate?.(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.()
      }))

      setRecordings(recordingsData)
      setSessions(sessionsData)
    } catch (error) {
      console.error('Error loading recordings and sessions:', error)
      // Fallback to basic query without complex filters
      const [recordingsSnapshot, sessionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'recordings'), limit(50))),
        getDocs(query(collection(db, 'sessions'), limit(50)))
      ])
      
      setRecordings(recordingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setSessions(sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await userService.getAllUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }, [])

  const loadCourses = useCallback(async () => {
    try {
      const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'), limit(50))
      const snapshot = await getDocs(coursesQuery)
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.()
      }))
      setCourses(coursesData)
    } catch (error) {
      console.error('Error loading courses:', error)
      setCourses([])
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const [
        usersCount,
        coursesCount,
        recordingsCount,
        pendingUsersCount
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'courses')),
        getCountFromServer(query(collection(db, 'recordings'), where('isPublished', '==', true))),
        getCountFromServer(query(collection(db, 'users'), where('isActive', '==', false)))
      ])

      const storageUsed = recordings.reduce((acc, r) => acc + (r.fileSize || 0), 0)
      const totalDuration = recordings.reduce((acc, r) => acc + (r.duration || 0), 0)
      const now = new Date()
      
      const activeSessions = sessions.filter(session => {
        const scheduledTime = session.scheduledTime
        const sessionEndTime = session.sessionEndTime
        return scheduledTime && sessionEndTime &&
               now >= scheduledTime && now <= sessionEndTime &&
               session.status === 'live'
      }).length

      setStats({
        totalUsers: usersCount.data().count,
        activeSessions,
        totalCourses: coursesCount.data().count,
        totalRecordings: recordingsCount.data().count,
        pendingUsers: pendingUsersCount.data().count,
        storageUsed,
        totalDuration,
        meetSessions: sessions.filter(s => s.meetLink).length,
        recordedSessions: recordings.filter(r => r.isPublished).length,
        upcomingSessions: sessions.filter(s => s.status === 'scheduled').length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Fallback to calculated stats
      const storageUsed = recordings.reduce((acc, r) => acc + (r.fileSize || 0), 0)
      const totalDuration = recordings.reduce((acc, r) => acc + (r.duration || 0), 0)
      const now = new Date()
      
      const activeSessions = sessions.filter(session => {
        const scheduledTime = session.scheduledTime
        const sessionEndTime = session.sessionEndTime
        return scheduledTime && sessionEndTime &&
               now >= scheduledTime && now <= sessionEndTime &&
               session.status === 'live'
      }).length

      setStats({
        totalUsers: users.length,
        activeSessions,
        totalCourses: courses.length,
        totalRecordings: recordings.length,
        pendingUsers: users.filter(user => !user.isActive).length,
        storageUsed,
        totalDuration,
        meetSessions: sessions.filter(s => s.meetLink).length,
        recordedSessions: recordings.filter(r => r.isPublished).length,
        upcomingSessions: sessions.filter(s => s.status === 'scheduled').length
      })
    }
  }, [users, courses, recordings, sessions])

  const loadRecentActivities = useCallback(async () => {
    try {
      // Generate activities from current data instead of querying activities collection
      const activities = await generateActivitiesFromData(users, courses, recordings, sessions)
      setRecentActivities(activities.slice(0, 5))
    } catch (error) {
      console.error('Error loading recent activities:', error)
      setRecentActivities([])
    }
  }, [users, courses, recordings, sessions])

  const generateActivitiesFromData = useCallback(async (usersData, coursesData, recordingsData, sessionsData = []) => {
    const activities = []
    const now = new Date()
    
    // User activities
    usersData.slice(0, 3).forEach((user, index) => {
      const timeAgo = new Date(now.getTime() - (index + 1) * 2 * 60 * 60 * 1000)
      activities.push({
        id: `user-${user.id}`,
        type: 'user_joined',
        userName: user.displayName || user.email,
        userEmail: user.email,
        timestamp: user.createdAt || timeAgo,
        message: `${user.displayName || user.email} joined the platform`
      })
    })
    
    // Course activities
    coursesData.slice(0, 2).forEach((course, index) => {
      const timeAgo = new Date(now.getTime() - (index + 1) * 4 * 60 * 60 * 1000)
      activities.push({
        id: `course-${course.id}`,
        type: 'course_created',
        userName: course.instructorName || 'Instructor',
        courseName: course.title,
        timestamp: course.createdAt || timeAgo,
        message: `Course "${course.title}" was created`
      })
    })
    
    // Session activities
    sessionsData.slice(0, 3).forEach((session, index) => {
      const timeAgo = new Date(now.getTime() - (index + 1) * 3 * 60 * 60 * 1000)
      activities.push({
        id: `session-${session.id}`,
        type: 'session_scheduled',
        userName: session.instructorName || session.createdBy || 'System',
        sessionName: session.title || session.topic,
        timestamp: session.createdAt || timeAgo,
        message: `Session "${session.title || session.topic}" was scheduled`
      })
    })
    
    // Recording activities
    recordingsData.slice(0, 2).forEach((recording, index) => {
      const timeAgo = new Date(now.getTime() - (index + 1) * 6 * 60 * 60 * 1000)
      activities.push({
        id: `recording-${recording.id}`,
        type: 'recording_created',
        userName: recording.instructorName || recording.createdBy || 'User',
        timestamp: recording.createdAt || timeAgo,
        message: `New recording uploaded by ${recording.instructorName || recording.createdBy || 'User'}`
      })
    })
    
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [])

  // Real-time listeners with cleanup
  useEffect(() => {
    const unsubscribe = setupRealtimeListeners()
    return () => unsubscribe()
  }, [])

  // Initial data load
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const setupRealtimeListeners = () => {
    const unsubscribers = []
    
    try {
      // Users listener
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20))
      const unsubscribeUsers = onSnapshot(usersQuery,
        (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.(),
            lastLogin: doc.data().lastLogin?.toDate?.(),
            approvedAt: doc.data().approvedAt?.toDate?.()
          }))
          setUsers(usersData)
        },
        (error) => console.error('Error in users listener:', error)
      )
      unsubscribers.push(unsubscribeUsers)
    } catch (error) {
      console.error('Error setting up users listener:', error)
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }

  // Action handlers
  const handleApproveUser = useCallback(async (userId) => {
    try {
      setError(null)
      setActionLoading(prev => ({ ...prev, [userId]: true }))
      await userService.approveUser(userId)
      await loadUsers() // Refresh users after approval
    } catch (error) {
      console.error('Error approving user:', error)
      setError('Failed to approve user. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }, [loadUsers])

  const handleDeactivateUser = useCallback(async (userId) => {
    try {
      setError(null)
      setActionLoading(prev => ({ ...prev, [userId]: true }))
      await userService.deactivateUser(userId, 'Deactivated by admin')
      await loadUsers()
    } catch (error) {
      console.error('Error deactivating user:', error)
      setError('Failed to deactivate user. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }, [loadUsers])

  const handleReactivateUser = useCallback(async (userId) => {
    try {
      setError(null)
      setActionLoading(prev => ({ ...prev, [userId]: true }))
      await userService.reactivateUser(userId)
      await loadUsers()
    } catch (error) {
      console.error('Error reactivating user:', error)
      setError('Failed to reactivate user. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }, [loadUsers])

  const handleChangeUserRole = useCallback(async (userId, newRole) => {
    try {
      setError(null)
      setActionLoading(prev => ({ ...prev, [userId]: true }))
      await userService.changeUserRole(userId, newRole)
      await loadUsers()
    } catch (error) {
      console.error('Error changing user role:', error)
      setError('Failed to change user role. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }, [loadUsers])

  // FIXED: Ensure recordings are properly published for students
  const handleAddRecording = useCallback(async (sessionId) => {
    const recordingUrl = prompt('Enter the Google Drive recording URL:')
    if (recordingUrl) {
      try {
        setError(null)
        setActionLoading(prev => ({ ...prev, [sessionId]: true }))
       
        // CRITICAL: Set isPublished to true and status to completed
        await recordingService.updateWithDriveRecording(sessionId, {
          recordingUrl: recordingUrl,
          duration: 60,
          fileSize: 250,
          isPublished: true, // This makes it visible to students
          status: 'completed', // This makes it available
          recordingStatus: 'available'
        })
       
        await loadRecordingsAndSessions()
      } catch (error) {
        console.error('Error adding recording:', error)
        setError('Failed to add recording. Please try again.')
      } finally {
        setActionLoading(prev => ({ ...prev, [sessionId]: false }))
      }
    }
  }, [loadRecordingsAndSessions])

  const handleRefresh = useCallback(() => {
    loadAllData()
  }, [loadAllData])

  const handleCreateIndex = () => {
    window.open('https://console.firebase.google.com/project/_/firestore/indexes', '_blank')
  }

  const handleExportData = () => {
    const data = {
      users: users.map(user => ({
        Name: user.displayName,
        Email: user.email,
        Role: user.role,
        Status: user.isActive ? 'Active' : 'Inactive',
        'Joined Date': user.createdAt?.toLocaleDateString()
      })),
      sessions: sessions.map(session => ({
        Title: session.title || session.topic,
        'Meet Link': session.meetLink || 'N/A',
        'Scheduled Time': session.scheduledTime?.toLocaleString(),
        Status: session.status,
        Instructor: session.instructorName || 'Unknown'
      })),
      recordings: recordings.map(recording => ({
        Title: recording.title,
        'Drive Link': recording.recordingUrl || 'N/A',
        Duration: `${recording.duration || 0} minutes`,
        'File Size': `${recording.fileSize || 0} MB`,
        Status: recording.isPublished ? 'Published' : 'Unpublished'
      }))
    }
    
    const csvContent = Object.entries(data).map(([type, items]) => {
      const headers = Object.keys(items[0] || {}).join(',')
      const rows = items.map(item => Object.values(item).join(','))
      return [`${type.toUpperCase()}\n${headers}\n${rows.join('\n')}`].join('\n')
    }).join('\n\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Memoized computed values
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
     
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'pending' && !user.isActive && user.approvalStatus === 'pending') ||
        (filterStatus === 'inactive' && user.approvalStatus === 'deactivated')
     
      return matchesSearch && matchesStatus
    })
  }, [users, searchTerm, filterStatus])

  const statCards = useMemo(() => [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: `${stats.pendingUsers} pending`,
      changeType: stats.pendingUsers > 0 ? 'warning' : 'positive',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-500/10 to-violet-600/10',
      description: 'Total registered users',
      loading: statsLoading
    },
    {
      name: 'Active Sessions',
      value: stats.activeSessions.toString(),
      icon: Video,
      change: `${stats.meetSessions} total sessions`,
      changeType: stats.activeSessions > 0 ? 'positive' : 'neutral',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-500/10 to-emerald-600/10',
      description: 'Live sessions',
      loading: statsLoading
    },
    {
      name: 'Total Courses',
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      change: `${courses.filter(c => c.isPublished).length} published`,
      changeType: 'neutral',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-500/10 to-cyan-600/10',
      description: 'Available courses',
      loading: statsLoading
    },
    {
      name: 'Available Recordings',
      value: stats.recordedSessions.toString(),
      icon: BarChart3,
      change: `${stats.upcomingSessions} upcoming sessions`,
      changeType: 'neutral',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-500/10 to-red-600/10',
      description: 'Published recordings',
      loading: statsLoading
    }
  ], [stats, courses, statsLoading])

  const quickActions = useMemo(() => [
    {
      title: 'Manage Users',
      description: 'View and manage all user accounts',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
      action: () => setActiveTab('users')
    },
    {
      title: 'Create Session',
      description: 'Schedule new teaching session',
      icon: Video,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10 dark:bg-green-500/20',
      action: () => setShowCreateSessionModal(true)
    },
    {
      title: 'View Sessions',
      description: 'Manage scheduled sessions',
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      action: () => setActiveTab('sessions')
    }
  ], [])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'course_created': return BookOpen
      case 'user_joined': return Users
      case 'recording_created': return Video
      case 'session_scheduled': return Clock
      default: return Zap
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'course_created': return 'text-purple-600 dark:text-purple-400'
      case 'user_joined': return 'text-blue-600 dark:text-blue-400'
      case 'recording_created': return 'text-green-600 dark:text-green-400'
      case 'session_scheduled': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatActivityText = (activity) => {
    return activity.message || `${activity.userName} ${activity.type.replace('_', ' ')}`
  }

  const handleSessionCreated = useCallback((session) => {
    loadAllData()
  }, [loadAllData])

  // Tab content rendering
  const renderTabContent = () => {
    if (loading && activeTab === 'dashboard') {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )
    }
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Index Error Alert */}
            {indexError && (
              <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-yellow-200/50 dark:border-yellow-800/50 p-4 sm:p-6 shadow-depth-4">
                <div className="flex items-start">
                  <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-2">
                      Firestore Index Required
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                      {indexError}
                    </p>
                    <div className="flex flex-col xs:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateIndex}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white justify-center"
                      >
                        Create Index
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIndexError(null)}
                        className="justify-center"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Alert */}
            {error && (
              <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-red-200/50 dark:border-red-800/50 p-4 sm:p-6 shadow-depth-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Stats Grid - Improved responsive layout */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.name}
                    className="group relative overflow-hidden glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 shadow-depth-4 hover:shadow-depth-5 transition-all duration-500 hover:scale-105 card-3d"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.bgColor} rounded-2xl`}></div>
                   
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-purple-500/25`}>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className={`text-xs sm:text-sm font-semibold ${
                          stat.changeType === 'positive'
                            ? 'text-green-600 dark:text-green-400'
                            : stat.changeType === 'warning'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {stat.change}
                        </div>
                      </div>
                     
                      {stat.loading ? (
                        <div className="animate-pulse">
                          <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            {stat.value}
                          </h3>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {stat.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stat.description}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 shadow-depth-4 hover:shadow-depth-5 transition-all duration-300 card-hover">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.title}
                        onClick={action.action}
                        className="w-full flex items-center p-3 sm:p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-600/80 hover:scale-105 transition-all duration-300 group hover-lift"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className={`p-2 sm:p-3 rounded-lg ${action.bgColor} mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                            {action.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {action.description}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 shadow-depth-4 hover:shadow-depth-5 transition-all duration-300 card-hover">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => {
                      const Icon = getActivityIcon(activity.type)
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center p-3 sm:p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-all duration-300 group"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className={`p-2 sm:p-3 rounded-lg bg-gray-200/50 dark:bg-gray-600/50 mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${getActivityColor(activity.type)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {formatActivityText(activity)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Zap className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                        No recent activities
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
     
      case 'users':
        return (
          <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-depth-4 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    User Management
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage all user accounts and permissions
                  </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex items-center justify-center text-xs sm:text-sm"
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Refresh
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-xs sm:text-sm justify-center">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Invite User
                  </Button>
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-sm"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
           
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8 sm:py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                      <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                          {filteredUsers.map((user, index) => (
                            <tr
                              key={user.id}
                              className="hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors duration-200"
                            >
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
                                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                    </div>
                                  </div>
                                  <div className="ml-2 sm:ml-3 min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                      {user.displayName || 'No Name'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {user.email}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                      Joined {formatTimeAgo(user.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  user.isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : user.approvalStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {user.isActive ? 'Active' : user.approvalStatus || 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <select
                                  value={user.role}
                                  onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                                  disabled={actionLoading[user.id]}
                                  className={`text-xs font-medium capitalize rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm ${
                                    user.role === 'admin'
                                      ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                      : user.role === 'teacher'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                      : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                  }`}
                                >
                                  <option value="student">Student</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-1 sm:space-x-2">
                                  {!user.isActive && user.approvalStatus === 'pending' ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveUser(user.id)}
                                      disabled={actionLoading[user.id]}
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-xs"
                                    >
                                      {actionLoading[user.id] ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                      <span className="ml-1 hidden xs:inline">Approve</span>
                                    </Button>
                                  ) : user.isActive ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeactivateUser(user.id)}
                                      disabled={actionLoading[user.id]}
                                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 text-xs"
                                    >
                                      {actionLoading[user.id] ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                      <span className="ml-1 hidden xs:inline">Deactivate</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleReactivateUser(user.id)}
                                      disabled={actionLoading[user.id]}
                                      className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-xs"
                                    >
                                      {actionLoading[user.id] ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-3 w-3" />
                                      )}
                                      <span className="ml-1 hidden xs:inline">Reactivate</span>
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Users className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Users Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">
                    There are no users matching your criteria.
                  </p>
                  <Button
                    onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                    className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
     
      case 'courses':
        return (
          <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-depth-4 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Course Management
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage all courses and content
                  </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex items-center justify-center text-xs sm:text-sm"
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Refresh
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-xs sm:text-sm justify-center">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Create Course
                  </Button>
                </div>
              </div>
            </div>
           
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8 sm:py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="glass-light dark:glass-dark backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-depth-4 transition-all duration-300 group hover:scale-105 card-3d"
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                              {course.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {course.instructorName || 'Unknown Instructor'}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.isPublished
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                     
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                        {course.description || 'No description available'}
                      </p>
                     
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{course.studentsCount || 0} students</span>
                        <span>{formatTimeAgo(course.createdAt)}</span>
                      </div>
                     
                      <div className="mt-3 sm:mt-4 flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <BookOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Courses Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">
                    There are no courses in the system yet.
                  </p>
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
     
      case 'sessions':
        return (
          <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-depth-4 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Teaching Sessions
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage teaching sessions and recordings
                  </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex items-center justify-center text-xs sm:text-sm"
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setShowCreateSessionModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs sm:text-sm justify-center"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Schedule Session
                  </Button>
                </div>
              </div>
            </div>
           
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8 sm:py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session, index) => {
                    const isLive = session.status === 'live'
                    const isUpcoming = session.status === 'scheduled'
                    const isRecorded = session.recordingStatus === 'available'
                    const isMeetSession = session.meetLink
                   
                    return (
                      <div
                        key={session.id}
                        className="glass-light dark:glass-dark backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-depth-4 transition-all duration-300 group hover:scale-105 card-3d"
                      >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className={`p-2 rounded-lg sm:rounded-xl ${
                              isLive
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : isRecorded
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : isMeetSession
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-gray-100 dark:bg-gray-900/30'
                            }`}>
                              {isMeetSession ? (
                                <Globe className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                  isLive
                                    ? 'text-red-600 dark:text-red-400'
                                    : isRecorded
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`} />
                              ) : (
                                <Video className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                  isLive
                                    ? 'text-red-600 dark:text-red-400'
                                    : isRecorded
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {session.title || session.topic}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {session.description}
                                {session.instructorName && ` • ${session.instructorName}`}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isLive
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : isUpcoming
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : isRecorded
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {isLive ? 'Live Now' : isUpcoming ? 'Upcoming' : isRecorded ? 'Recorded' : 'Completed'}
                          </span>
                        </div>
                       
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {session.scheduledTime ? session.scheduledTime.toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {session.scheduledTime ? session.scheduledTime.toLocaleTimeString() : 'No time'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {session.instructorName || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        {session.meetLink && (
                          <div className="mt-2 sm:mt-3 flex items-center space-x-2 text-xs sm:text-sm">
                            <Link className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                            <a
                              href={session.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                            >
                              {session.meetLink}
                            </a>
                          </div>
                        )}
                       
                        <div className="mt-3 sm:mt-4 flex flex-col xs:flex-row gap-2">
                          {isLive && session.meetLink && (
                            <a
                              href={session.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white w-full text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                Join Live
                              </Button>
                            </a>
                          )}
                          {!isRecorded && !isLive && !isUpcoming && session.meetLink && (
                            <Button
                              size="sm"
                              onClick={() => handleAddRecording(session.id)}
                              disabled={actionLoading[session.id]}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs"
                            >
                              {actionLoading[session.id] ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                              <span className="ml-1">Add Recording</span>
                            </Button>
                          )}
                          {isRecorded && session.recordingUrl && (
                            <a
                              href={session.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button size="sm" variant="outline" className="w-full text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                View Recording
                              </Button>
                            </a>
                          )}
                          <Button size="sm" variant="outline" className="text-xs">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Globe className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Sessions Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">
                    There are no teaching sessions scheduled or live.
                  </p>
                  <Button
                    onClick={() => setShowCreateSessionModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
     
      case 'analytics':
        return (
          <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-depth-4 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Platform Analytics
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Detailed insights and platform metrics
                  </p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex items-center justify-center text-xs sm:text-sm"
                  >
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleExportData}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs sm:text-sm justify-center"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>
           
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Platform Overview */}
                <div className="glass-light dark:glass-dark backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Platform Overview</h4>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Storage Used</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {formatFileSize(stats.storageUsed * 1024 * 1024)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Users (Last 30 days)</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {users.filter(u => u.lastLogin && (new Date() - new Date(u.lastLogin)) < 30 * 24 * 60 * 60 * 1000).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Recording Duration</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDuration(stats.totalDuration * 60)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Teaching Sessions</span>
                      <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {stats.meetSessions}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* User Distribution */}
                <div className="glass-light dark:glass-dark backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">User Distribution</h4>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Students</span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                        {users.filter(u => u.role === 'student').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Teachers</span>
                      <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {users.filter(u => u.role === 'teacher').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Admins</span>
                      <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
                        {users.filter(u => u.role === 'admin').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending Approval</span>
                      <span className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        {users.filter(u => !u.isActive && u.approvalStatus === 'pending').length}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Session Statistics */}
                <div className="glass-light dark:glass-dark backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Session Statistics</h4>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {sessions.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Recorded Sessions</span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                        {stats.recordedSessions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Upcoming Sessions</span>
                      <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {stats.upcomingSessions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Google Meet Integration</span>
                      <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {stats.meetSessions > 0 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Recent Recordings */}
                <div className="lg:col-span-2 glass-light dark:glass-dark backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Recent Recordings</h4>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {recordings.slice(0, 5).map((recording, index) => (
                      <div key={recording.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors duration-200">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                              {recording.title || 'Untitled Recording'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {recording.instructorName || recording.createdBy} • {formatTimeAgo(recording.createdAt)}
                              {recording.meetLink && ' • Google Meet'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          <span>{recording.duration || 0} min</span>
                          <span>{formatFileSize((recording.fileSize || 0) * 1024 * 1024)}</span>
                        </div>
                      </div>
                    ))}
                    {recordings.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No recordings available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="glass-light dark:glass-dark backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 shadow-depth-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This section is under development.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-3 break-words">
              Admin Dashboard
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Manage your platform and monitor teaching sessions
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="hidden lg:flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Tabs - Improved mobile responsiveness */}
      <div className="glass-light dark:glass-dark backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 p-1 sm:p-2 shadow-depth-4">
        <nav className="flex space-x-1 sm:space-x-2 rtl:space-x-reverse overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Refresh Button */}
      <div className="lg:hidden flex justify-center">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center w-full sm:w-auto justify-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><LoadingSpinner /></div>}>
          <CreateSessionModal
            onClose={() => setShowCreateSessionModal(false)}
            onSuccess={handleSessionCreated}
          />
        </Suspense>
      )}
    </div>
  )
}

export default React.memo(AdminDashboard)