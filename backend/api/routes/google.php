<?php
// "Continue with Google" (OpenID Connect, no library), the same way as the first RoomEase
// project:
// 1. GET /auth/google/start sends the browser to Google, with a single-use state and PKCE.
// 2. Google sends it back to GET /auth/google/callback with a code, which is exchanged with
//    Google over checked HTTPS for the person's Google id, verified email and name.
// 3. A known account (by Google id, or by email, which links it) is signed in. Someone new
//    picks Boarder or Landlord and gives a phone number first (POST /auth/google/finish).
// The browser always ends on the website's /auth/google (or /login with an error code), and
// React finishes from there.
//
// Settings, in .env: ROOMEASE_GOOGLE_CLIENT_ID and ROOMEASE_GOOGLE_CLIENT_SECRET, from an
// OAuth client of type "Web application" whose redirect URI is this API's
// /auth/google/callback (README.md, "Continue with Google").

const GOOGLE_START_TTL = 600; // seconds to come back from Google
const GOOGLE_SIGNUP_TTL = 900; // seconds to finish the "one more step" page

function google_config()
{
  static $config = null;
  if ($config !== null) return $config;
  $config = [
    'client_id' => trim(env_value('ROOMEASE_GOOGLE_CLIENT_ID')),
    'client_secret' => trim(env_value('ROOMEASE_GOOGLE_CLIENT_SECRET')),
    // A cacert.pem, if PHP can't check Google's certificate (the same file as for Gmail works).
    'ca_bundle' => env_value('ROOMEASE_GOOGLE_CA_BUNDLE', env_value('ROOMEASE_MAIL_CA_BUNDLE')),
    // Google's addresses. Only tests point these elsewhere.
    'auth_url' => env_value('ROOMEASE_GOOGLE_AUTH_URL', 'https://accounts.google.com/o/oauth2/v2/auth'),
    'token_url' => env_value('ROOMEASE_GOOGLE_TOKEN_URL', 'https://oauth2.googleapis.com/token'),
  ];
  return $config;
}

function google_enabled()
{
  $config = google_config();
  return $config['client_id'] !== '' && $config['client_secret'] !== '';
}

// http(s)://host[:port] this request came to (ngrok and other proxies say https in X-Forwarded-Proto).
function request_origin()
{
  $https = is_https() || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
  return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

// This API's path, e.g. /RoomeaseV2/backend/api
function api_path()
{
  return rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
}

// Where Google sends people back. It must be listed, exactly, under "Authorized redirect
// URIs" of the OAuth client in the Google Cloud console.
function google_redirect_uri()
{
  return env_value('ROOMEASE_GOOGLE_REDIRECT_URI', request_origin() . api_path() . '/auth/google/callback');
}

// The website's address (…/RoomeaseV2/): the one the visitor came from if it's on this same
// host (the dev server's port differs), else the one next to this API.
function website_url($candidate = '')
{
  $parts = is_string($candidate) ? parse_url($candidate) : false;
  $host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0]);
  if ($parts && in_array($parts['scheme'] ?? '', ['http', 'https'], true) && strtolower($parts['host'] ?? '') === $host && !isset($parts['user'])) {
    return $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . (int) $parts['port'] : '') . rtrim($parts['path'] ?? '', '/') . '/';
  }
  return request_origin() . rtrim(dirname(dirname(api_path())), '/') . '/';
}

// A page inside the website to go to afterwards ("/rooms/sunrise"), or ''.
function internal_path($path)
{
  return is_string($path) && preg_match('#^/(?!/)[^\s\\\\]*$#', $path) && strlen($path) <= 300 ? $path : '';
}

function redirect_to($url)
{
  header('Cache-Control: no-store');
  header('Location: ' . $url, true, 302);
  exit;
}

function base64url_encode($bytes)
{
  return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function base64url_decode($text)
{
  $text = strtr((string) $text, '-_', '+/');
  return (string) base64_decode($text . str_repeat('=', (4 - strlen($text) % 4) % 4), true);
}

// GET /auth/google/start?role=boarder|landlord&remember=1&next=/rooms/sunrise&return=<website URL>
function route_google_start()
{
  $site = website_url($_GET['return'] ?? '');
  if (!google_enabled()) redirect_to($site . 'login?googleError=not-set-up');
  $verifier = base64url_encode(random_bytes(48));
  $state = bin2hex(random_bytes(24));
  $_SESSION['google_oauth'] = [
    'state' => $state,
    'verifier' => $verifier,
    'role' => in_array($_GET['role'] ?? '', API_ROLES, true) ? $_GET['role'] : 'boarder',
    'remember' => !empty($_GET['remember']),
    'next' => internal_path($_GET['next'] ?? ''),
    'site' => $site,
    'redirect_uri' => google_redirect_uri(),
    'started_at' => time(),
  ];
  redirect_to(google_config()['auth_url'] . '?' . http_build_query([
    'client_id' => google_config()['client_id'],
    'redirect_uri' => google_redirect_uri(),
    'response_type' => 'code',
    'scope' => 'openid email profile',
    'state' => $state,
    'code_challenge' => base64url_encode(hash('sha256', $verifier, true)),
    'code_challenge_method' => 'S256',
    'prompt' => 'select_account',
  ]));
}

// GET /auth/google/callback?code&state (or ?error when the person cancelled at Google)
function route_google_callback()
{
  // The attempt works once: it's taken out of the session before anything else.
  $pending = $_SESSION['google_oauth'] ?? null;
  unset($_SESSION['google_oauth']);
  $site = is_array($pending) ? $pending['site'] : website_url();
  $role = is_array($pending) ? $pending['role'] : 'boarder';
  // Error codes, not messages: the sign-in page says what each one means.
  $fail = function ($code) use ($site, $role) {
    redirect_to($site . 'login?' . http_build_query(['googleError' => $code, 'role' => $role]));
  };

  $state = $_GET['state'] ?? '';
  if (!is_array($pending) || !is_string($state) || !hash_equals($pending['state'], $state) || time() - $pending['started_at'] > GOOGLE_START_TTL) $fail('expired');
  if (isset($_GET['error'])) $fail('cancelled');
  $code = $_GET['code'] ?? '';
  if (!is_string($code) || $code === '') $fail('failed');
  if (!google_enabled()) $fail('not-set-up');

  try {
    $claims = google_exchange_code($code, $pending['verifier'], $pending['redirect_uri']);
  } catch (RuntimeException $error) {
    error_log('RoomEase: Google sign-in failed - ' . $error->getMessage());
    $fail('failed');
  }
  $profile = google_profile_from_claims($claims);
  [$account, $problem, $linked] = google_find_account($profile['google_id'], $profile['email']);
  if ($problem) $fail($problem);

  if (!$account) {
    // Someone new: nothing is created until they choose Boarder or Landlord.
    session_regenerate_id(true);
    $_SESSION['google_signup'] = $profile + ['remember' => $pending['remember'], 'role' => $role, 'next' => $pending['next'], 'started_at' => time()];
    redirect_to($site . 'auth/google?' . http_build_query(['status' => 'choose-role', 'role' => $role, 'next' => $pending['next']]));
  }
  if ($account['deleted_at']) $fail('removed');
  if (!$account['is_active']) $fail('deactivated');

  start_signed_in_session($account);
  if ($pending['remember']) issue_remember_cookie($account['user_id']);
  audit('auth.login', 'user', $account['user_id'], trim($account['first_name'] . ' ' . $account['last_name']), $linked ? 'With Google (account linked to Google now)' : 'With Google', $account);
  redirect_to($site . 'auth/google?' . http_build_query(['status' => $linked ? 'linked' : 'signed-in', 'next' => $pending['next']]));
}

// GET /auth/google/pending: the new Google user waiting to choose Boarder or Landlord.
function route_google_pending()
{
  $signup = google_signup_or_fail();
  ok(['name' => trim($signup['first_name'] . ' ' . $signup['last_name']), 'email' => $signup['email'], 'role' => $signup['role'], 'next' => $signup['next']]);
}

// POST /auth/google/finish { role, phone }: creates the account and signs in.
function route_google_finish()
{
  $signup = google_signup_or_fail();
  $role = input('role');
  $phone = normalize_ph_mobile(input('phone'));
  $fields = [];
  if (!in_array($role, API_ROLES, true)) $fields['role'] = 'Choose Boarder or Landlord.';
  if (!$phone) $fields['phone'] = 'Enter a mobile number like 0917 123 4567.';
  if ($fields) fail(422, reset($fields), $fields);
  if (email_taken($signup['email'], 0)) {
    unset($_SESSION['google_signup']);
    fail(409, 'An account with this email was just created. Continue with Google again to sign in.');
  }

  db()->prepare('INSERT INTO users (email, google_id, password_hash, first_name, last_name, phone_number, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
    // Nobody knows this password; they sign in with Google (or set one with "Forgot password").
    ->execute([$signup['email'], $signup['google_id'], password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT), mb_substr($signup['first_name'], 0, 100), mb_substr($signup['last_name'], 0, 100), $phone, $role]);
  $account = load_account((int) db()->lastInsertId());
  unset($_SESSION['google_signup']);
  start_signed_in_session($account);
  if ($signup['remember']) issue_remember_cookie($account['user_id']);
  $name = trim($account['first_name'] . ' ' . $account['last_name']);
  audit('user.created', 'user', $account['user_id'], $name, 'Signed up with Google as a ' . $role, $account);
  audit('auth.login', 'user', $account['user_id'], $name, 'With Google', $account);
  ok(['user' => public_user($account), 'csrfToken' => csrf_token(), 'next' => $signup['next']], 201);
}

function google_signup_or_fail()
{
  $signup = $_SESSION['google_signup'] ?? null;
  if (!is_array($signup) || time() - $signup['started_at'] > GOOGLE_SIGNUP_TTL) {
    fail(410, 'That Google sign-up expired. Please continue with Google again.', null, 'google-expired');
  }
  return $signup;
}

// ---------- Talking to Google ----------

// POST to Google over checked HTTPS. Returns [status, body]; throws if it can't connect.
function google_http_post($url, array $fields)
{
  $config = google_config();
  if (function_exists('curl_init')) {
    $options = [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => http_build_query($fields),
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CONNECTTIMEOUT => 10,
      CURLOPT_TIMEOUT => 20,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
      CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ];
    // WAMP has no certificate bundle set, so curl uses Windows' own certificates.
    if ($config['ca_bundle'] !== '') $options[CURLOPT_CAINFO] = $config['ca_bundle'];
    elseif (defined('CURLSSLOPT_NATIVE_CA') && PHP_OS_FAMILY === 'Windows') $options[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
    $ch = curl_init($url);
    curl_setopt_array($ch, $options);
    $body = curl_exec($ch);
    if ($body === false) throw new RuntimeException('request to Google failed: ' . curl_error($ch));
    return [(int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE), (string) $body];
  }
  // Without curl: PHP's own HTTPS, with the certificate checked the same way.
  $ssl = ['verify_peer' => true, 'verify_peer_name' => true];
  if ($config['ca_bundle'] !== '') $ssl['cafile'] = $config['ca_bundle'];
  $context = stream_context_create([
    'http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n", 'content' => http_build_query($fields), 'timeout' => 20, 'ignore_errors' => true],
    'ssl' => $ssl,
  ]);
  $body = @file_get_contents($url, false, $context);
  if ($body === false) throw new RuntimeException('request to Google failed: ' . (error_get_last()['message'] ?? 'unknown error'));
  preg_match('#^HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $match);
  return [(int) ($match[1] ?? 0), $body];
}

// The code from the callback → the person's checked ID token claims.
function google_exchange_code($code, $verifier, $redirectUri)
{
  $config = google_config();
  [$status, $body] = google_http_post($config['token_url'], [
    'code' => $code,
    'client_id' => $config['client_id'],
    'client_secret' => $config['client_secret'],
    'redirect_uri' => $redirectUri,
    'grant_type' => 'authorization_code',
    'code_verifier' => $verifier,
  ]);
  $data = json_decode($body, true);
  if ($status !== 200 || !is_array($data) || empty($data['id_token'])) {
    // Google's error message holds no secrets, so it can be logged.
    throw new RuntimeException("token endpoint answered HTTP $status: " . substr($body, 0, 300));
  }
  return google_id_token_claims($data['id_token'], $config['client_id']);
}

// Reads and checks the ID token's claims. The signature isn't checked: the token came
// straight from Google over checked HTTPS, which OpenID Connect allows (section 3.1.3.7).
function google_id_token_claims($jwt, $clientId)
{
  $parts = explode('.', (string) $jwt);
  if (count($parts) !== 3) throw new RuntimeException('ID token is not a JWT');
  $claims = json_decode(base64url_decode($parts[1]), true);
  if (!is_array($claims)) throw new RuntimeException('ID token payload is not JSON');
  if (!in_array($claims['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)) throw new RuntimeException('ID token has the wrong issuer');
  if (($claims['aud'] ?? '') !== $clientId) throw new RuntimeException('ID token was issued for a different client');
  if ((int) ($claims['exp'] ?? 0) < time()) throw new RuntimeException('ID token has expired');
  if (empty($claims['sub']) || !is_string($claims['sub']) || empty($claims['email'])) throw new RuntimeException('ID token has no account id or email');
  if (($claims['email_verified'] ?? false) !== true && ($claims['email_verified'] ?? '') !== 'true') throw new RuntimeException('Google has not verified this email address');
  return $claims;
}

// The details kept: Google id, email, first and last name.
function google_profile_from_claims(array $claims)
{
  $email = mb_strtolower(trim($claims['email']));
  $first = trim((string) ($claims['given_name'] ?? ''));
  $last = trim((string) ($claims['family_name'] ?? ''));
  if ($first === '') $first = trim((string) ($claims['name'] ?? '')) ?: strstr($email, '@', true);
  return ['google_id' => $claims['sub'], 'email' => $email, 'first_name' => $first, 'last_name' => $last];
}

// The account for a Google sign-in: by Google id, else by email (and linked then).
// Returns [account or null, error code or null, linked now?].
function google_find_account($googleId, $email)
{
  $stmt = db()->prepare('SELECT * FROM users WHERE google_id = ? LIMIT 1');
  $stmt->execute([$googleId]);
  $account = $stmt->fetch();
  if (!$account) {
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $account = $stmt->fetch();
  }
  if (!$account) return [null, null, false];
  // Admins sign in to the admin panel, with their username or email and password.
  if (!in_array($account['role'], API_ROLES, true)) return [null, 'admin', false];
  if ($account['google_id'] === $googleId) return [$account, null, false];
  if ($account['google_id'] !== null) return [null, 'other-google', false];
  // Deactivated or removed accounts aren't linked; the callback refuses them.
  if ($account['deleted_at'] || !$account['is_active']) return [$account, null, false];

  // Link it. The old password stops working: sign-up never proved the email was theirs, so
  // someone else could have registered it with a password they know. The owner can set a
  // new password with "Forgot password".
  $replacement = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
  $link = db()->prepare('UPDATE users SET google_id = ?, password_hash = ?, updated_by = user_id WHERE user_id = ? AND google_id IS NULL');
  $link->execute([$googleId, $replacement, $account['user_id']]);
  if ($link->rowCount() !== 1) return google_find_account($googleId, $email); // linked meanwhile
  // "Remember me" on other devices stops too (the new password signs out other sessions).
  db()->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([$account['user_id']]);
  $account['google_id'] = $googleId;
  $account['password_hash'] = $replacement;
  return [$account, null, true];
}
