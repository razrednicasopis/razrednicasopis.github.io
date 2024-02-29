// JavaScript
document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('blurryBackground').style.display = 'block';
    document.getElementById('popupContainer').style.display = 'block';


   // Center the popup on the screen
   var popup = document.getElementById('popupContainer');
   var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
   var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

   var popupHeight = popup.offsetHeight;
   var popupWidth = popup.offsetWidth;

   popup.style.top = Math.max(0, (windowHeight - popupHeight) / 2) + 'px';
   popup.style.left = Math.max(0, (windowWidth - popupWidth) / 2) + 'px';
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('blurryBackground').style.display = 'none';
    document.getElementById('popupContainer').style.display = 'none';
});
