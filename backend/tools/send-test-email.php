<?php
// Checks the Gmail settings in .env by sending one email. From the project folder:
//
//   php backend/tools/send-test-email.php you@example.com
//
// On WAMP, use WAMP's PHP, e.g. (your version number may differ):
//   C:\wamp64\bin\php\php8.2.13\php.exe backend\tools\send-test-email.php you@example.com
if (PHP_SAPI !== 'cli') {
  http_response_code(404);
  exit;
}
date_default_timezone_set('Asia/Manila');
require __DIR__ . '/../lib/mailer.php';

$to = $argv[1] ?? '';
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
  fwrite(STDERR, "Usage: php backend/tools/send-test-email.php you@example.com\n");
  exit(2);
}

$config = mail_config();
echo 'Sending from ' . ($config['username'] !== '' ? $config['username'] : '(ROOMEASE_MAIL_USERNAME is not set)')
  . " through {$config['host']}:{$config['port']} (" . ($config['port'] === 465 ? 'TLS' : 'STARTTLS') . ")…\n";

$result = send_mail(
  $to,
  'RoomEase test email',
  "This is a test from RoomEase. If you can read it, password reset codes will arrive by email too.\r\n\r\nRoomEase\r\n"
);
if ($result === true) {
  echo "Sent. Check the inbox (and the spam folder) of $to.\n";
  exit(0);
}

fwrite(STDERR, "Not sent: $result\n");
// What usually causes each kind of failure.
$hints = [
  '/not set up|example Gmail/' => 'Copy .env.example to .env (in the project folder) and fill in ROOMEASE_MAIL_USERNAME and ROOMEASE_MAIL_PASSWORD.',
  '/AUTH password|535|534/' => 'Gmail refused the sign-in. ROOMEASE_MAIL_PASSWORD must be an App Password (Google Account > Security > 2-Step Verification > App passwords), not your Gmail password, for the address in ROOMEASE_MAIL_USERNAME.',
  '/certificate|SSL operation failed|crypto/i' => 'PHP could not check Gmail\'s certificate. Download https://curl.se/ca/cacert.pem, and set ROOMEASE_MAIL_CA_BUNDLE to its full path in .env (or openssl.cafile in php.ini).',
  '/could not connect|timed out/' => 'The connection to Gmail failed. Check the internet connection; if your network blocks the port, try ROOMEASE_MAIL_PORT=587 (or 465).',
];
foreach ($hints as $pattern => $hint) {
  if (preg_match($pattern, $result)) {
    fwrite(STDERR, "\n$hint\n");
    break;
  }
}
exit(1);
