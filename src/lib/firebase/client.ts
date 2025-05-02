import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import getFirestore
import { firebaseApp } from "./config";

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp); // Initialize and export Firestore db instance
