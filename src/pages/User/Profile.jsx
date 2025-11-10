import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, storage } from '../../config/firebase';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  GraduationCap,
  UserCheck,
  Save,
  Upload,
  Camera,
  Building,
  Users,
  BarChart3,
  Settings,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  CreditCard,
  Bell,
  Lock,
  Globe,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';

const Profile = () => {
  const { t } = useTranslation();
  const { user, userProfile, updateProfile, userRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    bio: '',
    department: '',
    gradeLevel: '',
    subjects: '',
    qualifications: ''
  });

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get role-based gradient colors
  const getAvatarGradient = () => {
    switch (userRole) {
      case 'admin': return 'from-purple-500 to-violet-600';
      case 'teacher': return 'from-blue-500 to-cyan-600';
      case 'student': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        bio: userProfile.bio || '',
        department: userProfile.department || '',
        gradeLevel: userProfile.gradeLevel || '',
        subjects: userProfile.subjects || '',
        qualifications: userProfile.qualifications || ''
      });
    }
    loadUserStats();
  }, [userProfile, userRole]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      let userStats = {};
      
      switch (userRole) {
        case 'admin':
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const coursesSnapshot = await getDocs(collection(db, 'courses'));
          const teachersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
          
          userStats = {
            totalUsers: usersSnapshot.size,
            activeCourses: coursesSnapshot.size,
            teachers: teachersSnapshot.size,
            systemHealth: '98%'
          };
          break;

        case 'teacher':
          const teacherCoursesSnapshot = await getDocs(query(collection(db, 'courses'), where('teacherId', '==', user.uid)));
          const teacherSessionsSnapshot = await getDocs(query(collection(db, 'sessions'), where('teacherId', '==', user.uid)));
          const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          
          userStats = {
            totalCourses: teacherCoursesSnapshot.size,
            sessions: teacherSessionsSnapshot.size,
            students: studentsSnapshot.size,
            rating: '4.8/5'
          };
          break;

        case 'student':
          const studentCoursesSnapshot = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid)));
          const completedLessonsSnapshot = await getDocs(query(collection(db, 'progress'), where('studentId', '==', user.uid), where('completed', '==', true)));
          const upcomingSessionsSnapshot = await getDocs(query(collection(db, 'sessions'), where('students', 'array-contains', user.uid)));
          
          userStats = {
            enrolledCourses: studentCoursesSnapshot.size,
            completedLessons: completedLessonsSnapshot.size,
            upcomingSessions: upcomingSessionsSnapshot.size,
            progress: '75%'
          };
          break;

        default:
          userStats = {};
      }
      
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError(t('profile.fillAllFields', 'Please fill in all fields'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError(t('profile.passwordMinLength', 'Password must be at least 6 characters long'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('profile.passwordsDontMatch', 'New passwords do not match'));
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError(t('profile.samePassword', 'New password must be different from current password'));
      return;
    }

    setChangingPassword(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      setPasswordSuccess(t('profile.passwordChanged', 'Password changed successfully!'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      switch (error.code) {
        case 'auth/wrong-password':
          setPasswordError(t('profile.incorrectPassword', 'Current password is incorrect'));
          break;
        case 'auth/weak-password':
          setPasswordError(t('profile.weakPassword', 'Password is too weak. Please use a stronger password.'));
          break;
        case 'auth/requires-recent-login':
          setPasswordError(t('profile.recentLoginRequired', 'Please log in again to change your password'));
          break;
        default:
          setPasswordError(t('profile.passwordChangeFailed', 'Failed to change password. Please try again.'));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // NEW: Base64 image upload that works without CORS issues
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (1MB max for Base64)
    if (file.size > 1 * 1024 * 1024) {
      alert('Image size should be less than 1MB for quick upload');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const base64String = event.target.result;
        
        // Update profile with Base64 image
        await updateProfile({ 
          photoURL: base64String,
          photoURLType: 'base64' // Mark as Base64 for rendering
        });
        
        alert('Profile picture updated successfully!');
      } catch (error) {
        console.error('Error updating profile with Base64:', error);
        alert('Failed to update profile picture. Please try again.');
      } finally {
        setUploadingImage(false);
      }
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  // Render avatar with proper fallbacks
  const renderAvatar = () => {
    const avatarUrl = userProfile?.photoURL || user?.photoURL;
    
    // If we have a Base64 image or regular URL
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
          onError={(e) => {
            // If image fails to load, fall back to initials
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    // Fallback to initials avatar
    return null;
  };

  const getRoleConfig = () => {
    const baseConfig = {
      admin: {
        icon: Shield,
        color: 'purple',
        badge: t('admin.administrator', 'Administrator'),
        stats: [
          {
            label: t('admin.totalUsers', 'Total Users'),
            value: stats.totalUsers || '0',
            icon: Users,
            color: 'text-blue-600'
          },
          {
            label: t('admin.activeCourses', 'Active Courses'),
            value: stats.activeCourses || '0',
            icon: BookOpen,
            color: 'text-green-600'
          },
          {
            label: t('admin.teachers', 'Teachers'),
            value: stats.teachers || '0',
            icon: UserCheck,
            color: 'text-purple-600'
          },
          {
            label: t('admin.systemHealth', 'System Health'),
            value: stats.systemHealth || '100%',
            icon: Settings,
            color: 'text-green-600'
          }
        ]
      },
      teacher: {
        icon: UserCheck,
        color: 'blue',
        badge: t('teacher.teacher', 'Teacher'),
        stats: [
          {
            label: t('teacher.totalCourses', 'Total Courses'),
            value: stats.totalCourses || '0',
            icon: BookOpen,
            color: 'text-blue-600'
          },
          {
            label: t('teacher.sessions', 'Sessions'),
            value: stats.sessions || '0',
            icon: Clock,
            color: 'text-green-600'
          },
          {
            label: t('teacher.students', 'Students'),
            value: stats.students || '0',
            icon: Users,
            color: 'text-purple-600'
          },
          {
            label: t('teacher.rating', 'Rating'),
            value: stats.rating || '0/5',
            icon: Award,
            color: 'text-yellow-600'
          }
        ]
      },
      student: {
        icon: GraduationCap,
        color: 'green',
        badge: t('student.student', 'Student'),
        stats: [
          {
            label: t('student.enrolledCourses', 'Enrolled Courses'),
            value: stats.enrolledCourses || '0',
            icon: BookOpen,
            color: 'text-blue-600'
          },
          {
            label: t('student.completedLessons', 'Completed Lessons'),
            value: stats.completedLessons || '0',
            icon: Award,
            color: 'text-green-600'
          },
          {
            label: t('student.upcomingSessions', 'Upcoming Sessions'),
            value: stats.upcomingSessions || '0',
            icon: Clock,
            color: 'text-purple-600'
          },
          {
            label: t('student.progress', 'Overall Progress'),
            value: stats.progress || '0%',
            icon: TrendingUp,
            color: 'text-green-600'
          }
        ]
      }
    };

    return baseConfig[userRole] || baseConfig.student;
  };

  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('profile.personalInfo', 'Personal Information')}
          </h2>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              {t('profile.edit', 'Edit Profile')}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('profile.firstName', 'First Name')}
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              icon={<User size={18} className="text-gray-400" />}
            />
            <Input
              label={t('profile.lastName', 'Last Name')}
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <Input
            label={t('profile.email', 'Email Address')}
            name="email"
            value={user?.email || ''}
            disabled
            icon={<Mail size={18} className="text-gray-400" />}
          />

          <Input
            label={t('profile.phone', 'Phone Number')}
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!isEditing}
            icon={<Phone size={18} className="text-gray-400" />}
          />

          {(userRole === 'admin' || userRole === 'teacher') && (
            <Input
              label={t('profile.department', 'Department')}
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={!isEditing}
              icon={<Building size={18} className="text-gray-400" />}
            />
          )}

          {userRole === 'student' && (
            <Input
              label={t('profile.gradeLevel', 'Grade Level')}
              name="gradeLevel"
              value={formData.gradeLevel}
              onChange={handleInputChange}
              disabled={!isEditing}
              icon={<GraduationCap size={18} className="text-gray-400" />}
            />
          )}

          {userRole === 'teacher' && (
            <Input
              label={t('profile.subjects', 'Subjects')}
              name="subjects"
              value={formData.subjects}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder={t('profile.subjectsPlaceholder', 'Math, Science, English...')}
              icon={<BookOpen size={18} className="text-gray-400" />}
            />
          )}

          {userRole === 'teacher' && (
            <Input
              label={t('profile.qualifications', 'Qualifications')}
              name="qualifications"
              value={formData.qualifications}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder={t('profile.qualificationsPlaceholder', 'M.Ed, PhD, Teaching Certificate...')}
              icon={<Award size={18} className="text-gray-400" />}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.bio', 'Bio')}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              placeholder={t('profile.bioPlaceholder', 'Tell us about yourself...')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.address', 'Address')}
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              placeholder={t('profile.addressPlaceholder', 'Enter your address...')}
            />
          </div>

          {isEditing && (
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={handleSaveProfile}
                loading={isLoading}
                className="flex items-center"
              >
                <Save size={18} className="mr-2" />
                {t('profile.save', 'Save Changes')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: userProfile?.firstName || '',
                    lastName: userProfile?.lastName || '',
                    phone: userProfile?.phone || '',
                    address: userProfile?.address || '',
                    bio: userProfile?.bio || '',
                    department: userProfile?.department || '',
                    gradeLevel: userProfile?.gradeLevel || '',
                    subjects: userProfile?.subjects || '',
                    qualifications: userProfile?.qualifications || ''
                  });
                }}
              >
                {t('profile.cancel', 'Cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('profile.changePassword', 'Change Password')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('profile.passwordSecurity', 'Update your password to keep your account secure')}
        </p>
      </div>

      {passwordError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
        </div>
      )}

      {passwordSuccess && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
        </div>
      )}

      <div className="space-y-4 max-w-md">
        <Input
          label={t('profile.currentPassword', 'Current Password')}
          name="currentPassword"
          type={showCurrentPassword ? 'text' : 'password'}
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
          icon={<Lock size={18} className="text-gray-400" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Input
          label={t('profile.newPassword', 'New Password')}
          name="newPassword"
          type={showNewPassword ? 'text' : 'password'}
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          icon={<Key size={18} className="text-gray-400" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Input
          label={t('profile.confirmPassword', 'Confirm New Password')}
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          icon={<Key size={18} className="text-gray-400" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="pt-4">
          <Button
            onClick={handleChangePassword}
            loading={changingPassword}
            className="flex items-center"
          >
            <Key size={18} className="mr-2" />
            {t('profile.updatePassword', 'Update Password')}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            {t('profile.passwordTips', 'Password Tips')}
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• {t('profile.minLength', 'Use at least 6 characters')}</li>
            <li>• {t('profile.includeNumbers', 'Include numbers and symbols')}</li>
            <li>• {t('profile.avoidCommon', 'Avoid common words and patterns')}</li>
            <li>• {t('profile.uniquePassword', 'Use a unique password for this account')}</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('profile.title', 'My Profile')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('profile.description', 'Manage your profile and account settings')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${roleConfig.color}-100 text-${roleConfig.color}-800 dark:bg-${roleConfig.color}-900 dark:text-${roleConfig.color}-200`}>
              <RoleIcon className="w-4 h-4 mr-1" />
              {roleConfig.badge}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {roleConfig.stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile.profile', 'Profile')}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile.password', 'Password')}
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Picture and Details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Avatar with fallback */}
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                  {renderAvatar()}
                  {/* Fallback initials avatar - always present but hidden if image loads */}
                  <div 
                    className={`w-full h-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white text-2xl font-bold ${
                      (userProfile?.photoURL || user?.photoURL) ? 'hidden' : 'flex'
                    }`}
                  >
                    {getUserInitials()}
                  </div>
                </div>
                
                {isEditing && activeTab === 'profile' && (
                  <label className="absolute bottom-2 right-2 bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                    {uploadingImage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera size={16} className="text-white" />
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4 text-center">
                {userProfile?.firstName} {userProfile?.lastName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">{user?.email}</p>
              
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${roleConfig.color}-100 text-${roleConfig.color}-800 dark:bg-${roleConfig.color}-900 dark:text-${roleConfig.color}-200`}>
                  <RoleIcon className="w-4 h-4 mr-1" />
                  {roleConfig.badge}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar size={18} className="mr-3" />
                <span className="text-sm">
                  {t('profile.memberSince', 'Member since')}: {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin size={18} className="mr-3" />
                <span className="text-sm">{formData.address || t('profile.noAddress', 'No address provided')}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Phone size={18} className="mr-3" />
                <span className="text-sm">{formData.phone || t('profile.noPhone', 'No phone provided')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'password' && renderPasswordTab()}
        </div>
      </div>
    </div>
  );
};

export default Profile;