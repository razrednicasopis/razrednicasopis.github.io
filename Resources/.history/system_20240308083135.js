//This is a JS code for the switching of the newspaper page content



//Code for the clock

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const time = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clock').innerText = time;
  }

  // Update every second
  setInterval(updateClock, 1000);

  // Initial call to set the initial time
  updateClock();