"use client"

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDYpDxwgVxG-uXVdXuzvlJJg4AXQfUFAyE",
  authDomain: "smart-fiance-tracker.firebaseapp.com",
  databaseURL: "https://smart-fiance-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-fiance-tracker",
  storageBucket: "smart-fiance-tracker.appspot.com",
  messagingSenderId: "1098977655324",
  appId: "1:1098977655324:web:b5e4c9e1d3f2c5f2f3f2c5"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Get Realtime Database instance
const database = getDatabase(app)

export { database } 