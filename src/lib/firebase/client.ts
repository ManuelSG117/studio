import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import getFirestore
import { getStorage } from "@firebase/storage"; // Import getStorage
import { firebaseApp } from "./config";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ...other config keys
};

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp); // Initialize and export Firestore db instance
export const storage = getStorage(firebaseApp); // Initialize and export Firebase Storage instance
