<?php
// Emails about decisions, to the person each decision is about:
// - landlords, when an admin approves, sends back, removes or restores their listing (sent
//   from the admin panel, admin/includes/listing_actions.php);
// - boarders, when a landlord approves or declines their reservation request, or deletes the
//   listing they asked about (sent from the API).
// Only to active accounts with Settings > Notifications > "Email updates" on (and, for
// reservations, "Reservation updates" on too). When email isn't set up in .env, nothing is
// sent or logged. A failed email never undoes the decision; backend/logs/mail.log has it.

require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/preferences.php';

// The website's address, for links in emails: ROOMEASE_SITE_URL in .env (set it to the
// address people use, e.g. an ngrok or real domain), else the address of this request.
function site_url($path = '')
{
  $base = env_value('ROOMEASE_SITE_URL');
  if ($base === '') {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $folder = preg_replace('#/backend/.*$#', '', str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? ''));
    $base = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $folder;
  }
  return rtrim($base, '/') . '/' . ltrim($path, '/');
}

function wants_decision_email(PDO $pdo, array $person, $aboutReservations)
{
  if (!mail_enabled() || !$person['is_active'] || $person['deleted_at'] || !$person['email']) return false;
  $preferences = user_preferences($pdo, $person['user_id']);
  return $preferences['email_updates'] && (!$aboutReservations || $preferences['reservation_alerts']);
}

// Sends one decision email in RoomEase's style: a greeting, the paragraphs and a button.
function send_decision_email($to, $firstName, $subject, array $paragraphs, $buttonLabel, $url)
{
  $text = "Hi $firstName,\r\n\r\n" . implode("\r\n\r\n", $paragraphs) . "\r\n\r\n$buttonLabel: $url\r\n\r\nRoomEase\r\n";
  $e = function ($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
  };
  // Email apps ignore stylesheets, so the styles are inline.
  $html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>'
    . '<body style="margin:0;padding:32px 16px;background:#f5f7f6;">'
    . '<div style="max-width:480px;margin:0 auto;font-family:\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2a28;">'
    . '<p style="margin:0 0 28px;font-size:20px;font-weight:700;color:#166534;">RoomEase</p>'
    . '<p style="margin:0 0 16px;">Hi ' . $e($firstName) . ',</p>';
  foreach ($paragraphs as $paragraph) $html .= '<p style="margin:0 0 16px;">' . $e($paragraph) . '</p>';
  $html .= '<p style="margin:24px 0 0;"><a href="' . $e($url) . '" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#166534;color:#ffffff;text-decoration:none;font-weight:600;">' . $e($buttonLabel) . '</a></p>'
    . '<p style="margin:28px 0 0;color:#5c6b66;font-size:13px;">You get these because "Email updates" is on in your RoomEase settings.</p>'
    . '</div></body></html>';
  return send_mail($to, $subject, $text, $html);
}

// $action: approve, reject, remove or restore. True if sent; false or a reason if not.
function email_listing_decision(PDO $pdo, $listingId, $action, $reason = '')
{
  $stmt = $pdo->prepare('SELECT b.name, b.moderation_status, u.user_id, u.email, u.first_name, u.is_active, u.deleted_at
    FROM boarding_houses b JOIN users u ON u.user_id = b.landlord_id WHERE b.boarding_house_id = ?');
  $stmt->execute([$listingId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row || !wants_decision_email($pdo, $row, false)) return false;

  $name = '"' . $row['name'] . '"';
  $reason = trim((string) $reason);
  switch ($action) {
    case 'approve':
      $subject = "{$row['name']} is live on RoomEase";
      $paragraphs = ["Good news! $name is approved. Boarders can now find it, save it and request a room."];
      break;
    case 'reject':
      $subject = "{$row['name']} needs changes";
      $paragraphs = ["$name isn't approved yet.", "What to change: $reason", 'Edit the listing on RoomEase. When you save your changes, it goes back for review.'];
      break;
    case 'remove':
      $subject = "{$row['name']} was removed from RoomEase";
      $paragraphs = array_values(array_filter([
        "An administrator removed $name, so boarders can no longer see it.",
        $reason !== '' ? "Reason: $reason" : null,
        'If you think this is a mistake, contact the RoomEase team.',
      ]));
      break;
    case 'restore':
      $subject = "{$row['name']} is back on RoomEase";
      $after = ['approved' => ' Boarders can see it again.', 'pending' => ' It is waiting for an administrator\'s review before boarders can see it.', 'rejected' => ' It still needs the changes that were asked for before boarders can see it.'][$row['moderation_status']] ?? '';
      $paragraphs = ["$name was restored." . $after];
      break;
    default:
      return false;
  }
  return send_decision_email($row['email'], $row['first_name'], $subject, $paragraphs, 'Open your listing', site_url("landlord/listings/$listingId"));
}

// After a landlord approves or declines a request (or deletes the listing, which declines
// the requests still waiting). True if sent; false or a reason if not.
function email_reservation_decision(PDO $pdo, $reservationId)
{
  $stmt = $pdo->prepare('SELECT v.status, v.landlord_note, v.move_in_date, r.name AS room, b.name AS listing, b.contact_number,
      l.first_name AS l_first, l.last_name AS l_last, l.phone_number AS l_phone,
      u.user_id, u.email, u.first_name, u.is_active, u.deleted_at
    FROM reservations v JOIN rooms r ON r.room_id = v.room_id JOIN boarding_houses b ON b.boarding_house_id = r.boarding_house_id
    JOIN users l ON l.user_id = b.landlord_id JOIN users u ON u.user_id = v.boarder_id WHERE v.reservation_id = ?');
  $stmt->execute([$reservationId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row || !in_array($row['status'], ['accepted', 'declined'], true) || !wants_decision_email($pdo, $row, true)) return false;

  $landlord = trim($row['l_first'] . ' ' . $row['l_last']);
  $phone = $row['contact_number'] ?: $row['l_phone'];
  $moveIn = date('F j, Y', strtotime($row['move_in_date']));
  if ($row['status'] === 'accepted') {
    return send_decision_email($row['email'], $row['first_name'], "Your request at {$row['listing']} is approved", array_values(array_filter([
      "Good news! $landlord approved your request for {$row['room']} at {$row['listing']}, moving in on $moveIn.",
      $phone ? "Contact $landlord at $phone to arrange your move-in." : "Message $landlord on RoomEase to arrange your move-in.",
    ])), 'See your reservations', site_url('boarder/reservations'));
  }
  return send_decision_email($row['email'], $row['first_name'], "Your request at {$row['listing']} was declined", array_values(array_filter([
    "{$row['listing']} declined your request for {$row['room']}.",
    $row['landlord_note'] ? "Their reason: {$row['landlord_note']}" : null,
    'There are other rooms on RoomEase that may suit you.',
  ])), 'Find another room', site_url('rooms'));
}
