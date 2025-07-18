// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHH7FRaqWCQv8tWi9UkF8dqtlv2mE87sM",
  authDomain: "libre-app-ac9a9.firebaseapp.com",
  projectId: "libre-app-ac9a9",
  storageBucket: "libre-app-ac9a9.firebasestorage.app",
  messagingSenderId: "683543010590",
  appId: "1:683543010590:web:ff6bfeb034fa0eb30c7d0f",
  measurementId: "G-S9SD78MDD3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);