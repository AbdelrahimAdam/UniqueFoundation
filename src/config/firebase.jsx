// src/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// --- Firebase Configuration (NEW PROJECT) ---
const firebaseConfig = {
  apiKey: "AIzaSyC3uGr4F17VK-6OY_dyGSSclVuf_QyuSQc",
  authDomain: "uniquefoundation-org.firebaseapp.com",
  projectId: "uniquefoundation-org",
  storageBucket: "uniquefoundation-org.firebasestorage.app",
  messagingSenderId: "1021315264601",
  appId: "1:1021315264601:web:7954fffae51c3d1cc48148",
  measurementId: "G-XXXXXXXXXX" // Optional: replace with your Measurement ID if using Analytics
};

// --- Initialize Firebase (prevent re-initialization) ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Firebase Services ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Optional: Firebase Analytics (browser only) ---
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized ✅");
    }
  });
}

export default app;
