// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSqKgpjT3iCVkku4dcyB7BDwcmXh6aqF8",
  authDomain: "smart-pantry-c621f.firebaseapp.com",
  projectId: "smart-pantry-c621f",
  storageBucket: "smart-pantry-c621f.firebasestorage.app",
  messagingSenderId: "669077026177",
  appId: "1:669077026177:web:5cb09db7e8fa39e18f2480",
  measurementId: "G-DNZYJEY1YC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);