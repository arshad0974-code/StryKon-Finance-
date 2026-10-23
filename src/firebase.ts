import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Official Firebase Web App configuration provided for Strykon Finance / Expense Tracker
export const firebaseConfig = {
  apiKey: "AIzaSyA4KDQ88zp0D6of9TZlQlvQ3Xupp7ajqoA",
  authDomain: "better-version-of-me-a7c8c.firebaseapp.com",
  projectId: "better-version-of-me-a7c8c",
  storageBucket: "better-version-of-me-a7c8c.firebasestorage.app",
  messagingSenderId: "420192789824",
  appId: "1:420192789824:web:399dd73afd0b793ddf06a5",
  measurementId: "G-YS79BZ00YF"
};

// Reuse existing Firebase app instance if already initialized to avoid duplicate app errors
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication using getAuth(app)
export const auth: Auth = getAuth(app);

// Initialize Analytics only when supported in the runtime environment
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Gracefully ignore Analytics failures (e.g. ad blockers or unsupported environments)
    });
}
