import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyADGwLzFxfqkf6y1tXbrLcmLFztmtlDgyo",
  authDomain: "mean-85713.firebaseapp.com",
  projectId: "mean-85713",
  storageBucket: "mean-85713.firebasestorage.app",
  messagingSenderId: "825006547235",
  appId: "1:825006547235:web:1452d76498a2e66014ec96",
  measurementId: "G-X442P0KWHZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
