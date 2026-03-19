import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCO31RFCCxSIX0K7fq47z6N7b3kUijtbgA",
  authDomain: "nova-midia-34ba9.firebaseapp.com",
  projectId: "nova-midia-34ba9",
  storageBucket: "nova-midia-34ba9.firebasestorage.app",
  messagingSenderId: "944110989362",
  appId: "1:944110989362:web:c77866cfbd80874d99cc2b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);