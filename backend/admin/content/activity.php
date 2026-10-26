<?php
// Who did what, and when (super admins only).
require_once __DIR__ . '/../includes/activity_labels.php';

$group = isset(ACTIVITY_GROUPS[$_GET['group'] ?? '']) ? $_GET['group'] : '';
$actions = array_keys(array_filter(ACTIVITY_LABELS, function ($label) use ($group) {
  return $label[3] === $group;
}));
$where = $group ? 'WHERE a.action IN (' . implode(',', array_fill(0, count($actions), '?')) . ')' : '';
$stmt = $pdo->prepare("SELECT a.*, u.first_name, u.last_name FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_id
  $where ORDER BY a.created_at DESC, a.log_id DESC LIMIT 1000");
$stmt->execute($group ? $actions : []);
$entries = $stmt->fetchAll();
?>
  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">
        <h1 class="m-0">Activity Log</h1>
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
                <h3 class="card-title">Approvals, removals, account changes and sign-ins</h3>
              </div>
              <div class="card-header p-2">
                <ul class="nav nav-pills">
                  <li class="nav-item"><a class="nav-link <?php echo $group === '' ? 'active bg-olive' : ''; ?>" href="dashboard.php?page=activity">Everything</a></li>
                  <?php foreach (ACTIVITY_GROUPS as $key => $label): ?>
                  <li class="nav-item"><a class="nav-link <?php echo $group === $key ? 'active bg-olive' : ''; ?>" href="dashboard.php?page=activity&group=<?php echo $key; ?>"><?php echo e($label); ?></a></li>
                  <?php endforeach; ?>
                </ul>
              </div>
              <div class="card-body">
                <table id="example1" class="table table-bordered table-striped">
                  <thead>
                  <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Detail</th>
                    <th>IP address</th>
                  </tr>
                  </thead>
                  <tbody>
                  <?php foreach ($entries as $row): $info = activity_info($row['action']); ?>
                  <tr>
                    <td data-order="<?php echo e($row['created_at']); ?>"><?php echo e(nice_date($row['created_at'], true)); ?></td>
                    <td><?php echo e($row['first_name'] ? full_name($row) : 'System'); ?></td>
                    <td><?php echo e($row['actor_role'] ? role_label($row['actor_role']) : '—'); ?></td>
                    <td><i class="<?php echo e($info['icon']); ?> text-<?php echo e($info['tone']); ?>"></i> <?php echo e($info['text']); ?></td>
                    <td><?php echo activity_target_link($row); ?></td>
                    <td><?php echo e($row['detail'] ?? ''); ?></td>
                    <td><?php echo e($row['ip_address'] ?? ''); ?></td>
                  </tr>
                  <?php endforeach; ?>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
