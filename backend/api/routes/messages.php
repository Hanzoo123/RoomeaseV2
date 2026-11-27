<?php
// Messages between a boarder and a landlord about one boarding house, each person's
// notifications, and the Contact Us form (which lands in the AdminLTE inbox).
// WAMP has no WebSockets, so the app polls: an open chat every few seconds, the rest every
// minute and when the tab regains focus.

const MESSAGE_MAX = 2000;
const MESSAGES_PER_MINUTE = 20;
const CONTACT_TOPICS = ['A listing is wrong', 'My account', 'Listing my boarding house', 'Something else'];

// ---------- Conversations ----------

// GET /conversations: newest activity first, each with its last message and unread count.
function route_conversations()
{
  $user = require_user();
  ok(['conversations' => load_conversations('(c.boarder_id = ? OR c.landlord_id = ?)', [$user['user_id'], $user['user_id']], $user)]);
}

// POST /conversations { listingId, boarderId? }: the conversation about that boarding house,
// started if needed. A boarder starts one about a live listing; a landlord, with a boarder
// who has asked for a room in one of their listings.
function route_start_conversation()
{
  $user = require_user();
  $body = body();
  $listingId = $body['listingId'] ?? null;
  if (!is_int($listingId)) fail(422, 'Choose a boarding house.');

  if ($user['role'] === 'boarder') {
    public_listing_id_or_404($listingId);
    $boarderId = (int) $user['user_id'];
  } else {
    own_listing_row($user['user_id'], $listingId);
    $boarderId = $body['boarderId'] ?? null;
    $stmt = db()->prepare('SELECT COUNT(*) FROM reservations v JOIN rooms r ON r.room_id = v.room_id WHERE v.boarder_id = ? AND r.boarding_house_id = ?');
    $stmt->execute([is_int($boarderId) ? $boarderId : 0, $listingId]);
    if (!$stmt->fetchColumn()) fail(403, 'You can message boarders who asked for a room in this listing.');
  }
  $stmt = db()->prepare('SELECT landlord_id FROM boarding_houses WHERE boarding_house_id = ?');
  $stmt->execute([$listingId]);
  $landlordId = (int) $stmt->fetchColumn();

  $insert = db()->prepare('INSERT IGNORE INTO conversations (boarding_house_id, boarder_id, landlord_id) VALUES (?, ?, ?)');
  $insert->execute([$listingId, $boarderId, $landlordId]);
  $conversation = load_conversations('c.boarding_house_id = ? AND c.boarder_id = ?', [$listingId, $boarderId], $user)[0];
  ok(['conversation' => $conversation], $insert->rowCount() ? 201 : 200);
}

// GET /conversations/{id}/messages?after=<message id>: oldest first; with `after`, only newer
// ones (what the app asks for while the chat is open).
function route_conversation_messages($params)
{
  $user = require_user();
  $conversation = conversation_or_404($params['id'], $user);
  $after = max(0, (int) ($_GET['after'] ?? 0));
  $stmt = db()->prepare('SELECT * FROM (SELECT * FROM messages WHERE conversation_id = ? AND message_id > ? ORDER BY message_id DESC LIMIT 500) newest ORDER BY message_id');
  $stmt->execute([$conversation['conversation_id'], $after]);
  ok([
    'messages' => array_map('public_message', $stmt->fetchAll()),
    // When the other person last opened the chat (for "Seen").
    'otherLastRead' => iso_or_null($conversation[$conversation['boarder_id'] == $user['user_id'] ? 'landlord_last_read' : 'boarder_last_read']),
  ]);
}

// POST /conversations/{id}/messages { body }
function route_send_message($params)
{
  $user = require_user();
  $conversation = conversation_or_404($params['id'], $user);
  $text = trim(str_replace("\r\n", "\n", input('body')));
  if ($text === '') fail(422, 'Write a message first.');
  if (mb_strlen($text) > MESSAGE_MAX) fail(422, 'Keep your message under ' . number_format(MESSAGE_MAX) . ' characters.');
  $stmt = db()->prepare('SELECT COUNT(*) FROM messages WHERE sender_id = ? AND created_at > NOW() - INTERVAL 1 MINUTE');
  $stmt->execute([$user['user_id']]);
  if ($stmt->fetchColumn() >= MESSAGES_PER_MINUTE) fail(429, 'You’re sending messages very quickly. Please wait a minute.');

  db()->prepare('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)')->execute([$conversation['conversation_id'], $user['user_id'], $text]);
  $id = (int) db()->lastInsertId();
  mark_read($conversation, $user);
  $stmt = db()->prepare('SELECT * FROM messages WHERE message_id = ?');
  $stmt->execute([$id]);
  ok(['message' => public_message($stmt->fetch())], 201);
}

// POST /conversations/{id}/read: the signed-in person has seen everything so far.
function route_read_conversation($params)
{
  $user = require_user();
  mark_read(conversation_or_404($params['id'], $user), $user);
  ok(null);
}

function mark_read($conversation, $user)
{
  $column = $conversation['boarder_id'] == $user['user_id'] ? 'boarder_last_read' : 'landlord_last_read';
  db()->prepare("UPDATE conversations SET $column = NOW() WHERE conversation_id = ?")->execute([$conversation['conversation_id']]);
}

// One of the signed-in person's conversations, or a 404.
function conversation_or_404($id, $user)
{
  $stmt = db()->prepare('SELECT * FROM conversations WHERE conversation_id = ? AND (boarder_id = ? OR landlord_id = ?)');
  $stmt->execute([ctype_digit((string) $id) ? (int) $id : 0, $user['user_id'], $user['user_id']]);
  return $stmt->fetch() ?: fail(404, 'That conversation wasn’t found.');
}

function load_conversations($where, $args, $user)
{
  $me = (int) $user['user_id'];
  $stmt = db()->prepare("SELECT c.*, b.name AS listing_name, b.landlord_id AS owner_id,
      bu.first_name AS b_first, bu.last_name AS b_last, bu.email AS b_email,
      lu.first_name AS l_first, lu.last_name AS l_last, lu.email AS l_email,
      lm.message_id AS last_id, lm.sender_id AS last_sender, lm.body AS last_body, lm.created_at AS last_at,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id AND (m.sender_id IS NULL OR m.sender_id <> ?)
        AND m.created_at > COALESCE(IF(c.boarder_id = ?, c.boarder_last_read, c.landlord_last_read), '1970-01-02')) AS unread
    FROM conversations c
    JOIN boarding_houses b ON b.boarding_house_id = c.boarding_house_id
    JOIN users bu ON bu.user_id = c.boarder_id
    JOIN users lu ON lu.user_id = c.landlord_id
    LEFT JOIN messages lm ON lm.message_id = (SELECT MAX(m2.message_id) FROM messages m2 WHERE m2.conversation_id = c.conversation_id)
    WHERE $where
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC, c.conversation_id DESC");
  $stmt->execute(array_merge([$me, $me], $args));
  return array_map(function ($row) {
    $landlord = ['id' => (int) $row['landlord_id'], 'name' => trim($row['l_first'] . ' ' . $row['l_last']), 'email' => $row['l_email']];
    return [
      'id' => (int) $row['conversation_id'],
      // The landlord's name lets the app match the listing to the listings it shows.
      'listing' => ['id' => (int) $row['boarding_house_id'], 'name' => $row['listing_name'], 'landlord' => ['id' => (int) $row['owner_id'], 'name' => $landlord['name']]],
      'boarder' => ['id' => (int) $row['boarder_id'], 'name' => trim($row['b_first'] . ' ' . $row['b_last']), 'email' => $row['b_email']],
      'landlord' => $landlord,
      'lastMessage' => $row['last_id'] ? public_message(['message_id' => $row['last_id'], 'sender_id' => $row['last_sender'], 'body' => $row['last_body'], 'created_at' => $row['last_at']]) : null,
      'unread' => (int) $row['unread'],
      'createdAt' => iso_or_null($row['created_at']),
    ];
  }, $stmt->fetchAll());
}

function public_message($row)
{
  return ['id' => (int) $row['message_id'], 'senderId' => $row['sender_id'] === null ? null : (int) $row['sender_id'], 'body' => $row['body'], 'date' => iso_or_null($row['created_at'])];
}

function iso_or_null($value)
{
  return $value ? date(DATE_ATOM, strtotime($value)) : null;
}

// ---------- Notifications ----------

// GET /notifications: the newest 100, and how many are unread.
function route_notifications()
{
  $user = require_user();
  ok(notification_list($user));
}

// POST /notifications/{id}/read
function route_read_notification($params)
{
  $user = require_user();
  db()->prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?')->execute([(int) $params['id'], $user['user_id']]);
  ok(notification_list($user));
}

// POST /notifications/read-all
function route_read_all_notifications()
{
  $user = require_user();
  db()->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')->execute([$user['user_id']]);
  ok(notification_list($user));
}

// DELETE /notifications/{id}
function route_delete_notification($params)
{
  $user = require_user();
  db()->prepare('DELETE FROM notifications WHERE notification_id = ? AND user_id = ?')->execute([(int) $params['id'], $user['user_id']]);
  ok(notification_list($user));
}

function notification_list($user)
{
  $stmt = db()->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, notification_id DESC LIMIT 100');
  $stmt->execute([$user['user_id']]);
  $unread = db()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
  $unread->execute([$user['user_id']]);
  return [
    'notifications' => array_map(function ($row) {
      // link: a page of the app, e.g. "/landlord/reservations" or "/landlord/listings/12".
      return ['id' => (int) $row['notification_id'], 'title' => $row['title'], 'body' => $row['body'], 'link' => $row['link'], 'read' => (bool) $row['is_read'], 'date' => iso_or_null($row['created_at'])];
    }, $stmt->fetchAll()),
    'unread' => (int) $unread->fetchColumn(),
  ];
}

// ---------- Contact Us ----------

// POST /contact { name, email, topic, message, website }. "website" is a field people never
// see: if it's filled in, a bot sent the form, and it's quietly dropped. Each email can send
// 3 messages an hour, and each IP address 10 (a school network shares one address).
function route_contact()
{
  $name = input('name');
  $email = input('email');
  $topic = input('topic');
  $message = trim(str_replace("\r\n", "\n", input('message')));
  if (input('website') !== '') ok(['sent' => true], 201);

  $fields = [];
  if ($name === '') $fields['name'] = 'Please tell us your name.';
  elseif (mb_strlen($name) > 100) $fields['name'] = 'Keep your name under 100 characters.';
  if (!valid_email($email)) $fields['email'] = 'Please give an email address we can reply to.';
  elseif (mb_strlen($email) > 150) $fields['email'] = 'Keep the email under 150 characters.';
  if (!in_array($topic, CONTACT_TOPICS, true)) $fields['topic'] = 'Choose what it is about.';
  if (mb_strlen($message) < 10) $fields['message'] = 'Please write a little more, so we know how to help.';
  elseif (mb_strlen($message) > 5000) $fields['message'] = 'Keep the message under 5,000 characters.';
  if ($fields) fail(422, reset($fields), $fields);
  fail_throttled('contact', $email, 'You have sent several messages already. Please try again in an hour.');

  db()->prepare('INSERT INTO contact_messages (name, email, topic, message, ip_address) VALUES (?, ?, ?, ?, ?)')
    ->execute([$name, $email, $topic, $message, client_ip()]);
  $user = current_user();
  record_try('contact', $email, $user['user_id'] ?? null);
  ok(['sent' => true], 201);
}
