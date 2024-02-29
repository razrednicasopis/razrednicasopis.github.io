document.addEventListener('DOMContentLoaded', function () {
    // Set the end date and time for the maintenance period
    const endDate = new Date('2023-12-31T12:00:00').getTime();

    // Update the countdown every second
    const countdown = setInterval(function () {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance <= 0) {
            // If the maintenance period is over, redirect to your main site
            clearInterval(countdown);
            document.getElementById("maintenanceobvestilo").innerHTML = "Trenutno ne poteka vzdrževanje! <br> Dostop do strani bo kmalu omogočen."
        }

        // Calculate remaining time
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the countdown
        document.getElementById('countdown').innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
});