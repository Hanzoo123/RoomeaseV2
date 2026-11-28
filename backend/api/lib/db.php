<?php
// The same MySQL database as the admin panel (settings in backend/config/database.php).
require __DIR__ . '/../../config/database.php';

try {
  $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  $pdo->exec("SET time_zone = '+08:00'");
} catch (PDOException $e) {
  error_log('RoomEase API: ' . $e->getMessage());
  fail(503, 'The database is not reachable. Is WAMP running, and was database/roomease.sql imported?');
}

function db()
{
  global $pdo;
  return $pdo;
}

// Records who did what, for the super admin's Activity Log. IP and browser are kept for
// sign-ins only (as in the admin panel).
function audit($action, $targetType, $targetId, $targetLabel, $detail = null, $actor = null)
{
  $actor = $actor ?? current_user();
  $isSignIn = strpos($action, 'auth.') === 0;
  db()->prepare('INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, target_label, detail, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([
      $actor['user_id'] ?? null,
      $actor['role'] ?? null,
      $action,
      $targetType,
      $targetId,
      mb_substr((string) $targetLabel, 0, 200),
      $detail !== null ? mb_substr((string) $detail, 0, 500) : null,
      $isSignIn ? client_ip() : null,
      $isSignIn ? mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 120) : null,
    ]);
}

// A notification about reservations (a new request, an answer, a cancellation): only for
// people with Settings > Notifications > "Reservation updates" on. Call it outside a
// transaction (reading the settings can create their table, which ends a transaction).
function notify_about_reservation($userId, $title, $body, $link)
{
  if (user_preferences(db(), $userId)['reservation_alerts']) notify($userId, $title, $body, $link);
}

// A notification for one person. The React app shows them from phase 5; the admin panel
// writes them the same way (backend/admin/includes/functions.php).
function notify($userId, $title, $body, $link = null)
{
  db()->prepare('INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)')
    ->execute([$userId, mb_substr($title, 0, 150), mb_substr($body, 0, 500), $link]);
}
