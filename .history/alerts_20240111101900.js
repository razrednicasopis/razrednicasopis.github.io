document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default behavior of the anchor tag
    document.getElementById('popupContainer').style.display = 'block';
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('popupContainer').style.display = 'none';
});