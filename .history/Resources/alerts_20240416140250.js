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

const maintenanceStartTime = new Date("2024-04-16T14:07:00Z").getTime();
let notificationDisplayedThisMinute = false;

// Function to display the maintenance warning
function displayMaintenanceWarning(timeLeft, unit) {
  const maintenanceMessage = `Dragi uporabniki! Strežniki Razrednega Časopisa bodo zaradi vzdrževanja nedosegljivi čez ${timeLeft} ${unit}. Prosimo, načrtujte uporabo strani v skladu s tem.`;
  
  // Display the warning message
  alert(maintenanceMessage);

  // Set flag to true once notification is displayed
  notificationDisplayedThisMinute = true;
}

// Function to calculate time left before maintenance and display warning if needed
function calculateTimeLeft() {
  const currentTime = new Date().getTime();
  const timeDifference = maintenanceStartTime - currentTime;
  const minutesLeft = Math.ceil(timeDifference / (1000 * 60)); // Round up to ensure we don't miss the notification

  // Check if the current time is within the specified intervals
  const intervals = [120, 90, 60, 30, 15, 10, 5, 4, 3, 2, 1]; // Intervals in minutes
  if (intervals.includes(minutesLeft) && !notificationDisplayedThisMinute && timeDifference > 0) {
    // Display maintenance warning if current time is within one of the specified intervals
    displayMaintenanceWarning(minutesLeft, "minute" + (minutesLeft !== 1 ? "s" : ""));
  }

  // Reset flag if new minute starts
  if (Math.floor(new Date().getTime() / (1000 * 60)) !== Math.floor(currentTime / (1000 * 60))) {
    notificationDisplayedThisMinute = false;
  }
}

// Initial check and start checking maintenance status every minute
calculateTimeLeft();
setInterval(calculateTimeLeft, 60000); // Check every minute (60000 milliseconds)


