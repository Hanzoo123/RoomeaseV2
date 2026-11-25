<?php
// The signed-in person's own profile, photo and password.

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
// here it is checked, re-drawn and saved as a 256 × 256 JPEG.
function route_upload_avatar()
{
  $user = require_user();
  $source = decode_photo(body()['image'] ?? '');
  // Center-crop to a square and scale down to 256 × 256.
  $side = min(imagesx($source), imagesy($source));
  $avatar = redraw_photo($source, AVATAR_SIZE, AVATAR_SIZE, intdiv(imagesx($source) - $side, 2), intdiv(imagesy($source) - $side, 2), $side, $side);
  $path = save_photo($avatar, 'avatars');
  imagedestroy($source);
  imagedestroy($avatar);

  remove_photo($user['avatar_path'], 'avatars');
  db()->prepare('UPDATE users SET avatar_path = ?, updated_by = user_id WHERE user_id = ?')->execute([$path, $user['user_id']]);
  ok(['user' => public_user(load_account($user['user_id']))]);
}

// DELETE /me/avatar
function route_delete_avatar()
{
  $user = require_user();
  remove_photo($user['avatar_path'], 'avatars');
  db()->prepare('UPDATE users SET avatar_path = NULL, updated_by = user_id WHERE user_id = ?')->execute([$user['user_id']]);
  ok(['user' => public_user(load_account($user['user_id']))]);
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
