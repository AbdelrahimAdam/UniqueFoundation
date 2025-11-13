import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, role = 'student' }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme initialization
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

      setIsDarkMode(shouldBeDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
    };

    initializeTheme();
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Auto-close sidebar when clicking on main content on mobile
  const handleMainContentClick = useCallback(() => {
    if (isMobile && isSidebarOpen) {
      closeSidebar();
    }
  }, [isMobile, isSidebarOpen, closeSidebar]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen, closeSidebar]);

  // Close sidebar when clicking overlay
  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      closeSidebar();
    }
  }, [closeSidebar]);

  // Close sidebar on route change (for SPA navigation)
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [children, isMobile, closeSidebar]);

  // Role-based background gradients
  const getBackgroundGradient = () => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900';
      case 'teacher':
        return 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-blue-900';
      case 'student':
        return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-green-900';
      default:
        return 'bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundGradient()} transition-colors duration-300`}>
      {/* Decorative Background Blobs - Reduced intensity for mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl sm:blur-3xl opacity-10 sm:opacity-20 animate-pulse" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl sm:blur-3xl opacity-10 sm:opacity-20 animate-pulse delay-1000" />
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl sm:blur-3xl opacity-10 sm:opacity-20 animate-pulse delay-500" />
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Component */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          userRole={role}
          isMobile={isMobile}
        />

        {/* Main Content Area */}
        <div 
          className="flex-1 flex flex-col min-h-screen lg:ml-0 overflow-hidden"
          onClick={handleMainContentClick}
        >
          {/* Header */}
          <Header
            onMenuClick={toggleSidebar}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            userRole={role}
            isSidebarOpen={isSidebarOpen}
          />

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 transition-all duration-300">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Navigation Hint (only on mobile when sidebar is closed) */}
      {isMobile && !isSidebarOpen && (
        <div className="fixed bottom-4 left-4 z-30 lg:hidden">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20 dark:border-gray-700/50">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;