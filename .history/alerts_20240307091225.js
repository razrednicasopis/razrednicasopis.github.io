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
        location.reload;
    });

    checkMaintenanceStatus();
});