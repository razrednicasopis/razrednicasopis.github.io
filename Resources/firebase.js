// Import the functions you need from the SDKs you need
  import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr_e248o8ssqmG_n2Ey0Om798N45PcX_4",
  authDomain: "razrednicasopisdatabase.firebaseapp.com",
  projectId: "razrednicasopisdatabase",
  storageBucket: "razrednicasopisdatabase.appspot.com",
  messagingSenderId: "231546049366",
  appId: "1:231546049366:web:aa96e0d01b1997ead93cf7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

export const registerWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export default app;
