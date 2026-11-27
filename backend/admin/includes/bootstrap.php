<?php
// Loaded first by every admin page: session, database connection and helpers.
date_default_timezone_set('Asia/Manila');
// Errors show on the page while developing, never in production (ROOMEASE_ENV in .env);
// either way they're logged to backend/logs/php-errors.log.
require_once __DIR__ . '/../../lib/runtime.php';
setup_error_handling(true);

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
