<?php
// The signed-in person's own profile, photo and password.

const AVATAR_DIR = __DIR__ . '/../../uploads/avatars';
const AVATAR_SIZE = 256;

// PATCH /me { name, email, phone }
function route_update_profile()
{
  $user = require_user();
  [$fields, $person] = validate_person(false);
  if ($fields) fail(422, reset($fields), $fields);
  if (email_taken($person['email'], $user['user_id'])) {
    fail(409, 'Another account already uses this email.', ['email' => 'Another account already uses this email.']);
  }
  db()->prepare('UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, updated_by = user_id WHERE user_id = ?')
    ->execute([$person['first'], $person['last'], $person['email'], $person['phone'], $user['user_id']]);
  audit('profile.updated', 'user', $user['user_id'], $person['first'] . ' ' . $person['last']);
  ok(['user' => public_user(load_account($user['user_id']))]);
}

// POST /me/avatar { image: "data:image/jpeg;base64,…" }. The app already shrinks the photo;
// here it is checked, re-drawn (which drops anything hidden in the file) and saved as a JPEG.
function route_upload_avatar()
{
  $user = require_user();
  $image = body()['image'] ?? '';
  if (!is_string($image) || !preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $image, $parts)) {
    fail(422, 'Choose a photo (JPG, PNG or WebP).');
  }
  $bytes = base64_decode($parts[2], true);
  if ($bytes === false || strlen($bytes) > 1536 * 1024) fail(422, 'That photo is too large. Choose a smaller one.');

  $type = (new finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
  $size = @getimagesizefromstring($bytes);
  if (!in_array($type, ['image/jpeg', 'image/png', 'image/webp'], true) || !$size || $size[0] > 6000 || $size[1] > 6000) {
    fail(422, 'That file isn’t a photo we can use. Try a JPG or PNG.');
  }
  if (!function_exists('imagecreatefromstring')) {
    fail(500, 'Photo uploads need PHP’s GD extension. In WAMP, turn on PHP > PHP extensions > gd.');
  }
  $source = @imagecreatefromstring($bytes);
  if (!$source) fail(422, 'That photo couldn’t be read. Try another one.');

  // Center-crop to a square and scale down to 256 × 256.
  $side = min(imagesx($source), imagesy($source));
  $avatar = imagecreatetruecolor(AVATAR_SIZE, AVATAR_SIZE);
  imagefill($avatar, 0, 0, imagecolorallocate($avatar, 255, 255, 255));
  imagecopyresampled($avatar, $source, 0, 0, intdiv(imagesx($source) - $side, 2), intdiv(imagesy($source) - $side, 2), AVATAR_SIZE, AVATAR_SIZE, $side, $side);

  if (!is_dir(AVATAR_DIR) && !mkdir(AVATAR_DIR, 0775, true)) fail(500, 'The uploads folder can’t be written to.');
  $file = bin2hex(random_bytes(16)) . '.jpg';
  if (!imagejpeg($avatar, AVATAR_DIR . '/' . $file, 85)) fail(500, 'The photo couldn’t be saved.');
  imagedestroy($source);
  imagedestroy($avatar);

  remove_avatar_file($user['avatar_path']);
  db()->prepare('UPDATE users SET avatar_path = ?, updated_by = user_id WHERE user_id = ?')->execute(['uploads/avatars/' . $file, $user['user_id']]);
  ok(['user' => public_user(load_account($user['user_id']))]);
}

// DELETE /me/avatar
function route_delete_avatar()
{
  $user = require_user();
  remove_avatar_file($user['avatar_path']);
  db()->prepare('UPDATE users SET avatar_path = NULL, updated_by = user_id WHERE user_id = ?')->execute([$user['user_id']]);
  ok(['user' => public_user(load_account($user['user_id']))]);
}

function remove_avatar_file($path)
{
  // Only files this API saved: uploads/avatars/<hex>.jpg
  if ($path && preg_match('#^uploads/avatars/[a-f0-9]{32}\.jpg$#', $path) && is_file(AVATAR_DIR . '/' . basename($path))) {
    unlink(AVATAR_DIR . '/' . basename($path));
  }
}

// POST /me/password { current, next }: signs out other devices, keeps this one.
function route_change_password()
{
  $user = require_user();
  $current = body()['current'] ?? '';
  $next = body()['next'] ?? '';
  if (!is_string($current) || !password_verify($current, $user['password_hash'])) {
    fail(422, 'Your current password is incorrect.', ['current' => 'Your current password is incorrect.']);
  }
  if (!is_string($next) || ($problems = password_problems($next))) {
    fail(422, 'Your new password needs ' . implode(', ', $problems ?? ['8 or more characters']) . '.');
  }
  if (password_verify($next, $user['password_hash'])) fail(422, 'Choose a password you haven’t been using.');

  db()->prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_by = user_id WHERE user_id = ?')
    ->execute([password_hash($next, PASSWORD_DEFAULT), $user['user_id']]);
  // Other devices are signed out; this one stays signed in.
  $remembered = isset($_COOKIE[REMEMBER_COOKIE]);
  forget_remember_cookie(true, $user['user_id']);
  if ($remembered) issue_remember_cookie($user['user_id']);
  session_regenerate_id(true);
  $_SESSION['password'] = password_fingerprint(load_account($user['user_id']));
  audit('profile.password_changed', 'user', $user['user_id'], trim($user['first_name'] . ' ' . $user['last_name']));
  ok(null);
}
