<?php
// The signed-in admin's own details and password.
$stmt = $pdo->prepare('SELECT * FROM users WHERE user_id = ?');
$stmt->execute([current_admin_id()]);
$me = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!csrf_ok()) {
    flash('Your session expired. Please try again.', 'error');
    go('profile');
  }

  if (($_POST['form'] ?? '') === 'details') {
    $first = trim($_POST['firstname'] ?? '');
    $middle = trim($_POST['middlename'] ?? '');
    $last = trim($_POST['lastname'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = preg_replace('/[\s-]/', '', $_POST['phone'] ?? '');
    $taken = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ? AND user_id <> ?');
    $taken->execute([$email, current_admin_id()]);

    if ($first === '' || $last === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $toast_message = 'Please fill in your first name, last name and a valid email.';
      $toast_type = 'error';
    } elseif ($phone !== '' && !preg_match('/^09\d{9}$/', $phone)) {
      $toast_message = 'Enter an 11-digit mobile number starting with 09.';
      $toast_type = 'error';
    } elseif ($taken->fetchColumn() > 0) {
      $toast_message = 'Another account already uses that email.';
      $toast_type = 'error';
    } else {
      $pdo->prepare('UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone_number = ?, updated_by = ? WHERE user_id = ?')
        ->execute([$first, $middle !== '' ? $middle : null, $last, $email, $phone !== '' ? $phone : null, current_admin_id(), current_admin_id()]);
      $_SESSION['firstname'] = $first;
      $_SESSION['lastname'] = $last;
      audit($pdo, 'profile.updated', 'user', current_admin_id(), "$first $last");
      flash('Profile updated.');
      go('profile');
    }
  }

  if (($_POST['form'] ?? '') === 'password') {
    $current = $_POST['current_password'] ?? '';
    $new = $_POST['new_password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';
    $problems = password_problems($new);

    if (!password_verify($current, $me['password_hash'])) {
      $toast_message = 'Your current password is incorrect.';
      $toast_type = 'error';
    } elseif ($problems) {
      $toast_message = 'The new password needs ' . implode(', ', $problems) . '.';
      $toast_type = 'error';
    } elseif ($new !== $confirm) {
      $toast_message = "The new passwords don't match.";
      $toast_type = 'error';
    } elseif (password_verify($new, $me['password_hash'])) {
      $toast_message = 'Choose a password different from the current one.';
      $toast_type = 'error';
    } else {
      $pdo->prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_by = ? WHERE user_id = ?')
        ->execute([password_hash($new, PASSWORD_DEFAULT), current_admin_id(), current_admin_id()]);
      // Signs out other "remember me" devices.
      $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([current_admin_id()]);
      $_SESSION['must_change_password'] = false;
      session_regenerate_id(true);
      audit($pdo, 'profile.password_changed', 'user', current_admin_id(), full_name($me));
      flash('Password changed.');
      go('profile');
    }
  }
}
?>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <div class="content-header">
    <div class="container-fluid">
      <h1 class="m-0">My Profile</h1>
    </div>
  </div>
  <!-- Main content -->
  <div class="content">
    <div class="container-fluid">
      <?php if ($_SESSION['must_change_password']): ?>
      <div class="callout callout-warning">
        <h5>Choose your own password</h5>
        <p>Your account was given a temporary password. Set a new one below to continue.</p>
      </div>
      <?php endif; ?>
      <div class="row">
        <div class="col-lg-6">
          <div class="card card-olive">
            <div class="card-header">
              <h3 class="card-title">Personal Information</h3>
            </div>
            <form action="" method="post">
              <?php echo csrf_field(); ?>
              <input type="hidden" name="form" value="details">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 form-group">
                    <label>Username</label>
                    <input type="text" class="form-control form-control-sm" value="<?php echo e($me['username']); ?>" disabled>
                  </div>
                  <div class="col-md-6 form-group">
                    <label>Role</label>
                    <input type="text" class="form-control form-control-sm" value="<?php echo e(role_label($me['role'])); ?>" disabled>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4 form-group">
                    <label for="firstname">First Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="firstname" name="firstname" value="<?php echo e($me['first_name']); ?>" required maxlength="100">
                  </div>
                  <div class="col-md-4 form-group">
                    <label for="middlename">Middle Name</label>
                    <input type="text" class="form-control form-control-sm" id="middlename" name="middlename" value="<?php echo e($me['middle_name']); ?>" maxlength="100">
                  </div>
                  <div class="col-md-4 form-group">
                    <label for="lastname">Last Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="lastname" name="lastname" value="<?php echo e($me['last_name']); ?>" required maxlength="100">
                  </div>
                </div>
                <div class="form-group">
                  <label for="profile-email">Email address <span class="text-danger">*</span></label>
                  <input type="email" class="form-control form-control-sm" id="profile-email" name="email" value="<?php echo e($me['email']); ?>" required maxlength="150">
                </div>
                <div class="form-group mb-0">
                  <label for="phone">Mobile number</label>
                  <input type="tel" class="form-control form-control-sm" id="phone" name="phone" value="<?php echo e($me['phone_number']); ?>" placeholder="09171234567">
                </div>
              </div>
              <div class="card-footer">
                <button type="submit" class="btn bg-olive">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card card-olive">
            <div class="card-header">
              <h3 class="card-title">Change Password</h3>
            </div>
            <form action="" method="post">
              <?php echo csrf_field(); ?>
              <input type="hidden" name="form" value="password">
              <div class="card-body">
                <div class="form-group">
                  <label for="current_password">Current Password <span class="text-danger">*</span></label>
                  <input type="password" class="form-control form-control-sm" id="current_password" name="current_password" required autocomplete="current-password">
                </div>
                <div class="form-group">
                  <label for="new_password">New Password <span class="text-danger">*</span></label>
                  <input type="password" class="form-control form-control-sm" id="new_password" name="new_password" required minlength="8" autocomplete="new-password">
                  <small class="text-muted">8 or more characters with an uppercase letter, a lowercase letter, a number and a symbol.</small>
                </div>
                <div class="form-group mb-0">
                  <label for="confirm_password">Confirm New Password <span class="text-danger">*</span></label>
                  <input type="password" class="form-control form-control-sm" id="confirm_password" name="confirm_password" required autocomplete="new-password">
                </div>
              </div>
              <div class="card-footer">
                <button type="submit" class="btn bg-olive">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
