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

    document.addEventListener
