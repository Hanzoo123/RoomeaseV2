<?php
// A landlord's own listings: add one, edit it, send it back for review after an admin asked
// for changes, delete it, and keep each room's free slots up to date.
// New and resubmitted listings land in AdminLTE > Listings > In review. Edits to a live
// listing show right away, as the React form tells the landlord.

const LISTING_BODY_LIMIT = 7 * 1024 * 1024; // PHP's post_max_size is 8 MB in WAMP
const MAX_LISTING_PHOTOS = 5;
const LISTING_PHOTO_SIDE = 1600;
const MAX_ROOMS = 50;
const MAX_HOUSE_RULES = 10;
const CURFEW_LENGTH = 60;
// Listings a landlord deleted are gone for them; ones an admin removed stay, with the reason.
const OWN_LISTING = 'b.landlord_id = ? AND (b.deleted_at IS NULL OR b.deleted_by IS NULL OR b.deleted_by <> b.landlord_id)';

// A photo that passed the checks but GD still couldn't open.
class PhotoProblem extends RuntimeException
{
}

// GET /landlord/listings: every listing of the signed-in landlord, newest first.
function route_landlord_listings()
{
  $user = require_user('landlord');
  ok(['listings' => own_listings($user['user_id'])]);
}

// POST /landlord/listings: a new listing, which waits for an admin's review.
function route_create_listing()
{
  $user = require_user('landlord');
  $form = read_listing_form($user, null);
  $id = save_listing_atomically($form, function () use ($user, $form) {
    db()->prepare("INSERT INTO boarding_houses (landlord_id, name, address, area, moderation_status, submitted_at, created_by, updated_by)
      VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?)")
      ->execute([$user['user_id'], $form['name'], $form['address'], $form['area'], $user['user_id'], $user['user_id']]);
    return (int) db()->lastInsertId();
  });
  audit('listing.submitted', 'listing', $id, $form['name']);
  ok(['listing' => own_listing($user['user_id'], $id)], 201);
}

// PUT /landlord/listings/{id}: saves changes. A listing that was sent back goes to the
// review queue again; a live or waiting one keeps its status.
function route_update_listing($params)
{
  $user = require_user('landlord');
  $listing = own_listing_row($user['user_id'], $params['id']);
  if ($listing['deleted_at']) fail(409, 'An administrator removed this listing, so it can’t be edited. Contact RoomEase if you think this is a mistake.');
  $form = read_listing_form($user, $listing);
  $resubmit = $listing['moderation_status'] === 'rejected';

  save_listing_atomically($form, function () use ($user, $form, $listing, $resubmit) {
    $set = $resubmit ? ", moderation_status = 'pending', rejection_reason = NULL, submitted_at = NOW()" : '';
    db()->prepare("UPDATE boarding_houses SET name = ?, address = ?, area = ?, updated_by = ? $set WHERE boarding_house_id = ?")
      ->execute([$form['name'], $form['address'], $form['area'], $user['user_id'], $listing['boarding_house_id']]);
    return (int) $listing['boarding_house_id'];
  });
  audit($resubmit ? 'listing.resubmitted' : 'listing.updated', 'listing', $listing['boarding_house_id'], $form['name']);
  ok(['listing' => own_listing($user['user_id'], $listing['boarding_house_id']), 'resubmitted' => $resubmit]);
}

// DELETE /landlord/listings/{id}: hidden from everyone. Kept in MySQL (admins see it under
// Removed), and requests still waiting for an answer are declined.
function route_delete_listing($params)
{
  $user = require_user('landlord');
  $listing = own_listing_row($user['user_id'], $params['id']);
  $id = (int) $listing['boarding_house_id'];
  $pdo = db();
  $pdo->beginTransaction();
  $pdo->prepare("UPDATE boarding_houses SET deleted_at = COALESCE(deleted_at, NOW()), deleted_by = ?,
      removal_reason = COALESCE(removal_reason, 'Deleted by the landlord.'), updated_by = ? WHERE boarding_house_id = ?")
    ->execute([$user['user_id'], $user['user_id'], $id]);
  $pdo->prepare("UPDATE reservations SET status = 'declined', landlord_note = 'The landlord took this listing down.', decided_at = NOW(), updated_by = ?
      WHERE status = 'pending' AND room_id IN (SELECT room_id FROM rooms WHERE boarding_house_id = ?)")
    ->execute([$user['user_id'], $id]);
  $pdo->commit();
  audit('listing.deleted', 'listing', $id, $listing['name']);
  ok(null);
}

// PATCH /landlord/rooms/{id} { slotsTaken?, isOpen? }: the Room Availability page.
function route_update_room($params)
{
  $user = require_user('landlord');
  $stmt = db()->prepare('SELECT r.*, b.landlord_id, b.deleted_at FROM rooms r JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id
    WHERE r.room_id = ? AND b.landlord_id = ?');
  $stmt->execute([ctype_digit((string) $params['id']) ? (int) $params['id'] : 0, $user['user_id']]);
  $room = $stmt->fetch();
  if (!$room) fail(404, 'That room wasn’t found. It may have been deleted.');
  if ($room['deleted_at']) fail(409, 'This listing was removed, so its rooms can’t be changed.');

  $body = body();
  $taken = (int) $room['slots_taken'];
  $open = (bool) $room['is_open'];
  if (array_key_exists('slotsTaken', $body)) {
    if (!is_int($body['slotsTaken']) || $body['slotsTaken'] < 0 || $body['slotsTaken'] > $room['capacity']) {
      fail(422, "Occupied beds must be between 0 and {$room['capacity']} for {$room['name']}.");
    }
    $taken = $body['slotsTaken'];
  }
  if (array_key_exists('isOpen', $body)) {
    if (!is_bool($body['isOpen'])) fail(422, 'isOpen must be true or false.');
    $open = $body['isOpen'];
  }
  db()->prepare('UPDATE rooms SET slots_taken = ?, is_open = ?, updated_by = ? WHERE room_id = ?')
    ->execute([$taken, (int) $open, $user['user_id'], $room['room_id']]);
  ok(['listing' => own_listing($user['user_id'], $room['boarding_house_id'])]);
}

// ---------- Loading ----------

// The landlord's listings in the public shape (see load_listings) plus what only the
// landlord sees: review status, the admin's reason, every room, and the photo ids.
function own_listings($landlordId, $listingId = null)
{
  $where = OWN_LISTING;
  $args = [$landlordId];
  if ($listingId !== null) {
    $where .= ' AND b.boarding_house_id = ?';
    $args[] = (int) $listingId;
  }
  $listings = load_listings($where, $args, '', 'COALESCE(b.submitted_at, b.created_at) DESC, b.boarding_house_id DESC');
  if (!$listings) return [];

  $in = implode(',', array_map('intval', array_column($listings, 'id')));
  $status = [];
  foreach (db()->query("SELECT * FROM boarding_houses WHERE boarding_house_id IN ($in)") as $row) $status[$row['boarding_house_id']] = $row;
  $rooms = [];
  foreach (db()->query("SELECT r.*, t.room_type_name,
      (SELECT COUNT(*) FROM reservations v WHERE v.room_id = r.room_id AND v.status IN ('pending', 'accepted')) AS active_requests
    FROM rooms r JOIN room_types t ON t.room_type_id = r.room_type_id
    WHERE r.boarding_house_id IN ($in) ORDER BY r.room_id") as $room) {
    $rooms[$room['boarding_house_id']][] = [
      'id' => (int) $room['room_id'],
      'name' => $room['name'],
      'type' => $room['room_type_name'],
      'rent' => (int) round($room['monthly_rent']),
      'capacity' => (int) $room['capacity'],
      'slotsTaken' => (int) $room['slots_taken'],
      'freeSlots' => $room['is_open'] ? max(0, $room['capacity'] - $room['slots_taken']) : 0,
      'isOpen' => (bool) $room['is_open'],
      'description' => $room['description'],
      // Pending or accepted requests: such a room can be closed but not deleted.
      'activeRequests' => (int) $room['active_requests'],
    ];
  }
  // Same order as load_listings' photos (cover first).
  $photoIds = [];
  foreach (db()->query("SELECT boarding_house_id, image_id FROM images WHERE boarding_house_id IN ($in) AND room_id IS NULL
    ORDER BY is_primary DESC, image_id") as $photo) $photoIds[$photo['boarding_house_id']][] = (int) $photo['image_id'];

  return array_map(function ($listing) use ($status, $rooms, $photoIds) {
    $row = $status[$listing['id']];
    $date = function ($value) {
      return $value ? date(DATE_ATOM, strtotime($value)) : null;
    };
    return $listing + [
      'status' => $row['moderation_status'],
      'rejectionReason' => $row['moderation_status'] === 'rejected' ? $row['rejection_reason'] : null,
      'removed' => $row['deleted_at'] !== null,
      'removalReason' => $row['deleted_at'] !== null ? $row['removal_reason'] : null,
      'submittedAt' => $date($row['submitted_at'] ?? $row['created_at']),
      'moderatedAt' => $date($row['moderated_at']),
      'createdAt' => $date($row['created_at']),
      'rooms' => $rooms[$listing['id']] ?? [],
      'photoIds' => $photoIds[$listing['id']] ?? [],
    ];
  }, $listings);
}

function own_listing($landlordId, $listingId)
{
  return own_listings($landlordId, $listingId)[0] ?? null;
}

// The raw row of one of the landlord's listings, or a 404 (also for other landlords' listings).
function own_listing_row($landlordId, $id)
{
  if (!ctype_digit((string) $id)) fail(404, 'Listing not found.');
  $stmt = db()->prepare('SELECT b.* FROM boarding_houses b WHERE ' . OWN_LISTING . ' AND b.boarding_house_id = ?');
  $stmt->execute([$landlordId, (int) $id]);
  return $stmt->fetch() ?: fail(404, 'Listing not found. It may have been deleted, or it belongs to another landlord.');
}

// ---------- Saving ----------

// Checks the whole form and answers 422 with a message per field, e.g.
// { name: '…', 'rooms.1.rent': '…' }. Returns the values ready for MySQL.
function read_listing_form($user, $existing)
{
  $body = body(LISTING_BODY_LIMIT);
  $errors = [];
  $text = function ($key) use ($body) {
    return is_string($body[$key] ?? null) ? trim($body[$key]) : '';
  };
  $flag = function ($key) use ($body, &$errors) {
    $value = $body[$key] ?? null;
    if ($value !== null && !is_bool($value)) $errors[$key] = 'Choose yes or no.';
    return $value === null ? null : (int) $value;
  };
  $form = ['id' => $existing ? (int) $existing['boarding_house_id'] : null];

  $form['name'] = $text('name');
  if ($form['name'] === '') $errors['name'] = 'Enter the name of your boarding house.';
  elseif (mb_strlen($form['name']) > 150) $errors['name'] = 'Keep the name under 150 characters.';
  else {
    $same = db()->prepare('SELECT COUNT(*) FROM boarding_houses b WHERE ' . OWN_LISTING . ' AND b.name = ? AND b.boarding_house_id <> ?');
    $same->execute([$user['user_id'], $form['name'], $form['id'] ?? 0]);
    if ($same->fetchColumn()) $errors['name'] = 'You already have a listing with this name.';
  }
  $form['area'] = $text('area');
  if (!in_array($form['area'], AREAS, true)) $errors['area'] = 'Choose one of the areas in the list.';
  $form['address'] = $text('address');
  if ($form['address'] === '') $errors['address'] = 'Enter the street address so boarders can find it.';
  elseif (mb_strlen($form['address']) > 255) $errors['address'] = 'Keep the address under 255 characters.';
  $form['description'] = $text('description');
  if (mb_strlen($form['description']) > 2000) $errors['description'] = 'Keep the description under 2,000 characters.';

  // Stay terms. null means "not stated" and shows as "Ask the landlord".
  $form['curfew'] = $text('curfew') ?: null;
  if ($form['curfew'] && mb_strlen($form['curfew']) > CURFEW_LENGTH) $errors['curfew'] = 'Keep the curfew short, e.g. 10:00 PM.';
  $stay = $body['minimumStayMonths'] ?? null;
  if ($stay !== null && (!is_int($stay) || $stay < 1 || $stay > 24)) $errors['minimumStayMonths'] = 'Choose a minimum stay of 1 to 24 months.';
  $form['minimumStayMonths'] = $stay;
  $methods = string_list($body['paymentMethods'] ?? []);
  if ($methods === null || array_diff($methods, PAYMENT_METHODS)) $errors['paymentMethods'] = 'Choose from ' . implode(', ', PAYMENT_METHODS) . '.';
  $form['paymentMethods'] = implode(',', array_intersect(PAYMENT_METHODS, $methods ?? [])) ?: null;
  $form['genderPolicy'] = $body['genderPolicy'] ?? 'any';
  if (!in_array($form['genderPolicy'], ['any', 'female', 'male'], true)) $errors['genderPolicy'] = 'Choose who can stay.';
  foreach (['visitorsAllowed', 'petsAllowed', 'cookingAllowed'] as $key) $form[$key] = $flag($key);

  $rules = string_list($body['houseRules'] ?? []);
  if ($rules === null) $errors['houseRules'] = 'Write one rule per line.';
  $rules = array_values(array_filter(array_map(function ($rule) {
    return trim(preg_replace('/\s+/', ' ', $rule));
  }, $rules ?? []), 'strlen'));
  if (count($rules) > MAX_HOUSE_RULES) $errors['houseRules'] = 'Keep it to ' . MAX_HOUSE_RULES . ' rules or fewer.';
  elseif (array_filter($rules, function ($rule) {
    return mb_strlen($rule) > 120;
  })) $errors['houseRules'] = 'Keep each rule under 120 characters.';
  $form['houseRules'] = $rules ? implode("\n", $rules) : null;

  // Map pin: anywhere in the Philippines.
  $coords = $body['coords'] ?? null;
  $form['coords'] = null;
  if ($coords !== null) {
    if (!is_array($coords) || count($coords) !== 2 || !is_numeric($coords[0] ?? null) || !is_numeric($coords[1] ?? null)
      || $coords[0] < 4.5 || $coords[0] > 21.5 || $coords[1] < 116 || $coords[1] > 127) {
      $errors['coords'] = 'Drop the pin on your boarding house in Baybay City.';
    } else {
      $form['coords'] = [round((float) $coords[0], 6), round((float) $coords[1], 6)];
    }
  }

  // Amenities and bills from the shared lists.
  $known = db()->query('SELECT amenity_name, amenity_id FROM amenities WHERE landlord_id IS NULL')->fetchAll(PDO::FETCH_KEY_PAIR);
  $amenities = string_list($body['amenities'] ?? []);
  if (!$amenities) $errors['amenities'] = 'Pick at least one amenity.';
  elseif (array_diff($amenities, array_keys($known))) $errors['amenities'] = 'Pick amenities from the list.';
  $form['amenityIds'] = array_values(array_intersect_key($known, array_flip($amenities ?? [])));

  $knownBills = db()->query('SELECT utility_name, utility_id FROM utilities WHERE landlord_id IS NULL')->fetchAll(PDO::FETCH_KEY_PAIR);
  $form['utilities'] = [];
  $bills = $body['utilities'] ?? [];
  foreach (is_array($bills) ? $bills : [] as $bill) {
    $name = is_array($bill) && is_string($bill['name'] ?? null) ? $bill['name'] : '';
    $billing = is_array($bill) && is_string($bill['billing'] ?? null) ? trim($bill['billing']) : '';
    if (!isset($knownBills[$name])) {
      $errors['utilities'] = 'Pick bills from the list.';
    } elseif (mb_strlen($billing) > 150) {
      $errors['utilities'] = 'Keep each billing note under 150 characters.';
    } else {
      $form['utilities'][$knownBills[$name]] = $billing ?: 'Included in rent';
    }
  }

  $form['rooms'] = read_rooms($body['rooms'] ?? null, $existing, $errors);
  $form['photos'] = read_photos($body['photos'] ?? [], $existing, $errors);

  if ($errors) fail(422, count($errors) === 1 ? reset($errors) : 'Please fix the highlighted fields.', $errors);
  return $form;
}

// rooms: [{ id?, name, type, rent, capacity, slotsTaken, isOpen, description? }]
function read_rooms($rooms, $existing, &$errors)
{
  if (!is_array($rooms) || !$rooms) {
    $errors['rooms'] = 'Add at least one room.';
    return [];
  }
  if (count($rooms) > MAX_ROOMS) {
    $errors['rooms'] = 'A listing can have up to ' . MAX_ROOMS . ' rooms.';
    return [];
  }
  $types = db()->query('SELECT room_type_name, room_type_id FROM room_types')->fetchAll(PDO::FETCH_KEY_PAIR);
  $saved = [];
  if ($existing) {
    $stmt = db()->prepare("SELECT r.room_id, r.name, (SELECT COUNT(*) FROM reservations v WHERE v.room_id = r.room_id AND v.status IN ('pending', 'accepted')) AS active
      FROM rooms r WHERE r.boarding_house_id = ?");
    $stmt->execute([$existing['boarding_house_id']]);
    foreach ($stmt as $row) $saved[(int) $row['room_id']] = $row;
  }

  $out = [];
  $names = [];
  foreach (array_values($rooms) as $i => $room) {
    $key = function ($field) use ($i) {
      return "rooms.$i.$field";
    };
    if (!is_array($room)) {
      $errors[$key('name')] = 'Fill in this room.';
      continue;
    }
    $id = $room['id'] ?? null;
    if ($id !== null && (!is_int($id) || !isset($saved[$id]))) {
      $errors[$key('name')] = 'This room was deleted. Reload the page and try again.';
      continue;
    }
    $name = is_string($room['name'] ?? null) ? trim($room['name']) : '';
    $lower = mb_strtolower($name);
    if ($name === '') $errors[$key('name')] = 'Name the room, e.g. Room 1.';
    elseif (mb_strlen($name) > 60) $errors[$key('name')] = 'Keep the room name under 60 characters.';
    elseif (isset($names[$lower])) $errors[$key('name')] = 'Two rooms can’t have the same name.';
    $names[$lower] = true;

    $type = $room['type'] ?? '';
    if (!is_string($type) || !isset($types[$type])) $errors[$key('type')] = 'Choose a room type.';
    $rent = $room['rent'] ?? null;
    if (!is_int($rent) || $rent < 100 || $rent > 100000) $errors[$key('rent')] = 'Enter the monthly rent in pesos (100 to 100,000).';
    $capacity = $room['capacity'] ?? null;
    if (!is_int($capacity) || $capacity < 1 || $capacity > 100) $errors[$key('capacity')] = 'Beds must be 1 to 100.';
    $taken = $room['slotsTaken'] ?? 0;
    if (!is_int($taken) || $taken < 0 || (is_int($capacity) && $taken > $capacity)) $errors[$key('slotsTaken')] = 'Occupied beds can’t be more than the beds in the room.';
    $open = $room['isOpen'] ?? true;
    if (!is_bool($open)) $errors[$key('isOpen')] = 'Choose open or closed.';
    $description = is_string($room['description'] ?? null) ? trim($room['description']) : '';
    if (mb_strlen($description) > 500) $errors[$key('description')] = 'Keep the room note under 500 characters.';

    $out[] = [
      'id' => $id,
      'name' => $name,
      'typeId' => $types[$type] ?? null,
      'rent' => $rent,
      'capacity' => $capacity,
      'slotsTaken' => $taken,
      'isOpen' => (int) (bool) $open,
      'description' => $description ?: null,
    ];
  }

  // Rooms left out are deleted, which would delete their requests too, so those stay.
  $kept = array_filter(array_column($out, 'id'));
  foreach ($saved as $id => $row) {
    if (!in_array($id, $kept, true) && $row['active'] > 0) {
      $errors['rooms'] = "{$row['name']} has booking requests or boarders, so it can’t be deleted. Close it instead.";
    }
  }
  return ['list' => $out, 'delete' => array_values(array_diff(array_keys($saved), $kept))];
}

// photos: [{ id } | { data: "data:image/jpeg;base64,…" }] in order; the first is the cover.
function read_photos($photos, $existing, &$errors)
{
  if (!is_array($photos)) $photos = [];
  if (count($photos) > MAX_LISTING_PHOTOS) {
    $errors['photos'] = 'You can add up to ' . MAX_LISTING_PHOTOS . ' photos.';
    return ['list' => [], 'delete' => []];
  }
  $saved = [];
  if ($existing) {
    $stmt = db()->prepare('SELECT image_id, image_path FROM images WHERE boarding_house_id = ? AND room_id IS NULL');
    $stmt->execute([$existing['boarding_house_id']]);
    $saved = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
  }
  $list = [];
  foreach (array_values($photos) as $i => $photo) {
    $what = 'Photo ' . ($i + 1);
    if (is_array($photo) && isset($photo['id'])) {
      if (!is_int($photo['id']) || !isset($saved[$photo['id']])) $errors['photos'] = "$what was already removed. Reload the page and try again.";
      else $list[] = ['id' => $photo['id'], 'path' => $saved[$photo['id']]];
    } elseif (is_array($photo) && isset($photo['data'])) {
      require_gd();
      $problem = photo_problem($photo['data'], $what, 3 * 1024 * 1024, 4096);
      if ($problem) $errors['photos'] = $problem;
      else $list[] = ['data' => $photo['data'], 'what' => $what];
    } else {
      $errors['photos'] = "$what is missing.";
    }
  }
  $kept = array_filter(array_column($list, 'id'));
  return ['list' => $list, 'delete' => array_diff_key($saved, array_flip($kept))];
}

// Runs $saveHouse (which inserts or updates the boarding_houses row and returns its id),
// then the details, all in one transaction. New photo files are removed if anything fails.
function save_listing_atomically($form, $saveHouse)
{
  $pdo = db();
  $newFiles = [];
  $pdo->beginTransaction();
  try {
    $id = $saveHouse();
    $pdo->prepare('UPDATE boarding_houses SET description = ?, house_rules = ?, curfew = ?, minimum_stay_months = ?, payment_methods = ?,
        gender_policy = ?, visitors_allowed = ?, pets_allowed = ?, cooking_allowed = ?, latitude = ?, longitude = ? WHERE boarding_house_id = ?')
      ->execute([
        $form['description'] ?: null, $form['houseRules'], $form['curfew'], $form['minimumStayMonths'], $form['paymentMethods'],
        $form['genderPolicy'], $form['visitorsAllowed'], $form['petsAllowed'], $form['cookingAllowed'],
        $form['coords'][0] ?? null, $form['coords'][1] ?? null, $id,
      ]);

    $pdo->prepare('DELETE FROM boarding_house_amenities WHERE boarding_house_id = ?')->execute([$id]);
    $add = $pdo->prepare('INSERT INTO boarding_house_amenities (boarding_house_id, amenity_id) VALUES (?, ?)');
    foreach ($form['amenityIds'] as $amenityId) $add->execute([$id, $amenityId]);
    $pdo->prepare('DELETE FROM boarding_house_utilities WHERE boarding_house_id = ?')->execute([$id]);
    $add = $pdo->prepare('INSERT INTO boarding_house_utilities (boarding_house_id, utility_id, billing_policy) VALUES (?, ?, ?)');
    foreach ($form['utilities'] as $utilityId => $billing) $add->execute([$id, $utilityId, $billing]);

    save_rooms($id, $form['rooms']);
    $oldFiles = save_photos($id, $form['photos'], $newFiles);
    $pdo->commit();
  } catch (Throwable $error) {
    $pdo->rollBack();
    foreach ($newFiles as $path) remove_photo($path, 'listings');
    if ($error instanceof PhotoProblem) fail(422, $error->getMessage(), ['photos' => $error->getMessage()]);
    throw $error;
  }
  // Only once MySQL no longer points at them.
  foreach ($oldFiles as $path) remove_photo($path, 'listings');
  return $id;
}

function save_rooms($listingId, $rooms)
{
  $pdo = db();
  $user = current_user();
  if ($rooms['delete']) {
    $pdo->prepare('DELETE FROM rooms WHERE boarding_house_id = ? AND room_id IN (' . implode(',', array_map('intval', $rooms['delete'])) . ')')
      ->execute([$listingId]);
  }
  // Renaming "Room 1" to "Room 2" while another room gives up "Room 2" would trip the
  // unique name, so kept rooms get a temporary name first.
  $kept = array_filter(array_column($rooms['list'], 'id'));
  if ($kept) {
    $pdo->prepare("UPDATE rooms SET name = CONCAT('~', room_id) WHERE boarding_house_id = ? AND room_id IN (" . implode(',', array_map('intval', $kept)) . ')')
      ->execute([$listingId]);
  }
  $update = $pdo->prepare('UPDATE rooms SET name = ?, room_type_id = ?, monthly_rent = ?, capacity = ?, slots_taken = ?, is_open = ?, description = ?, updated_by = ?
    WHERE room_id = ? AND boarding_house_id = ?');
  $insert = $pdo->prepare('INSERT INTO rooms (boarding_house_id, name, room_type_id, monthly_rent, capacity, slots_taken, is_open, description, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  foreach ($rooms['list'] as $room) {
    $values = [$room['name'], $room['typeId'], $room['rent'], $room['capacity'], $room['slotsTaken'], $room['isOpen'], $room['description'], $user['user_id']];
    if ($room['id']) $update->execute([...$values, $room['id'], $listingId]);
    else $insert->execute([$listingId, ...array_slice($values, 0, 7), $user['user_id'], $user['user_id']]);
  }
}

// Saves new photos and sets the order (first = cover). The rows are re-added in order, since
// the photos are sorted by id. Returns the files of dropped photos, to delete after the commit.
function save_photos($listingId, $photos, &$newFiles)
{
  $user = current_user();
  db()->prepare('DELETE FROM images WHERE boarding_house_id = ? AND room_id IS NULL')->execute([$listingId]);
  $insert = db()->prepare('INSERT INTO images (boarding_house_id, image_path, is_primary, created_by, updated_by) VALUES (?, ?, ?, ?, ?)');
  foreach ($photos['list'] as $position => $photo) {
    if (isset($photo['path'])) {
      $path = $photo['path'];
    } else {
      $source = open_photo($photo['data']);
      if (!$source) throw new PhotoProblem("{$photo['what']} couldn’t be read. Try another one.");
      $fitted = fit_photo($source, LISTING_PHOTO_SIDE);
      imagedestroy($source);
      $path = $newFiles[] = save_photo($fitted, 'listings', 82);
      imagedestroy($fitted);
    }
    $insert->execute([$listingId, $path, (int) ($position === 0), $user['user_id'], $user['user_id']]);
  }
  return array_values($photos['delete']);
}

// A list of strings from the body, or null when it's something else.
function string_list($value)
{
  if (!is_array($value)) return null;
  foreach ($value as $item) if (!is_string($item)) return null;
  return array_values($value);
}
