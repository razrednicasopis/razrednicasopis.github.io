document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('popupContainer').style.display = 'block';
    document.body.classList.add('blur', 'popup-open');
    document.getElementById('popupContainer').style.top = '0';
    document.getElementById('popupContainer').style.left = '0';
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('popupContainer').style.display = 'none';
    document.body.classList.remove('blur', 'popup-open');
});