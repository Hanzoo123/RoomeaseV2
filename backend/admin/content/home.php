<?php
$stats = $pdo->query("SELECT
    (SELECT COUNT(*) FROM boarding_houses WHERE moderation_status = 'pending' AND deleted_at IS NULL) AS pending,
    (SELECT COUNT(*) FROM boarding_houses WHERE moderation_status = 'approved' AND deleted_at IS NULL) AS live,
    (SELECT COUNT(*) FROM users WHERE role = 'boarder' AND deleted_at IS NULL) AS boarders,
    (SELECT COUNT(*) FROM users WHERE role = 'landlord' AND deleted_at IS NULL) AS landlords,
    (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0) AS unread,
    (SELECT COUNT(*) FROM reservations WHERE status = 'pending') AS requests")->fetch();

// Oldest first: the landlord who has waited longest is reviewed first.
$queue = $pdo->query("SELECT b.boarding_house_id, b.name, b.area, b.submitted_at, b.created_at,
    u.first_name, u.last_name, MIN(r.monthly_rent) AS rent
  FROM boarding_houses b
  JOIN users u ON u.user_id = b.landlord_id
  LEFT JOIN rooms r ON r.boarding_house_id = b.boarding_house_id
  WHERE b.moderation_status = 'pending' AND b.deleted_at IS NULL
  GROUP BY b.boarding_house_id
  ORDER BY COALESCE(b.submitted_at, b.created_at)")->fetchAll();

$messages = $pdo->query("SELECT contact_message_id, name, topic, message, created_at FROM contact_messages WHERE is_read = 0 ORDER BY created_at DESC LIMIT 4")->fetchAll();

$sentBack = $pdo->query("SELECT b.boarding_house_id, b.name, b.rejection_reason, b.moderated_at, u.first_name, u.last_name
  FROM boarding_houses b JOIN users u ON u.user_id = b.landlord_id
  WHERE b.moderation_status = 'rejected' AND b.deleted_at IS NULL
  ORDER BY b.moderated_at DESC LIMIT 5")->fetchAll();

$activity = is_super_admin()
  ? $pdo->query("SELECT a.*, u.first_name, u.last_name FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_id ORDER BY a.created_at DESC, a.log_id DESC LIMIT 6")->fetchAll()
  : [];
require_once __DIR__ . '/../includes/activity_labels.php';
?>
  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">
        <h1 class="m-0">Welcome, <?php echo e($_SESSION['firstname'] . ' ' . $_SESSION['lastname']); ?>!</h1>
        <p class="text-muted mb-0">
          <?php echo $stats['pending'] ? e($stats['pending'] . ($stats['pending'] == 1 ? ' listing is' : ' listings are') . ' waiting for review.') : 'Every listing has been reviewed.'; ?>
        </p>
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content-header -->

    <!-- Main content -->
    <div class="content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-lg-3 col-6">
            <div class="small-box bg-warning">
              <div class="inner">
                <h3><?php echo (int) $stats['pending']; ?></h3>
                <p>Listings in review</p>
              </div>
              <div class="icon"><i class="fas fa-clipboard-check"></i></div>
              <a href="dashboard.php?page=listings&status=review" class="small-box-footer">Review now <i class="fas fa-arrow-circle-right"></i></a>
            </div>
          </div>
          <div class="col-lg-3 col-6">
            <div class="small-box bg-olive">
              <div class="inner">
                <h3><?php echo (int) $stats['live']; ?></h3>
                <p>Live listings</p>
              </div>
              <div class="icon"><i class="fas fa-home"></i></div>
              <a href="dashboard.php?page=listings&status=live" class="small-box-footer">More info <i class="fas fa-arrow-circle-right"></i></a>
            </div>
          </div>
          <div class="col-lg-3 col-6">
            <div class="small-box bg-info">
              <div class="inner">
                <h3><?php echo (int) $stats['boarders'] + (int) $stats['landlords']; ?></h3>
                <p><?php echo (int) $stats['boarders']; ?> boarders · <?php echo (int) $stats['landlords']; ?> landlords</p>
              </div>
              <div class="icon"><i class="fas fa-user-friends"></i></div>
              <a href="dashboard.php?page=accounts" class="small-box-footer">More info <i class="fas fa-arrow-circle-right"></i></a>
            </div>
          </div>
          <div class="col-lg-3 col-6">
            <div class="small-box bg-danger">
              <div class="inner">
                <h3><?php echo (int) $stats['unread']; ?></h3>
                <p>Unread contact messages</p>
              </div>
              <div class="icon"><i class="fas fa-inbox"></i></div>
              <a href="dashboard.php?page=inbox" class="small-box-footer">Open inbox <i class="fas fa-arrow-circle-right"></i></a>
            </div>
          </div>
        </div>
        <!-- /.row -->

        <div class="row">
          <div class="col-lg-8">
            <div class="card">
              <div class="card-header bg-olive">
                <h3 class="card-title">Waiting for review</h3>
              </div>
              <div class="card-body p-0">
                <?php if ($queue): ?>
                <table class="table table-striped mb-0">
                  <thead>
                  <tr>
                    <th>Boarding house</th>
                    <th>Landlord</th>
                    <th>Rent from</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                  </thead>
                  <tbody>
                  <?php foreach ($queue as $row): ?>
                  <tr>
                    <td><?php echo e($row['name']); ?><br><small class="text-muted"><?php echo e($row['area']); ?></small></td>
                    <td><?php echo e(full_name($row)); ?></td>
                    <td><?php echo $row['rent'] !== null ? peso($row['rent']) : '—'; ?></td>
                    <td><?php echo e(time_ago($row['submitted_at'] ?? $row['created_at'])); ?></td>
                    <td class="text-right">
                      <a class="btn bg-olive btn-sm" href="dashboard.php?page=view_listing&id=<?php echo (int) $row['boarding_house_id']; ?>"><i class="fas fa-search"></i> Review</a>
                    </td>
                  </tr>
                  <?php endforeach; ?>
                  </tbody>
                </table>
                <?php else: ?>
                <p class="text-muted p-3 mb-0"><i class="fas fa-check-circle text-success"></i> Nothing to review. New listings show up here as soon as a landlord submits them.</p>
                <?php endif; ?>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Sent back to landlords</h3>
              </div>
              <div class="card-body p-0">
                <?php if ($sentBack): ?>
                <ul class="list-group list-group-flush">
                  <?php foreach ($sentBack as $row): ?>
                  <li class="list-group-item">
                    <a href="dashboard.php?page=view_listing&id=<?php echo (int) $row['boarding_house_id']; ?>"><?php echo e($row['name']); ?></a>
                    <small class="text-muted">· <?php echo e(full_name($row)); ?> · <?php echo e(time_ago($row['moderated_at'])); ?></small>
                    <br><small><?php echo e($row['rejection_reason']); ?></small>
                  </li>
                  <?php endforeach; ?>
                </ul>
                <?php else: ?>
                <p class="text-muted p-3 mb-0">No listings are waiting on landlord changes.</p>
                <?php endif; ?>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">New contact messages</h3>
                <div class="card-tools">
                  <a href="dashboard.php?page=inbox" class="btn btn-tool">Open inbox</a>
                </div>
              </div>
              <div class="card-body p-0">
                <?php if ($messages): ?>
                <ul class="list-group list-group-flush">
                  <?php foreach ($messages as $row): ?>
                  <li class="list-group-item">
                    <a href="dashboard.php?page=inbox&view=<?php echo (int) $row['contact_message_id']; ?>"><b><?php echo e($row['name']); ?></b></a>
                    <small class="text-muted float-right"><?php echo e(time_ago($row['created_at'])); ?></small>
                    <br><small class="text-muted"><?php echo e($row['topic']); ?></small>
                    <p class="mb-0 text-truncate"><?php echo e($row['message']); ?></p>
                  </li>
                  <?php endforeach; ?>
                </ul>
                <?php else: ?>
                <p class="text-muted p-3 mb-0">No unread messages.</p>
                <?php endif; ?>
              </div>
            </div>

            <?php if (is_super_admin()): ?>
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Recent activity</h3>
                <div class="card-tools">
                  <a href="dashboard.php?page=activity" class="btn btn-tool">Full log</a>
                </div>
              </div>
              <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                  <?php foreach ($activity as $row): $info = activity_info($row['action']); ?>
                  <li class="list-group-item">
                    <i class="<?php echo e($info['icon']); ?> text-<?php echo e($info['tone']); ?> mr-1"></i>
                    <b><?php echo e($row['first_name'] ? full_name($row) : 'System'); ?></b> <?php echo e($info['text']); ?><?php if ($info['group'] !== 'signins'): ?>:
                    <?php echo activity_target_link($row); ?><?php endif; ?>
                    <br><small class="text-muted"><?php echo e(time_ago($row['created_at'])); ?></small>
                  </li>
                  <?php endforeach; ?>
                </ul>
              </div>
            </div>
            <?php endif; ?>

            <div class="info-box">
              <span class="info-box-icon bg-olive"><i class="fas fa-calendar-check"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Reservation requests waiting on landlords</span>
                <span class="info-box-number"><?php echo (int) $stats['requests']; ?></span>
              </div>
            </div>
          </div>
        </div>
        <!-- /.row -->
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
