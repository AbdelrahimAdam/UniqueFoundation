// hooks/useAuth.js
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase.jsx'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  // Refs for preventing multiple instances and tracking state
  const isMountedRef = useRef(false)
  const unsubscribeRef = useRef(null)
  const isRegisteringRef = useRef(false)
  const authCheckCompleteRef = useRef(false)

  // Auth state
  const [authState, setAuthState] = useState({
    user: null,
    role: null,
    profile: null,
    isApproved: false,
    isAuthenticated: false,
    isLoading: true,
    authChecked: false
  })

  // Loading states
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (isMountedRef.current) {
      console.log('⚠️  AuthProvider already mounted - skipping')
      return
    }
    isMountedRef.current = true

    console.log('🚀 Initializing AuthProvider (production version)')

    // Clean up any existing listeners
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser?.uid || 'null')

      // Skip auth state processing during registration
      if (isRegisteringRef.current) {
        console.log('⏸️  Skipping auth state change during registration')
        return
      }

      if (firebaseUser) {
        // User is authenticated - set up profile listener
        const userDocRef = doc(db, 'users', firebaseUser.uid)
        
        // Clean up previous listener
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
        }

        const unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            console.log('📄 Profile snapshot:', docSnap.exists(), docSnap.data()?.isActive)

            if (docSnap.exists()) {
              const data = docSnap.data()
              const approved = data.isActive === true || data.role === 'admin'

              console.log('✅ Profile loaded:', { 
                uid: firebaseUser.uid, 
                isActive: data.isActive, 
                role: data.role, 
                approved 
              })

              // Update last login timestamp
              if (!data.lastLogin || (Date.now() - data.lastLogin.toDate().getTime()) > 300000) { // 5 minutes
                updateDoc(userDocRef, { lastLogin: new Date() })
              }

              // Set complete auth state
              setAuthState({
                user: firebaseUser,
                profile: data,
                role: data.role,
                isApproved: approved,
                isAuthenticated: true,
                isLoading: false,
                authChecked: true
              })

              // Force logout if user was approved but now rejected
              if (!approved && authState.isApproved) {
                console.log('🚫 User deactivated - forcing logout')
                signOut(auth)
              }
            } else {
              console.log('❌ No profile found - signing out')
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                authChecked: true
              }))
              signOut(auth)
            }

            authCheckCompleteRef.current = true
          },
          (error) => {
            console.error('❌ Profile listener error:', error)
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              authChecked: true
            }))
            authCheckCompleteRef.current = true
          }
        )

        unsubscribeRef.current = unsubscribeProfile

      } else {
        // No user - clear all state
        console.log('🚫 No user - setting public state')
        setAuthState({
          user: null,
          profile: null,
          role: null,
          isApproved: false,
          isAuthenticated: false,
          isLoading: false,
          authChecked: true
        })
        authCheckCompleteRef.current = true
      }
    })

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up auth listeners')
      unsubscribe()
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      isMountedRef.current = false
      authCheckCompleteRef.current = false
    }
  }, [])

  // Registration function
  const register = async (email, password, userData) => {
    try {
      setAuthLoading(true)
      isRegisteringRef.current = true
      
      console.log('🔄 Starting registration process...', { email, role: userData.role })

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      console.log('✅ Firebase user created:', firebaseUser.uid)

      // Update profile with display name
      await updateProfile(firebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`
      })

      // Create user profile in Firestore
      const userProfile = {
        uid: firebaseUser.uid,
        email: email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role || 'student',
        isActive: userData.role === 'admin', // Admins are auto-approved
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        subscription: {
          plan: 'free',
          status: userData.role === 'admin' ? 'active' : 'pending_approval',
          startDate: userData.role === 'admin' ? new Date() : null,
          endDate: null
        }
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile)
      console.log('✅ User profile created in Firestore')

      // If not admin, sign out immediately to require approval
      if (userData.role !== 'admin') {
        await signOut(auth)
        console.log('✅ Non-admin user signed out, awaiting approval')
        return { 
          success: true, 
          message: 'Registration successful! Please wait for admin approval before logging in.',
          requiresApproval: true
        }
      }

      console.log('✅ Admin user registered and auto-approved')
      return { 
        success: true, 
        user: firebaseUser,
        requiresApproval: false
      }
    } catch (error) {
      console.error('❌ Registration error:', error)

      // Clean up auth user if Firestore fails
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete()
          console.log('🧹 Cleaned up auth user after failed registration')
        } catch (deleteError) {
          console.error('Error cleaning up auth user:', deleteError)
        }
      }

      let errorMessage = 'Registration failed. Please try again.'

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.'
      }

      return { 
        success: false, 
        error: errorMessage 
      }
    } finally {
      setAuthLoading(false)
      isRegisteringRef.current = false
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      setAuthLoading(true)
      console.log('🔐 Attempting login...', { email })

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      console.log('✅ Firebase auth successful, checking profile...')

      // Immediate profile check
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

      if (!userDoc.exists()) {
        console.log('❌ User profile not found after login')
        await signOut(auth)
        return { 
          success: false, 
          error: 'User profile not found. Please contact support.' 
        }
      }

      const data = userDoc.data()
      const approved = data.isActive === true || data.role === 'admin'

      console.log('🔍 Login approval check:', {
        userId: firebaseUser.uid,
        isActive: data.isActive,
        role: data.role,
        approved: approved
      })

      if (!approved) {
        console.log('❌ User not approved, signing out...')
        await signOut(auth)
        return { 
          success: false, 
          error: 'Account pending approval. Please wait for admin approval.',
          requiresApproval: true 
        }
      }

      console.log('✅ Login successful, user is approved')
      return { success: true }
    } catch (error) {
      console.error('❌ Login error:', error)
      let message = 'Login failed. Please try again.'

      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.'
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.'
      }

      return { success: false, error: message }
    } finally {
      setAuthLoading(false)
    }
  }

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return { success: true, user: result.user }
    } catch (error) {
      console.error('❌ Google sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setAuthLoading(false)
    }
  }

  // Password reset
  const resetPassword = async (email) => {
    try {
      setAuthLoading(true)
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      console.error('❌ Password reset error:', error)
      return { success: false, error: error.message }
    } finally {
      setAuthLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setAuthLoading(true)
      console.log('🚪 Logging out user...')
      await signOut(auth)
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  // Check if route is public (for route guards)
  const isPublicRoute = (pathname) => {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ]
    
    // Also allow any static assets
    const staticExtensions = ['.ico', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot']
    const isStaticAsset = staticExtensions.some(ext => pathname.includes(ext))
    
    return publicRoutes.includes(pathname) || isStaticAsset
  }

  // Complete auth value
  const value = {
    // Consolidated auth state (primary source of truth)
    ...authState,
    
    // Loading states
    authLoading,
    
    // Auth functions
    register,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    isPublicRoute,
    
    // Helper methods
    hasRole: (role) => authState.role === role,
    hasAnyRole: (roles) => roles.includes(authState.role),
    canAccess: (requiredRole) => {
      if (!authState.isAuthenticated || !authState.isApproved) return false
      if (!requiredRole) return true
      return authState.role === requiredRole
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}