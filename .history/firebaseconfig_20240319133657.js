 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
 import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
 import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
 ";
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries

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
 const app = initializeApp(firebaseConfig);
 const analytics = getAnalytics(app);