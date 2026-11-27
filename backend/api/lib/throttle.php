<?php
// Limits on repeated tries (sign-in, sign-up, password reset, the Contact form), counted in
// login_attempts per account (or email) and per IP address.

const LIMITS = [
  // kind => [per account, per IP, minutes]
  'login' => [5, 20, 15],
  'register' => [null, 10, 60],
  'reset' => [3, 10, 15],
  'reset_code' => [5, 20, 15],
  'contact' => [3, 10, 60],
];

// Seconds until another try is allowed, or 0.
function throttled($kind, $identifier)
{
  [$perAccount, $perIp, $minutes] = LIMITS[$kind];
  $stmt = db()->prepare("SELECT SUM(identifier = :identifier) AS by_account, SUM(ip_address = :ip) AS by_ip,
      MIN(attempted_at) AS oldest
    FROM login_attempts WHERE kind = :kind AND attempted_at > NOW() - INTERVAL $minutes MINUTE");
  $stmt->execute(['identifier' => mb_strtolower($identifier), 'ip' => client_ip(), 'kind' => $kind]);
  $row = $stmt->fetch();
  $over = ($perAccount && $row['by_account'] >= $perAccount) || ($perIp && $row['by_ip'] >= $perIp);
  return $over ? $minutes * 60 : 0;
}

function record_try($kind, $identifier, $userId = null)
{
  db()->prepare('INSERT INTO login_attempts (kind, identifier, user_id, ip_address) VALUES (?, ?, ?, ?)')
    ->execute([$kind, mb_substr(mb_strtolower($identifier), 0, 190), $userId, client_ip()]);
}

function clear_tries($kind, $identifier)
{
  db()->prepare('DELETE FROM login_attempts WHERE kind = ? AND identifier = ?')->execute([$kind, mb_strtolower($identifier)]);
}

function fail_throttled($kind, $identifier, $message = 'Too many tries. Please wait %d minutes and try again.')
{
  $seconds = throttled($kind, $identifier);
  if ($seconds) fail(429, sprintf($message, ceil($seconds / 60)));
}
