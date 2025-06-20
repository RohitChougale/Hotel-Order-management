// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfVV8J9ZN6dYhQlGKA5OA0nPoUnVK6k00",
  authDomain: "restaurant-app-b13f2.firebaseapp.com",
  projectId: "restaurant-app-b13f2",
  storageBucket: "restaurant-app-b13f2.firebasestorage.app",
  messagingSenderId: "204486449943",
  appId: "1:204486449943:web:eb47ea647ea0357150b552",
  measurementId: "G-HM7WKX2VEG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export const auth = getAuth(app);
export { db, analytics };