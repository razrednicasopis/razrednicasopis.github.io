document.getElementById('showPopupLink').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('popupContainer').style.display = 'block';
    document.body.classList.add('popup-open');
});

document.getElementById('closePopupBtn').addEventListener('click', function() {
    document.getElementById('popupContainer').style.display = 'none';
    document.body.classList.remove('popup-open');
});

// Koda za Contact Form Button

const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', function() {
  submitBtn.classList.toggle('blob-btn'); // Toggle the blob-btn class on click
});
