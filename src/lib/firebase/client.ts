import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import getFirestore
import { getStorage } from "@firebase/storage"; // Import getStorage
import { firebaseApp } from "./config";

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp); // Initialize and export Firestore db instance
export const storage = getStorage(firebaseApp); // Initialize and export Firebase Storage instance
