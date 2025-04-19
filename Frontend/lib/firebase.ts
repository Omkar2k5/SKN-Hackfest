import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Initialize Firebase
let app: FirebaseApp
let database: Database | null = null
let firestore: Firestore | null = null
let auth: Auth | null = null

// Check if we're on the client side
const isBrowser = typeof window !== 'undefined'

// Initialize Firebase if it hasn't been initialized yet
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig)
    // Only initialize these services on the client side
    if (isBrowser) {
      database = getDatabase(app)
      firestore = getFirestore(app)
      auth = getAuth(app)
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error)
  }
} else {
  app = getApp()
  // Only initialize these services on the client side
  if (isBrowser) {
    try {
      database = getDatabase(app)
      firestore = getFirestore(app)
      auth = getAuth(app)
    } catch (error) {
      console.error('Error getting Firebase services:', error)
    }
  }
}

export { app, database, firestore, auth } 