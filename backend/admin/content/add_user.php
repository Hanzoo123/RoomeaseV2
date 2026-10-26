<?php
// Add an admin or super admin (super admins only). Same form as the template's Add User.
if (!isset ($_SESSION['user_id']) || !is_super_admin()) {
  header("location: dashboard.php?page=forbidden");
  exit;
}

$toast_message='';
$toast_type='';

if ($_SERVER['REQUEST_METHOD']=="POST") {

  $username = trim($_POST['username'] ?? '');
  $email = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';
  $firstname = trim($_POST['firstname'] ?? '');
  $middlename = trim($_POST['middlename'] ?? '');
  $lastname = trim($_POST['lastname'] ?? '');
  $role = $_POST['role'] ?? '';
  $status = $_POST['status'] ?? '';
  $created_by = $_SESSION['user_id'];
  $problems = password_problems($password);

  if (!csrf_ok()) {
    $toast_message = "Your session expired. Please try again.";
    $toast_type = "error";
  } elseif (!preg_match('/^[A-Za-z0-9._-]{3,30}$/', $username)) {
    $toast_message = "Username: 3 to 30 letters, numbers, dots, dashes or underscores.";
    $toast_type = "error";
  } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || $firstname === '' || $lastname === '') {
    $toast_message = "Please fill in a valid email, first name and last name.";
    $toast_type = "error";
  } elseif ($problems) {
    $toast_message = "The password needs " . implode(', ', $problems) . ".";
    $toast_type = "error";
  } elseif (!in_array($role, ADMIN_ROLES, true) || !in_array($status, ['active', 'inactive'], true)) {
    $toast_message = "Choose a role and a status.";
    $toast_type = "error";
  } else {
    $stmt = $pdo->prepare("SELECT count(*) FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);

    if ($stmt->fetchColumn()>0) {
      $toast_message="Error: Username or Email already exist!";
      $toast_type="error";
    } else {
      // Hash password
      $hashed_password = password_hash($password, PASSWORD_DEFAULT);

      // must_change_password: the new admin picks their own password at first sign-in.
      $insert = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name,
          role, is_active, must_change_password, created_by)
        VALUES (:username, :email, :password, :firstname, :middlename, :lastname, :role, :status, 1, :created_by) ");

    try {
      $insert->execute([
        'username' => $username,
        'email' => $email,
        'password' => $hashed_password,
        'firstname' => $firstname,
        'middlename' => $middlename !== '' ? $middlename : null,
        'lastname' => $lastname,
        'role' => $role,
        'status' => $status === 'active' ? 1 : 0,
        'created_by' => $created_by,
      ]);
      audit($pdo, 'admin.created', 'user', (int) $pdo->lastInsertId(), "$firstname $lastname", role_label($role));
      $toast_message = "User added successfully! They will choose a new password at their first sign-in.";
      $toast_type = "success";
      } catch (PDOException $e) {
      $toast_message = "Database Error: ". $e->getMessage();
      $toast_type = "error";
      }
    }
  }
}
?>

  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">

      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content-header -->

    <!-- Main content -->
    <div class="content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-lg-8">
            <div class="card card-olive">
            <div class="card-header">
              <h3 class="card-title">Add New Admin</h3>
            </div>

            <form action="" method="post" id="addUserForm">
              <?php echo csrf_field(); ?>
              <div class="card-body">

                <div class="row">
                  <div class="col-md-6 form-group">
                    <label for="username">Username <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="username" name="username" placeholder="Enter username" required="" maxlength="30">
                    <small id="usernameError" class="text-danger d-none">Username is already taken.</small>
                  </div>

                  <div class="col-md-6 form-group">
                    <label for="email">Email address <span class="text-danger">*</span></label>
                    <input type="email" class="form-control form-control-sm" id="email" name="email" placeholder="Enter email" required="" maxlength="150">
                    <small id="emailError" class="text-danger d-none">Email is already taken.</small>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-4 form-group">
                    <label for="firstname">First Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="firstname" name="firstname" required="" maxlength="100">
                  </div>
                  <div class="col-md-4 form-group">
                    <label for="middlename">Middle Name</label>
                    <input type="text" class="form-control form-control-sm" id="middlename" name="middlename" maxlength="100">
                  </div>
                  <div class="col-md-4 form-group">
                    <label for="lastname">Last Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="lastname" name="lastname" required="" maxlength="100">
                  </div>
                </div>

                <div class="form-group">
                  <label for="password">Temporary Password <span class="text-danger">*</span></label>
                  <input type="password" class="form-control form-control-sm" id="password" name="password" placeholder="Password" required="" minlength="8">
                  <small class="text-muted">8 or more characters with an uppercase letter, a lowercase letter, a number and a symbol. They change it at their first sign-in.</small>
                </div>

                <div class="row">
                  <div class="col-md-6 form-group">
                    <label>Role</label>
                    <select class="form-control form-control-sm" name="role" required="">
                      <option value="administrator">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div class="col-md-6 form-group">
                    <label>Status</label>
                    <select class="form-control form-control-sm" name="status" required="">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

              </div>

              <div class="card-footer">
                <button type="submit" class="btn bg-olive" id="submitBtn">Submit</button>
              </div>
            </form>
          </div>
          </div>
          <!-- /.col-md-6 -->
        </div>
        <!-- /.row -->
      </div><!-- /.container-fluid -->
    </div>
  </div>
  <!-- /.content-wrapper -->
