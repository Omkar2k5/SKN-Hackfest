import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup, 
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseAuthStateChanged
} from 'firebase/auth'
import { app } from './firebase'

const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Set persistence to LOCAL (survives browser restart)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting persistence:", error)
  })

// Email/Password Sign Up
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update the user's display name
    if (result.user) {
      await updateProfile(result.user, {
        displayName: displayName
      })
    }
    
    return { user: result.user, error: null }
  } catch (error: any) {
    return {
      user: null,
      error: error.message || 'Failed to create account'
    }
  }
}

// Email/Password Sign In
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return { user: result.user, error: null }
  } catch (error: any) {
    return {
      user: null,
      error: error.message || 'Failed to sign in with Google'
    }
  }
}

let confirmationResultInstance: ConfirmationResult | null = null

// Phone Number Sign In
export const initializePhoneAuth = () => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {}
    })
  }
  return (window as any).recaptchaVerifier
}

export const signInWithPhone = async (phoneNumber: string) => {
  try {
    const recaptchaVerifier = initializePhoneAuth()
    const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
    confirmationResultInstance = result
    return { confirmationResult: result, error: null }
  } catch (error: any) {
    return {
      confirmationResult: null,
      error: error.message || 'Failed to send verification code'
    }
  }
}

export const verifyPhoneCode = async (code: string) => {
  try {
    if (!confirmationResultInstance) {
      throw new Error('No confirmation result found')
    }
    const result = await confirmationResultInstance.confirm(code)
    return { user: result.user, error: null }
  } catch (error: any) {
    return {
      user: null,
      error: error.message || 'Failed to verify code'
    }
  }
}

// Sign Out
export const logOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Get Current User
export const getCurrentUser = () => {
  return auth.currentUser
}

// Auth State Observer
export const onAuthStateChanged = (callback: Parameters<typeof firebaseAuthStateChanged>[1]) => 
  firebaseAuthStateChanged(auth, callback) 