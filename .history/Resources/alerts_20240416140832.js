 document.addEventListener('DOMContentLoaded', function () {
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
    });

    //Maintenance mode pop-up


    document.addEventListener('DOMContentLoaded', function ()  {
        function toggleMaintenancePopup(show) {
            var maintenancePopup = document.getElementById('maintenancePopup');
            if (maintenancePopup) {
                maintenancePopup.style.display = show ? 'block' : 'none';
                document.body.classList.toggle('popup-open', show);
                console.log(Error);
            }
        }
   

    
    function checkMaintenanceStatus() {
        setInterval(function () {
            

            toggleMaintenancePopup(maintenanceMode);

        }, 1000);
    }

    document.getElementById('closeMaintenancePopupBtn').addEventListener('click', function ()  {
        location.reload();
    });

    checkMaintenanceStatus();
});

//Maintenance Warning

const maintenanceStartTime = new Date("2024-04-16T15:05:00Z").getTime();
let notificationDisplayedThisMinute = false;

// Function to display the maintenance warning
function displayMaintenanceWarning(hoursOrMinutesLeft, unit) {
  document.getElementById("maintenance-message").innerHTML = `Dragi uporabniki! Strežniki Razrednega Časopisa bodo zaradi vzdrževanja nedosegljivi čez ${hoursOrMinutesLeft} ${unit}. Prosimo, načrtujte uporabo strani v skladu s tem.`;

  // Show the warning
  document.getElementById("maintenance-warning").style.display = "block";

  // Hide the warning once the text completely disappears
  setTimeout(() => {
    document.getElementById("maintenance-warning").style.display = "none";
  }, 30000); // Adjust time based on animation duration

  // Set flag to true once notification is displayed
  notificationDisplayedThisMinute = true;
}

// Function to calculate time left before maintenance and display warning if needed
function calculateTimeLeft() {
  const currentTime = new Date().getTime();
  const timeDifference = maintenanceStartTime - currentTime;
  const currentMinute = Math.floor(currentTime / (1000 * 60)); // Current minute since epoch

  if (timeDifference > 0 && !notificationDisplayedThisMinute) {
    const hoursLeft = Math.floor(timeDifference / (1000 * 60 * 60));
    if (hoursLeft > 0) {
      displayMaintenanceWarning(hoursLeft, "h");
    } else {
      const minutesLeft = Math.floor(timeDifference / (1000 * 60));
      displayMaintenanceWarning(minutesLeft, "m");
    }
  }

  // Reset flag if new minute starts
  if (Math.floor(new Date().getTime() / (1000 * 60)) !== currentMinute) {
    notificationDisplayedThisMinute = false;
  }
}

// Check maintenance status every second
setInterval(() => {
  calculateTimeLeft();
}, 1000);

