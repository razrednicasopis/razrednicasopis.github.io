// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
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

export const auth = get