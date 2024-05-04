// JavaScript
document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('blurryBackground').style.display = 'block';
    document.getElementById('popupContainer').style.display = 'block';
    document.body.classList.add('blur-background');

    // Center the popup on the screen
    var popup = document.getElementById('popupContainer');
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('blurryBackground').style.display = 'none';
    document.getElementById('popupContainer').style.display = 'none';
});
