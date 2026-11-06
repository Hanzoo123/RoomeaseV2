<?php
// Input rules shared by the admin panel and the API. Same rules as the React app
// (src/data/validation.js) and the PHP version.

// The password rules a password misses, as words for a message ("a number", …).
function password_problems($password)
{
  $problems = [];
  if (mb_strlen($password) < 8) $problems[] = '8 or more characters';
  if (!preg_match('/\p{Lu}/u', $password)) $problems[] = 'an uppercase letter';
  if (!preg_match('/\p{Ll}/u', $password)) $problems[] = 'a lowercase letter';
  if (!preg_match('/\d/', $password)) $problems[] = 'a number';
  if (!preg_match('/[^\p{L}\p{N}]/u', $password)) $problems[] = 'a symbol';
  return $problems;
}

// Philippine mobile number: 11 digits starting with 09; spaces and dashes allowed.
// Returns the digits only, or null when it isn't one.
function normalize_ph_mobile($phone)
{
  if (!preg_match('/^[0-9\-\s]+$/', (string) $phone)) return null;
  $digits = preg_replace('/\D/', '', $phone);
  return preg_match('/^09\d{9}$/', $digits) ? $digits : null;
}

function valid_email($email)
{
  return mb_strlen($email) <= 150 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
