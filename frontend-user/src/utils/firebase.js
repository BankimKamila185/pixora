import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCnH8dbgcklTp-3FH1XO_x07fzUuU0XfIk",
  authDomain: "pixora-6ae3a.firebaseapp.com",
  projectId: "pixora-6ae3a",
  storageBucket: "pixora-6ae3a.firebasestorage.app",
  messagingSenderId: "29636820171",
  appId: "1:29636820171:web:8c238bd2589b1418c96f4e",
  measurementId: "G-9K7ZNBW7J9"
};

// Initialize Firebase app safely for Next.js SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let analytics = undefined;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

/**
 * Returns Firebase Auth instance.
 * Always call this from browser context (client components / event handlers).
 * Never call during SSR — use the `auth` export for that check.
 */
export function getFirebaseAuth() {
  return getAuth(app);
}

// Kept for backward-compat SSR checks: `if (!auth)` in server context → shows mock
// In browser context, prefer calling getFirebaseAuth() directly
export { app, analytics };

