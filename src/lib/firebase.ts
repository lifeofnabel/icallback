import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_hQM14fKjYZDFiDTTF6-0Po0mWI7-v-o",
  authDomain: "mawid-booking.firebaseapp.com",
  projectId: "mawid-booking",
  storageBucket: "mawid-booking.appspot.com",
  messagingSenderId: "909234455380",
  appId: "1:909234455380:web:774b3663ffffce72dbbec1"
};

// Firestore Initialisierung
if (!firebaseConfig.apiKey) {
  console.error(
      "Firebase Initialization Critical Error: API key is missing. Firebase services cannot be initialized."
  );
  throw new Error("Firebase API key missing");
}

// Firebase App initialisieren
const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth und Firestore initialisieren
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Exportieren (immer definiert!)
export { app, auth, db };
