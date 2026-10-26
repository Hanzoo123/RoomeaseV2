<?php
require_once __DIR__ . '/../includes/listing_actions.php';
require_once __DIR__ . '/../includes/listing_buttons.php';
require_once __DIR__ . '/../includes/reason_modal.php';
require_once __DIR__ . '/../includes/activity_labels.php';

$id = (int) ($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT b.*, u.first_name, u.last_name, u.email, u.phone_number, u.created_at AS landlord_since, u.is_active AS landlord_active,
    (SELECT COUNT(*) FROM boarding_houses x WHERE x.landlord_id = b.landlord_id) AS landlord_listings
  FROM boarding_houses b JOIN users u ON u.user_id = b.landlord_id WHERE b.boarding_house_id = ?");
$stmt->execute([$id]);
$listing = $stmt->fetch();
if (!$listing) {
  go('404');
}

$rooms = $pdo->prepare("SELECT r.*, t.room_type_name FROM rooms r JOIN room_types t ON t.room_type_id = r.room_type_id WHERE r.boarding_house_id = ? ORDER BY r.room_id");
$rooms->execute([$id]);
$rooms = $rooms->fetchAll();

$amenities = $pdo->prepare("SELECT a.amenity_name FROM boarding_house_amenities ba JOIN amenities a ON a.amenity_id = ba.amenity_id WHERE ba.boarding_house_id = ? ORDER BY a.amenity_name");
$amenities->execute([$id]);
$amenities = $amenities->fetchAll(PDO::FETCH_COLUMN);

$utilities = $pdo->prepare("SELECT u.utility_name, bu.billing_policy FROM boarding_house_utilities bu JOIN utilities u ON u.utility_id = bu.utility_id WHERE bu.boarding_house_id = ? ORDER BY u.utility_id");
$utilities->execute([$id]);
$utilities = $utilities->fetchAll();

$photos = $pdo->prepare("SELECT image_path, is_primary FROM images WHERE boarding_house_id = ? ORDER BY is_primary DESC, image_id");
$photos->execute([$id]);
$photos = $photos->fetchAll();

$rating = $pdo->prepare("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE boarding_house_id = ?");
$rating->execute([$id]);
$rating = $rating->fetch();

$history = $pdo->prepare("SELECT a.*, u.first_name, u.last_name FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_id
  WHERE a.target_type = 'listing' AND a.target_id = ? ORDER BY a.created_at DESC, a.log_id DESC");
$history->execute([$id]);
$history = $history->fetchAll();

$state = listing_status($listing);
$rules = array_filter(array_map('trim', explode("\n", (string) $listing['house_rules'])));
$rents = array_column($rooms, 'monthly_rent');
$address = trim((string) $listing['address']);

// What an admin checks before approving. A miss is a warning, not a blocker.
$checklist = [
  ['Full street address', mb_strlen($address) >= 8 && mb_strtolower($address) !== mb_strtolower($listing['area'])],
  ['At least one photo', count($photos) > 0],
  ['Description of 40+ characters', mb_strlen(trim((string) $listing['description'])) >= 40],
  ['Rent between ₱500 and ₱15,000', $rents && min($rents) >= 500 && max($rents) <= 15000],
  ['At least one room', count($rooms) > 0],
  ['Bills included are listed', count($utilities) > 0],
  ['House rules are listed', count($rules) > 0],
  ['Map pin set', $listing['latitude'] !== null && $listing['longitude'] !== null],
];
$passed = count(array_filter(array_column($checklist, 1)));
$yesNo = function ($value) {
  return $value === null ? 'Not stated' : ($value ? 'Allowed' : 'Not allowed');
};
$genders = ['any' => 'Anyone', 'female' => 'Female only', 'male' => 'Male only'];
?>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <div class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-7">
          <h1 class="m-0"><?php echo e($listing['name']); ?> <span class="badge <?php echo $state['badge']; ?> align-middle" style="font-size: .9rem"><?php echo e($state['label']); ?></span></h1>
          <small class="text-muted">Submitted <?php echo e(nice_date($listing['submitted_at'] ?? $listing['created_at'], true)); ?><?php echo $listing['moderated_at'] ? ' · last reviewed ' . e(nice_date($listing['moderated_at'])) : ''; ?></small>
        </div>
        <div class="col-sm-5 text-sm-right mt-2 mt-sm-0">
          <a href="dashboard.php?page=listings&status=<?php echo e($state['key']); ?>" class="btn btn-default btn-sm mb-1"><i class="fas fa-arrow-left"></i> Back</a>
          <?php echo listing_buttons($listing); ?>
        </div>
      </div>
    </div>
  </div>
  <!-- Main content -->
  <div class="content">
    <div class="container-fluid">
      <?php if ($state['key'] === 'changes' && $listing['rejection_reason']): ?>
      <div class="callout callout-danger">
        <h5>Sent back to the landlord</h5>
        <p><?php echo e($listing['rejection_reason']); ?></p>
      </div>
      <?php elseif ($state['key'] === 'removed'): ?>
      <div class="callout callout-warning">
        <h5>Removed from the site</h5>
        <p><?php echo e($listing['removal_reason'] ?: 'No reason given.'); ?> Boarders can't see it until it is restored.</p>
      </div>
      <?php endif; ?>

      <div class="row">
        <div class="col-lg-8">
          <div class="card card-olive">
            <div class="card-header">
              <h3 class="card-title">Listing details</h3>
            </div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-4">Address</dt>
                <dd class="col-sm-8"><?php echo e($address); ?>, <?php echo e($listing['area']); ?>, Baybay City</dd>
                <dt class="col-sm-4">Monthly rent</dt>
                <dd class="col-sm-8"><?php echo $rents ? peso(min($rents)) . (max($rents) != min($rents) ? ' – ' . peso(max($rents)) : '') : '—'; ?></dd>
                <dt class="col-sm-4">Rating</dt>
                <dd class="col-sm-8"><?php echo $rating['n'] ? number_format($rating['avg'], 1) . ' / 5 from ' . (int) $rating['n'] . ' reviews' : 'No reviews yet'; ?></dd>
                <dt class="col-sm-4">Page views</dt>
                <dd class="col-sm-8"><?php echo number_format((int) $listing['views']); ?></dd>
                <dt class="col-sm-4">Map pin</dt>
                <dd class="col-sm-8">
                  <?php if ($listing['latitude'] !== null): ?>
                    <a href="https://www.google.com/maps?q=<?php echo (float) $listing['latitude']; ?>,<?php echo (float) $listing['longitude']; ?>" target="_blank" rel="noopener noreferrer">
                      <?php echo (float) $listing['latitude']; ?>, <?php echo (float) $listing['longitude']; ?> <i class="fas fa-external-link-alt"></i>
                    </a>
                  <?php else: ?>Not set<?php endif; ?>
                </dd>
                <dt class="col-sm-4">Description</dt>
                <dd class="col-sm-8"><?php echo $listing['description'] ? nl2br(e($listing['description'])) : '<span class="text-muted">None</span>'; ?></dd>
                <dt class="col-sm-4">Amenities</dt>
                <dd class="col-sm-8 mb-0">
                  <?php foreach ($amenities as $amenity): ?><span class="badge badge-light border mr-1"><?php echo e($amenity); ?></span><?php endforeach; ?>
                  <?php if (!$amenities): ?><span class="text-muted">None listed</span><?php endif; ?>
                </dd>
              </dl>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Rooms (<?php echo count($rooms); ?>)</h3>
            </div>
            <div class="card-body">
              <table id="example2" class="table table-bordered table-hover">
                <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Monthly rent</th>
                  <th>Slots taken</th>
                  <th>Status</th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($rooms as $room): $free = $room['is_open'] && $room['slots_taken'] < $room['capacity']; ?>
                <tr>
                  <td><?php echo e($room['name']); ?></td>
                  <td><?php echo e($room['room_type_name']); ?></td>
                  <td data-order="<?php echo (float) $room['monthly_rent']; ?>"><?php echo peso($room['monthly_rent']); ?></td>
                  <td><?php echo (int) $room['slots_taken']; ?> of <?php echo (int) $room['capacity']; ?></td>
                  <td><span class="badge <?php echo $free ? 'badge-success' : 'badge-secondary'; ?>"><?php echo $free ? 'Has a free slot' : ($room['is_open'] ? 'Full' : 'Closed'); ?></span></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Stay terms</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <dl class="row mb-0">
                    <dt class="col-6">Who can stay</dt><dd class="col-6"><?php echo e($genders[$listing['gender_policy']] ?? 'Not stated'); ?></dd>
                    <dt class="col-6">Curfew</dt><dd class="col-6"><?php echo e($listing['curfew'] ?: 'No curfew'); ?></dd>
                    <dt class="col-6">Minimum stay</dt><dd class="col-6"><?php echo $listing['minimum_stay_months'] ? (int) $listing['minimum_stay_months'] . ' months' : 'No minimum'; ?></dd>
                    <dt class="col-6">Visitors</dt><dd class="col-6"><?php echo $yesNo($listing['visitors_allowed']); ?></dd>
                    <dt class="col-6">Cooking</dt><dd class="col-6"><?php echo $yesNo($listing['cooking_allowed']); ?></dd>
                    <dt class="col-6">Pets</dt><dd class="col-6"><?php echo $yesNo($listing['pets_allowed']); ?></dd>
                    <dt class="col-6">Pay by</dt><dd class="col-6"><?php echo e(str_replace(',', ', ', (string) $listing['payment_methods']) ?: 'Not stated'); ?></dd>
                  </dl>
                </div>
                <div class="col-md-6">
                  <p class="mb-1"><b>Bills included</b></p>
                  <?php if ($utilities): ?>
                  <ul class="pl-3">
                    <?php foreach ($utilities as $utility): ?><li><?php echo e($utility['utility_name']); ?> <span class="text-muted">· <?php echo e($utility['billing_policy'] ?: 'Included'); ?></span></li><?php endforeach; ?>
                  </ul>
                  <?php else: ?><p class="text-muted">None listed.</p><?php endif; ?>
                  <p class="mb-1"><b>House rules</b></p>
                  <?php if ($rules): ?>
                  <ul class="pl-3 mb-0">
                    <?php foreach ($rules as $rule): ?><li><?php echo e($rule); ?></li><?php endforeach; ?>
                  </ul>
                  <?php else: ?><p class="text-muted mb-0">None listed.</p><?php endif; ?>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Photos (<?php echo count($photos); ?>)</h3>
            </div>
            <div class="card-body">
              <?php if ($photos): ?>
              <div class="row">
                <?php foreach ($photos as $photo): ?>
                <div class="col-sm-4 mb-3">
                  <img src="../<?php echo e($photo['image_path']); ?>" class="img-fluid rounded" alt="Listing photo">
                  <?php if ($photo['is_primary']): ?><span class="badge badge-dark mt-1">Cover</span><?php endif; ?>
                </div>
                <?php endforeach; ?>
              </div>
              <?php else: ?>
              <p class="text-muted mb-0">No photos uploaded yet. Boarders see an illustration instead.</p>
              <?php endif; ?>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card card-olive card-outline">
            <div class="card-header">
              <h3 class="card-title">Review checklist</h3>
              <div class="card-tools">
                <span class="badge <?php echo $passed === count($checklist) ? 'badge-success' : 'badge-warning'; ?>"><?php echo $passed; ?> of <?php echo count($checklist); ?></span>
              </div>
            </div>
            <div class="card-body">
              <ul class="list-unstyled mb-0">
                <?php foreach ($checklist as [$label, $ok]): ?>
                <li class="mb-1">
                  <i class="fas <?php echo $ok ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-warning'; ?> mr-1"></i>
                  <?php echo e($label); ?>
                </li>
                <?php endforeach; ?>
              </ul>
            </div>
          </div>

          <div class="card card-olive card-outline">
            <div class="card-body box-profile">
              <div class="text-center">
                <img class="profile-user-img img-fluid img-circle" src="dist/img/avatar.png" alt="Landlord">
              </div>
              <h3 class="profile-username text-center"><?php echo e(full_name($listing)); ?></h3>
              <p class="text-muted text-center">Landlord<?php echo $listing['landlord_active'] ? '' : ' · deactivated'; ?></p>
              <ul class="list-group list-group-unbordered mb-3">
                <li class="list-group-item"><b>Listings</b> <span class="float-right"><?php echo (int) $listing['landlord_listings']; ?></span></li>
                <li class="list-group-item"><b>Email</b> <a class="float-right" href="mailto:<?php echo e($listing['email']); ?>?subject=<?php echo rawurlencode('Your RoomEase listing: ' . $listing['name']); ?>"><?php echo e($listing['email']); ?></a></li>
                <li class="list-group-item"><b>Phone</b> <span class="float-right"><?php echo e($listing['contact_number'] ?: $listing['phone_number'] ?: '—'); ?></span></li>
                <li class="list-group-item"><b>Joined</b> <span class="float-right"><?php echo e(nice_date($listing['landlord_since'])); ?></span></li>
              </ul>
              <a href="dashboard.php?page=view_account&id=<?php echo (int) $listing['landlord_id']; ?>" class="btn bg-olive btn-block btn-sm">View account</a>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">History</h3>
            </div>
            <div class="card-body p-0">
              <?php if ($history): ?>
              <ul class="list-group list-group-flush">
                <?php foreach ($history as $row): $info = activity_info($row['action']); ?>
                <li class="list-group-item">
                  <i class="<?php echo e($info['icon']); ?> text-<?php echo e($info['tone']); ?> mr-1"></i>
                  <b><?php echo e($row['first_name'] ? full_name($row) : 'System'); ?></b> <?php echo e($info['text']); ?>
                  <?php if ($row['detail']): ?><br><small>“<?php echo e($row['detail']); ?>”</small><?php endif; ?>
                  <br><small class="text-muted"><?php echo e(time_ago($row['created_at'])); ?></small>
                </li>
                <?php endforeach; ?>
              </ul>
              <?php else: ?>
              <p class="text-muted p-3 mb-0">No recorded changes yet.</p>
              <?php endif; ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?php listing_reason_modals(); ?>
