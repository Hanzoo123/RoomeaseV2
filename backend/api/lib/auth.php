<?php
// Who is signed in: a PHP session, plus an optional "Remember me" cookie that signs the
// person back in after the session ends. Admin roles use the admin panel, not this API.

const API_ROLES = ['boarder', 'landlord'];
const REMEMBER_COOKIE = 'ROOMEASE_REMEMBER';
const REMEMBER_DAYS = 30;

// Its own cookie, so it never mixes with the admin panel's session (ROOMEASE_ADMIN).
session_name('ROOMEASE_API');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'httponly' => true,
  'samesite' => 'Lax',
  'secure' => is_https(),
]);
session_start();

function is_https()
{
  return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}

// ---------- CSRF: the React app sends this token back in an X-CSRF-Token header ----------

function csrf_token()
{
  if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf_token'];
}

function require_csrf()
{
  $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (!is_string($sent) || !hash_equals(csrf_token(), $sent)) {
    fail(403, 'Your session expired. Please try again.', null, 'csrf');
  }
}

// ---------- The signed-in account ----------

function load_account($userId)
{
  $stmt = db()->prepare('SELECT * FROM users WHERE user_id = ?');
  $stmt->execute([$userId]);
  return $stmt->fetch() ?: null;
}

function account_can_sign_in($account)
{
  return $account && $account['is_active'] && !$account['deleted_at'] && in_array($account['role'], API_ROLES, true);
}

// Why the person was just signed out, if they were ('deactivated'), for GET /auth/me.
$signed_out_reason = null;

// The signed-in account (a users row), or null. Checked against the database on every
// request, so an account an admin deactivates is signed out at once.
function current_user()
{
  static $resolved = false, $user = null;
  global $signed_out_reason;
  if ($resolved) return $user;
  $resolved = true;

  if (!empty($_SESSION['user_id'])) {
    $account = load_account($_SESSION['user_id']);
    // A password change or reset elsewhere ends this session too.
    $samePassword = $account && hash_equals(password_fingerprint($account), (string) ($_SESSION['password'] ?? ''));
    if (account_can_sign_in($account) && $samePassword) return $user = $account;
    $signed_out_reason = $account && !$account['is_active'] ? 'deactivated' : 'signed_out';
    $staleId = $_SESSION['user_id'];
    forget_session();
    forget_remember_cookie(true, $staleId);
    return $user = null;
  }

  // No session: try the "Remember me" cookie.
  $account = account_from_remember_cookie();
  if ($account) {
    start_signed_in_session($account);
    return $user = $account;
  }
  return null;
}

function require_user($roles = API_ROLES)
{
  $user = current_user();
  if (!$user) fail(401, 'Please sign in first.');
  if (!in_array($user['role'], (array) $roles, true)) fail(403, 'Your account can’t do that.');
  return $user;
}

function start_signed_in_session($account)
{
  // A new session id on sign-in, so an old one can't be reused.
  session_regenerate_id(true);
  $_SESSION['user_id'] = (int) $account['user_id'];
  $_SESSION['password'] = password_fingerprint($account);
  unset($_SESSION['csrf_token']);
  db()->prepare('UPDATE users SET last_login_at = NOW() WHERE user_id = ?')->execute([$account['user_id']]);
}

// Changes whenever the password does, without keeping the hash itself in the session.
function password_fingerprint($account)
{
  return hash_hmac('sha256', $account['password_hash'], 'roomease-session');
}

function forget_session()
{
  $_SESSION = [];
  session_regenerate_id(true);
}

// ---------- "Remember me": selector + validator; only a hash of the validator is stored ----------

function issue_remember_cookie($userId)
{
  $selector = bin2hex(random_bytes(12));
  $validator = bin2hex(random_bytes(32));
  db()->prepare('INSERT INTO remember_tokens (user_id, selector, validator_hash, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL ' . REMEMBER_DAYS . ' DAY)')
    ->execute([$userId, $selector, hash('sha256', $validator)]);
  setcookie(REMEMBER_COOKIE, "$selector:$validator", [
    'expires' => time() + REMEMBER_DAYS * 86400,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => is_https(),
  ]);
}

function forget_remember_cookie($deleteToken = true, $userId = null)
{
  $cookie = $_COOKIE[REMEMBER_COOKIE] ?? '';
  if ($deleteToken && is_string($cookie) && strpos($cookie, ':') !== false) {
    db()->prepare('DELETE FROM remember_tokens WHERE selector = ?')->execute([explode(':', $cookie, 2)[0]]);
  }
  if ($userId) {
    db()->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([$userId]);
  }
  if ($cookie !== '') {
    setcookie(REMEMBER_COOKIE, '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => is_https()]);
  }
}

// Each token works once: signing in with it replaces it with a new one.
function account_from_remember_cookie()
{
  $cookie = $_COOKIE[REMEMBER_COOKIE] ?? '';
  if (!is_string($cookie) || !preg_match('/^([a-f0-9]{24}):([a-f0-9]{64})$/', $cookie, $parts)) return null;
  [, $selector, $validator] = $parts;

  $stmt = db()->prepare('SELECT * FROM remember_tokens WHERE selector = ? AND expires_at > NOW()');
  $stmt->execute([$selector]);
  $token = $stmt->fetch();
  if (!$token || !hash_equals($token['validator_hash'], hash('sha256', $validator))) {
    // A known selector with the wrong validator may be a stolen cookie: drop all of that person's tokens.
    forget_remember_cookie(true, $token['user_id'] ?? null);
    return null;
  }

  $account = load_account($token['user_id']);
  db()->prepare('DELETE FROM remember_tokens WHERE token_id = ?')->execute([$token['token_id']]);
  if (!account_can_sign_in($account)) {
    forget_remember_cookie(false);
    return null;
  }
  issue_remember_cookie($account['user_id']);
  return $account;
}

// ---------- What the React app sees ----------

function public_user($account)
{
  return [
    'id' => (int) $account['user_id'],
    'role' => $account['role'],
    'name' => trim($account['first_name'] . ' ' . $account['last_name']),
    'firstName' => $account['first_name'],
    'lastName' => $account['last_name'],
    'email' => $account['email'],
    'phone' => $account['phone_number'] ?? '',
    // Relative to backend/, e.g. "uploads/avatars/ab12….jpg".
    'avatarPath' => $account['avatar_path'],
    // Signs in with Google (its password, if any, was set with "Forgot password").
    'google' => !empty($account['google_id']),
    // Settings > Notifications: { emailUpdates, reservationAlerts, listingTips }
    'preferences' => preferences_for_app(user_preferences(db(), $account['user_id'])),
    'createdAt' => date(DATE_ATOM, strtotime($account['created_at'])),
  ];
}
