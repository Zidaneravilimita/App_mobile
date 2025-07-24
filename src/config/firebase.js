import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// Importez les fonctions de Firebase Storage
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHH7FRaqWCQv8tWi9UkF8dqtlv2mE87sM",
  authDomain: "libre-app-ac9a9.firebaseapp.com",
  projectId: "libre-app-ac9a9",
  storageBucket: "libre-app-ac9a9.firebasestorage.app",
  messagingSenderId: "683543010590",
  appId: "1:683543010590:web:dd99846d66c0a49b0c7d0f",
  measurementId: "G-8XZ4F48WTS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app); //  Exportez l'instance de Storage

export default app;