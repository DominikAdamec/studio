import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize App Check
if (typeof window !== 'undefined') {
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (recaptchaKey) {
        try {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(recaptchaKey),
                isTokenAutoRefreshEnabled: true,
            });
        } catch (e) {
            console.error("Error initializing Firebase App Check", e);
        }
    }
}


export { app, auth, db };
