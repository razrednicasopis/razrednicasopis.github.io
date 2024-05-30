import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, getDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);





document.addEventListener('DOMContentLoaded', function () {
    function toggleMaintenancePopup(show) {
        const maintenancePopup = document.getElementById('maintenancePopup');
        const blurContainer = document.querySelector('.blur-container');
        if (maintenancePopup) {
            console.log('Toggling maintenance popup:', show);
            maintenancePopup.style.display = show ? 'block' : 'none';
            document.body.classList.toggle('popup-open', show);
        } else {
            console.error('maintenancePopup element not found');
        }

        if (blurContainer) {
            blurContainer.style.filter = show ? 'blur(5px)' : 'none';
        } else {
            console.error('blur-container element not found');
        }
    }

    async function checkInitialMaintenanceStatus() {
        try {
            const docRef = doc(db, 'settings', 'maintenanceMode');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log('Maintenance document data:', docSnap.data());
                const data = docSnap.data();
                if (data.maintenanceMode) {
                    console.log('Redirecting to maintenance page');
                    window.location.href = '/Resources/maintenance/popravila.html';
                } else {
                    console.log('Starting to listen for maintenance status changes');
                    listenForMaintenanceStatus();
                }
            } else {
                console.log('No such document!');
            }
        } catch (error) {
            console.error('Error getting document:', error);
        }
    }

    function listenForMaintenanceStatus() {
        const docRef = doc(db, 'settings', 'maintenanceMode');
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const maintenanceMode = data.maintenanceMode;
                console.log('Maintenance status changed:', maintenanceMode);
                toggleMaintenancePopup(maintenanceMode);
            } else {
                console.log('No such document!');
            }
        }, (error) => {
            console.error('Error getting document:', error);
        });
    }

    document.getElementById('closeMaintenancePopupBtn').addEventListener('click', function () {
        window.location.href = '/Resources/maintenance/popravila.html';
    });

    checkInitialMaintenanceStatus();
});
