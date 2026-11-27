<?php
// Creates your own super admin, to replace the demo "superadmin" before going live. From
// the project folder:
//
//   php backend/tools/create-super-admin.php
//
// It asks for a username, email and name, and prints a one-time password. At the first
// sign-in (backend/admin/) the admin panel asks for a new password of your own.
// (--username=… --email=… --first=… --last=… answer the questions without asking.)
require __DIR__ . '/lib.php';

$options = cli_options();
$pdo = tool_db();
$taken = function ($column, $value) use ($pdo) {
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE $column = ?");
  $stmt->execute([$value]);
  return (bool) $stmt->fetchColumn();
};
$checks = [
  'username' => function ($value) use ($taken) {
    if (!preg_match('/^[A-Za-z0-9._-]{3,30}$/', $value)) return 'Use 3 to 30 letters, numbers, dots, dashes or underscores.';
    if (in_array(strtolower($value), ['superadmin', 'admin'], true)) return 'Choose a name other than the demo accounts\' ("superadmin", "admin").';
    return $taken('username', $value) ? 'That username is taken.' : null;
  },
  'email' => function ($value) use ($taken) {
    if (!valid_email($value)) return 'Enter a valid email address.';
    if (in_array(strtolower($value), DEMO_EMAILS, true)) return 'That is a demo account\'s address. Use your own.';
    return $taken('email', $value) ? 'Another account already uses that email.' : null;
  },
  'first' => function ($value) {
    return $value === '' || mb_strlen($value) > 100 ? 'Enter a first name (up to 100 characters).' : null;
  },
  'last' => function ($value) {
    return $value === '' || mb_strlen($value) > 100 ? 'Enter a last name (up to 100 characters).' : null;
  },
];
$questions = ['username' => 'Username (for signing in)', 'email' => 'Email', 'first' => 'First name', 'last' => 'Last name'];
$answers = [];
foreach ($questions as $key => $question) {
  if (isset($options[$key]) && is_string($options[$key])) {
    $problem = $checks[$key](trim($options[$key]));
    if ($problem !== null) stop("--$key: $problem");
    $answers[$key] = trim($options[$key]);
  } else {
    $answers[$key] = ask($question, $checks[$key]);
  }
}

// A one-time password that meets the site's rules (upper and lower case, a number, a symbol).
function one_time_password()
{
  $sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '#%+=?@'];
  $chars = [];
  foreach ($sets as $set) $chars[] = $set[random_int(0, strlen($set) - 1)];
  $all = implode('', $sets);
  while (count($chars) < 14) $chars[] = $all[random_int(0, strlen($all) - 1)];
  for ($i = count($chars) - 1; $i > 0; $i--) {
    $j = random_int(0, $i);
    [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
  }
  return implode('', $chars);
}
$password = one_time_password();
if (password_problems($password)) stop('Could not make a password. Please run this again.');

$pdo->prepare("INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, must_change_password)
  VALUES (?, ?, ?, ?, ?, 'super_admin', 1, 1)")
  ->execute([$answers['username'], $answers['email'], password_hash($password, PASSWORD_DEFAULT), $answers['first'], $answers['last']]);
$id = (int) $pdo->lastInsertId();
$pdo->prepare("INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, target_label, detail) VALUES (NULL, 'system', 'admin.created', 'user', ?, ?, ?)")
  ->execute([$id, $answers['first'] . ' ' . $answers['last'], 'Super Admin (backend/tools/create-super-admin.php)']);

say();
say("Super admin created: {$answers['username']} ({$answers['email']}).");
say();
say("  One-time password:  $password");
say();
say('Sign in at http://localhost/RoomeaseV2/backend/admin/ (your folder name may differ) with the username');
say('or email and this password. The admin panel then asks you to choose your own password.');
say('This password is shown only now and isn\'t saved anywhere readable.');
