 import 
 
 
 // Your web app's Firebase configuration
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional
 const firebaseConfig = {
   apiKey: "AIzaSyBxQdhylPvbBSvENdbVGfuLeSbFx5DpR-I",
   authDomain: "razredni-casopis-database.firebaseapp.com",
   projectId: "razredni-casopis-database",
   storageBucket: "razredni-casopis-database.appspot.com",
   messagingSenderId: "469900513547",
   appId: "1:469900513547:web:781580c89566f1cacb920e",
   measurementId: "G-T7QKD3ZGL0"
 };

 // Initialize Firebase
 const app = firebase.initializeApp(firebaseConfig);
 const analytics = firebase.analytics();
 const auth = firebase.auth();