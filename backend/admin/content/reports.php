<?php
// Site-wide numbers, charts and exportable tables (Copy / CSV / Excel / PDF / Print).
$kpi = $pdo->query("SELECT
    (SELECT COUNT(*) FROM boarding_houses WHERE moderation_status = 'approved' AND deleted_at IS NULL) AS live,
    (SELECT COALESCE(SUM(r.slots_taken), 0) FROM rooms r JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id WHERE b.moderation_status = 'approved' AND b.deleted_at IS NULL) AS taken,
    (SELECT COALESCE(SUM(r.capacity), 0) FROM rooms r JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id WHERE b.moderation_status = 'approved' AND b.deleted_at IS NULL) AS capacity,
    (SELECT AVG(r.monthly_rent) FROM rooms r JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id WHERE b.moderation_status = 'approved' AND b.deleted_at IS NULL) AS avg_rent,
    (SELECT COUNT(*) FROM reservations WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS requests_month,
    (SELECT SUM(status = 'accepted') / NULLIF(SUM(status IN ('accepted', 'declined')), 0) FROM reservations) AS approval_rate,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 30 DAY AND deleted_at IS NULL) AS new_accounts")->fetch();
$occupancy = $kpi['capacity'] ? round($kpi['taken'] / $kpi['capacity'] * 100) : 0;

// Last 6 months, oldest first.
$months = [];
for ($i = 5; $i >= 0; $i--) {
  $months[] = date('Y-m', strtotime("first day of -$i month"));
}
$statuses = ['accepted' => 'Approved', 'pending' => 'Pending', 'declined' => 'Declined', 'cancelled' => 'Cancelled'];
$perMonth = array_fill_keys(array_keys($statuses), array_fill(0, 6, 0));
$rows = $pdo->query("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, status, COUNT(*) AS n FROM reservations
  WHERE created_at >= DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01') GROUP BY month, status")->fetchAll();
foreach ($rows as $row) {
  $index = array_search($row['month'], $months, true);
  if ($index !== false) $perMonth[$row['status']][$index] = (int) $row['n'];
}
$signups = array_fill(0, 6, 0);
foreach ($pdo->query("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS n FROM users WHERE created_at >= DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01') GROUP BY month") as $row) {
  $index = array_search($row['month'], $months, true);
  if ($index !== false) $signups[$index] = (int) $row['n'];
}
$byArea = $pdo->query("SELECT area, COUNT(*) AS n FROM boarding_houses WHERE moderation_status = 'approved' AND deleted_at IS NULL GROUP BY area ORDER BY n DESC")->fetchAll();
$byType = $pdo->query("SELECT t.room_type_name AS type, COUNT(*) AS n FROM rooms r JOIN room_types t ON t.room_type_id = r.room_type_id
  JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id WHERE b.moderation_status = 'approved' AND b.deleted_at IS NULL
  GROUP BY t.room_type_id ORDER BY t.room_type_id")->fetchAll();

$chartData = [
  'months' => array_map(function ($month) { return date('M', strtotime("$month-01")); }, $months),
  'requests' => array_map(function ($key, $label) use ($perMonth) { return ['label' => $label, 'data' => $perMonth[$key]]; }, array_keys($statuses), $statuses),
  'signups' => $signups,
  'areas' => ['labels' => array_column($byArea, 'area'), 'data' => array_map('intval', array_column($byArea, 'n'))],
  'types' => ['labels' => array_column($byType, 'type'), 'data' => array_map('intval', array_column($byType, 'n'))],
];

// The table under the charts, chosen with the buttons above it.
$reports = ['listings' => 'Listings', 'reservations' => 'Reservations', 'accounts' => 'Accounts'];
$report = isset($reports[$_GET['report'] ?? '']) ? $_GET['report'] : 'listings';
if ($report === 'listings') {
  $table = $pdo->query("SELECT b.*, u.first_name, u.last_name, MIN(r.monthly_rent) AS rent_min, MAX(r.monthly_rent) AS rent_max,
      COUNT(r.room_id) AS rooms, SUM(r.capacity - r.slots_taken) AS free_slots,
      (SELECT ROUND(AVG(rating), 1) FROM reviews v WHERE v.boarding_house_id = b.boarding_house_id) AS rating
    FROM boarding_houses b JOIN users u ON u.user_id = b.landlord_id LEFT JOIN rooms r ON r.boarding_house_id = b.boarding_house_id
    GROUP BY b.boarding_house_id ORDER BY b.name")->fetchAll();
} elseif ($report === 'reservations') {
  $table = $pdo->query("SELECT res.*, b.name AS listing, r.name AS room, u.first_name, u.last_name FROM reservations res
    JOIN rooms r ON r.room_id = res.room_id JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id
    JOIN users u ON u.user_id = res.boarder_id ORDER BY res.created_at DESC")->fetchAll();
} else {
  $table = $pdo->query("SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC")->fetchAll();
}

$page_script = <<<'JS'
$(function () {
  var data = JSON.parse(document.getElementById('report-data').textContent);
  var colors = { Approved: '#3d9970', Pending: '#ffc107', Declined: '#dc3545', Cancelled: '#6c757d' };
  var ticks = { beginAtZero: true, precision: 0 };

  new Chart($('#requestsChart'), {
    type: 'bar',
    data: { labels: data.months, datasets: data.requests.map(function (set) { return { label: set.label, data: set.data, backgroundColor: colors[set.label] }; }) },
    options: { maintainAspectRatio: false, responsive: true, scales: { xAxes: [{ stacked: true, gridLines: { display: false } }], yAxes: [{ stacked: true, ticks: ticks }] } }
  });
  new Chart($('#signupsChart'), {
    type: 'line',
    data: { labels: data.months, datasets: [{ label: 'New accounts', data: data.signups, borderColor: '#3d9970', backgroundColor: 'rgba(61, 153, 112, 0.15)', pointBackgroundColor: '#3d9970' }] },
    options: { maintainAspectRatio: false, responsive: true, legend: { display: false }, scales: { yAxes: [{ ticks: ticks }] } }
  });
  new Chart($('#areaChart'), {
    type: 'horizontalBar',
    data: { labels: data.areas.labels, datasets: [{ label: 'Live listings', data: data.areas.data, backgroundColor: '#3d9970' }] },
    options: { maintainAspectRatio: false, responsive: true, legend: { display: false }, scales: { xAxes: [{ ticks: ticks }] } }
  });
  new Chart($('#typeChart'), {
    type: 'doughnut',
    data: { labels: data.types.labels, datasets: [{ data: data.types.data, backgroundColor: ['#3d9970', '#17a2b8', '#ffc107', '#6f42c1', '#fd7e14'] }] },
    options: { maintainAspectRatio: false, responsive: true }
  });
});
JS;
$resStatus = ['pending' => 'badge-warning', 'accepted' => 'badge-success', 'declined' => 'badge-danger', 'cancelled' => 'badge-secondary'];
?>
  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">
        <h1 class="m-0">Reports</h1>
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content-header -->
    <script type="application/json" id="report-data"><?php echo json_encode($chartData, JSON_HEX_TAG | JSON_HEX_AMP); ?></script>

    <!-- Main content -->
    <div class="content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-3 col-sm-6 col-12">
            <div class="info-box">
              <span class="info-box-icon bg-olive"><i class="fas fa-home"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Live listings</span>
                <span class="info-box-number"><?php echo (int) $kpi['live']; ?></span>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 col-12">
            <div class="info-box">
              <span class="info-box-icon bg-info"><i class="fas fa-bed"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Slots taken</span>
                <span class="info-box-number"><?php echo $occupancy; ?>% <small>(<?php echo (int) $kpi['taken']; ?> of <?php echo (int) $kpi['capacity']; ?>)</small></span>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 col-12">
            <div class="info-box">
              <span class="info-box-icon bg-warning"><i class="fas fa-wallet"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Average monthly rent</span>
                <span class="info-box-number"><?php echo $kpi['avg_rent'] ? peso($kpi['avg_rent']) : '—'; ?></span>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 col-12">
            <div class="info-box">
              <span class="info-box-icon bg-danger"><i class="fas fa-calendar-check"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Requests this month</span>
                <span class="info-box-number"><?php echo (int) $kpi['requests_month']; ?> <small>(<?php echo $kpi['approval_rate'] !== null ? round($kpi['approval_rate'] * 100) : 0; ?>% approved overall)</small></span>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-lg-8">
            <div class="card card-olive">
              <div class="card-header"><h3 class="card-title">Reservation requests, last 6 months</h3></div>
              <div class="card-body"><div style="height: 260px"><canvas id="requestsChart"></canvas></div></div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card card-olive">
              <div class="card-header"><h3 class="card-title">Rooms by type (live listings)</h3></div>
              <div class="card-body"><div style="height: 260px"><canvas id="typeChart"></canvas></div></div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card card-olive">
              <div class="card-header"><h3 class="card-title">New accounts per month</h3><div class="card-tools"><span class="badge badge-light"><?php echo (int) $kpi['new_accounts']; ?> in the last 30 days</span></div></div>
              <div class="card-body"><div style="height: 220px"><canvas id="signupsChart"></canvas></div></div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card card-olive">
              <div class="card-header"><h3 class="card-title">Live listings by area</h3></div>
              <div class="card-body"><div style="height: 220px"><canvas id="areaChart"></canvas></div></div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-lg-12">
            <div class="card">
              <div class="card-header bg-olive">
                <h3 class="card-title"><?php echo e($reports[$report]); ?> report</h3>
              </div>
              <div class="card-header p-2">
                <ul class="nav nav-pills">
                  <?php foreach ($reports as $key => $label): ?>
                  <li class="nav-item"><a class="nav-link <?php echo $key === $report ? 'active bg-olive' : ''; ?>" href="dashboard.php?page=reports&report=<?php echo $key; ?>"><?php echo e($label); ?></a></li>
                  <?php endforeach; ?>
                </ul>
              </div>
              <div class="card-body">
                <table id="example1" class="table table-bordered table-striped">
                  <?php if ($report === 'listings'): ?>
                  <thead><tr><th>Boarding house</th><th>Landlord</th><th>Area</th><th>Rent</th><th>Rooms</th><th>Free slots</th><th>Status</th><th>Views</th><th>Rating</th></tr></thead>
                  <tbody>
                  <?php foreach ($table as $b): $state = listing_status($b); ?>
                  <tr>
                    <td><?php echo e($b['name']); ?></td>
                    <td><?php echo e(full_name($b)); ?></td>
                    <td><?php echo e($b['area']); ?></td>
                    <td data-order="<?php echo (float) $b['rent_min']; ?>"><?php echo $b['rent_min'] === null ? '—' : peso($b['rent_min']) . ($b['rent_max'] != $b['rent_min'] ? ' – ' . peso($b['rent_max']) : ''); ?></td>
                    <td><?php echo (int) $b['rooms']; ?></td>
                    <td><?php echo (int) $b['free_slots']; ?></td>
                    <td><?php echo e($state['label']); ?></td>
                    <td><?php echo (int) $b['views']; ?></td>
                    <td><?php echo $b['rating'] !== null ? e($b['rating']) : '—'; ?></td>
                  </tr>
                  <?php endforeach; ?>
                  </tbody>
                  <?php elseif ($report === 'reservations'): ?>
                  <thead><tr><th>Requested</th><th>Boarder</th><th>Boarding house</th><th>Room</th><th>Move-in</th><th>Status</th><th>Landlord note</th></tr></thead>
                  <tbody>
                  <?php foreach ($table as $r): ?>
                  <tr>
                    <td data-order="<?php echo e($r['created_at']); ?>"><?php echo e(nice_date($r['created_at'])); ?></td>
                    <td><?php echo e(full_name($r)); ?></td>
                    <td><?php echo e($r['listing']); ?></td>
                    <td><?php echo e($r['room']); ?></td>
                    <td><?php echo e(nice_date($r['move_in_date'])); ?></td>
                    <td><span class="badge <?php echo $resStatus[$r['status']] ?? 'badge-secondary'; ?> text-capitalize"><?php echo e($r['status'] === 'accepted' ? 'approved' : $r['status']); ?></span></td>
                    <td><?php echo e($r['landlord_note'] ?? ''); ?></td>
                  </tr>
                  <?php endforeach; ?>
                  </tbody>
                  <?php else: ?>
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Last sign-in</th></tr></thead>
                  <tbody>
                  <?php foreach ($table as $u): ?>
                  <tr>
                    <td><?php echo e(full_name($u)); ?></td>
                    <td><?php echo e($u['email']); ?></td>
                    <td><?php echo e($u['phone_number'] ?? ''); ?></td>
                    <td><?php echo e(role_label($u['role'])); ?></td>
                    <td><?php echo $u['is_active'] ? 'Active' : 'Inactive'; ?></td>
                    <td data-order="<?php echo e($u['created_at']); ?>"><?php echo e(nice_date($u['created_at'])); ?></td>
                    <td data-order="<?php echo e($u['last_login_at']); ?>"><?php echo e($u['last_login_at'] ? nice_date($u['last_login_at']) : '—'); ?></td>
                  </tr>
                  <?php endforeach; ?>
                  </tbody>
                  <?php endif; ?>
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
