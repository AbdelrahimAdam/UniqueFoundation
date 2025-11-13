import React, { useState, useEffect, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { 
  Home, 
  Video, 
  Users, 
  BarChart3, 
  BookOpen,
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Shield,
  GraduationCap,
  UserCheck,
  Calendar,
  FileText,
  HelpCircle,
  TrendingUp,
  Crown,
} from 'lucide-react'

// Memoized menu items to prevent unnecessary re-renders
const MenuItem = memo(({ 
  item, 
  isActive, 
  isRTL, 
  roleColors, 
  handleNavigation 
}) => {
  const Icon = item.icon
  
  return (
    <button
      onClick={() => handleNavigation(item.path)}
      className={`group relative flex items-center w-full px-3 sm:px-4 py-3 sm:py-4 text-left rtl:text-right rounded-2xl transition-all duration-200 backdrop-blur-sm border ${
        isActive
          ? `${roleColors.bg} ${roleColors.text} ${roleColors.border} shadow-lg transform scale-105`
          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md border-transparent hover:border-white/20 dark:hover:border-gray-600/20'
      }`}
    >
      {isActive && (
        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b ${roleColors.gradient} rounded-r-full shadow-sm`}></div>
      )}
      
      <div className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
        isActive 
          ? `bg-gradient-to-br ${roleColors.gradient} shadow-lg` 
          : 'bg-white/50 dark:bg-gray-800/50 group-hover:bg-white/70 dark:group-hover:bg-gray-700/50'
      }`}>
        <Icon 
          size={18} 
          className={
            isActive 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
          } 
        />
      </div>
      
      <div className={`${isRTL ? 'mr-3' : 'ml-3'} flex-1 min-w-0`}>
        <span className="font-medium block text-sm truncate">{item.label}</span>
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-600 dark:text-gray-400 truncate">
          {item.description}
        </span>
      </div>
    </button>
  )
})

const Sidebar = ({ isOpen, onClose, userRole = 'student', isMobile = false }) => {
  const { t, i18n } = useTranslation()
  const { user, logout, userProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'
  const [darkMode, setDarkMode] = useState(false)

  // Initialize dark mode - optimized
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  // Optimized dark mode toggle
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newDarkMode)
  }, [darkMode])

  // Pre-memoized menu configuration
  const menuConfig = React.useMemo(() => ({
    admin: [
      { 
        id: 'dashboard', 
        label: t('sidebar.dashboard', 'Dashboard'), 
        icon: Home, 
        path: '/admin/dashboard',
        description: t('sidebar.dashboard_desc', 'Overview and statistics')
      },
      { 
        id: 'users', 
        label: t('sidebar.users', 'User Management'), 
        icon: Users, 
        path: '/admin/users',
        description: t('sidebar.users_desc', 'Manage all users and permissions')
      },
      { 
        id: 'courses', 
        label: t('sidebar.courses', 'Course Management'), 
        icon: BookOpen, 
        path: '/admin/courses',
        description: t('sidebar.courses_desc', 'Manage courses and content')
      },
      { 
        id: 'sessions', 
        label: t('sidebar.sessions', 'Session Management'), 
        icon: Video, 
        path: '/admin/sessions',
        description: t('sidebar.sessions_desc', 'Google Meet sessions monitoring')
      },
      { 
        id: 'analytics', 
        label: t('sidebar.analytics', 'Analytics'), 
        icon: BarChart3, 
        path: '/admin/analytics',
        description: t('sidebar.analytics_desc', 'Platform insights and metrics')
      },
      { 
        id: 'reports', 
        label: t('sidebar.reports', 'Reports'), 
        icon: FileText, 
        path: '/admin/reports',
        description: t('sidebar.reports_desc', 'System reports and exports')
      },
    ],
    teacher: [
      { 
        id: 'dashboard', 
        label: t('sidebar.dashboard', 'Dashboard'), 
        icon: Home, 
        path: '/teacher/dashboard',
        description: t('sidebar.dashboard_desc', 'Teaching overview and insights')
      },
      { 
        id: 'recordings', 
        label: t('sidebar.recordings', 'My Recordings'), 
        icon: Video, 
        path: '/teacher/recordings',
        description: t('sidebar.recordings_desc', 'Manage your class recordings')
      },
      { 
        id: 'sessions', 
        label: t('sidebar.sessions', 'My Sessions'), 
        icon: Calendar, 
        path: '/teacher/sessions',
        description: t('sidebar.sessions_desc', 'Schedule and manage sessions')
      },
      { 
        id: 'students', 
        label: t('sidebar.students', 'Students'), 
        icon: Users, 
        path: '/teacher/students',
        description: t('sidebar.students_desc', 'Manage your students')
      },
      { 
        id: 'my-courses', 
        label: t('sidebar.my_courses', 'My Courses'), 
        icon: BookOpen, 
        path: '/teacher/my-courses',
        description: t('sidebar.my_courses_desc', 'Your teaching courses')
      },
      { 
        id: 'analytics', 
        label: t('sidebar.analytics', 'Analytics'), 
        icon: BarChart3, 
        path: '/teacher/analytics',
        description: t('sidebar.analytics_desc', 'Teaching performance insights')
      },
    ],
    student: [
      { 
        id: 'dashboard', 
        label: t('sidebar.dashboard', 'Dashboard'), 
        icon: Home, 
        path: '/student/dashboard',
        description: t('sidebar.dashboard_desc', 'Learning overview and progress')
      },
      { 
        id: 'sessions', 
        label: t('sidebar.sessions', 'Learning Sessions'), 
        icon: Calendar, 
        path: '/student/sessions',
        description: t('sidebar.sessions_desc', 'Join live sessions and classes')
      },
      { 
        id: 'recordings', 
        label: t('sidebar.recordings', 'Recordings'), 
        icon: Video, 
        path: '/student/recordings',
        description: t('sidebar.recordings_desc', 'Watch recorded sessions')
      },
      { 
        id: 'courses', 
        label: t('sidebar.courses', 'Browse Courses'), 
        icon: BookOpen, 
        path: '/student/courses',
        description: t('sidebar.courses_desc', 'Discover and enroll in courses')
      },
      { 
        id: 'my-courses', 
        label: t('sidebar.my_courses', 'My Courses'), 
        icon: BookOpen, 
        path: '/student/my-courses',
        description: t('sidebar.my_courses_desc', 'Your enrolled courses')
      },
      { 
        id: 'progress', 
        label: t('sidebar.progress', 'Progress'), 
        icon: TrendingUp, 
        path: '/student/progress',
        description: t('sidebar.progress_desc', 'Track your learning progress')
      },
      { 
        id: 'teachers', 
        label: t('sidebar.teachers', 'Teachers'), 
        icon: Users, 
        path: '/student/teachers',
        description: t('sidebar.teachers_desc', 'View available teachers')
      },
    ]
  }), [t])

  // Common routes for all roles
  const commonRoutes = React.useMemo(() => [
    { 
      id: 'profile', 
      label: t('sidebar.profile', 'Profile'), 
      icon: User, 
      path: '/profile',
      description: t('sidebar.profile_desc', 'Manage your profile settings')
    },
    { 
      id: 'help', 
      label: t('sidebar.help', 'Help & Support'), 
      icon: HelpCircle, 
      path: '/help',
      description: t('sidebar.help_desc', 'Get help and support')
    },
  ], [t])

  const getMenuItems = useCallback(() => menuConfig[userRole] || [], [menuConfig, userRole])
  const menuItems = getMenuItems()

  // Optimized navigation handler
  const handleNavigation = useCallback((path) => {
    navigate(path)
    if (isMobile) {
      onClose?.()
    }
  }, [navigate, isMobile, onClose])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Optimized active path check
  const isActive = useCallback((path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }, [location.pathname])

  const getRoleIcon = useCallback(() => {
    switch (userRole) {
      case 'admin': return Shield
      case 'teacher': return UserCheck
      case 'student': return GraduationCap
      default: return User
    }
  }, [userRole])

  const getRoleColors = useCallback(() => {
    switch (userRole) {
      case 'admin': 
        return {
          gradient: 'from-purple-500 to-violet-600',
          bgGradient: 'from-purple-500/15 to-violet-600/15',
          text: 'text-purple-700 dark:text-purple-300',
          bg: 'bg-purple-100/80 dark:bg-purple-900/40',
          border: 'border-purple-200/50 dark:border-purple-700/50'
        }
      case 'teacher': 
        return {
          gradient: 'from-blue-500 to-cyan-600',
          bgGradient: 'from-blue-500/15 to-cyan-600/15',
          text: 'text-blue-700 dark:text-blue-300',
          bg: 'bg-blue-100/80 dark:bg-blue-900/40',
          border: 'border-blue-200/50 dark:border-blue-700/50'
        }
      case 'student': 
        return {
          gradient: 'from-green-500 to-emerald-600',
          bgGradient: 'from-green-500/15 to-emerald-600/15',
          text: 'text-green-700 dark:text-green-300',
          bg: 'bg-green-100/80 dark:bg-green-900/40',
          border: 'border-green-200/50 dark:border-green-700/50'
        }
      default: 
        return {
          gradient: 'from-gray-500 to-gray-600',
          bgGradient: 'from-gray-500/15 to-gray-600/15',
          text: 'text-gray-700 dark:text-gray-300',
          bg: 'bg-gray-100/80 dark:bg-gray-900/40',
          border: 'border-gray-200/50 dark:border-gray-700/50'
        }
    }
  }, [userRole])

  const RoleIcon = getRoleIcon()
  const roleColors = getRoleColors()

  // Get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }, [user])

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    return user?.displayName || user?.email || 'User'
  }, [user])

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-80 
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
      border-r border-white/40 dark:border-gray-700/40
      shadow-2xl shadow-black/10 dark:shadow-black/30
      transform transition-transform duration-300 ease-out
      lg:translate-x-0 lg:static lg:inset-0
      ${isRTL ? 'right-0 left-auto' : ''}
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      flex flex-col h-screen rounded-r-3xl lg:rounded-r-none
    `}>
      
      {/* Static Header with Logo */}
      <div className="flex-shrink-0 rounded-t-3xl overflow-hidden">
        <div className="flex items-center justify-between h-20 px-4 sm:px-6 border-b border-white/30 dark:border-gray-700/30 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="relative">
              {/* Unique Foundation Logo - Full Rounded */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white/20">
                <img 
                  src="/logo.png" 
                  alt="Unique Foundation Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback if logo doesn't load
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                {/* Fallback logo */}
                <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                  <div className="text-white font-bold text-sm sm:text-base">UF</div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                Unique Foundation
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate">{userRole} Portal</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200 backdrop-blur-sm hover:scale-110"
            aria-label="Close sidebar"
          >
            <X size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 sm:p-6 border-b border-white/30 dark:border-gray-700/30 bg-gradient-to-br from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-800/40 backdrop-blur-xl">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="relative">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${roleColors.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-105`}>
                {getUserInitials()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${roleColors.gradient} rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm backdrop-blur-sm`}>
                <RoleIcon size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                {getUserDisplayName()}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize backdrop-blur-sm ${roleColors.bg} ${roleColors.text} border ${roleColors.border}`}>
                  {userRole}
                </span>
                {userProfile?.subscription?.plan === 'premium' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm backdrop-blur-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Content */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-b-3xl">
        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 sm:px-4 py-4 sm:py-6 space-y-2">
            <p className="px-3 sm:px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 backdrop-blur-sm">
              Main Menu
            </p>
            {menuItems.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                isActive={isActive(item.path)}
                isRTL={isRTL}
                roleColors={roleColors}
                handleNavigation={handleNavigation}
              />
            ))}
          </nav>

          {/* Common Routes Section */}
          <div className="px-3 sm:px-4 py-4 sm:py-6 border-t border-white/30 dark:border-gray-700/30">
            <p className="px-3 sm:px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 backdrop-blur-sm">
              General
            </p>
            <div className="space-y-2">
              {commonRoutes.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`group relative flex items-center w-full px-3 sm:px-4 py-3 text-left rtl:text-right rounded-xl transition-all duration-200 backdrop-blur-sm border ${
                      active
                        ? `${roleColors.bg} ${roleColors.text} ${roleColors.border} shadow-md transform scale-105`
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 border-transparent hover:border-white/20 dark:hover:border-gray-600/20'
                    }`}
                  >
                    <Icon 
                      size={16} 
                      className={
                        active 
                          ? roleColors.text
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                      } 
                    />
                    
                    <span className={`${isRTL ? 'mr-3' : 'ml-3'} font-medium text-sm flex-1 text-left truncate`}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Static Footer */}
      <div className="flex-shrink-0 rounded-b-3xl overflow-hidden">
        <div className="p-3 sm:p-4 space-y-2 border-t border-white/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center w-full px-3 sm:px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50 group backdrop-blur-sm border border-transparent hover:border-white/20 dark:hover:border-gray-600/20"
          >
            {darkMode ? (
              <Sun size={16} className={`${isRTL ? 'ml-3' : 'mr-3'} group-hover:text-yellow-500 transition-colors`} />
            ) : (
              <Moon size={16} className={`${isRTL ? 'ml-3' : 'mr-3'} group-hover:text-blue-500 transition-colors`} />
            )}
            <span className="font-medium text-sm flex-1 text-left">
              {darkMode ? t('sidebar.lightMode', 'Light Mode') : t('sidebar.darkMode', 'Dark Mode')}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 sm:px-4 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-xl transition-all duration-200 hover:bg-red-50/50 dark:hover:bg-red-900/20 group backdrop-blur-sm border border-transparent hover:border-red-200/50 dark:hover:border-red-800/50"
          >
            <LogOut size={16} className={`${isRTL ? 'ml-3' : 'mr-3'} group-hover:scale-105 transition-transform`} />
            <span className="font-medium text-sm flex-1 text-left">{t('sidebar.logout', 'Logout')}</span>
          </button>

          {/* Version Info */}
          <div className="pt-2 border-t border-white/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">v2.0.0</span>
              <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Sidebar)