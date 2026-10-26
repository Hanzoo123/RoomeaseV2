<?php
require_once __DIR__ . '/../includes/listing_actions.php';
require_once __DIR__ . '/../includes/listing_buttons.php';
require_once __DIR__ . '/../includes/reason_modal.php';

$filters = [
  'review' => ['In review', "b.moderation_status = 'pending' AND b.deleted_at IS NULL"],
  'live' => ['Live', "b.moderation_status = 'approved' AND b.deleted_at IS NULL"],
  'changes' => ['Needs changes', "b.moderation_status = 'rejected' AND b.deleted_at IS NULL"],
  'removed' => ['Removed', 'b.deleted_at IS NOT NULL'],
  'all' => ['All', '1 = 1'],
];
$status = isset($filters[$_GET['status'] ?? '']) ? $_GET['status'] : 'review';

$tabCounts = $pdo->query("SELECT
    SUM(moderation_status = 'pending' AND deleted_at IS NULL) AS review,
    SUM(moderation_status = 'approved' AND deleted_at IS NULL) AS live,
    SUM(moderation_status = 'rejected' AND deleted_at IS NULL) AS changes,
    SUM(deleted_at IS NOT NULL) AS removed,
    COUNT(*) AS `all`
  FROM boarding_houses")->fetch();

// The review queue is oldest first; the other lists show the newest first.
$order = $status === 'review' ? 'ASC' : 'DESC';
$listings = $pdo->query("SELECT b.*, u.first_name, u.last_name,
    MIN(r.monthly_rent) AS rent_min, MAX(r.monthly_rent) AS rent_max,
    COUNT(r.room_id) AS rooms_total,
    SUM(r.is_open = 1 AND r.slots_taken < r.capacity) AS rooms_open
  FROM boarding_houses b
  JOIN users u ON u.user_id = b.landlord_id
  LEFT JOIN rooms r ON r.boarding_house_id = b.boarding_house_id
  WHERE {$filters[$status][1]}
  GROUP BY b.boarding_house_id
  ORDER BY COALESCE(b.submitted_at, b.created_at) $order")->fetchAll();
?>
  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">
        <h1 class="m-0">Listings</h1>
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
                <h3 class="card-title"><?php echo e($filters[$status][0]); ?> listings</h3>
              </div>
              <div class="card-header p-2">
                <ul class="nav nav-pills">
                  <?php foreach ($filters as $key => [$label]): ?>
                  <li class="nav-item">
                    <a class="nav-link <?php echo $key === $status ? 'active bg-olive' : ''; ?>" href="dashboard.php?page=listings&status=<?php echo $key; ?>">
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
                    <th>Boarding house</th>
                    <th>Landlord</th>
                    <th>Area</th>
                    <th>Monthly rent</th>
                    <th>Rooms open</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th class="no-export">Action</th>
                  </tr>
                  </thead>
                  <tbody>
                    <?php foreach ($listings as $b): $state = listing_status($b); ?>
                  <tr>
                    <td><a href="dashboard.php?page=view_listing&id=<?php echo (int) $b['boarding_house_id']; ?>"><?php echo e($b['name']); ?></a></td>
                    <td><?php echo e(full_name($b)); ?></td>
                    <td><?php echo e($b['area']); ?></td>
                    <td data-order="<?php echo (float) $b['rent_min']; ?>">
                      <?php echo $b['rent_min'] === null ? '—' : peso($b['rent_min']) . ($b['rent_max'] != $b['rent_min'] ? ' – ' . peso($b['rent_max']) : ''); ?>
                    </td>
                    <td><?php echo (int) $b['rooms_open']; ?> of <?php echo (int) $b['rooms_total']; ?></td>
                    <td data-order="<?php echo e($b['submitted_at'] ?? $b['created_at']); ?>"><?php echo e(nice_date($b['submitted_at'] ?? $b['created_at'])); ?></td>
                    <td>
                      <span class="badge <?php echo $state['badge']; ?>"><?php echo e($state['label']); ?></span>
                      <?php if ($state['key'] === 'changes' && $b['rejection_reason']): ?>
                        <br><small class="text-muted"><?php echo e($b['rejection_reason']); ?></small>
                      <?php elseif ($state['key'] === 'removed' && $b['removal_reason']): ?>
                        <br><small class="text-muted"><?php echo e($b['removal_reason']); ?></small>
                      <?php endif; ?>
                    </td>
                    <td class="text-nowrap">
                      <a class="btn bg-olive btn-sm mb-1" href="dashboard.php?page=view_listing&id=<?php echo (int) $b['boarding_house_id']; ?>"><i class="fas fa-eye"></i> View</a>
                      <?php echo listing_buttons($b); ?>
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
<?php listing_reason_modals(); ?>
