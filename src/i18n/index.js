import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      'common': {
        'save': 'Save',
        'cancel': 'Cancel',
        'delete': 'Delete',
        'edit': 'Edit',
        'search': 'Search',
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success',
        'warning': 'Warning',
        'confirm': 'Confirm',
        'yes': 'Yes',
        'no': 'No',
        'profile': 'Profile',
        'create': 'Create',
        'current': 'Current',
        'mostPopular': 'Most Popular',
        'update': 'Update',
        'back': 'Back',
        'next': 'Next',
        'previous': 'Previous',
        'close': 'Close',
        'open': 'Open',
        'view': 'View',
        'manage': 'Manage',
        'settings': 'Settings',
        'preferences': 'Preferences',
        'language': 'Language',
        'notifications': 'Notifications',
        'help': 'Help',
        'support': 'Support',
        'about': 'About',
        'contact': 'Contact',
        'privacy': 'Privacy',
        'terms': 'Terms',
        'filters': {
          'all': 'All',
          'allStatus': 'All Status',
          'active': 'Active',
          'inactive': 'Inactive',
          'pending': 'Pending'
        }
      },
      
      // App
      'app': {
        'name': 'Meet Recorder',
        'description': 'Record and manage your Google Meet sessions',
        'tagline': 'Educational Platform for Online Classes',
        'version': 'Version',
        'copyright': 'All rights reserved'
      },
      
      // Auth
      'auth': {
        'login': 'Sign in',
        'register': 'Sign up',
        'logout': 'Logout',
        'email': 'Email',
        'password': 'Password',
        'confirmPassword': 'Confirm Password',
        'firstName': 'First Name',
        'lastName': 'Last Name',
        'forgotPassword': 'Forgot Password?',
        'noAccount': "Don't have an account?",
        'hasAccount': 'Already have an account?',
        'loginWithGoogle': 'Continue with Google',
        'registerAsTeacher': 'Register as Teacher',
        'registerAsStudent': 'Register as Student',
        'loginSubtitle': 'Welcome back! Please sign in to continue.',
        'registerSubtitle': 'Create your account to get started.',
        'invalidCredentials': 'Invalid email or password',
        'googleLoginFailed': 'Google login failed. Please try again.',
        'rememberMe': 'Remember me',
        'orContinueWith': 'Or continue with',
        'registrationFailed': 'Registration failed. Please try again.',
        'emailInUse': 'This email is already registered. Please use a different email or sign in.',
        'invalidEmail': 'The email address is not valid.',
        'operationNotAllowed': 'Email/password accounts are not enabled. Please contact support.',
        'weakPassword': 'The password is too weak. Please use a stronger password.',
        'networkError': 'Network error. Please check your connection and try again.',
        'registrationSuccess': 'Registration successful! Please wait for admin approval before logging in.',
        'logoutSuccess': 'You have been logged out successfully.',
        'sessionExpired': 'Your session has expired. Please log in again.'
      },
      
      // Validation
      'validation': {
        'required': '{{field}} is required',
        'invalidEmail': 'Invalid email address',
        'minLength': '{{field}} must be at least {{min}} characters',
        'maxLength': '{{field}} must be at most {{max}} characters',
        'passwordsMatch': 'Passwords must match',
        'invalidMeetUrl': 'Please enter a valid Google Meet URL',
        'invalidUrl': 'Please enter a valid URL',
        'invalidDate': 'Please enter a valid date',
        'invalidTime': 'Please enter a valid time',
        'futureDate': 'Please select a future date',
        'positiveNumber': 'Please enter a positive number'
      },
      
      // Navigation
      'navigation': {
        'home': 'Home',
        'dashboard': 'Dashboard',
        'courses': 'Courses',
        'sessions': 'Sessions',
        'recordings': 'Recordings',
        'users': 'Users',
        'analytics': 'Analytics',
        'reports': 'Reports',
        'admin': 'Admin'
      },
      
      // Sidebar
      'sidebar': {
        'dashboard': 'Dashboard',
        'recordings': 'Recordings',
        'students': 'Students',
        'teachers': 'Teachers',
        'users': 'Users',
        'analytics': 'Analytics',
        'classes': 'Classes',
        'courses': 'Courses',
        'sessions': 'Sessions',
        'settings': 'Settings',
        'profile': 'Profile',
        'subscription': 'Subscription'
      },
      
      // Teacher
      'teacher': {
        'dashboard': {
          'title': 'Teacher Dashboard',
          'subtitle': 'Manage your recordings and classes',
          'noRecordings': 'No recordings yet',
          'getStarted': 'Get started by creating your first recording session',
          'welcome': 'Welcome back, Teacher!'
        },
        'stats': {
          'totalRecordings': 'Total Recordings',
          'published': 'Published',
          'totalViews': 'Total Views',
          'recording': 'Recording',
          'students': 'Students',
          'courses': 'Courses',
          'upcomingSessions': 'Upcoming Sessions'
        },
        'actions': {
          'createSession': 'Create New Session',
          'manageStudents': 'Manage Students',
          'viewAnalytics': 'View Analytics',
          'uploadRecording': 'Upload Recording'
        }
      },
      
      // Student
      'student': {
        'dashboard': {
          'title': 'Student Dashboard',
          'subtitle': 'Access your courses and recordings',
          'welcome': 'Welcome back, Student!',
          'noCourses': 'No courses enrolled yet',
          'enrollNow': 'Browse available courses and enroll to get started'
        },
        'stats': {
          'enrolledCourses': 'Enrolled Courses',
          'completedSessions': 'Completed Sessions',
          'upcomingSessions': 'Upcoming Sessions',
          'watchTime': 'Total Watch Time'
        },
        'actions': {
          'joinSession': 'Join Session',
          'viewRecording': 'View Recording',
          'downloadMaterials': 'Download Materials',
          'askQuestion': 'Ask Question'
        }
      },
      
      // Admin
      'admin': {
        'dashboard': {
          'title': 'Admin Dashboard',
          'subtitle': 'Manage users, courses, and sessions',
          'welcome': 'Welcome back, Administrator!'
        },
        'tabs': {
          'dashboard': 'Dashboard',
          'users': 'Users',
          'courses': 'Courses',
          'sessions': 'Sessions',
          'analytics': 'Analytics',
          'settings': 'Settings',
          'reports': 'Reports'
        },
        'users': {
          'title': 'User Management',
          'subtitle': 'Manage user accounts and permissions',
          'totalUsers': 'Total Users',
          'activeUsers': 'Active Users',
          'pendingApproval': 'Pending Approval',
          'approve': 'Approve',
          'reject': 'Reject',
          'deactivate': 'Deactivate',
          'activate': 'Activate',
          'changeRole': 'Change Role',
          'userDetails': 'User Details'
        },
        'courses': {
          'title': 'Course Management',
          'subtitle': 'Create and manage courses',
          'createCourse': 'Create Course',
          'editCourse': 'Edit Course',
          'courseDetails': 'Course Details',
          'enrolledStudents': 'Enrolled Students'
        },
        'sessions': {
          'title': 'Session Management',
          'subtitle': 'Schedule and manage sessions',
          'createSession': 'Create Session',
          'editSession': 'Edit Session',
          'sessionDetails': 'Session Details',
          'upcomingSessions': 'Upcoming Sessions',
          'pastSessions': 'Past Sessions'
        },
        'stats': {
          'totalUsers': 'Total Users',
          'activeSessions': 'Active Sessions',
          'totalCourses': 'Total Courses',
          'totalRecordings': 'Total Recordings',
          'systemHealth': 'System Health',
          'storageUsed': 'Storage Used'
        },
        'actions': {
          'manageUsers': 'Manage Users',
          'createCourse': 'Create Course',
          'scheduleSession': 'Schedule Session',
          'viewReports': 'View Reports',
          'systemSettings': 'System Settings'
        }
      },
      
      // Recording
      'recording': {
        'createNew': 'New Recording',
        'title': 'Title',
        'description': 'Description',
        'class': 'Class',
        'course': 'Course',
        'meetUrl': 'Google Meet URL',
        'startRecording': 'Start Recording',
        'stopRecording': 'Stop Recording',
        'uploadRecording': 'Upload Recording',
        'editRecording': 'Edit Recording',
        'deleteRecording': 'Delete Recording',
        'recordingDetails': 'Recording Details',
        'status': {
          'pending': 'Pending',
          'recording': 'Recording',
          'processing': 'Processing',
          'completed': 'Completed',
          'failed': 'Failed'
        },
        'views': '{{count}} views',
        'draft': 'Draft',
        'published': 'Published',
        'duration': 'Duration',
        'size': 'Size',
        'format': 'Format',
        'createdAt': 'Created At',
        'updatedAt': 'Updated At'
      },
      
      // Session
      'session': {
        'createNew': 'Create New Session',
        'createSession': 'Create Session',
        'editSession': 'Edit Session',
        'title': 'Session Title',
        'description': 'Description',
        'date': 'Session Date',
        'time': 'Session Time',
        'meetLink': 'Google Meet Link',
        'duration': 'Duration (minutes)',
        'joinSession': 'Join Session',
        'viewRecording': 'View Recording',
        'upcomingSessions': 'Upcoming Sessions',
        'pastSessions': 'Past Sessions',
        'liveNow': 'Live Now',
        'scheduled': 'Scheduled',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'participants': 'Participants',
        'recordingAvailable': 'Recording Available',
        'noRecording': 'No Recording Available'
      },
      
      // Course
      'course': {
        'title': 'Course Title',
        'description': 'Course Description',
        'instructor': 'Instructor',
        'duration': 'Course Duration',
        'level': 'Level',
        'category': 'Category',
        'price': 'Price',
        'enroll': 'Enroll',
        'unenroll': 'Unenroll',
        'enrolled': 'Enrolled',
        'completed': 'Completed',
        'progress': 'Progress',
        'materials': 'Course Materials',
        'syllabus': 'Syllabus',
        'requirements': 'Requirements'
      },
      
      // User
      'user': {
        'profile': 'User Profile',
        'settings': 'User Settings',
        'preferences': 'Preferences',
        'account': 'Account',
        'security': 'Security',
        'notifications': 'Notifications',
        'billing': 'Billing',
        'role': 'Role',
        'status': 'Status',
        'joined': 'Joined',
        'lastActive': 'Last Active',
        'editProfile': 'Edit Profile',
        'changePassword': 'Change Password',
        'deleteAccount': 'Delete Account'
      },
      
      // Subscription
      'subscription': {
        'title': 'Subscription Plans',
        'free': {
          'name': 'Free Plan',
          'price': 'Free',
          'description': 'Perfect for getting started',
          'features': [
            'Access to basic courses',
            'Join live sessions',
            'View recordings',
            'Community support'
          ]
        },
        'premium': {
          'name': 'Premium Plan',
          'price': 'Coming Soon',
          'description': 'For serious learners',
          'features': [
            'All free features',
            'Advanced courses',
            'Priority support',
            'Download resources',
            'Certificate of completion'
          ]
        },
        'subscribe': 'Subscribe Now',
        'upgrade': 'Upgrade Now',
        'downgrade': 'Downgrade',
        'cancel': 'Cancel Subscription',
        'comingSoon': 'Coming Soon',
        'currentPlan': 'Current Plan',
        'billingCycle': 'Billing Cycle',
        'nextBilling': 'Next Billing Date',
        'status': {
          'active': 'Active',
          'inactive': 'Inactive',
          'pending': 'Pending Approval',
          'cancelled': 'Cancelled',
          'expired': 'Expired'
        }
      },
      
      // Notifications
      'notifications': {
        'title': 'Notifications',
        'markAllRead': 'Mark all as read',
        'noNotifications': 'No new notifications',
        'types': {
          'sessionReminder': 'Session Reminder',
          'recordingReady': 'Recording Ready',
          'newCourse': 'New Course Available',
          'systemUpdate': 'System Update'
        }
      },
      
      // Errors
      'error': {
        'loadingFailed': 'Loading failed',
        'failedToLoadRecordings': 'Failed to load recordings',
        'networkError': 'Network error',
        'unauthorized': 'Unauthorized access',
        'forbidden': 'Access forbidden',
        'notFound': 'Resource not found',
        'serverError': 'Server error',
        'generic': 'Something went wrong',
        'tryAgain': 'Please try again',
        'contactSupport': 'Contact support if the problem persists',
        'pageNotFound': 'Page not found',
        'goHome': 'Go back to home'
      },
      
      // Success Messages
      'success': {
        'saved': 'Changes saved successfully',
        'created': 'Created successfully',
        'updated': 'Updated successfully',
        'deleted': 'Deleted successfully',
        'uploaded': 'Uploaded successfully',
        'approved': 'Approved successfully',
        'rejected': 'Rejected successfully',
        'enrolled': 'Enrolled successfully',
        'joined': 'Joined successfully'
      },
      
      // Status Messages
      'status': {
        'loading': 'Loading...',
        'saving': 'Saving...',
        'processing': 'Processing...',
        'uploading': 'Uploading...',
        'downloading': 'Downloading...'
      }
    }
  },
  ar: {
    translation: {
      // Common
      'common': {
        'save': 'حفظ',
        'cancel': 'إلغاء',
        'delete': 'حذف',
        'edit': 'تعديل',
        'search': 'بحث',
        'loading': 'جاري التحميل...',
        'error': 'خطأ',
        'success': 'نجاح',
        'warning': 'تحذير',
        'confirm': 'تأكيد',
        'yes': 'نعم',
        'no': 'لا',
        'profile': 'الملف الشخصي',
        'create': 'إنشاء',
        'current': 'الحالي',
        'mostPopular': 'الأكثر شيوعاً',
        'update': 'تحديث',
        'back': 'رجوع',
        'next': 'التالي',
        'previous': 'السابق',
        'close': 'إغلاق',
        'open': 'فتح',
        'view': 'عرض',
        'manage': 'إدارة',
        'settings': 'الإعدادات',
        'preferences': 'التفضيلات',
        'language': 'اللغة',
        'notifications': 'الإشعارات',
        'help': 'مساعدة',
        'support': 'الدعم',
        'about': 'حول',
        'contact': 'اتصل بنا',
        'privacy': 'الخصوصية',
        'terms': 'الشروط',
        'filters': {
          'all': 'الكل',
          'allStatus': 'كل الحالات',
          'active': 'نشط',
          'inactive': 'غير نشط',
          'pending': 'قيد الانتظار'
        }
      },
      
      // App
      'app': {
        'name': 'مسجل الاجتماعات',
        'description': 'سجل وادار جلسات جوجل ميت الخاصة بك',
        'tagline': 'منصة تعليمية للفصول الدراسية عبر الإنترنت',
        'version': 'الإصدار',
        'copyright': 'جميع الحقوق محفوظة'
      },
      
      // Auth
      'auth': {
        'login': 'تسجيل الدخول',
        'register': 'إنشاء حساب',
        'logout': 'تسجيل الخروج',
        'email': 'البريد الإلكتروني',
        'password': 'كلمة المرور',
        'confirmPassword': 'تأكيد كلمة المرور',
        'firstName': 'الاسم الأول',
        'lastName': 'اسم العائلة',
        'forgotPassword': 'نسيت كلمة المرور؟',
        'noAccount': 'ليس لديك حساب؟',
        'hasAccount': 'لديك حساب بالفعل؟',
        'loginWithGoogle': 'الدخول بحساب جوجل',
        'registerAsTeacher': 'التسجيل كمدرس',
        'registerAsStudent': 'التسجيل كطالب',
        'loginSubtitle': 'مرحباً بعودتك! يرجى تسجيل الدخول للمتابعة.',
        'registerSubtitle': 'أنشئ حسابك للبدء.',
        'invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        'googleLoginFailed': 'فشل الدخول بحساب جوجل. يرجى المحاولة مرة أخرى.',
        'rememberMe': 'تذكرني',
        'orContinueWith': 'أو تابع باستخدام',
        'registrationFailed': 'فشل التسجيل. يرجى المحاولة مرة أخرى.',
        'emailInUse': 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني مختلف أو تسجيل الدخول.',
        'invalidEmail': 'عنوان البريد الإلكتروني غير صالح.',
        'operationNotAllowed': 'حسابات البريد الإلكتروني/كلمة المرور غير مفعلة. يرجى الاتصال بالدعم.',
        'weakPassword': 'كلمة المرور ضعيفة جداً. يرجى استخدام كلمة مرور أقوى.',
        'networkError': 'خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
        'registrationSuccess': 'تم التسجيل بنجاح! يرجى انتظار موافقة المدير قبل تسجيل الدخول.',
        'logoutSuccess': 'تم تسجيل الخروج بنجاح.',
        'sessionExpired': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.'
      },
      
      // Validation
      'validation': {
        'required': '{{field}} مطلوب',
        'invalidEmail': 'بريد إلكتروني غير صالح',
        'minLength': '{{field}} يجب أن يكون على الأقل {{min}} أحرف',
        'maxLength': '{{field}} يجب أن يكون على الأكثر {{max}} أحرف',
        'passwordsMatch': 'كلمات المرور يجب أن تتطابق',
        'invalidMeetUrl': 'يرجى إدخال رابط جوجل ميت صالح',
        'invalidUrl': 'يرجى إدخال رابط صالح',
        'invalidDate': 'يرجى إدخال تاريخ صالح',
        'invalidTime': 'يرجى إدخال وقت صالح',
        'futureDate': 'يرجى اختيار تاريخ مستقبلي',
        'positiveNumber': 'يرجى إدخال رقم موجب'
      },
      
      // Navigation
      'navigation': {
        'home': 'الرئيسية',
        'dashboard': 'لوحة التحكم',
        'courses': 'الدورات',
        'sessions': 'الجلسات',
        'recordings': 'التسجيلات',
        'users': 'المستخدمين',
        'analytics': 'التحليلات',
        'reports': 'التقارير',
        'admin': 'المدير'
      },
      
      // Sidebar
      'sidebar': {
        'dashboard': 'لوحة التحكم',
        'recordings': 'التسجيلات',
        'students': 'الطلاب',
        'teachers': 'المدرسين',
        'users': 'المستخدمين',
        'analytics': 'التحليلات',
        'classes': 'الفصول',
        'courses': 'الدورات',
        'sessions': 'الجلسات',
        'settings': 'الإعدادات',
        'profile': 'الملف الشخصي',
        'subscription': 'الاشتراك'
      },
      
      // Teacher
      'teacher': {
        'dashboard': {
          'title': 'لوحة تحكم المدرس',
          'subtitle': 'إدارة التسجيلات والفصول',
          'noRecordings': 'لا توجد تسجيلات بعد',
          'getStarted': 'ابدأ بإنشاء جلسة التسجيل الأولى',
          'welcome': 'أهلاً بعودتك، أيها المدرس!'
        },
        'stats': {
          'totalRecordings': 'إجمالي التسجيلات',
          'published': 'منشور',
          'totalViews': 'إجمالي المشاهدات',
          'recording': 'قيد التسجيل',
          'students': 'الطلاب',
          'courses': 'الدورات',
          'upcomingSessions': 'الجلسات القادمة'
        },
        'actions': {
          'createSession': 'إنشاء جلسة جديدة',
          'manageStudents': 'إدارة الطلاب',
          'viewAnalytics': 'عرض التحليلات',
          'uploadRecording': 'رفع تسجيل'
        }
      },
      
      // Student
      'student': {
        'dashboard': {
          'title': 'لوحة تحكم الطالب',
          'subtitle': 'الوصول إلى دوراتك وتسجيلاتك',
          'welcome': 'أهلاً بعودتك، أيها الطالب!',
          'noCourses': 'لا توجد دورات مسجلة بعد',
          'enrollNow': 'تصفح الدورات المتاحة وسجل للبدء'
        },
        'stats': {
          'enrolledCourses': 'الدورات المسجلة',
          'completedSessions': 'الجلسات المكتملة',
          'upcomingSessions': 'الجلسات القادمة',
          'watchTime': 'إجمالي وقت المشاهدة'
        },
        'actions': {
          'joinSession': 'انضم للجلسة',
          'viewRecording': 'شاهد التسجيل',
          'downloadMaterials': 'تحميل المواد',
          'askQuestion': 'اطرح سؤالاً'
        }
      },
      
      // Admin
      'admin': {
        'dashboard': {
          'title': 'لوحة تحكم المدير',
          'subtitle': 'إدارة المستخدمين، الدورات، والجلسات',
          'welcome': 'أهلاً بعودتك، أيها المدير!'
        },
        'tabs': {
          'dashboard': 'لوحة التحكم',
          'users': 'المستخدمين',
          'courses': 'الدورات',
          'sessions': 'الجلسات',
          'analytics': 'التحليلات',
          'settings': 'الإعدادات',
          'reports': 'التقارير'
        },
        'users': {
          'title': 'إدارة المستخدمين',
          'subtitle': 'إدارة حسابات المستخدمين والصلاحيات',
          'totalUsers': 'إجمالي المستخدمين',
          'activeUsers': 'المستخدمين النشطين',
          'pendingApproval': 'بانتظار الموافقة',
          'approve': 'موافقة',
          'reject': 'رفض',
          'deactivate': 'تعطيل',
          'activate': 'تفعيل',
          'changeRole': 'تغيير الدور',
          'userDetails': 'تفاصيل المستخدم'
        },
        'courses': {
          'title': 'إدارة الدورات',
          'subtitle': 'إنشاء وإدارة الدورات',
          'createCourse': 'إنشاء دورة',
          'editCourse': 'تعديل الدورة',
          'courseDetails': 'تفاصيل الدورة',
          'enrolledStudents': 'الطلاب المسجلين'
        },
        'sessions': {
          'title': 'إدارة الجلسات',
          'subtitle': 'جدولة وإدارة الجلسات',
          'createSession': 'إنشاء جلسة',
          'editSession': 'تعديل الجلسة',
          'sessionDetails': 'تفاصيل الجلسة',
          'upcomingSessions': 'الجلسات القادمة',
          'pastSessions': 'الجلسات السابقة'
        },
        'stats': {
          'totalUsers': 'إجمالي المستخدمين',
          'activeSessions': 'الجلسات النشطة',
          'totalCourses': 'إجمالي الدورات',
          'totalRecordings': 'إجمالي التسجيلات',
          'systemHealth': 'صحة النظام',
          'storageUsed': 'المساحة المستخدمة'
        },
        'actions': {
          'manageUsers': 'إدارة المستخدمين',
          'createCourse': 'إنشاء دورة',
          'scheduleSession': 'جدولة جلسة',
          'viewReports': 'عرض التقارير',
          'systemSettings': 'إعدادات النظام'
        }
      },
      
      // Recording
      'recording': {
        'createNew': 'تسجيل جديد',
        'title': 'العنوان',
        'description': 'الوصف',
        'class': 'الفصل',
        'course': 'الدورة',
        'meetUrl': 'رابط جوجل ميت',
        'startRecording': 'بدء التسجيل',
        'stopRecording': 'إيقاف التسجيل',
        'uploadRecording': 'رفع التسجيل',
        'editRecording': 'تعديل التسجيل',
        'deleteRecording': 'حذف التسجيل',
        'recordingDetails': 'تفاصيل التسجيل',
        'status': {
          'pending': 'قيد الانتظار',
          'recording': 'جاري التسجيل',
          'processing': 'قيد المعالجة',
          'completed': 'مكتمل',
          'failed': 'فشل'
        },
        'views': '{{count}} مشاهدات',
        'draft': 'مسودة',
        'published': 'منشور',
        'duration': 'المدة',
        'size': 'الحجم',
        'format': 'الصيغة',
        'createdAt': 'تم الإنشاء في',
        'updatedAt': 'تم التحديث في'
      },
      
      // Session
      'session': {
        'createNew': 'إنشاء جلسة جديدة',
        'createSession': 'إنشاء الجلسة',
        'editSession': 'تعديل الجلسة',
        'title': 'عنوان الجلسة',
        'description': 'الوصف',
        'date': 'تاريخ الجلسة',
        'time': 'وقت الجلسة',
        'meetLink': 'رابط جوجل ميت',
        'duration': 'المدة (بالدقائق)',
        'joinSession': 'انضم للجلسة',
        'viewRecording': 'شاهد التسجيل',
        'upcomingSessions': 'الجلسات القادمة',
        'pastSessions': 'الجلسات السابقة',
        'liveNow': 'مباشر الآن',
        'scheduled': 'مجدولة',
        'completed': 'مكتملة',
        'cancelled': 'ملغية',
        'participants': 'المشاركين',
        'recordingAvailable': 'التسجيل متاح',
        'noRecording': 'لا يوجد تسجيل متاح'
      },
      
      // Course
      'course': {
        'title': 'عنوان الدورة',
        'description': 'وصف الدورة',
        'instructor': 'المدرس',
        'duration': 'مدة الدورة',
        'level': 'المستوى',
        'category': 'الفئة',
        'price': 'السعر',
        'enroll': 'سجل',
        'unenroll': 'إلغاء التسجيل',
        'enrolled': 'مسجل',
        'completed': 'مكتمل',
        'progress': 'التقدم',
        'materials': 'مواد الدورة',
        'syllabus': 'المنهج',
        'requirements': 'المتطلبات'
      },
      
      // User
      'user': {
        'profile': 'الملف الشخصي',
        'settings': 'إعدادات المستخدم',
        'preferences': 'التفضيلات',
        'account': 'الحساب',
        'security': 'الأمان',
        'notifications': 'الإشعارات',
        'billing': 'الفواتير',
        'role': 'الدور',
        'status': 'الحالة',
        'joined': 'انضم في',
        'lastActive': 'نشط آخر مرة',
        'editProfile': 'تعديل الملف',
        'changePassword': 'تغيير كلمة المرور',
        'deleteAccount': 'حذف الحساب'
      },
      
      // Subscription
      'subscription': {
        'title': 'باقات الاشتراك',
        'free': {
          'name': 'الباقة المجانية',
          'price': 'مجاني',
          'description': 'مثالي للبدء',
          'features': [
            'الوصول للدورات الأساسية',
            'الانضمام للجلسات المباشرة',
            'مشاهدة التسجيلات',
            'دعم المجتمع'
          ]
        },
        'premium': {
          'name': 'الباقة المميزة',
          'price': 'قريباً',
          'description': 'للمتعلمين الجادين',
          'features': [
            'كل ميزات الباقة المجانية',
            'الدورات المتقدمة',
            'دعم متميز',
            'تحميل المصادر',
            'شهادة إتمام'
          ]
        },
        'subscribe': 'اشترك الآن',
        'upgrade': 'ترقية الآن',
        'downgrade': 'تخفيض',
        'cancel': 'إلغاء الاشتراك',
        'comingSoon': 'قريباً',
        'currentPlan': 'الباقة الحالية',
        'billingCycle': 'دورة الفواتير',
        'nextBilling': 'تاريخ الفاتورة القادمة',
        'status': {
          'active': 'نشط',
          'inactive': 'غير نشط',
          'pending': 'بانتظار الموافقة',
          'cancelled': 'ملغى',
          'expired': 'منتهي'
        }
      },
      
      // Notifications
      'notifications': {
        'title': 'الإشعارات',
        'markAllRead': 'تعليم الكل كمقروء',
        'noNotifications': 'لا توجد إشعارات جديدة',
        'types': {
          'sessionReminder': 'تذكير بالجلسة',
          'recordingReady': 'التسجيل جاهز',
          'newCourse': 'دورة جديدة متاحة',
          'systemUpdate': 'تحديث النظام'
        }
      },
      
      // Errors
      'error': {
        'loadingFailed': 'فشل التحميل',
        'failedToLoadRecordings': 'فشل تحميل التسجيلات',
        'networkError': 'خطأ في الشبكة',
        'unauthorized': 'وصول غير مصرح',
        'forbidden': 'وصول ممنوع',
        'notFound': 'المورد غير موجود',
        'serverError': 'خطأ في الخادم',
        'generic': 'حدث خطأ ما',
        'tryAgain': 'يرجى المحاولة مرة أخرى',
        'contactSupport': 'اتصل بالدعم إذا استمرت المشكلة',
        'pageNotFound': 'الصفحة غير موجودة',
        'goHome': 'العودة للرئيسية'
      },
      
      // Success Messages
      'success': {
        'saved': 'تم حفظ التغييرات بنجاح',
        'created': 'تم الإنشاء بنجاح',
        'updated': 'تم التحديث بنجاح',
        'deleted': 'تم الحذف بنجاح',
        'uploaded': 'تم الرفع بنجاح',
        'approved': 'تمت الموافقة بنجاح',
        'rejected': 'تم الرفض بنجاح',
        'enrolled': 'تم التسجيل بنجاح',
        'joined': 'تم الانضمام بنجاح'
      },
      
      // Status Messages
      'status': {
        'loading': 'جاري التحميل...',
        'saving': 'جاري الحفظ...',
        'processing': 'جاري المعالجة...',
        'uploading': 'جاري الرفع...',
        'downloading': 'جاري التحميل...'
      }
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

// Set initial direction
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

export default i18n