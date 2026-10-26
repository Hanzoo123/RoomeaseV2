<?php
require_once 'includes/bootstrap.php';
$error = '';

if (isset($_SESSION['user_id'])) {
  header("Location: dashboard.php?page=dashboard");
  exit;
}

// Same limits as the PHP version: 5 wrong tries per account, 20 per address, in 15 minutes.
const MAX_TRIES_PER_ACCOUNT = 5;
const MAX_TRIES_PER_IP = 20;
const TRY_WINDOW_MINUTES = 15;

function too_many_tries($pdo, $identifier)
{
  $stmt = $pdo->prepare("SELECT
      SUM(identifier = :identifier) AS by_account,
      SUM(ip_address = :ip) AS by_ip
    FROM login_attempts
    WHERE kind = 'admin_login' AND attempted_at > NOW() - INTERVAL " . TRY_WINDOW_MINUTES . " MINUTE");
  $stmt->execute(['identifier' => $identifier, 'ip' => client_ip()]);
  $counts = $stmt->fetch();
  return $counts['by_account'] >= MAX_TRIES_PER_ACCOUNT || $counts['by_ip'] >= MAX_TRIES_PER_IP;
}

function record_failed_try($pdo, $identifier, $userId)
{
  $stmt = $pdo->prepare("INSERT INTO login_attempts (kind, identifier, user_id, ip_address) VALUES ('admin_login', ?, ?, ?)");
  $stmt->execute([$identifier, $userId, client_ip()]);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $login_id = trim($_POST['login_id'] ?? '');
    $password = $_POST['password'] ?? '';
    $identifier = mb_strtolower($login_id);

    if (empty($login_id) || empty($password)) {
        $error = "Please enter both username/email and password.";
    } elseif (!csrf_ok()) {
        $error = "Your session expired. Please try again.";
    } elseif (too_many_tries($pdo, $identifier)) {
        $error = "Too many wrong tries. Please wait " . TRY_WINDOW_MINUTES . " minutes and try again.";
    } else {
        // Username or email, active and not removed. Only admins and super admins sign in here.
        $stmt = $pdo->prepare("SELECT * FROM users WHERE (username = :username OR email = :email) AND is_active = 1 AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([':username' => $login_id, ':email' => $login_id]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            if (!in_array($user['role'], ADMIN_ROLES, true)) {
                $error = "This sign-in is for admins and super admins. Landlords and boarders sign in on the RoomEase website.";
            } else {
                // New session id on sign-in, so an old one can't be reused.
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['user_id'];
                $_SESSION['username'] = $user['username'] ?? $user['email'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['firstname'] = $user['first_name'];
                $_SESSION['lastname'] = $user['last_name'];
                $_SESSION['must_change_password'] = (bool) $user['must_change_password'];

                $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE user_id = ?")->execute([$user['user_id']]);
                $pdo->prepare("DELETE FROM login_attempts WHERE kind = 'admin_login' AND identifier = ?")->execute([$identifier]);
                audit($pdo, 'auth.login', 'user', $user['user_id'], full_name($user));

                // Redirect to dashboard
                header("Location: dashboard.php?page=dashboard");
                exit();
            }
        } else {
            record_failed_try($pdo, $identifier, $user['user_id'] ?? null);
            $error = "Username or password is incorrect";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RoomEase Admin | Log in</title>

  <!-- Google Font: Source Sans Pro -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
  <!-- Font Awesome -->
  <link rel="stylesheet" href="plugins/fontawesome-free/css/all.min.css">
  <!-- icheck bootstrap -->
  <link rel="stylesheet" href="plugins/icheck-bootstrap/icheck-bootstrap.min.css">
  <!-- Theme style -->
  <link rel="stylesheet" href="dist/css/adminlte.min.css">
  <!-- Toastr CSS -->
  <link rel="stylesheet" href="plugins/toastr/toastr.min.css">
</head>
<body class="hold-transition login-page">
<div class="login-box">
  <div class="login-logo">
    <a href="index.php"><b>Room</b>Ease</a>
  </div>
  <!-- /.login-logo -->
  <div class="card">
    <div class="card-body login-card-body">
      <p class="login-box-msg">Sign in to start your session</p>

      <form action="" method="post">
        <?php echo csrf_field(); ?>
        <div class="input-group mb-3">
          <input type="text" name="login_id" class="form-control" placeholder="Username or Email" required autocomplete="username"
                 value="<?php echo isset($_POST['login_id']) ? htmlspecialchars($_POST['login_id']) : ''; ?>">
          <div class="input-group-append">
            <div class="input-group-text">
              <span class="fas fa-user"></span>
            </div>
          </div>
        </div>
        <div class="input-group mb-3">
          <input type="password" name="password" class="form-control" placeholder="Password" required autocomplete="current-password">
          <div class="input-group-append">
            <div class="input-group-text">
              <span class="fas fa-lock"></span>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <button type="submit" class="btn bg-olive btn-block">Sign In</button>
          </div>
          <!-- /.col -->
        </div>
      </form>
      <p class="mb-0 mt-3 text-center text-muted small">For admins and super admins only.</p>
    </div>
    <!-- /.login-card-body -->
  </div>
</div>
<!-- /.login-box -->

<!-- jQuery -->
<script src="plugins/jquery/jquery.min.js"></script>
<!-- Bootstrap 4 -->
<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<!-- AdminLTE App -->
<script src="dist/js/adminlte.min.js"></script>
<!-- Toastr JS -->
<script src="plugins/toastr/toastr.min.js"></script>

<!-- Toastr Error Display -->
<?php if (!empty($error)): ?>
<script>
  $(document).ready(function() {
      toastr.options = {
          "closeButton": true,
          "progressBar": true,
          "positionClass": "toast-top-center",
          "timeOut": "5000"
      };
      toastr.error(<?php echo json_encode($error); ?>);
  });
</script>
<?php endif; ?>

</body>
</html>
