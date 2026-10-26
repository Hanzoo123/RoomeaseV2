<?php
require_once 'includes/bootstrap.php';
if (isset($_SESSION['user_id'])) {
  audit($pdo, 'auth.logout', 'user', current_admin_id(), trim(($_SESSION['firstname'] ?? '') . ' ' . ($_SESSION['lastname'] ?? '')));
}
session_unset();
session_destroy();
header("Location: index.php");
exit;
?>
