// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPYCFbVGakt0uBmE3OZRh00wUDDXgvgXY",
  authDomain: "skn-hackfest.firebaseapp.com",
  databaseURL: "https://skn-hackfest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skn-hackfest",
  storageBucket: "skn-hackfest.firebasestorage.app",
  messagingSenderId: "687898768842",
  appId: "1:687898768842:web:812be8fba162b2bfc9cb33",
  measurementId: "G-1JY3TX0JVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app; 