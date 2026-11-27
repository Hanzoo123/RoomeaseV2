<?php
// Accounts: who am I, sign up, sign in, sign out, and "Forgot password".

const ROLE_LABELS = ['boarder' => 'Boarder', 'landlord' => 'Landlord'];
const RESET_CODE_MINUTES = 10;
const RESET_MAX_TRIES = 5;

// GET /auth/me: the signed-in person (or null) and the CSRF token for the next request.
function route_me()
{
  global $signed_out_reason;
  $user = current_user();
  ok([
    'user' => $user ? public_user($user) : null,
    'csrfToken' => csrf_token(),
    // 'deactivated' when an admin deactivated the account since the last request.
    'signedOutReason' => $user ? null : $signed_out_reason,
  ]);
}

// Checks the sign-up and profile fields; returns [$fields, $values].
function validate_person($requirePhone)
{
  $name = preg_replace('/\s+/u', ' ', input('name'));
  $email = input('email');
  $phoneInput = input('phone');
  $phone = normalize_ph_mobile($phoneInput);
  $parts = explode(' ', $name);
  $fields = [];
  if (count($parts) < 2 || mb_strlen($parts[0]) > 100 || mb_strlen(implode(' ', array_slice($parts, 1))) > 100) {
    $fields['name'] = 'Enter your first and last name.';
  }
  if (!valid_email($email)) $fields['email'] = 'Enter a valid email address.';
  if (($requirePhone || $phoneInput !== '') && !$phone) $fields['phone'] = 'Enter an 11-digit mobile number starting with 09, e.g. 0917 123 4567.';
  // First word is the first name, the rest the last name ("Juan Dela Cruz" → Juan / Dela Cruz).
  return [$fields, ['first' => $parts[0], 'last' => implode(' ', array_slice($parts, 1)), 'email' => $email, 'phone' => $phone]];
}

function email_taken($email, $exceptUserId = 0)
{
  $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE email = ? AND user_id <> ?');
  $stmt->execute([$email, $exceptUserId]);
  return $stmt->fetchColumn() > 0;
}

// POST /auth/register { name, email, phone, password, role }: creates the account and signs in.
function route_register()
{
  fail_throttled('register', client_ip(), 'Too many sign-ups from this network. Please wait %d minutes.');
  [$fields, $person] = validate_person(true);
  $password = body()['password'] ?? '';
  $role = input('role');
  if (!is_string($password) || ($problems = password_problems($password))) {
    $fields['password'] = 'Your password needs ' . implode(', ', $problems ?? ['8 or more characters']) . '.';
  }
  if (!in_array($role, API_ROLES, true)) $fields['role'] = 'Choose Boarder or Landlord.';
  if ($fields) fail(422, reset($fields), $fields);

  record_try('register', client_ip());
  if (email_taken($person['email'])) {
    fail(409, 'An account with this email already exists. Sign in instead.', ['email' => 'This email already has an account.']);
  }
  try {
    db()->prepare('INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role) VALUES (?, ?, ?, ?, ?, ?)')
      ->execute([$person['email'], password_hash($password, PASSWORD_DEFAULT), $person['first'], $person['last'], $person['phone'], $role]);
  } catch (PDOException $e) {
    // Two sign-ups with the same email at the same moment.
    if ($e->getCode() === '23000') fail(409, 'An account with this email already exists. Sign in instead.');
    throw $e;
  }
  $id = (int) db()->lastInsertId();
  db()->prepare('UPDATE users SET created_by = ? WHERE user_id = ?')->execute([$id, $id]);

  $account = load_account($id);
  start_signed_in_session($account);
  issue_remember_cookie($id);
  audit('user.created', 'user', $id, $person['first'] . ' ' . $person['last'], 'Signed up as a ' . $role, $account);
  ok(['user' => public_user($account), 'csrfToken' => csrf_token()], 201);
}

// POST /auth/login { email, password, role, remember }
function route_login()
{
  $email = input('email');
  $password = body()['password'] ?? '';
  $role = input('role');
  if ($email === '' || !is_string($password) || $password === '') fail(422, 'Enter your email and password.');
  fail_throttled('login', $email, 'Too many wrong tries. Please wait %d minutes and try again.');

  $stmt = db()->prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1');
  $stmt->execute([$email]);
  $account = $stmt->fetch();
  // Check a password even when there's no account, so the answer takes as long either way.
  $hash = $account['password_hash'] ?? '$2y$10$ATdeEpZfCcYF0BEoYT3V.eeFluE/DF55SncJjt9OB2STt5WRZagge';
  if (!password_verify($password, $hash) || !$account) {
    record_try('login', $email, $account['user_id'] ?? null);
    fail(401, 'Incorrect email or password.');
  }
  if (!$account['is_active']) {
    fail(403, 'This account has been deactivated. Contact the RoomEase team if you think this is a mistake.');
  }
  if (!in_array($account['role'], API_ROLES, true)) {
    fail(403, 'Admins and super admins sign in on the admin panel.');
  }
  if ($role !== '' && $account['role'] !== $role) {
    $label = ROLE_LABELS[$account['role']];
    fail(403, "This account is registered as a $label. Switch to the $label tab to sign in.");
  }

  clear_tries('login', $email);
  if (password_needs_rehash($account['password_hash'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE users SET password_hash = ? WHERE user_id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $account['user_id']]);
  }
  start_signed_in_session($account);
  if (!empty(body()['remember'])) issue_remember_cookie($account['user_id']);
  audit('auth.login', 'user', $account['user_id'], trim($account['first_name'] . ' ' . $account['last_name']), null, $account);
  ok(['user' => public_user($account), 'csrfToken' => csrf_token()]);
}

// POST /auth/logout: ends the session and forgets this device.
function route_logout()
{
  $user = current_user();
  if ($user) audit('auth.logout', 'user', $user['user_id'], trim($user['first_name'] . ' ' . $user['last_name']));
  forget_remember_cookie(true);
  forget_session();
  ok(['csrfToken' => csrf_token()]);
}

// ---------- Forgot password: email → 6-digit code → new password ----------

// When the code can't be emailed, it can be shown on screen, but only to this computer
// (config/app.php, ROOMEASE_SHOW_RESET_CODES).
function reset_codes_on_screen()
{
  $config = require __DIR__ . '/../../config/app.php';
  return !empty($config['show_reset_codes_on_screen']) && in_array(client_ip(), ['127.0.0.1', '::1'], true);
}

// POST /auth/forgot { email }. Answers the same whether or not the email has an account.
function route_forgot()
{
  $email = input('email');
  if (!valid_email($email)) fail(422, 'Enter the email address on your account.');
  fail_throttled('reset', $email, 'Too many code requests. Please wait %d minutes.');
  record_try('reset', $email);

  // Admins reset passwords through a super admin, not by email.
  $stmt = db()->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL AND role IN ('boarder', 'landlord')");
  $stmt->execute([$email]);
  $account = $stmt->fetch();
  $code = null;
  $emailed = null;
  if ($account) {
    // An earlier code stops working once a new one is asked for.
    db()->prepare('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL')->execute([$account['user_id']]);
    $code = (string) random_int(100000, 999999);
    db()->prepare('INSERT INTO password_resets (user_id, token_hash, code_hash, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL ' . RESET_CODE_MINUTES . ' MINUTE)')
      ->execute([$account['user_id'], hash('sha256', random_bytes(32)), password_hash($code, PASSWORD_DEFAULT)]);
    $emailed = email_reset_code($account, $code);
  }
  // The answer is the same whether or not the email has an account. Only this computer
  // sees the code (or that there is no account), and only when it wasn't emailed.
  $onScreen = reset_codes_on_screen() && $emailed !== true;
  ok([
    'codeOnScreen' => $onScreen,
    'code' => $onScreen ? $code : null,
    // Why it wasn't emailed, e.g. "AUTH password: 535 …" (never contains the password).
    'emailProblem' => $onScreen && is_string($emailed) ? $emailed : null,
  ]);
}

// Emails a reset code. True if the mail server took it, or why not.
function email_reset_code($account, $code)
{
  $name = $account['first_name'];
  $minutes = RESET_CODE_MINUTES;
  $text = "Hi $name,\r\n\r\n"
    . "Use this code to reset the password for your RoomEase account:\r\n\r\n"
    . "    $code\r\n\r\n"
    . "It expires in $minutes minutes. Never share it; RoomEase will not ask you for it.\r\n\r\n"
    . "If you didn't ask for this, ignore this email. Your password stays the same.\r\n\r\n"
    . "RoomEase\r\n";
  // Email apps ignore stylesheets, so the styles are inline.
  $e = function ($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
  };
  $html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>'
    . '<body style="margin:0;padding:32px 16px;background:#f5f7f6;">'
    . '<div style="max-width:440px;margin:0 auto;font-family:\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2a28;">'
    . '<p style="margin:0 0 28px;font-size:20px;font-weight:700;color:#166534;">RoomEase</p>'
    . '<p style="margin:0 0 16px;">Hi ' . $e($name) . ',</p>'
    . '<p style="margin:0 0 20px;">Use this code to reset the password for your RoomEase account:</p>'
    . '<p style="margin:0 0 20px;font-family:Consolas,\'Courier New\',monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#166534;">' . $e($code) . '</p>'
    . '<p style="margin:0 0 16px;">It expires in ' . $minutes . ' minutes. Never share it; RoomEase will not ask you for it.</p>'
    . '<p style="margin:0;color:#5c6b66;font-size:13.5px;">If you didn\'t ask for this, ignore this email. Your password stays the same.</p>'
    . '</div></body></html>';
  return send_mail($account['email'], 'Your RoomEase password code', $text, $html);
}

// The newest unused reset request for an email, with "live" = not expired.
function latest_reset($email)
{
  $stmt = db()->prepare('SELECT r.*, r.expires_at > NOW() AS live FROM password_resets r JOIN users u ON u.user_id = r.user_id
    WHERE u.email = ? AND r.used_at IS NULL ORDER BY r.reset_id DESC LIMIT 1');
  $stmt->execute([$email]);
  return $stmt->fetch() ?: null;
}

// POST /auth/verify-code { email, code } → { token } for the last step. Five wrong tries end the code.
function route_verify_code()
{
  $email = input('email');
  $code = input('code');
  if (!preg_match('/^\d{6}$/', $code)) fail(422, 'Enter the 6-digit code.');
  $reset = latest_reset($email);
  if (!$reset || !$reset['live']) fail(422, 'This code has expired. Request a new one.');
  if ($reset['attempts'] >= RESET_MAX_TRIES) fail(429, 'Too many wrong tries. Request a new code.');
  if (!password_verify($code, $reset['code_hash'])) {
    db()->prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE reset_id = ?')->execute([$reset['reset_id']]);
    $left = RESET_MAX_TRIES - $reset['attempts'] - 1;
    fail(422, $left > 0 ? "That code isn’t right. $left " . ($left === 1 ? 'try' : 'tries') . ' left.' : 'Too many wrong tries. Request a new code.');
  }
  // The code is right: swap the placeholder for a token that allows one password change.
  $token = bin2hex(random_bytes(32));
  db()->prepare('UPDATE password_resets SET verified_at = NOW(), token_hash = ?, expires_at = NOW() + INTERVAL ' . RESET_CODE_MINUTES . ' MINUTE WHERE reset_id = ?')
    ->execute([hash('sha256', $token), $reset['reset_id']]);
  ok(['token' => $token]);
}

// POST /auth/reset { email, token, password }: sets the new password and signs out other devices.
function route_reset()
{
  $email = input('email');
  $token = input('token');
  $password = body()['password'] ?? '';
  if (!is_string($password) || ($problems = password_problems($password))) {
    fail(422, 'Your new password needs ' . implode(', ', $problems ?? ['8 or more characters']) . '.');
  }
  $stmt = db()->prepare('SELECT r.reset_id, u.* FROM password_resets r JOIN users u ON u.user_id = r.user_id
    WHERE r.token_hash = ? AND u.email = ? AND r.verified_at IS NOT NULL AND r.used_at IS NULL AND r.expires_at > NOW()');
  $stmt->execute([hash('sha256', $token), $email]);
  $row = $stmt->fetch();
  if (!$row) fail(422, 'Your reset session expired. Start again.');

  db()->prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_by = user_id WHERE user_id = ?')
    ->execute([password_hash($password, PASSWORD_DEFAULT), $row['user_id']]);
  db()->prepare('UPDATE password_resets SET used_at = NOW() WHERE reset_id = ?')->execute([$row['reset_id']]);
  db()->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([$row['user_id']]);
  audit('auth.password_reset', 'user', $row['user_id'], trim($row['first_name'] . ' ' . $row['last_name']), null, $row);
  ok(null);
}
