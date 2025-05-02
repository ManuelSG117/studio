// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAtB0cdUQfc7qMFUY7938VFzyDWh5fdkP8",
  authDomain: "studiomasseguro.firebaseapp.com",
  projectId: "studiomasseguro",
  storageBucket: "studiomasseguro.appspot.com", // Corrected domain for storage bucket
  messagingSenderId: "339892599799",
  appId: "1:339892599799:web:b5263b52a5c77c19118cf2",
  measurementId: "G-XG6NP2RR6G" // Added measurementId
};

// Initialize Firebase
function initializeFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = initializeFirebaseApp();
