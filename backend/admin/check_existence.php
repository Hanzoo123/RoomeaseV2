<?php
// Used by the Add User form to say right away if a username or email is taken.
require_once 'includes/bootstrap.php';

// Only a signed-in super admin may ask, so this can't be used to probe for accounts.
if (!isset($_SESSION['user_id']) || !is_super_admin() || !csrf_ok()) {
  http_response_code(403);
  echo json_encode(['exists' => false]);
  exit;
}

if (isset($_POST['field']) && isset($_POST['value'])) {
  $field = $_POST['field'];
  $value = trim($_POST['value']);

  if (!in_array($field, ['username', 'email'])) {
    echo json_encode(['exists'=> false]);
    exit;
  }

  $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE $field = :value");
  $stmt->execute(['value' => $value]);
  $count = $stmt->fetchColumn();

  echo json_encode(['exists' => ($count > 0)]);
}
?>
