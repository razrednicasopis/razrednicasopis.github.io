document.addEventListener("DOMContentLoaded", () => {
  // Create overlay element
  const overlay = document.createElement("div");
  overlay.className = "image-overlay";
  const img = document.createElement("img");
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  // Click on images inside photo-space or graph-space
  document.querySelectorAll(".photo-space img, .graph-space img").forEach(el => {
    el.addEventListener("click", () => {
      img.src = el.src; // Set clicked image
      overlay.classList.add("active");
    });
  });

  // Close overlay on click
  overlay.addEventListener("click", () => {
    overlay.classList.remove("active");
    img.src = "";
  });
});