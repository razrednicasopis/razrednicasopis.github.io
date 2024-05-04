document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('popupContainer').style.display = 'block';
    document.body.classList.add('blur', '')
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('popupContainer').style.display = 'none';
});