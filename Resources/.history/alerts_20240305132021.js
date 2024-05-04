document.addEventListener('DOMContentLoaded', function () {
    // Function to toggle the popup
    function togglePopup() {
        var popupContainer = document.querySelector('.popupContainer');
        if (popupContainer) {
            popupContainer.style.display = popupContainer.style.display === 'none' ? 'block' : 'none';
            document.body.classList.toggle('popup-open');
        }
    }

    // Add event listener to show initial popup
    document.querySelector('.showPopupLink').addEventListener('click', function () {
        togglePopup();
    });

    // Add event listener to close button
    document.querySelectorAll('.closePopupBtn').forEach(function (button) {
        button.addEventListener('click', function () {
            togglePopup();
        });
    });
});

    //Maintenance mode pop-up


