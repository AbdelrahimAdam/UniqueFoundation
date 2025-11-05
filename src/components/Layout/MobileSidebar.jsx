import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { 
  X,
  Home, 
  Video, 
  Users, 
  BarChart3, 
  Settings,
  BookOpen,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react'

const MobileSidebar = ({ isOpen, onClose, isDarkMode, toggleDarkMode }) => {
  const { t, i18n } = useTranslation()
  const { userRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const adminMenu = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home, path: '/admin' },
    { id: 'users', label: t('sidebar.users'), icon: Users, path: '/admin' },
    { id: 'courses', label: t('sidebar.courses'), icon: BookOpen, path: '/admin' },
    { id: 'sessions', label: t('sidebar.sessions'), icon: Video, path: '/admin' },
    { id: 'analytics', label: t('sidebar.analytics'), icon: BarChart3, path: '/admin' },
  ]

  const teacherMenu = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home, path: '/teacher' },
    { id: 'recordings', label: t('sidebar.recordings'), icon: Video, path: '/teacher' },
    { id: 'students', label: t('sidebar.students'), icon: Users, path: '/teacher' },
    { id: 'analytics', label: t('sidebar.analytics'), icon: BarChart3, path: '/teacher' },
  ]

  const studentMenu = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home, path: '/student' },
    { id: 'classes', label: t('sidebar.classes'), icon: BookOpen, path: '/student' },
    { id: 'recordings', label: t('sidebar.recordings'), icon: Video, path: '/student' },
    { id: 'subscription', label: t('sidebar.subscription'), icon: CreditCard, path: '/subscription' },
  ]

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin': return adminMenu
      case 'teacher': return teacherMenu
      case 'student': return studentMenu
      default: return []
    }
  }

  const menuItems = getMenuItems()

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  const isActive = (path) => {
    if (userRole === 'admin' && path === '/admin' && location.pathname.startsWith('/admin')) {
      return true
    }
    if (userRole === 'teacher' && path === '/teacher' && location.pathname.startsWith('/teacher')) {
      return true
    }
    if (userRole === 'student' && path === '/student' && location.pathname.startsWith('/student')) {
      return true
    }
    return location.pathname === path
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg transform transition-transform duration-300 lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isRTL ? 'left-auto right-0' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Meet Recorder
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center w-full px-4 py-3 text-left rtl:text-right rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-lg scale-105'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:shadow-md'
                  }`}
                >
                  <Icon size={20} className={`${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Footer actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={() => handleNavigation('/profile')}
              className={`flex items-center w-full px-4 py-3 text-left rtl:text-right rounded-xl transition-all duration-200 ${
                isActive('/profile')
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-lg scale-105'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 hover:shadow-md'
              }`}
            >
              <Settings size={20} className={`${isRTL ? 'ml-3' : 'mr-3'}`} />
              <span className="font-medium">{t('sidebar.settings')}</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full px-4 py-3 text-left rtl:text-right rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              {isDarkMode ? (
                <Sun size={20} className={`${isRTL ? 'ml-3' : 'mr-3'}`} />
              ) : (
                <Moon size={20} className={`${isRTL ? 'ml-3' : 'mr-3'}`} />
              )}
              <span className="font-medium">
                {isDarkMode ? t('common.lightMode') : t('common.darkMode')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileSidebar