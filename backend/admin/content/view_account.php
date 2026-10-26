<?php
require_once __DIR__ . '/../includes/reason_modal.php';
require_once __DIR__ . '/../includes/account_actions.php';
require_once __DIR__ . '/../includes/activity_labels.php';

$id = (int) ($_GET['id'] ?? 0);
$stmt = $pdo->prepare('SELECT * FROM users WHERE user_id = ? AND deleted_at IS NULL');
$stmt->execute([$id]);
$account = $stmt->fetch();
if (!$account) {
  go('404');
}
// Admin accounts are edited on the super admin's User Management page.
if (in_array($account['role'], ADMIN_ROLES, true) && is_super_admin()) {
  go('update_user', ['id' => $id]);
}

$listings = [];
$requests = [];
if ($account['role'] === 'landlord') {
  $stmt = $pdo->prepare('SELECT b.*, MIN(r.monthly_rent) AS rent_min FROM boarding_houses b LEFT JOIN rooms r ON r.boarding_house_id = b.boarding_house_id
    WHERE b.landlord_id = ? GROUP BY b.boarding_house_id ORDER BY b.created_at DESC');
  $stmt->execute([$id]);
  $listings = $stmt->fetchAll();
}
if ($account['role'] === 'boarder') {
  $stmt = $pdo->prepare('SELECT res.*, b.boarding_house_id, b.name AS listing_name, r.name AS room_name FROM reservations res
    JOIN rooms r ON r.room_id = res.room_id JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id
    WHERE res.boarder_id = ? ORDER BY res.created_at DESC');
  $stmt->execute([$id]);
  $requests = $stmt->fetchAll();
}
$history = $pdo->prepare("SELECT a.*, u.first_name, u.last_name FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_id
  WHERE a.target_type = 'user' AND a.target_id = ? AND a.action NOT LIKE 'auth.%' ORDER BY a.created_at DESC LIMIT 10");
$history->execute([$id]);
$history = $history->fetchAll();
$statusBadge = ['pending' => 'badge-warning', 'accepted' => 'badge-success', 'declined' => 'badge-danger', 'cancelled' => 'badge-secondary'];
?>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <div class="content-header">
    <div class="container-fluid">
      <a href="dashboard.php?page=accounts" class="btn btn-default btn-sm"><i class="fas fa-arrow-left"></i> Back to Boarders &amp; Landlords</a>
    </div>
  </div>
  <!-- Main content -->
  <div class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-4">
          <div class="card card-olive card-outline">
            <div class="card-body box-profile">
              <div class="text-center">
                <img class="profile-user-img img-fluid img-circle" src="<?php echo $account['avatar_path'] ? '../' . e($account['avatar_path']) : 'dist/img/avatar.png'; ?>" alt="Profile picture">
              </div>
              <h3 class="profile-username text-center"><?php echo e(full_name($account)); ?></h3>
              <p class="text-muted text-center"><?php echo e(role_label($account['role'])); ?></p>
              <ul class="list-group list-group-unbordered mb-3">
                <li class="list-group-item"><b>Status</b> <span class="float-right badge <?php echo $account['is_active'] ? 'badge-success' : 'badge-danger'; ?>"><?php echo $account['is_active'] ? 'Active' : 'Inactive'; ?></span></li>
                <li class="list-group-item"><b>Email</b> <a class="float-right" href="mailto:<?php echo e($account['email']); ?>"><?php echo e($account['email']); ?></a></li>
                <li class="list-group-item"><b>Phone</b> <span class="float-right"><?php echo e($account['phone_number'] ?: '—'); ?></span></li>
                <li class="list-group-item"><b>Joined</b> <span class="float-right"><?php echo e(nice_date($account['created_at'])); ?></span></li>
                <li class="list-group-item"><b>Last sign-in</b> <span class="float-right"><?php echo e(time_ago($account['last_login_at'])); ?></span></li>
              </ul>
              <?php if (!$account['is_active'] && $account['deactivation_reason']): ?>
              <div class="callout callout-danger py-2"><small><b>Deactivated:</b> <?php echo e($account['deactivation_reason']); ?></small></div>
              <?php endif; ?>
              <div class="text-center"><?php echo account_buttons($account); ?></div>
            </div>
          </div>
        </div>

        <div class="col-md-8">
          <?php if ($account['role'] === 'landlord'): ?>
          <div class="card">
            <div class="card-header bg-olive">
              <h3 class="card-title">Listings (<?php echo count($listings); ?>)</h3>
            </div>
            <div class="card-body">
              <table id="example2" class="table table-bordered table-hover">
                <thead><tr><th>Boarding house</th><th>Area</th><th>Rent from</th><th>Status</th></tr></thead>
                <tbody>
                <?php foreach ($listings as $b): $state = listing_status($b); ?>
                <tr>
                  <td><a href="dashboard.php?page=view_listing&id=<?php echo (int) $b['boarding_house_id']; ?>"><?php echo e($b['name']); ?></a></td>
                  <td><?php echo e($b['area']); ?></td>
                  <td><?php echo $b['rent_min'] !== null ? peso($b['rent_min']) : '—'; ?></td>
                  <td><span class="badge <?php echo $state['badge']; ?>"><?php echo e($state['label']); ?></span></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          </div>
          <?php elseif ($account['role'] === 'boarder'): ?>
          <div class="card">
            <div class="card-header bg-olive">
              <h3 class="card-title">Reservation requests (<?php echo count($requests); ?>)</h3>
            </div>
            <div class="card-body">
              <table id="example2" class="table table-bordered table-hover">
                <thead><tr><th>Boarding house</th><th>Room</th><th>Requested</th><th>Move-in</th><th>Status</th></tr></thead>
                <tbody>
                <?php foreach ($requests as $r): ?>
                <tr>
                  <td><a href="dashboard.php?page=view_listing&id=<?php echo (int) $r['boarding_house_id']; ?>"><?php echo e($r['listing_name']); ?></a></td>
                  <td><?php echo e($r['room_name']); ?></td>
                  <td data-order="<?php echo e($r['created_at']); ?>"><?php echo e(nice_date($r['created_at'])); ?></td>
                  <td><?php echo e(nice_date($r['move_in_date'])); ?></td>
                  <td><span class="badge <?php echo $statusBadge[$r['status']] ?? 'badge-secondary'; ?> text-capitalize"><?php echo e($r['status']); ?></span>
                    <?php if ($r['landlord_note']): ?><br><small class="text-muted"><?php echo e($r['landlord_note']); ?></small><?php endif; ?></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          </div>
          <?php endif; ?>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Account history</h3>
            </div>
            <div class="card-body p-0">
              <?php if ($history): ?>
              <ul class="list-group list-group-flush">
                <?php foreach ($history as $row): $info = activity_info($row['action']); ?>
                <li class="list-group-item">
                  <i class="<?php echo e($info['icon']); ?> text-<?php echo e($info['tone']); ?> mr-1"></i>
                  <b><?php echo e($row['first_name'] ? full_name($row) : 'System'); ?></b> <?php echo e($info['text']); ?>
                  <?php if ($row['detail']): ?>: “<?php echo e($row['detail']); ?>”<?php endif; ?>
                  <small class="text-muted float-right"><?php echo e(time_ago($row['created_at'])); ?></small>
                </li>
                <?php endforeach; ?>
              </ul>
              <?php else: ?>
              <p class="text-muted p-3 mb-0">No changes recorded for this account.</p>
              <?php endif; ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?php account_reason_modal(); ?>
