<?php
// WAMP64 defaults: MySQL on localhost (port 3306), user root, no password.
// Import database/roomease.sql first (phpMyAdmin > Import).
// Using WAMP's MariaDB instead? It listens on port 3307: set $host = 'localhost;port=3307'.
$host = 'localhost';
$dbname = 'roomease';
$username = 'root';
$password = '';

try{
  $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4",$username,$password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  // Show and compare times in Philippine time, whatever the server's own clock says.
  $pdo->exec("SET time_zone = '+08:00'");
} catch (PDOException $e) {
	die("Connection failed: " . $e->getMessage() . " (Is WAMP running, and was database/roomease.sql imported?)");
}
?>
