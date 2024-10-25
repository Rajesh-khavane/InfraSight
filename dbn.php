<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ifrasight";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$stmt = $conn->prepare("INSERT INTO adata (accel_x, accel_y, accel_z, pressure) VALUES (?, ?, ?, ?)");
$stmt->bind_param("dddi", $accel_x, $accel_y, $accel_z, $pressure);

// Parameters for the bell-shaped distribution
$mean_x = 0.0;    // Mean for X acceleration
$mean_y = 0.0;    // Mean for Y acceleration
$mean_z = 1.0;    // Mean for Z acceleration
$std_dev_x = 0.1; // Standard deviation for X acceleration
$std_dev_y = 0.1; // Standard deviation for Y acceleration
$std_dev_z = 0.1; // Standard deviation for Z acceleration
$pressure = 336;  // Fixed pressure

for ($i = 0; $i < 137; $i++) {
    $accel_x = $mean_x + $std_dev_x * rand(-1000, 1000) / 1000; // Gaussian for X
    $accel_y = $mean_y + $std_dev_y * rand(-1000, 1000) / 1000; // Gaussian for Y
    $accel_z = $mean_z + $std_dev_z * rand(-1000, 1000) / 1000; // Gaussian for Z

    $stmt->execute();
    sleep(3);
}

echo "Data inserted successfully.";

$stmt->close();
$conn->close();
?>
