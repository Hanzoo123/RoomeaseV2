<?php
// Public listings: what anyone can see on Find Place to Stay. Only approved listings that
// haven't been removed are shown; the rest answer 404, as if they didn't exist.

const PUBLIC_LISTING = "b.moderation_status = 'approved' AND b.deleted_at IS NULL";
const AREAS = ['Poblacion', 'San Isidro', 'Baybay City Center', 'Near VSU'];
const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank transfer'];
const LISTING_SORTS = [
  'recommended' => 'b.boarding_house_id ASC',
  'newest' => 'COALESCE(b.moderated_at, b.created_at) DESC',
  // MariaDB won't sort by the rent_min alias here, so the expression is repeated.
  'price-asc' => 'MIN(r.monthly_rent) IS NULL, MIN(r.monthly_rent) ASC',
  'price-desc' => 'MIN(r.monthly_rent) DESC',
  'rating' => 'b.boarding_house_id ASC', // sorted after the ratings are added
];

// GET /lookups: the choices the browse filters and (later) the listing form offer.
function route_lookups()
{
  $areas = db()->query("SELECT DISTINCT area FROM boarding_houses WHERE area <> '' ORDER BY area")->fetchAll(PDO::FETCH_COLUMN);
  ok([
    'roomTypes' => db()->query('SELECT room_type_name FROM room_types ORDER BY room_type_id')->fetchAll(PDO::FETCH_COLUMN),
    'amenities' => db()->query('SELECT amenity_name FROM amenities WHERE landlord_id IS NULL ORDER BY amenity_id')->fetchAll(PDO::FETCH_COLUMN),
    'utilities' => db()->query('SELECT utility_name FROM utilities WHERE landlord_id IS NULL ORDER BY utility_id')->fetchAll(PDO::FETCH_COLUMN),
    'areas' => array_values(array_unique(array_merge(AREAS, $areas))),
    'paymentMethods' => PAYMENT_METHODS,
    'genderPolicies' => ['any' => 'Anyone', 'female' => 'Female only', 'male' => 'Male only'],
  ]);
}

// GET /listings?q&area&roomType&min&max&amenities&available&stay&sort&page&perPage
function route_listings()
{
  $where = [PUBLIC_LISTING];
  $having = [];
  $args = [];
  $q = trim((string) ($_GET['q'] ?? ''));
  if ($q !== '') {
    $where[] = '(b.name LIKE ? OR b.address LIKE ? OR b.area LIKE ?)';
    $like = '%' . addcslashes($q, '%_\\') . '%';
    array_push($args, $like, $like, $like);
  }
  if (!empty($_GET['area'])) {
    $where[] = 'b.area = ?';
    $args[] = (string) $_GET['area'];
  }
  if (!empty($_GET['roomType'])) {
    $where[] = 'EXISTS (SELECT 1 FROM rooms rr JOIN room_types tt ON tt.room_type_id = rr.room_type_id WHERE rr.boarding_house_id = b.boarding_house_id AND tt.room_type_name = ?)';
    $args[] = (string) $_GET['roomType'];
  }
  foreach (array_filter(explode(',', (string) ($_GET['amenities'] ?? ''))) as $amenity) {
    $where[] = 'EXISTS (SELECT 1 FROM boarding_house_amenities ba JOIN amenities aa ON aa.amenity_id = ba.amenity_id WHERE ba.boarding_house_id = b.boarding_house_id AND aa.amenity_name = ?)';
    $args[] = trim($amenity);
  }
  if (in_array($_GET['stay'] ?? '', ['female', 'male'], true)) {
    $where[] = "(b.gender_policy IS NULL OR b.gender_policy IN ('any', ?))";
    $args[] = $_GET['stay'];
  }
  // Rent filters use the cheapest room.
  if (is_numeric($_GET['min'] ?? null)) $having[] = 'rent_min >= ' . (int) $_GET['min'];
  if (is_numeric($_GET['max'] ?? null)) $having[] = 'rent_min <= ' . (int) $_GET['max'];
  if (($_GET['available'] ?? '') === '1') $having[] = 'rooms_open > 0';

  $sort = isset(LISTING_SORTS[$_GET['sort'] ?? '']) ? $_GET['sort'] : 'recommended';
  $listings = load_listings(implode(' AND ', $where), $args, $having ? 'HAVING ' . implode(' AND ', $having) : '', LISTING_SORTS[$sort]);
  if ($sort === 'rating') {
    usort($listings, function ($a, $b) {
      return [$b['rating']['average'], $b['rating']['count']] <=> [$a['rating']['average'], $a['rating']['count']];
    });
  }

  // Few enough boarding houses in one city to page in PHP.
  $perPage = max(1, min(200, (int) ($_GET['perPage'] ?? 50)));
  $page = max(1, (int) ($_GET['page'] ?? 1));
  ok([
    'listings' => array_slice($listings, ($page - 1) * $perPage, $perPage),
    'total' => count($listings),
    'page' => $page,
    'perPage' => $perPage,
  ]);
}

// GET /listings/{id}: one listing with its rooms.
function route_listing($params)
{
  $listing = public_listing_or_404($params['id']);
  $stmt = db()->prepare('SELECT r.*, t.room_type_name FROM rooms r JOIN room_types t ON t.room_type_id = r.room_type_id
    WHERE r.boarding_house_id = ? ORDER BY r.monthly_rent, r.name');
  $stmt->execute([$listing['id']]);
  $photos = db()->prepare('SELECT room_id, image_path FROM images WHERE boarding_house_id = ? AND room_id IS NOT NULL ORDER BY is_primary DESC, image_id');
  $photos->execute([$listing['id']]);
  $roomPhotos = [];
  foreach ($photos as $photo) $roomPhotos[$photo['room_id']][] = $photo['image_path'];

  $listing['rooms'] = array_map(function ($room) use ($roomPhotos) {
    $free = $room['is_open'] ? max(0, $room['capacity'] - $room['slots_taken']) : 0;
    return [
      'id' => (int) $room['room_id'],
      'name' => $room['name'],
      'type' => $room['room_type_name'],
      'rent' => (int) round($room['monthly_rent']),
      'capacity' => (int) $room['capacity'],
      'slotsTaken' => (int) $room['slots_taken'],
      'freeSlots' => $free,
      'isOpen' => (bool) $room['is_open'],
      'description' => $room['description'],
      'photos' => $roomPhotos[$room['room_id']] ?? [],
    ];
  }, $stmt->fetchAll());
  ok(['listing' => $listing]);
}

// POST /listings/{id}/view: counts a visit to the room page, once per listing per session.
function route_listing_view($params)
{
  $listing = public_listing_or_404($params['id']);
  $seen = $_SESSION['viewed_listings'] ?? [];
  $counted = !in_array($listing['id'], $seen, true);
  if ($counted) {
    db()->prepare('UPDATE boarding_houses SET views = views + 1 WHERE boarding_house_id = ?')->execute([$listing['id']]);
    $_SESSION['viewed_listings'] = array_slice(array_merge([$listing['id']], $seen), 0, 200);
  }
  ok(['counted' => $counted]);
}

// GET /listings/{id}/reviews: newest first, with the landlord's replies. The landlord can
// also read the reviews of their own listing while it isn't public.
function route_listing_reviews($params)
{
  $user = current_user();
  $id = ctype_digit((string) $params['id']) ? (int) $params['id'] : 0;
  $stmt = db()->prepare('SELECT b.landlord_id, (' . PUBLIC_LISTING . ') AS public FROM boarding_houses b WHERE b.boarding_house_id = ?');
  $stmt->execute([$id]);
  $listing = $stmt->fetch();
  $owner = $listing && $user && (int) $listing['landlord_id'] === (int) $user['user_id'];
  if (!$listing || (!$listing['public'] && !$owner)) fail(404, 'This listing isn’t available.');
  ok(listing_reviews($id, $user));
}

// A listing's reviews and rating, plus what the signed-in boarder may do:
// mine marks their review; canReview is true after an approved stay.
function listing_reviews($listingId, $user)
{
  $stmt = db()->prepare('SELECT * FROM reviews WHERE boarding_house_id = ? ORDER BY created_at DESC, review_id DESC');
  $stmt->execute([$listingId]);
  $rows = $stmt->fetchAll();
  $userId = $user ? (int) $user['user_id'] : 0;
  $isBoarder = $user && $user['role'] === 'boarder';
  $ratings = array_column($rows, 'rating');
  return [
    'reviews' => array_map(function ($review) use ($userId) {
      return public_review($review) + ['mine' => $userId && (int) $review['boarder_id'] === $userId];
    }, $rows),
    'rating' => ['average' => $ratings ? round(array_sum($ratings) / count($ratings), 2) : 0, 'count' => count($ratings)],
    'canReview' => $isBoarder && has_stayed($userId, $listingId),
  ];
}

function public_review($review)
{
  return [
    'id' => (int) $review['review_id'],
    'listingId' => (int) $review['boarding_house_id'],
    'name' => $review['reviewer_name'],
    'rating' => (int) $review['rating'],
    'comment' => $review['comment'],
    'date' => date(DATE_ATOM, strtotime($review['created_at'])),
    'reply' => $review['landlord_reply'] ? ['text' => $review['landlord_reply'], 'date' => date(DATE_ATOM, strtotime($review['replied_at']))] : null,
  ];
}

// GET /reviews/highlights: the review count and average across live listings, and a few
// recent five-star reviews, for the home page.
function route_review_highlights()
{
  $totals = db()->query('SELECT COUNT(*) AS n, AVG(v.rating) AS average FROM reviews v
    JOIN boarding_houses b ON b.boarding_house_id = v.boarding_house_id WHERE ' . PUBLIC_LISTING)->fetch();
  $rows = db()->query('SELECT v.*, b.name AS listing_name, u.first_name, u.last_name FROM reviews v
    JOIN boarding_houses b ON b.boarding_house_id = v.boarding_house_id JOIN users u ON u.user_id = b.landlord_id
    WHERE ' . PUBLIC_LISTING . ' AND v.rating = 5 ORDER BY v.created_at DESC, v.review_id DESC LIMIT 3')->fetchAll();
  ok([
    'count' => (int) $totals['n'],
    'average' => $totals['n'] ? round((float) $totals['average'], 2) : 0,
    'reviews' => array_map(function ($row) {
      // The listing's name and landlord let the app match it to the listings it shows.
      return public_review($row) + ['listing' => ['id' => (int) $row['boarding_house_id'], 'name' => $row['listing_name'], 'landlord' => ['name' => trim($row['first_name'] . ' ' . $row['last_name'])]]];
    }, $rows),
  ]);
}

// The id of a public listing, or a 404 (a lighter check than loading the whole listing).
function public_listing_id_or_404($id)
{
  $stmt = db()->prepare('SELECT b.boarding_house_id FROM boarding_houses b WHERE ' . PUBLIC_LISTING . ' AND b.boarding_house_id = ?');
  $stmt->execute([ctype_digit((string) $id) ? (int) $id : 0]);
  return (int) ($stmt->fetchColumn() ?: fail(404, 'This listing isn’t available. It may have been removed.'));
}

function public_listing_or_404($id)
{
  if (!ctype_digit((string) $id)) fail(404, 'This listing isn’t available.');
  $listings = load_listings(PUBLIC_LISTING . ' AND b.boarding_house_id = ?', [(int) $id]);
  if (!$listings) fail(404, 'This listing isn’t available. It may have been removed or is waiting for approval.');
  return $listings[0];
}

// Listings matching $where, with their rent range, room counts, room types, amenities,
// bills, photos and rating. The lists are loaded in a few queries for all listings at once.
function load_listings($where, $args, $having = '', $order = 'b.boarding_house_id ASC')
{
  $stmt = db()->prepare("SELECT b.*, u.first_name, u.last_name, u.phone_number,
      MIN(r.monthly_rent) AS rent_min, MAX(r.monthly_rent) AS rent_max,
      COUNT(r.room_id) AS rooms_total,
      COALESCE(SUM(r.is_open = 1 AND r.slots_taken < r.capacity), 0) AS rooms_open,
      COALESCE(SUM(CASE WHEN r.is_open = 1 AND r.slots_taken < r.capacity THEN r.capacity - r.slots_taken ELSE 0 END), 0) AS free_slots
    FROM boarding_houses b
    JOIN users u ON u.user_id = b.landlord_id
    LEFT JOIN rooms r ON r.boarding_house_id = b.boarding_house_id
    WHERE $where
    GROUP BY b.boarding_house_id
    $having
    ORDER BY $order");
  $stmt->execute($args);
  $rows = $stmt->fetchAll();
  if (!$rows) return [];

  $ids = array_column($rows, 'boarding_house_id');
  $in = implode(',', array_map('intval', $ids));
  $grouped = function ($sql) {
    $out = [];
    foreach (db()->query($sql) as $row) $out[$row['id']][] = $row;
    return $out;
  };
  // Most common room type first.
  $types = $grouped("SELECT r.boarding_house_id AS id, t.room_type_name AS name, COUNT(*) AS n FROM rooms r
    JOIN room_types t ON t.room_type_id = r.room_type_id WHERE r.boarding_house_id IN ($in)
    GROUP BY r.boarding_house_id, t.room_type_id ORDER BY n DESC, t.room_type_id");
  $amenities = $grouped("SELECT ba.boarding_house_id AS id, a.amenity_name AS name FROM boarding_house_amenities ba
    JOIN amenities a ON a.amenity_id = ba.amenity_id WHERE ba.boarding_house_id IN ($in) ORDER BY a.amenity_id");
  $utilities = $grouped("SELECT bu.boarding_house_id AS id, u.utility_name AS name, bu.billing_policy AS billing FROM boarding_house_utilities bu
    JOIN utilities u ON u.utility_id = bu.utility_id WHERE bu.boarding_house_id IN ($in) ORDER BY u.utility_id");
  $photos = $grouped("SELECT boarding_house_id AS id, image_path AS path FROM images
    WHERE boarding_house_id IN ($in) AND room_id IS NULL ORDER BY is_primary DESC, image_id");
  $ratings = $grouped("SELECT boarding_house_id AS id, AVG(rating) AS average, COUNT(*) AS n FROM reviews
    WHERE boarding_house_id IN ($in) GROUP BY boarding_house_id");

  return array_map(function ($row) use ($types, $amenities, $utilities, $photos, $ratings) {
    $id = $row['boarding_house_id'];
    $bool = function ($value) {
      return $value === null ? null : (bool) $value;
    };
    return [
      'id' => (int) $id,
      'name' => $row['name'],
      'address' => $row['address'],
      'area' => $row['area'],
      'city' => 'Baybay City',
      'description' => $row['description'] ?? '',
      'landlord' => [
        'id' => (int) $row['landlord_id'],
        'name' => trim($row['first_name'] . ' ' . $row['last_name']),
        // The listing's own number, else the landlord's.
        'phone' => $row['contact_number'] ?: ($row['phone_number'] ?: null),
      ],
      'rent' => $row['rent_min'] === null ? null : ['min' => (int) round($row['rent_min']), 'max' => (int) round($row['rent_max'])],
      'roomTypes' => array_column($types[$id] ?? [], 'name'),
      'roomCounts' => ['total' => (int) $row['rooms_total'], 'open' => (int) $row['rooms_open'], 'freeSlots' => (int) $row['free_slots']],
      'amenities' => array_column($amenities[$id] ?? [], 'name'),
      'utilities' => array_map(function ($utility) {
        return ['name' => $utility['name'], 'billing' => $utility['billing']];
      }, $utilities[$id] ?? []),
      'houseRules' => array_values(array_filter(array_map('trim', explode("\n", (string) $row['house_rules'])))),
      'stayTerms' => [
        'curfew' => $row['curfew'],
        'minimumStayMonths' => $row['minimum_stay_months'] === null ? null : (int) $row['minimum_stay_months'],
        'paymentMethods' => array_values(array_filter(array_map('trim', explode(',', (string) $row['payment_methods'])))),
        'genderPolicy' => $row['gender_policy'] ?? 'any',
        'visitorsAllowed' => $bool($row['visitors_allowed']),
        'petsAllowed' => $bool($row['pets_allowed']),
        'cookingAllowed' => $bool($row['cooking_allowed']),
      ],
      'coords' => $row['latitude'] === null ? null : [(float) $row['latitude'], (float) $row['longitude']],
      // Paths relative to backend/, e.g. "uploads/listings/….jpg". Cover first.
      'photos' => array_column($photos[$id] ?? [], 'path'),
      'rating' => isset($ratings[$id]) ? ['average' => round((float) $ratings[$id][0]['average'], 2), 'count' => (int) $ratings[$id][0]['n']] : ['average' => 0, 'count' => 0],
      'views' => (int) $row['views'],
      'listedAt' => date(DATE_ATOM, strtotime($row['moderated_at'] ?? $row['created_at'])),
    ];
  }, $rows);
}
