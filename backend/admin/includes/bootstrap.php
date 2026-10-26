<?php
// Loaded first by every admin page: session, database connection and helpers.
date_default_timezone_set('Asia/Manila');

// Its own session cookie, so signing in here never mixes with the React app's API session.
session_name('ROOMEASE_ADMIN');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'httponly' => true,
  'samesite' => 'Lax',
  'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

require_once __DIR__ . '/../config/conn.php';
require_once __DIR__ . '/functions.php';
