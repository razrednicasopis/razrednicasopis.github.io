document.addEventListener('DOMContentLoaded', function () {
  // Popup functionality
  document.querySelectorAll('.showPopupLink').forEach(function (link) {
      link.addEventListener('click', function (event) {
          event.preventDefault();
          document.getElementById('popupContainer').style.display = 'block';
          document.body.classList.add('popup-open');
      });
  });

  document.getElementById('closePopupBtn').addEventListener('click', function () {
      document.getElementById('popupContainer').style.display = 'none';
      document.body.classList.remove('popup-open');
  });

  // Maintenance Warning
  const banner = document.getElementById('maintenanceWarningMessage');
  const scrollingText = document.getElementById('scrollingText');
  const maintenanceStartTime = new Date("2024-05-28T14:17:50Z").getTime(); // Set the maintenance start time
  let notificationDisplayedThisMinute = false;

  function toggleMaintenancePopup(show, message = "") {
      if (show) {
          scrollingText.textContent = message;
          banner.classList.remove('hidden');
          document.body.classList.add('blur');
      } else {
          banner.classList.add('hidden');
          document.body.classList.remove('blur');
      }
  }

  function getFormattedTimeLeft(timeDifference) {
      const minutesLeft = Math.floor(timeDifference / (1000 * 60));
      const hoursLeft = Math.floor(minutesLeft / 60);
      const remainingMinutes = minutesLeft % 60;

      if (hoursLeft > 0) {
          return `${hoursLeft}h ${remainingMinutes}m`;
      } else {
          return `${remainingMinutes}m`;
      }
  }

  function checkMaintenanceStatus() {
      const intervals = [120, 90, 60, 45, 30, 15, 10, 5, 4, 3, 2, 1]; // Intervals in minutes
      const currentTime = new Date().getTime();
      const timeDifference = maintenanceStartTime - currentTime;

      console.log('Current time:', new Date(currentTime).toISOString());
      console.log('Maintenance start time:', new Date(maintenanceStartTime).toISOString());
      console.log('Time difference (ms):', timeDifference);

      if (timeDifference > 0 && !notificationDisplayedThisMinute) {
          const minutesLeft = Math.floor(timeDifference / (1000 * 60));
          console.log('Minutes left before maintenance:', minutesLeft);

          if (intervals.includes(minutesLeft)) {
              const timeLeftFormatted = getFormattedTimeLeft(timeDifference);
              const message = `Dragi uporabniki! Strežniki Razrednega Časopisa bodo čez ${timeLeftFormatted} nedosegljivi zaradi vzdrževanja.`;
              toggleMaintenancePopup(true, message);

              // Hide the warning once the text completely disappears
              setTimeout(() => {
                  toggleMaintenancePopup(false);
              }, 10000); // Adjust time based on animation duration

              notificationDisplayedThisMinute = true;
          }
      }

      // Reset flag if new minute starts
      if (Math.floor(new Date().getTime() / (1000 * 60)) !== Math.floor(currentTime / (1000 * 60))) {
          notificationDisplayedThisMinute = false;
      }
  }

  setInterval(checkMaintenanceStatus, 1000);
});
