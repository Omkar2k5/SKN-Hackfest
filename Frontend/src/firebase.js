// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set } from "firebase/database";

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

const database = getDatabase(app);

// Add list of valid bank sender IDs
const VALID_BANK_SENDERS = {
  'KOTAKB': 'Kotak Bank',
  'HDFCBK': 'HDFC Bank',
  'ICICIB': 'ICICI Bank',
  'SBIINB': 'SBI Bank',
  'AXISBK': 'Axis Bank',
  'IPBOTP': 'India Post Payments Bank',
  'YESBNK': 'Yes Bank',
  'PNBSMS': 'Punjab National Bank',
  // Add more banks as needed
};

// Function to validate if message is from a legitimate bank
function isLegitBankMessage(senderId) {
  // Extract the bank code after JD- or AD- prefix
  const match = senderId.match(/^(JD-|AD-|BK-)(.+)$/);
  if (!match) return false;
  
  const bankCode = match[2];
  return Object.keys(VALID_BANK_SENDERS).some(code => bankCode.includes(code));
}

// Function to store message in database
async function storeMessage(senderId, message, timestamp) {
  if (!isLegitBankMessage(senderId)) {
    console.log('Suspicious message detected. Not storing in database.');
    return false;
  }

  try {
    const messageRef = ref(database, `messages/${timestamp}`);
    await set(messageRef, {
      senderId,
      message,
      timestamp,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error storing message:', error);
    return false;
  }
}

export { isLegitBankMessage, storeMessage };
export default app; 