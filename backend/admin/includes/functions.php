<?php
// Small helpers shared by the admin pages.

const ADMIN_ROLES = ['super_admin', 'administrator'];
const ROLE_LABELS = ['super_admin' => 'Super Admin', 'administrator' => 'Admin', 'landlord' => 'Landlord', 'boarder' => 'Boarder'];

function e($value)
{
  return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function is_super_admin()
{
  return ($_SESSION['role'] ?? '') === 'super_admin';
}

function current_admin_id()
{
  return (int) ($_SESSION['user_id'] ?? 0);
}

function role_label($role)
{
  return ROLE_LABELS[$role] ?? ucfirst((string) $role);
}

function full_name($row)
{
  return trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
}

function peso($amount)
{
  return '₱' . number_format((float) $amount, 0);
}

function client_ip()
{
  return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45);
}

// ---------- CSRF: every form that changes something carries this token ----------

function csrf_token()
{
  if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf_token'];
}

function csrf_field()
{
  return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function csrf_ok()
{
  return isset($_POST['csrf_token']) && hash_equals(csrf_token(), (string) $_POST['csrf_token']);
}

// ---------- Toasts that survive a redirect (Post/Redirect/Get) ----------

function flash($message, $type = 'success')
{
  $_SESSION['flash'] = ['message' => $message, 'type' => $type];
}

function take_flash()
{
  $flash = $_SESSION['flash'] ?? null;
  unset($_SESSION['flash']);
  return $flash;
}

// Redirects to another admin page. dashboard.php buffers output, so this works mid-page.
function go($page, $params = [])
{
  header('Location: dashboard.php?' . http_build_query(['page' => $page] + $params));
  exit;
}

// ---------- Activity log and notifications ----------

// Records who did what. IP and browser are kept for sign-ins only (as in the PHP version).
function audit($pdo, $action, $targetType, $targetId, $targetLabel, $detail = null)
{
  $isSignIn = strpos($action, 'auth.') === 0;
  $stmt = $pdo->prepare('INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, target_label, detail, ip_address, user_agent)
    VALUES (:actor_id, :actor_role, :action, :target_type, :target_id, :target_label, :detail, :ip, :ua)');
  $stmt->execute([
    'actor_id' => current_admin_id() ?: null,
    'actor_role' => $_SESSION['role'] ?? null,
    'action' => $action,
    'target_type' => $targetType,
    'target_id' => $targetId,
    'target_label' => mb_substr((string) $targetLabel, 0, 200),
    'detail' => $detail !== null ? mb_substr((string) $detail, 0, 500) : null,
    'ip' => $isSignIn ? client_ip() : null,
    'ua' => $isSignIn ? mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 120) : null,
  ]);
}

// A notification the landlord or boarder sees in the React app.
function notify($pdo, $userId, $title, $body, $link = null)
{
  $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)');
  $stmt->execute([$userId, $title, $body, $link]);
}

// ---------- Display helpers ----------

// The same four states the React app shows landlords.
function listing_status($listing)
{
  if (!empty($listing['deleted_at'])) return ['key' => 'removed', 'label' => 'Removed', 'badge' => 'badge-dark'];
  if ($listing['moderation_status'] === 'approved') return ['key' => 'live', 'label' => 'Live', 'badge' => 'badge-success'];
  if ($listing['moderation_status'] === 'rejected') return ['key' => 'changes', 'label' => 'Needs changes', 'badge' => 'badge-danger'];
  return ['key' => 'review', 'label' => 'In review', 'badge' => 'badge-warning'];
}

function time_ago($datetime)
{
  if (!$datetime) return '—';
  $seconds = time() - strtotime($datetime);
  if ($seconds < 60) return 'just now';
  if ($seconds < 3600) return floor($seconds / 60) . ' min ago';
  if ($seconds < 86400) return floor($seconds / 3600) . ' hr ago';
  if ($seconds < 7 * 86400) {
    $days = floor($seconds / 86400);
    return $days == 1 ? 'yesterday' : "$days days ago";
  }
  return date('M j, Y', strtotime($datetime));
}

function nice_date($datetime, $withTime = false)
{
  if (!$datetime) return '—';
  return date($withTime ? 'M j, Y g:i A' : 'M j, Y', strtotime($datetime));
}

// Same rules as the React app and the PHP version.
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

// Sidebar badges: listings waiting for review and unread contact messages.
function sidebar_counts($pdo)
{
  return [
    'review' => (int) $pdo->query("SELECT COUNT(*) FROM boarding_houses WHERE moderation_status = 'pending' AND deleted_at IS NULL")->fetchColumn(),
    'inbox' => (int) $pdo->query('SELECT COUNT(*) FROM contact_messages WHERE is_read = 0')->fetchColumn(),
  ];
}

// The page the current request came from, limited to admin pages (used to return after a POST).
function return_to($fallbackPage)
{
  $target = $_POST['return'] ?? '';
  parse_str((string) parse_url($target, PHP_URL_QUERY), $query);
  $page = $query['page'] ?? '';
  if (!preg_match('/^[a-z_]+$/', $page)) return ['page' => $fallbackPage, 'params' => []];
  unset($query['page']);
  return ['page' => $page, 'params' => $query];
}
