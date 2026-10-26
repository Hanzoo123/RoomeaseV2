<?php
require_once __DIR__ . '/../includes/reason_modal.php';
require_once __DIR__ . '/../includes/account_actions.php';

$filters = [
  'all' => ['All', "u.role IN ('boarder', 'landlord')"],
  'boarder' => ['Boarders', "u.role = 'boarder'"],
  'landlord' => ['Landlords', "u.role = 'landlord'"],
  'inactive' => ['Deactivated', "u.role IN ('boarder', 'landlord') AND u.is_active = 0"],
];
$filter = isset($filters[$_GET['filter'] ?? '']) ? $_GET['filter'] : 'all';
$tabCounts = $pdo->query("SELECT COUNT(*) AS `all`, SUM(role = 'boarder') AS boarder, SUM(role = 'landlord') AS landlord, SUM(is_active = 0) AS inactive
  FROM users WHERE role IN ('boarder', 'landlord') AND deleted_at IS NULL")->fetch();

$accounts = $pdo->query("SELECT u.*,
    (SELECT COUNT(*) FROM boarding_houses b WHERE b.landlord_id = u.user_id) AS listings,
    (SELECT COUNT(*) FROM reservations r WHERE r.boarder_id = u.user_id) AS requests
  FROM users u
  WHERE {$filters[$filter][1]} AND u.deleted_at IS NULL
  ORDER BY u.created_at DESC")->fetchAll();
?>
  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">
        <h1 class="m-0">Boarders &amp; Landlords</h1>
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
                <h3 class="card-title">User Directory</h3>
              </div>
              <div class="card-header p-2">
                <ul class="nav nav-pills">
                  <?php foreach ($filters as $key => [$label]): ?>
                  <li class="nav-item">
                    <a class="nav-link <?php echo $key === $filter ? 'active bg-olive' : ''; ?>" href="dashboard.php?page=accounts&filter=<?php echo $key; ?>">
                      <?php echo e($label); ?> <span class="badge badge-light"><?php echo (int) $tabCounts[$key]; ?></span>
                    </a>
                  </li>
                  <?php endforeach; ?>
                </ul>
              </div>
              <!-- /.card-header -->
              <div class="card-body">
                <table id="example1" class="table table-bordered table-striped">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Activity</th>
                    <th>Status</th>
                    <th class="no-export">Action</th>
                  </tr>
                  </thead>
                  <tbody>
                    <?php foreach ($accounts as $b):?>
                  <tr>
                    <td><?php echo htmlspecialchars($b['first_name'].' '.$b['last_name']);?></td>
                    <td><?php echo htmlspecialchars($b['email']);?></td>
                    <td><?php echo e($b['phone_number'] ?: '—');?></td>
                    <td class="text-capitalize"><?php echo htmlspecialchars($b['role']);?></td>
                    <td data-order="<?php echo e($b['created_at']); ?>"><?php echo e(nice_date($b['created_at'])); ?></td>
                    <td><?php echo $b['role'] === 'landlord' ? (int) $b['listings'] . ' listings' : (int) $b['requests'] . ' requests'; ?></td>
                    <td>
                      <?php if($b['is_active']):?>
                        <span class="badge badge-success">Active</span>
                      <?php else:?>
                        <span class="badge badge-danger">Inactive</span>
                      <?php endif;?>
                    </td>
                    <td class="text-nowrap">
                      <a class="btn bg-olive btn-sm mb-1" href="dashboard.php?page=view_account&id=<?php echo $b['user_id'];?>"><i
                        class="fas fa-eye"></i> View</a>
                      <?php echo account_buttons($b); ?>
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
<?php account_reason_modal(); ?>
