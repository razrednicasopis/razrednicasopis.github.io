import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, setDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const db = getFirestore();

document.addEventListener('DOMContentLoaded', function () {
    function toggleMaintenancePopup(show) {
        const maintenancePopup = document.getElementById('maintenancePopup');
        if (maintenancePopup) {
            maintenancePopup.style.display = show ? 'flex' : 'none';
            document.body.classList.toggle('popup-open', show);
        }
    }

    async function checkInitialMaintenanceStatus() {
        try {
            const doc = await db.collection('settings').doc('siteStatus').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.maintenance) {
                    window.location.href = '../maintenance/popravila.html';
                } else {
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
        db.collection('settings').doc('maintenanceMode').onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const maintenanceMode = data.maintenance;
                toggleMaintenancePopup(maintenanceMode);
            } else {
                console.log('No such document!');
            }
        }, (error) => {
            console.error('Error getting document:', error);
        });
    }

    document.getElementById('closeMaintenancePopupBtn').addEventListener('click', function () {
        location.reload();
    });

    checkInitialMaintenanceStatus();
});