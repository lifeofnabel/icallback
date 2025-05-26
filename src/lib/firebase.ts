
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;

if (!firebaseConfig.apiKey) {
  console.error(
    "Firebase Initialization Critical Error: NEXT_PUBLIC_FIREBASE_API_KEY is missing or empty. " +
    "Firebase services cannot be initialized and will be unavailable. " +
    "Please set this environment variable in your .env.local file or your hosting provider's settings."
  );
} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
    } else {
      // This case should ideally not be reached if initializeApp succeeded or getApps()[0] returned an app.
      console.error("Firebase app object could not be properly initialized, even with an API key. Auth and Firestore will be unavailable.");
    }
  } catch (error: any) {
    console.error("Firebase Initialization Error during setup:", error.message);
    // Provide more specific advice if it's an invalid API key error
    if (error.code === 'auth/invalid-api-key' || (error.message && error.message.includes('API key'))) {
        console.error(
            "The 'invalid-api-key' error often means the NEXT_PUBLIC_FIREBASE_API_KEY is incorrect, " +
            "not properly set as an environment variable, or your Firebase project's API key settings " +
            "do not authorize this app's domain (check Firebase console -> Project settings -> General -> Your apps)."
        );
    }
    // app, auth, db will remain undefined due to the error
  }
}

export { app, auth, db };
