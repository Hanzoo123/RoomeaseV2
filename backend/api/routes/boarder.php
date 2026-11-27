<?php
// What a boarder does with listings: save them, request a room, cancel a request, and review
// a place they stayed in. Landlords answer requests and reviews in routes/landlord.php.

const MAX_PENDING_REQUESTS = 5;
const REVIEW_MIN = 10;
const REVIEW_MAX = 1000;

// ---------- Favorites ----------

// GET /favorites: the ids of the listings the boarder saved, newest first.
function route_favorites()
{
  $user = require_user('boarder');
  ok(['ids' => favorite_ids($user['user_id'])]);
}

// PUT /favorites/{id}: saves a listing (saving it twice is fine).
function route_add_favorite($params)
{
  $user = require_user('boarder');
  $id = public_listing_id_or_404($params['id']);
  db()->prepare('INSERT IGNORE INTO favorites (user_id, boarding_house_id) VALUES (?, ?)')->execute([$user['user_id'], $id]);
  ok(['ids' => favorite_ids($user['user_id'])]);
}

// DELETE /favorites/{id}
function route_remove_favorite($params)
{
  $user = require_user('boarder');
  db()->prepare('DELETE FROM favorites WHERE user_id = ? AND boarding_house_id = ?')->execute([$user['user_id'], (int) $params['id']]);
  ok(['ids' => favorite_ids($user['user_id'])]);
}

function favorite_ids($userId)
{
  $stmt = db()->prepare('SELECT boarding_house_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC, favorite_id DESC');
  $stmt->execute([$userId]);
  return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

// ---------- Reservations ----------

// GET /reservations: the boarder's requests, newest first.
function route_my_reservations()
{
  $user = require_user('boarder');
  ok(['reservations' => load_reservations('v.boarder_id = ?', [$user['user_id']])]);
}

// POST /reservations { roomId, moveIn: "2026-12-01", message? }
function route_create_reservation()
{
  $user = require_user('boarder');
  $body = body();
  $roomId = $body['roomId'] ?? null;
  $stmt = db()->prepare('SELECT r.*, b.name AS listing_name, b.landlord_id, b.boarding_house_id AS listing_id FROM rooms r
    JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id WHERE r.room_id = ? AND ' . PUBLIC_LISTING);
  $stmt->execute([is_int($roomId) ? $roomId : 0]);
  $room = $stmt->fetch();
  if (!$room) fail(404, 'That room isn’t available any more. Reload the page to see the rooms that are.', ['roomId' => 'Choose a room.']);

  $fields = [];
  $moveIn = is_string($body['moveIn'] ?? null) ? $body['moveIn'] : '';
  $date = DateTime::createFromFormat('!Y-m-d', $moveIn);
  $today = new DateTime('today');
  if (!$date || $date->format('Y-m-d') !== $moveIn) $fields['moveIn'] = 'Choose your preferred move-in date.';
  elseif ($date < $today) $fields['moveIn'] = 'The move-in date can’t be in the past.';
  elseif ($date > (clone $today)->modify('+1 year')) $fields['moveIn'] = 'Choose a date within the next year.';
  $message = is_string($body['message'] ?? null) ? trim($body['message']) : '';
  if (mb_strlen($message) > 500) $fields['message'] = 'Keep your message under 500 characters.';
  if ($fields) fail(422, reset($fields), $fields);

  // One waiting request per boarding house, and only a few waiting at a time. (An earlier
  // approved stay doesn't block a new request, e.g. to move to another room.)
  $stmt = db()->prepare("SELECT COUNT(*) FROM reservations v JOIN rooms r ON r.room_id = v.room_id
    WHERE v.boarder_id = ? AND r.boarding_house_id = ? AND v.status = 'pending'");
  $stmt->execute([$user['user_id'], $room['listing_id']]);
  if ($stmt->fetchColumn()) fail(409, "You already have a request waiting at {$room['listing_name']}. Cancel it first if you want a different room.");
  $stmt = db()->prepare("SELECT COUNT(*) FROM reservations WHERE boarder_id = ? AND status = 'pending'");
  $stmt->execute([$user['user_id']]);
  if ($stmt->fetchColumn() >= MAX_PENDING_REQUESTS) {
    fail(409, 'You have ' . MAX_PENDING_REQUESTS . ' requests waiting for an answer. Cancel one, or wait for a landlord to reply.');
  }
  if (!$room['is_open'] || $room['slots_taken'] >= $room['capacity']) {
    fail(409, "{$room['name']} has no free bed right now. Choose another room.", ['roomId' => 'This room is full.']);
  }

  db()->prepare('INSERT INTO reservations (room_id, boarder_id, move_in_date, message, created_by) VALUES (?, ?, ?, ?, ?)')
    ->execute([$room['room_id'], $user['user_id'], $moveIn, $message ?: null, $user['user_id']]);
  $id = (int) db()->lastInsertId();
  $name = trim($user['first_name'] . ' ' . $user['last_name']);
  notify($room['landlord_id'], 'New reservation request', "$name wants {$room['name']} at {$room['listing_name']}, moving in " . $date->format('M j, Y') . '.', '/landlord/reservations');
  ok(['reservation' => load_reservations('v.reservation_id = ?', [$id])[0]], 201);
}

// POST /reservations/{id}/cancel: only while the landlord hasn't answered.
function route_cancel_reservation($params)
{
  $user = require_user('boarder');
  $rows = load_reservations('v.reservation_id = ? AND v.boarder_id = ?', [(int) $params['id'], $user['user_id']]);
  if (!$rows) fail(404, 'That request wasn’t found.');
  $reservation = $rows[0];
  if ($reservation['status'] !== 'pending') fail(409, 'The landlord already answered this request, so it can’t be cancelled here. Message them instead.');

  db()->prepare("UPDATE reservations SET status = 'cancelled', decided_at = NOW(), updated_by = ? WHERE reservation_id = ? AND status = 'pending'")
    ->execute([$user['user_id'], $reservation['id']]);
  $listing = $reservation['listing'];
  notify($listing['landlord']['id'], 'Reservation cancelled', "{$reservation['boarder']['name']} cancelled their request for {$reservation['room']['name']} at {$listing['name']}.", '/landlord/reservations');
  audit('reservation.cancelled', 'reservation', $reservation['id'], "{$reservation['boarder']['name']} · {$listing['name']}");
  ok(['reservation' => load_reservations('v.reservation_id = ?', [$reservation['id']])[0]]);
}

// Requests with their room, boarding house, landlord and boarder, newest first.
function load_reservations($where, $args)
{
  $stmt = db()->prepare("SELECT v.*, r.name AS room_name, r.monthly_rent, t.room_type_name, b.boarding_house_id, b.name AS listing_name,
      b.landlord_id, b.contact_number, l.first_name AS l_first, l.last_name AS l_last, l.phone_number AS l_phone,
      u.first_name AS u_first, u.last_name AS u_last, u.email AS u_email, u.phone_number AS u_phone
    FROM reservations v
    JOIN rooms r ON r.room_id = v.room_id
    JOIN room_types t ON t.room_type_id = r.room_type_id
    JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id
    JOIN users l ON l.user_id = b.landlord_id
    JOIN users u ON u.user_id = v.boarder_id
    WHERE $where
    ORDER BY v.created_at DESC, v.reservation_id DESC");
  $stmt->execute($args);
  return array_map(function ($row) {
    return [
      'id' => (int) $row['reservation_id'],
      'status' => $row['status'],
      'moveIn' => $row['move_in_date'],
      'message' => $row['message'],
      'landlordNote' => $row['landlord_note'],
      'createdAt' => date(DATE_ATOM, strtotime($row['created_at'])),
      'decidedAt' => $row['decided_at'] ? date(DATE_ATOM, strtotime($row['decided_at'])) : null,
      'room' => ['id' => (int) $row['room_id'], 'name' => $row['room_name'], 'type' => $row['room_type_name'], 'rent' => (int) round($row['monthly_rent'])],
      'listing' => [
        'id' => (int) $row['boarding_house_id'],
        'name' => $row['listing_name'],
        'landlord' => ['id' => (int) $row['landlord_id'], 'name' => trim($row['l_first'] . ' ' . $row['l_last']), 'phone' => $row['contact_number'] ?: ($row['l_phone'] ?: null)],
      ],
      'boarder' => ['id' => (int) $row['boarder_id'], 'name' => trim($row['u_first'] . ' ' . $row['u_last']), 'email' => $row['u_email'], 'phone' => $row['u_phone'] ?: null],
    ];
  }, $stmt->fetchAll());
}

// ---------- Reviews ----------

// POST /listings/{id}/reviews { rating, comment }: only after an accepted stay. Saving again
// edits the boarder's review (one per boarder per boarding house).
function route_save_review($params)
{
  $user = require_user('boarder');
  $id = public_listing_id_or_404($params['id']);
  if (!has_stayed($user['user_id'], $id)) fail(403, 'Only boarders who stayed here (an approved reservation) can review it.');
  $rating = body()['rating'] ?? null;
  $comment = input('comment');
  $fields = [];
  if (!is_int($rating) || $rating < 1 || $rating > 5) $fields['rating'] = 'Choose a star rating.';
  if (mb_strlen($comment) < REVIEW_MIN) $fields['comment'] = 'Write at least a short sentence (' . REVIEW_MIN . ' characters or more).';
  elseif (mb_strlen($comment) > REVIEW_MAX) $fields['comment'] = 'Keep your review under ' . number_format(REVIEW_MAX) . ' characters.';
  if ($fields) fail(422, reset($fields), $fields);

  $name = trim($user['first_name'] . ' ' . $user['last_name']);
  $stmt = db()->prepare('SELECT review_id FROM reviews WHERE boarding_house_id = ? AND boarder_id = ?');
  $stmt->execute([$id, $user['user_id']]);
  $existing = $stmt->fetchColumn();
  if ($existing) {
    db()->prepare('UPDATE reviews SET rating = ?, comment = ?, reviewer_name = ? WHERE review_id = ?')->execute([$rating, $comment, $name, $existing]);
  } else {
    db()->prepare('INSERT INTO reviews (boarding_house_id, boarder_id, reviewer_name, rating, comment) VALUES (?, ?, ?, ?, ?)')
      ->execute([$id, $user['user_id'], $name, $rating, $comment]);
    $stmt = db()->prepare('SELECT landlord_id, name FROM boarding_houses WHERE boarding_house_id = ?');
    $stmt->execute([$id]);
    $listing = $stmt->fetch();
    notify($listing['landlord_id'], 'New review', "$name rated {$listing['name']} $rating out of 5.", '/landlord/listings/' . $id);
  }
  ok(listing_reviews($id, $user), $existing ? 200 : 201);
}

// DELETE /reviews/{id}: the boarder's own review.
function route_delete_review($params)
{
  $user = require_user('boarder');
  $stmt = db()->prepare('SELECT boarding_house_id FROM reviews WHERE review_id = ? AND boarder_id = ?');
  $stmt->execute([(int) $params['id'], $user['user_id']]);
  $listingId = $stmt->fetchColumn();
  if (!$listingId) fail(404, 'That review wasn’t found.');
  db()->prepare('DELETE FROM reviews WHERE review_id = ?')->execute([(int) $params['id']]);
  ok(listing_reviews((int) $listingId, $user));
}

function has_stayed($userId, $listingId)
{
  $stmt = db()->prepare("SELECT COUNT(*) FROM reservations v JOIN rooms r ON r.room_id = v.room_id
    WHERE v.boarder_id = ? AND r.boarding_house_id = ? AND v.status = 'accepted'");
  $stmt->execute([$userId, $listingId]);
  return (bool) $stmt->fetchColumn();
}
