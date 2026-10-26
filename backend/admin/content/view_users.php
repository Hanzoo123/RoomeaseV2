<?php
// Admin accounts (super admins only). Same page as the template's View Users.
try {
  $stmt = $pdo->query("SELECT user_id, username, email, first_name, last_name, role, is_active, last_login_at FROM users
    WHERE role IN ('super_admin', 'administrator') AND deleted_at IS NULL ORDER BY created_at DESC");
  $users = $stmt->fetchALL(PDO::FETCH_ASSOC);
  } catch (PDOException $e) {
    die("Database Error: " .$e->getMessage());
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
          <div class="col-lg-12">

<div class="card">
              <div class="card-header bg-olive">
                <h3 class="card-title">Admin Accounts</h3>
                <div class="card-tools">
                  <a href="dashboard.php?page=add_user" class="btn btn-tool text-white"><i class="fas fa-user-plus"></i> Add Admin</a>
                </div>
              </div>
              <!-- /.card-header -->
              <div class="card-body">
                <table id="example1" class="table table-bordered table-striped">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last sign-in</th>
                    <th>Status</th>
                    <th class="no-export">Action</th>
                  </tr>
                  </thead>
                  <tbody>
                    <?php foreach ($users as $b):?>
                  <tr>
                    <td><?php echo htmlspecialchars($b['first_name'].' '.$b['last_name']);?><?php echo $b['user_id'] == current_admin_id() ? ' <small class="text-muted">(you)</small>' : ''; ?></td>
                    <td><?php echo htmlspecialchars($b['username'] ?? '');?></td>
                    <td><?php echo htmlspecialchars($b['email'] ?? '');?></td>
                    <td><?php echo e(role_label($b['role']));?></td>
                    <td data-order="<?php echo e($b['last_login_at']); ?>"><?php echo e(time_ago($b['last_login_at'])); ?></td>
                    <td>
                      <?php if($b['is_active']):?>
                        <span class="badge badge-success">Active</span>
                      <?php else:?>
                        <span class="badge badge-danger">Inactive</span>
                      <?php endif;?>
                    </td>
                    <td>
                      <a class="btn bg-olive btn-sm" href="dashboard.php?page=update_user&id=<?php echo $b['user_id'];?>"><i
                        class="fas fa-edit"></i> Edit</a>
                    </td>
                  </tr>
                  <?php endforeach;?>
                  </tbody>
                </table>
              </div>
              <!-- /.card-body -->
            </div>
            <!-- /.card -->
          </div>
          <!-- /.col-md-6 -->
        </div>
        <!-- /.row -->
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
