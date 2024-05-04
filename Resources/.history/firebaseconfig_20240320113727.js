import { 
  getAuth,
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  connectAuthEmulator
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBxQdhylPvbBSvENdbVGfuLeSbFx5DpR-I",
  authDomain: "razredni-casopis-database.firebaseapp.com",
  projectId: "razredni-casopis-database",
  storageBucket: "razredni-casopis-database.appspot.com",
  messagingSenderId: "469900513547",
  appId: "1:469900513547:web:781580c89566f1cacb920e",
  measurementId: "G-T7QKD3ZGL0"
};

// Login using email/password
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);