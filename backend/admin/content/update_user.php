<?php
// Change an admin's role, status or password (super admins only). Same form as the template's Update User.
if (!isset ($_SESSION['user_id']) || !is_super_admin()) {
  header("location: dashboard.php?page=forbidden");
  exit;
}

$toast_message='';
$toast_type='';

if (!isset($_GET['id']) || empty ($_GET['id'])) {
  header ("Location: dashboard.php?page=view_users");
  exit;
}

$target_user_id = (int) $_GET['id'];

$stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = :id AND role IN ('super_admin', 'administrator') AND deleted_at IS NULL LIMIT 1");
$stmt->execute(['id' => $target_user_id]);
$target_user = $stmt->fetch(PDO:: FETCH_ASSOC);

if (!$target_user) {
  go('404');
}
$is_me = $target_user_id === current_admin_id();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $role   = $_POST['role'] ?? '';
  $status = $_POST['status'] ?? '';
  $password = $_POST['password'] ?? '';
  $updated_by = $_SESSION['user_id'];

  // There must always be at least one active super admin left.
  $otherSupers = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'super_admin' AND is_active = 1 AND deleted_at IS NULL AND user_id <> ?");
  $otherSupers->execute([$target_user_id]);
  $losesSuper = $target_user['role'] === 'super_admin' && ($role !== 'super_admin' || $status !== 'active');

  if (!csrf_ok()) {
    $toast_message = "Your session expired. Please try again.";
    $toast_type = "error";
  } elseif (!in_array($role, ADMIN_ROLES, true) || !in_array($status, ['active', 'inactive'], true)) {
    $toast_message = "Choose a role and a status.";
    $toast_type = "error";
  } elseif ($is_me && ($role !== $target_user['role'] || $status !== 'active')) {
    $toast_message = "You can't change your own role or deactivate yourself. Ask another super admin.";
    $toast_type = "error";
  } elseif ($losesSuper && $otherSupers->fetchColumn() == 0) {
    $toast_message = "This is the last active super admin. Make someone else a super admin first.";
    $toast_type = "error";
  } elseif ($password !== '' && ($problems = password_problems($password))) {
    $toast_message = "The new password needs " . implode(', ', $problems) . ".";
    $toast_type = "error";
  } else {
  try {

    if ($password !== '') {

      $hashed_password = password_hash($password, PASSWORD_DEFAULT);

      // A password set by someone else is temporary: they pick their own at next sign-in.
      $update = $pdo->prepare("
        UPDATE users
          SET role = :role, is_active = :status, password_hash = :password, must_change_password = :must_change, updated_by = :updated_by WHERE user_id = :id");

      $update->execute ([
        'role' => $role,
        'status' => $status === 'active' ? 1 : 0,
        'password' => $hashed_password,
        'must_change' => $is_me ? 0 : 1,
        'updated_by' => $updated_by,
        'id' => $target_user_id
      ]);
      audit($pdo, 'admin.password_reset', 'user', $target_user_id, full_name($target_user));
    } else {
      $update = $pdo->prepare("
        UPDATE users
          SET role = :role, is_active = :status, updated_by = :updated_by WHERE user_id = :id");

      $update->execute ([
        'role' => $role,
        'status' => $status === 'active' ? 1 : 0,
        'updated_by' => $updated_by,
        'id' => $target_user_id
      ]);
    }
    if ($role !== $target_user['role'] || ($status === 'active') !== (bool) $target_user['is_active']) {
      audit($pdo, 'admin.updated', 'user', $target_user_id, full_name($target_user), role_label($role) . ', ' . $status);
    }

    $toast_message = "User updated successfully!";
    $toast_type = "success";

    $stmt->execute(['id' => $target_user_id]);
    $target_user = $stmt->fetch(PDO:: FETCH_ASSOC);
    } catch (Exception $e) {
      $toast_message = "Database Error: ". $e->getMessage();
      $toast_type = "error";
    }
  }
}
?>

<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <div class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
        </div>
      </div>
    </div>
  </div>
  <!-- Main content -->
  <div class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          <div class="card card-olive">
            <div class="card-header">
              <h3 class="card-title">Update User Access</h3>
            </div>
            <form action="" method="post">
              <?php echo csrf_field(); ?>
              <div class="card-body">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" class="form-control form-control-sm" value="<?php echo htmlspecialchars(trim($target_user['first_name'] . ' ' . ($target_user['middle_name'] ?? '') . ' ' . $target_user['last_name'])); ?>" disabled>
                </div>

                <div class="row">
                  <div class="col-md-6 form-group">
                    <label>Username</label>
                    <input type="text" class="form-control form-control-sm" value="<?php echo htmlspecialchars($target_user['username'] ?? ''); ?>" disabled>
                  </div>
                  <div class="col-md-6 form-group">
                    <label>Email</label>
                    <input type="text" class="form-control form-control-sm" value="<?php echo htmlspecialchars($target_user['email'] ?? ''); ?>" disabled>
                  </div>
                </div>

                <hr>
                <!-- Editable Fields -->
                <div class="row">
                  <div class="col-md-6 form-group">
                    <label for="role">Role <span class="text-danger">*</span></label>
                    <select class="form-control form-control-sm" name="role" id="role" required <?php echo $is_me ? 'disabled' : ''; ?>>
                      <option value="administrator" <?php echo ($target_user['role'] === 'administrator') ? 'selected' : ''; ?>>Admin</option>
                      <option value="super_admin" <?php echo ($target_user['role'] === 'super_admin') ? 'selected' : ''; ?>>Super Admin</option>
                    </select>
                    <?php if ($is_me): ?><input type="hidden" name="role" value="<?php echo e($target_user['role']); ?>"><?php endif; ?>
                  </div>
                  <div class="col-md-6 form-group">
                    <label for="status">Status <span class="text-danger">*</span></label>
                    <select class="form-control form-control-sm" name="status" id="status" required <?php echo $is_me ? 'disabled' : ''; ?>>
                      <option value="active" <?php echo $target_user['is_active'] ? 'selected' : ''; ?>>Active</option>
                      <option value="inactive" <?php echo !$target_user['is_active'] ? 'selected' : ''; ?>>Inactive</option>
                    </select>
                    <?php if ($is_me): ?><input type="hidden" name="status" value="active"><?php endif; ?>
                  </div>
                </div>
                <?php if ($is_me): ?><small class="text-muted d-block mb-3">You can't change your own role or status.</small><?php endif; ?>

                <div class="form-group">
                  <label for="password">New Password</label>
                  <input type="password" class="form-control form-control-sm" id="password" name="password" placeholder="Leave blank to keep current password" minlength="8">
                  <small class="text-muted">Only fill this out if you need to reset the user's password. They will be asked to choose their own at the next sign-in.</small>
                </div>

              </div>

              <div class="card-footer">
                <button type="submit" class="btn bg-olive">Save Changes</button>
                <a href="dashboard.php?page=view_users" class="btn bg-warning float-right">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
