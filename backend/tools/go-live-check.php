<?php
// Checks that RoomEase is ready for other people to use, and says how to fix what isn't.
// From the project folder:
//
//   php backend/tools/go-live-check.php
//
// Exits with 1 while something must be fixed (warnings alone don't count).
require __DIR__ . '/lib.php';
require_once __DIR__ . '/../lib/mailer.php';

$results = [];
$check = function ($level, $label, $fix = null) use (&$results) {
  $results[] = [$level, $label, $fix];
};
$root = realpath(__DIR__ . '/../..');

// Settings
is_file("$root/.env")
  ? $check('OK', '.env exists')
  : $check('FIX', 'There is no .env file', 'Copy .env.example to .env in the project folder.');
is_production()
  ? $check('OK', 'Production mode: PHP errors are never shown on a page')
  : $check('FIX', 'Not in production mode: PHP errors can show file paths and database details', 'Add ROOMEASE_ENV=production to .env.');
$app = require __DIR__ . '/../config/app.php';
empty($app['show_reset_codes_on_screen'])
  ? $check('OK', 'Reset codes are never shown on screen')
  : $check('FIX', 'Reset codes can be shown on screen (to this computer, and through ngrok)', 'Remove ROOMEASE_SHOW_RESET_CODES from .env, or set it to false.');
mail_enabled()
  ? $check('OK', 'Email is set up (' . mail_config()['username'] . '). Test it: php backend/tools/send-test-email.php you@example.com')
  : $check('FIX', 'Email isn\'t set up, so "Forgot password" can\'t send codes', 'Set ROOMEASE_MAIL_USERNAME and ROOMEASE_MAIL_PASSWORD in .env (README.md, "Email").');

// Accounts
$pdo = tool_db();
$in = implode(',', array_map([$pdo, 'quote'], DEMO_EMAILS));
$demo = $pdo->query("SELECT email, password_hash FROM users WHERE email IN ($in)")->fetchAll();
$open = array_filter($demo, function ($account) {
  foreach (DEMO_PASSWORDS as $password) if (password_verify($password, $account['password_hash'])) return true;
  return false;
});
if (!$demo) $check('OK', 'No demo accounts');
elseif ($open) $check('FIX', count($open) . ' demo accounts still sign in with the passwords printed in README.md', 'php backend/tools/remove-demo-data.php --yes');
else $check('WARN', count($demo) . ' demo accounts remain (their passwords were changed)', 'php backend/tools/remove-demo-data.php --yes');
$own = $pdo->query("SELECT username, must_change_password FROM users WHERE role = 'super_admin' AND is_active = 1 AND deleted_at IS NULL AND email NOT IN ($in)")->fetchAll();
if (!$own) $check('FIX', 'No super admin of your own', 'php backend/tools/create-super-admin.php');
elseif (array_filter($own, function ($admin) {
  return $admin['must_change_password'];
})) $check('WARN', 'A super admin still has the one-time password', 'Sign in to the admin panel once and choose your own password.');
else $check('OK', 'Your own super admin: ' . implode(', ', array_column($own, 'username')));

// Files and folders
foreach (['backend/uploads' => 'photos', 'backend/logs' => 'logs'] as $dir => $what) {
  if (!is_dir("$root/$dir")) @mkdir("$root/$dir", 0775, true);
  is_writable("$root/$dir")
    ? $check('OK', "$dir can be written ($what)")
    : $check('FIX', "PHP can't write to $dir ($what)", "Let the web server's user write to $dir.");
}
is_file("$root/dist/index.html")
  ? $check('OK', 'The website is built (dist/)')
  : $check('FIX', 'The website isn\'t built: dist/index.html is missing', 'npm run build');
$backup = latest_backup();
if (!$backup) $check('WARN', 'No database backup yet', 'php backend/tools/backup-database.php (and schedule it daily: README.md, "Going live").');
elseif (filemtime($backup) < time() - 7 * 86400) $check('WARN', 'The newest backup is ' . floor((time() - filemtime($backup)) / 86400) . ' days old', 'php backend/tools/backup-database.php');
else $check('OK', 'Newest backup: ' . basename($backup) . ' (' . file_size($backup) . ')');

// PHP
foreach (['pdo_mysql' => 'the database', 'gd' => 'photos', 'fileinfo' => 'checking photos', 'mbstring' => 'text', 'openssl' => 'email'] as $extension => $why) {
  extension_loaded($extension)
    ? $check('OK', "PHP extension $extension ($why)")
    : $check('FIX', "PHP extension $extension is off ($why)", "WAMP: left-click the tray icon > PHP > PHP extensions > $extension.");
}
extension_loaded('zip')
  ? $check('OK', 'PHP extension zip (photos in backups)')
  : $check('WARN', 'PHP extension zip is off: backups won\'t include the photos', 'WAMP: PHP > PHP extensions > zip, or copy backend/uploads yourself.');

$labels = ['OK' => '  ok ', 'WARN' => ' warn', 'FIX' => '  FIX'];
say('RoomEase go-live check (' . database_name() . ')');
say();
foreach ($results as [$level, $label, $fix]) {
  say("{$labels[$level]}  $label");
  if ($fix && $level !== 'OK') say("        -> $fix");
}
$toFix = count(array_filter($results, function ($result) {
  return $result[0] === 'FIX';
}));
say();
say($toFix ? "$toFix " . ($toFix === 1 ? 'thing' : 'things') . ' to fix before going live.' : 'Ready to go live.');
say('If people will reach it from other devices, serve it over HTTPS (ngrok does); sign-in cookies then become secure-only by themselves.');
exit($toFix ? 1 : 0);
