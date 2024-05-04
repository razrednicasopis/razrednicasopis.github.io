<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST["name"];
    $email = $_POST["email"];
    $message = $_POST["message"];

    // Validate form data (you may add more validation)

    // Email setup
    $to = "your-email@example.com"; // Replace with your email address
    $subject = "New Contact Form Submission";
    $headers = "From: $email\r\n" .
               "Reply-To: $email\r\n" .
               "X-Mailer: PHP/" . phpversion();

    // Compose the email message
    $email_message = "Name: $name\n";
    $email_message .= "Email: $email\n";
    $email_message .= "Message:\n$message";

    // Send email
    mail($to, $subject, $email_message, $headers);

    // You can also redirect the user to a thank you page
    header("Location: thank_you.html");
    exit();
}
?>