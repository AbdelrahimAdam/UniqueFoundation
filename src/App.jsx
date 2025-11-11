import React, { Suspense, useEffect, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/use Auth.jsx';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';

// Lazy load auth pages
const Login = lazy(() => import('@/pages/Auth/Login.jsx'));
const Register = lazy(() => import('@/pages/Auth/Register.jsx'));

// Lazy load layout
const Layout = lazy(() => import('@/components/Layout/Layout.jsx'));

// Lazy load dashboards
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard.jsx'));
const TeacherDashboard = lazy(() => import('@/pages/Teacher/Dashboard.jsx'));
const StudentDashboard = lazy(() => import('@/pages/Student/Dashboard.jsx'));

// Lazy load admin pages
const UserManagement = lazy(() => import('@/pages/Admin/UserManagement.jsx'));
const CourseManagement = lazy(() => import('@/pages/Admin/CourseManagement.jsx'));
const SessionManagement = lazy(() => import('@/pages/Admin/SessionManagement.jsx'));
const Analytics = lazy(() => import('@/pages/Admin/Analytics.jsx'));

// Lazy load teacher pages
const TeacherRecordings = lazy(() => import('@/pages/Teacher/TeacherRecordings.jsx'));
const TeacherSessions = lazy(() => import('@/pages/Teacher/TeacherSessions.jsx'));
const TeacherStudents = lazy(() => import('@/pages/Teacher/TeacherStudents.jsx'));

// Lazy load student pages
const StudentSessions = lazy(() => import('@/pages/Student/StudentSessions.jsx'));
const StudentRecordings = lazy(() => import('@/pages/Student/StudentRecordings.jsx'));
const StudentCourses = lazy(() => import('@/pages/Student/StudentCourses.jsx'));

// Lazy load shared components
const RecordingDetail = lazy(() => import('@/pages/Recording/RecordingDetail.jsx'));
const Profile = lazy(() => import('@/pages/User/Profile.jsx'));
const SubscriptionPlans = lazy(() => import('@/components/Subscription/SubscriptionPlans.jsx'));

// Loading component for Suspense fallback
const PageLoading = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div className="text-center">
      <LoadingSpinner size="lg" className="text-blue-600 dark:text-blue-400" />
      <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  </div>
);

// ✅ Force Logout Component
const Logout = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        localStorage.clear()
        sessionStorage.clear()
        navigate('/login', { replace: true })
      }
    }

    performLogout()
  }, [navigate, signOut])

  return <PageLoading message="Logging out..." />
}

// ✅ Protected Route Component (Optimized)
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userRole, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoading />
  }

  // If no user and not loading, redirect to login
  if (!user && !loading) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user exists but profile is still loading, show loading
  if (user && !userProfile) {
    return <PageLoading message="Loading user profile..." />
  }

  // ⏳ Pending approval
  if (userProfile && !userProfile.isActive && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Account Pending Approval
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              Your account is pending admin approval. Please wait until your account is activated to access the dashboard.
            </p>
            <button
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.href = '/logout'
              }}
              className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout & Return to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// ✅ Public Route Component (Optimized)
const PublicRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  // If user exists and not loading, redirect to appropriate dashboard
  if (user && !loading) {
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />
      case 'student':
        return <Navigate to="/student/dashboard" replace />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return children
}

// ✅ Role-based dashboard component (Optimized)
const RoleBasedDashboard = () => {
  const { userRole, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-blue-600 dark:text-blue-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl">
            <div className="text-4xl mb-4 text-red-500">❌</div>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">
              Profile Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your user profile could not be loaded. Please contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!userProfile.isActive && userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl">
            <div className="text-4xl mb-4 text-yellow-500">⏳</div>
            <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">
              Account Pending Approval
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your account is pending admin approval. Please wait until your account is activated.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const DashboardComponent = {
    admin: AdminDashboard,
    teacher: TeacherDashboard,
    student: StudentDashboard
  }[userRole]

  if (!DashboardComponent) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl">
            <div className="text-4xl mb-4 text-red-500">❌</div>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">
              Invalid User Role
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your account has an invalid role. Please contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<PageLoading message="Loading dashboard..." />}>
      <DashboardComponent />
    </Suspense>
  )
}

// ✅ Lazy placeholder components for missing pages
const createLazyPlaceholder = (title, description) => 
  lazy(() => {
    const PlaceholderComponent = () => (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl border border-white/20 dark:border-gray-700/50 p-6 shadow-2xl">
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    )
    return Promise.resolve({ default: PlaceholderComponent })
  })

// Lazy placeholder components
const ReportsPage = createLazyPlaceholder('Reports', 'Reports content will be implemented here.');
const MyCourses = createLazyPlaceholder('My Courses', 'My courses content will be implemented here.');
const SchedulePage = createLazyPlaceholder('Schedule', 'Schedule content will be implemented here.');
const MessagesPage = createLazyPlaceholder('Messages', 'Messages content will be implemented here.');
const ProgressPage = createLazyPlaceholder('Progress', 'Progress tracking content will be implemented here.');
const BrowseCourses = createLazyPlaceholder('Browse Courses', 'Browse courses content will be implemented here.');
const NotificationsPage = createLazyPlaceholder('Notifications', 'Notifications content will be implemented here.');
const HelpPage = createLazyPlaceholder('Help & Support', 'Help and support content will be implemented here.');

// ✅ Unauthorized Page (Not lazy - frequently accessed)
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div className="text-center max-w-md mx-4">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Unauthorized Access
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
)

// ✅ Route Layout Wrapper (Optimized)
const RouteLayout = ({ role, children }) => (
  <Suspense fallback={<PageLoading message="Loading layout..." />}>
    <Layout role={role}>
      <Suspense fallback={<PageLoading message="Loading page..." />}>
        {children}
      </Suspense>
    </Layout>
  </Suspense>
)

// ✅ Admin Routes (Optimized)
const AdminRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="users" element={<UserManagement />} />
    <Route path="courses" element={<CourseManagement />} />
    <Route path="sessions" element={<SessionManagement />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="reports" element={<ReportsPage />} />
    <Route path="profile" element={<Profile />} />
    <Route path="subscription" element={<SubscriptionPlans />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="help" element={<HelpPage />} />
    <Route path="" element={<Navigate to="dashboard" replace />} />
  </Routes>
)

// ✅ Teacher Routes (Optimized)
const TeacherRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<TeacherDashboard />} />
    <Route path="recordings" element={<TeacherRecordings />} />
    <Route path="sessions" element={<TeacherSessions />} />
    <Route path="students" element={<TeacherStudents />} />
    <Route path="my-courses" element={<MyCourses />} />
    <Route path="schedule" element={<SchedulePage />} />
    <Route path="messages" element={<MessagesPage />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="profile" element={<Profile />} />
    <Route path="subscription" element={<SubscriptionPlans />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="help" element={<HelpPage />} />
    <Route path="" element={<Navigate to="dashboard" replace />} />
  </Routes>
)

// ✅ Student Routes (Optimized)
const StudentRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<StudentDashboard />} />
    <Route path="sessions" element={<StudentSessions />} />
    <Route path="recordings" element={<StudentRecordings />} />
    <Route path="courses" element={<StudentCourses />} />
    <Route path="my-courses" element={<MyCourses />} />
    <Route path="schedule" element={<SchedulePage />} />
    <Route path="messages" element={<MessagesPage />} />
    <Route path="progress" element={<ProgressPage />} />
    <Route path="profile" element={<Profile />} />
    <Route path="subscription" element={<SubscriptionPlans />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="help" element={<HelpPage />} />
    <Route path="" element={<Navigate to="dashboard" replace />} />
  </Routes>
)

// ✅ Main Routes (Optimized)
function AppRoutes() {
  const { userRole } = useAuth()

  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoading message="Loading login..." />}>
              <Login />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoading message="Loading registration..." />}>
              <Register />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route path="/logout" element={<Logout />} />

      {/* Main dashboard route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RouteLayout role={userRole}>
              <RoleBasedDashboard />
            </RouteLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <RouteLayout role="admin">
              <Suspense fallback={<PageLoading message="Loading admin section..." />}>
                <AdminRoutes />
              </Suspense>
            </RouteLayout>
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute requiredRole="teacher">
            <RouteLayout role="teacher">
              <Suspense fallback={<PageLoading message="Loading teacher section..." />}>
                <TeacherRoutes />
              </Suspense>
            </RouteLayout>
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <RouteLayout role="student">
              <Suspense fallback={<PageLoading message="Loading student section..." />}>
                <StudentRoutes />
              </Suspense>
            </RouteLayout>
          </ProtectedRoute>
        }
      />

      {/* Common routes */}
      <Route
        path="/recording/:id"
        element={
          <ProtectedRoute>
            <RouteLayout role={userRole}>
              <RecordingDetail />
            </RouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RouteLayout role={userRole}>
              <Profile />
            </RouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <RouteLayout role={userRole}>
              <SubscriptionPlans />
            </RouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <RouteLayout role={userRole}>
              <NotificationsPage />
            </RouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <RouteLayout role={userRole}>
              <HelpPage />
            </RouteLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute requiredRole="student">
            <RouteLayout role="student">
              <BrowseCourses />
            </RouteLayout>
          </ProtectedRoute>
        }
      />

      {/* Error routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Default routes */}
      <Route path="/" element={<NavigateToDashboard />} />
      <Route path="*" element={<NavigateToDashboard />} />
    </Routes>
  )
}

// ✅ Component to handle root redirect based on user role
const NavigateToDashboard = () => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to appropriate dashboard based on role
  const dashboardPaths = {
    admin: '/admin/dashboard',
    teacher: '/teacher/dashboard', 
    student: '/student/dashboard'
  }

  const dashboardPath = dashboardPaths[userRole]
  return dashboardPath ? <Navigate to={dashboardPath} replace /> : <Navigate to="/login" replace />
}

// ✅ App Wrapper
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Suspense fallback={<PageLoading message="Loading application..." />}>
          <AppRoutes />
        </Suspense>
      </div>
    </AuthProvider>
  )
}

export default App