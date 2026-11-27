<?php
// The settings ($host, $dbname, $username, $password) are in backend/config/database.php,
// shared with the API.
require __DIR__ . '/../../config/database.php';

try{
  $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4",$username,$password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  // Show and compare times in Philippine time, whatever the server's own clock says.
  $pdo->exec("SET time_zone = '+08:00'");
} catch (PDOException $e) {
  require_once __DIR__ . '/../../lib/runtime.php';
  http_response_code(503);
  die('Connection failed: ' . htmlspecialchars(error_text($e, 'the database is not reachable.')) . ' (Is WAMP running, and was database/roomease.sql imported?)');
}
?>
