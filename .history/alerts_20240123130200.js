document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('popupContainer').style.display = 'block';
    document.body.classList.add('blur', 'popup-open');
    document.getElementById('popupContainer').style.top = '50%';50';
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('popupContainer').style.display = 'none';
    document.body.classList.remove('blur', 'popup-open');
});