import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
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
  // Prevent multiple instances
  const isMountedRef = useRef(false)
  const unsubscribeRef = useRef(null)
  const isRegisteringRef = useRef(false)

  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  console.log('🔄 AuthProvider rendering - loading:', loading)

  useEffect(() => {
    if (isMountedRef.current) {
      console.log('⚠️  AuthProvider already mounted - skipping')
      return
    }
    isMountedRef.current = true

    console.log('🚀 Initializing AuthProvider (single instance)')  

    // Set a timeout to ensure loading doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    // Clean up any existing listeners  
    if (unsubscribeRef.current) {  
      unsubscribeRef.current()  
      unsubscribeRef.current = null  
    }  

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {  
      console.log('🔄 Auth state changed:', firebaseUser?.uid || 'null')  

      // Skip auth state processing if we're in the middle of registration  
      if (isRegisteringRef.current) {  
        console.log('⏸️  Skipping auth state change during registration')  
        return  
      }  

      if (firebaseUser) {  
        setUser(firebaseUser)

        // SINGLE real-time listener for profile  
        const userDocRef = doc(db, 'users', firebaseUser.uid)  
        const unsubscribeProfile = onSnapshot(  
          userDocRef,  
          (docSnap) => {  
            console.log('📄 Profile snapshot:', docSnap.exists())  

            if (docSnap.exists()) {  
              const data = docSnap.data()  
              const approved = data.isActive === true || data.role === 'admin'  

              console.log('✅ Profile loaded:', {   
                uid: firebaseUser.uid,   
                isActive: data.isActive,   
                role: data.role,   
                approved   
              })  

              setUserProfile(data)  
              setUserRole(data.role)  
            } else {  
              console.log('❌ No profile found - showing login')  
              setUserProfile(null)  
              setUserRole(null)  
            }  

            setLoading(false)  
            clearTimeout(loadingTimeout)
          },  
          (error) => {  
            console.error('Profile listener error:', error)  
            setLoading(false)  
            clearTimeout(loadingTimeout)
          }  
        )  

        unsubscribeRef.current = unsubscribeProfile  

      } else {  
        console.log('🚫 No user - showing login page')  
        setUser(null)  
        setUserProfile(null)  
        setUserRole(null)  
        setLoading(false)  
        clearTimeout(loadingTimeout)
      }  
    })  

    // Cleanup  
    return () => {  
      console.log('🧹 Cleaning up auth listener')  
      clearTimeout(loadingTimeout)
      unsubscribe()  
      if (unsubscribeRef.current) {  
        unsubscribeRef.current()  
        unsubscribeRef.current = null  
      }  
      isMountedRef.current = false
    }
  }, []) // Empty deps = runs once

  // Register function
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

  // Login function (blocks if not approved)
  const login = async (email, password) => {
    try {
      setAuthLoading(true)
      console.log('🔐 Attempting login...', { email })

      const userCredential = await signInWithEmailAndPassword(auth, email, password)  
      const firebaseUser = userCredential.user  

      console.log('✅ Firebase auth successful, checking profile...')  

      // IMMEDIATE profile check  
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

  // Manual function to reset loading state
  const resetLoading = () => {
    console.log('🔄 Manually resetting loading state')
    setLoading(false)
  }

  // SINGLE SOURCE OF TRUTH for all components
  const value = {
    // Legacy props (still work)
    user,
    userRole,
    userProfile,
    isAuthenticated: !!user,
    isApproved: userProfile?.isActive === true || userRole === 'admin',
    loading,
    authLoading,

    // Auth functions  
    register,
    login,  
    logout,
    
    // Debug function
    resetLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}