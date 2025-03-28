"use client"

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDPYCFbVGakt0uBmE3OZRh00wUDDXgvgXY",
  authDomain: "skn-hackfest.firebaseapp.com",
  databaseURL: "https://skn-hackfest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skn-hackfest",
  storageBucket: "skn-hackfest.firebasestorage.app",
  messagingSenderId: "687898768842",
  appId: "1:687898768842:web:812be8fba162b2bfc9cb33",
  measurementId: "G-1JY3TX0JVP"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app) 