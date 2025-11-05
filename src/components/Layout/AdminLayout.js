import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // Check mobile screen and initialize theme
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
      
      setDarkMode(shouldBeDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
      setMounted(true);
    };

    initializeTheme();
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
  }, [darkMode]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleOverlayClick = useCallback(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [isMobile, closeSidebar]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen, closeSidebar]);

  // Admin-specific styles
  const adminStyles = {
    gradient: 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/30 dark:to-indigo-900/40',
    primaryGradient: 'from-purple-500 to-violet-600',
    accentGradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-purple-400/20 to-violet-500/20',
    glow: 'glow-purple',
    buttonGradient: 'from-purple-500 to-violet-600',
    borderGradient: 'from-purple-500 via-violet-500 to-indigo-500',
    iconGradient: 'from-red-500 to-pink-600'
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin-slow rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 dark:border-gray-700 dark:border-t-purple-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return children;
  }

  return (
    <div className={`flex h-screen ${adminStyles.gradient} transition-all duration-500 relative overflow-hidden`}>
      {/* Enhanced 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 opacity-40 dark:opacity-30">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/10 dark:to-white/5 animate-pulse-slow"></div>
        </div>

        {/* Floating 3D orbs with enhanced animations */}
        <div className="absolute -top-20 -left-20 w-96 h-96 perspective-1000">
          <div className={`absolute inset-0 bg-gradient-to-br ${adminStyles.bgGradient} rounded-full blur-3xl animate-float-slow transform-3d`}></div>
          <div className={`absolute inset-4 bg-gradient-to-br ${adminStyles.bgGradient} rounded-full blur-2xl animate-float transform-3d`}></div>
        </div>

        <div className="absolute -bottom-32 -right-32 w-96 h-96 perspective-1000">
          <div className={`absolute inset-0 bg-gradient-to-tr ${adminStyles.bgGradient} rounded-full blur-3xl animate-float-slower transform-3d`}></div>
          <div className={`absolute inset-6 bg-gradient-to-tr ${adminStyles.bgGradient} rounded-full blur-2xl animate-float-delayed transform-3d`}></div>
        </div>

        {/* Animated blob */}
        <div className={`absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r ${adminStyles.primaryGradient} rounded-full opacity-20 blur-3xl animate-blob`}></div>

        {/* Enhanced grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_70%)]"></div>
        
        {/* Enhanced animated particles */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 bg-gradient-to-r ${adminStyles.primaryGradient} rounded-full animate-float ${adminStyles.glow}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${12 + Math.random() * 8}s`
              }}
            />
          ))}
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-shimmer-gradient animate-shimmer opacity-10"></div>
      </div>

      {/* Mobile Overlay with enhanced blur */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-2xl z-40 lg:hidden transition-all duration-500 animate-fade-in"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Enhanced Sidebar with 3D effect */}
      <div className={`
        fixed lg:relative z-50 h-full transition-all duration-500 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isMobile ? 'w-80' : 'w-72'}
      `}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          isDarkMode={darkMode}
          userRole="admin"
        />
      </div>

      {/* Main Content Area with enhanced depth */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Sticky header with enhanced glass effect */}
        <div className="sticky top-0 z-30">
          <Header 
            onMenuClick={toggleSidebar}
            isDarkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            userRole="admin"
          />
        </div>
        
        {/* Scrollable Page Content with enhanced styling */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 h-full">
            {/* Enhanced Admin Welcome Banner with 3D effect */}
            <div className="mb-6 lg:mb-8 p-6 glass-light dark:glass-dark backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-depth-4 dark:shadow-depth-5 relative overflow-hidden transform transition-all duration-300 card-hover">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-indigo-500/5 animate-pulse-slow"></div>
              
              {/* Animated border */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${adminStyles.borderGradient} animate-gradient-shift`}></div>
              
              {/* Shine effect */}
              <div className="shine-effect">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 relative z-10">
                  <div className={`w-12 h-12 bg-gradient-to-br ${adminStyles.iconGradient} rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25 transform transition-transform duration-300 group-hover:scale-110`}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gradient-purple text-shadow">
                      Admin Dashboard
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage platform users, courses, and sessions with enhanced controls
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full border border-green-500/20 self-start sm:self-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">System Active</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Children content with enhanced glass styling */}
            <div className="transform transition-all duration-300">
              <div className="relative perspective-1000">
                {/* Floating background for content with depth */}
                <div className="absolute inset-0 -inset-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-4xl -z-10 transform translate-z-0 shadow-depth-3"></div>
                
                {/* Enhanced content area with 3D effect */}
                <div className="relative glass-light dark:glass-dark backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-depth-4 dark:shadow-depth-5 overflow-hidden transform-3d card-3d">
                  {/* Enhanced accent top border */}
                  <div className={`h-1.5 bg-gradient-to-r ${adminStyles.borderGradient} animate-gradient-shift`}></div>
                  
                  {/* Content with enhanced padding */}
                  <div className="p-6 lg:p-8 relative z-10">
                    {children}
                  </div>
                  
                  {/* Bottom accent */}
                  <div className={`h-px bg-gradient-to-r ${adminStyles.borderGradient} opacity-50`}></div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="sticky bottom-0 glass-light dark:glass-dark backdrop-blur-xl border-t border-white/50 dark:border-gray-700/50 py-3 px-4 sm:px-6 z-20">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gradient-purple text-sm">
                Admin Panel v2.0
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="hidden sm:inline text-gray-500 dark:text-gray-500 text-xs">
                Secure Management Console
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-xs">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full relative"></div>
                </div>
                <span className="font-medium">All Systems Operational</span>
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Enhanced Floating Action Button for Mobile */}
      {!sidebarOpen && isMobile && (
        <button
          onClick={toggleSidebar}
          className={`
            fixed bottom-8 left-8 z-40 w-14 h-14 
            bg-gradient-to-br ${adminStyles.buttonGradient}
            rounded-2xl shadow-depth-4 ${adminStyles.glow}
            flex items-center justify-center text-white 
            transition-all duration-300 hover:scale-110 hover:shadow-depth-5 hover-lift
            lg:hidden
            backdrop-blur-lg border border-white/30
            animate-bounce-slow
            transform-3d
          `}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 transform transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-2xl bg-white/20 animate-ping-slow opacity-0"></span>
        </button>
      )}

      {/* Enhanced background orbs for extra depth */}
      <div className="fixed bottom-10 right-10 w-32 h-32 opacity-10">
        <div className={`absolute inset-0 bg-gradient-to-br ${adminStyles.primaryGradient} rounded-full blur-2xl animate-float-slower`}></div>
      </div>
    </div>
  );
};

export default AdminLayout;