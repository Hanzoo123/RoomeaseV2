<?php
// How the PHP side runs: development (the default) or production, set in .env:
//
//   ROOMEASE_ENV=production
//
// In production, PHP errors are never shown on a page (they would reveal file paths and
// database details) and reset codes are never shown on screen. In both modes, errors are
// written to backend/logs/php-errors.log.

require_once __DIR__ . '/env.php';

const LOGS_DIR = __DIR__ . '/../logs';

function is_production()
{
  return strtolower(trim(env_value('ROOMEASE_ENV', 'development'))) === 'production';
}

// The folder for logs (and its .htaccess, so Apache never serves them), created if needed.
function logs_dir()
{
  if (!is_dir(LOGS_DIR)) @mkdir(LOGS_DIR, 0775, true);
  if (!is_file(LOGS_DIR . '/.htaccess')) @file_put_contents(LOGS_DIR . '/.htaccess', "Require all denied\n");
  return LOGS_DIR;
}

// Errors go to backend/logs/php-errors.log. $showOnPage: whether a page may show them in
// development (the admin panel does; the API never does, it answers in JSON).
function setup_error_handling($showOnPage)
{
  error_reporting(E_ALL);
  ini_set('log_errors', '1');
  if (is_writable(logs_dir())) ini_set('error_log', LOGS_DIR . '/php-errors.log');
  ini_set('display_errors', $showOnPage && !is_production() ? '1' : '0');
}

// What a page may say about an exception: the details in development, a plain sentence in
// production (the details go to the error log).
function error_text(Throwable $error, $plain = 'Something went wrong. Please try again, or check backend/logs/php-errors.log.')
{
  if (!is_production()) return $error->getMessage();
  error_log('RoomEase: ' . $error);
  return $plain;
}
