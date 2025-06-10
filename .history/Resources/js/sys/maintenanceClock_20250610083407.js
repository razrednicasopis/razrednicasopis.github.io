const settingsDoc = doc(db, 'settings', 'nextMaintenance');
const maintenanceDoc = doc(db, 'settings', 'maintenanceMode');

async function fetchMaintenanceData() {
  const [settingsSnap, maintenanceSnap] = await Promise.all([
    getDoc(settingsDoc),
    getDoc(maintenanceDoc)
  ]);

  if (!settingsSnap.exists() || !maintenanceSnap.exists()) {
    showNoDataMessage();
    return;
  }

  const startTime = settingsSnap.data().maintenanceStartTime?.toDate?.();
  const maintenanceMode = maintenanceSnap.data().maintenanceMode;

  if (!startTime) {
    showNoDataMessage();
    return;
  }

  const now = new Date();

  if (startTime < now) {
    if (maintenanceMode) {
      showActiveMaintenanceMessage();
    } else {
      showUpcomingMaintenanceWarning();
    }
  } else {
    startCountdown(startTime, maintenanceMode);
  }
}
