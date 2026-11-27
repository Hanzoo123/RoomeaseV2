<?php
// Removes the demo accounts that database/roomease.sql adds (their passwords are public in
// README.md), with everything that belongs to them: their listings, rooms, photos,
// reservations, reviews, messages and notifications, the sample Contact Us messages, and
// the activity log about them. Accounts and listings that aren't demo ones stay.
//
//   php backend/tools/remove-demo-data.php          shows what would be removed
//   php backend/tools/remove-demo-data.php --yes    backs up the database first, then removes it
//
// Create your own super admin first (php backend/tools/create-super-admin.php): this refuses
// to run without one, so you can still sign in to the admin panel afterwards.
require __DIR__ . '/lib.php';

$options = cli_options();
$pdo = tool_db();
$in = function (array $values) use ($pdo) {
  return $values ? implode(',', array_map([$pdo, 'quote'], $values)) : 'NULL';
};
$column = function ($sql) use ($pdo) {
  return $pdo->query($sql)->fetchAll(PDO::FETCH_COLUMN);
};
$count = function ($sql) use ($pdo) {
  return (int) $pdo->query($sql)->fetchColumn();
};

$users = $column('SELECT user_id FROM users WHERE email IN (' . $in(DEMO_EMAILS) . ')');
$u = $in($users);
$listings = $column("SELECT boarding_house_id FROM boarding_houses WHERE landlord_id IN ($u)");
$l = $in($listings);
$reservations = $column("SELECT v.reservation_id FROM reservations v JOIN rooms r ON r.room_id = v.room_id WHERE v.boarder_id IN ($u) OR r.boarding_house_id IN ($l)");
$r = $in($reservations);
$contactWhere = 'email IN (' . $in(array_merge(DEMO_CONTACT_EMAILS, DEMO_EMAILS)) . ')';
$auditWhere = "actor_id IN ($u) OR (target_type = 'user' AND target_id IN ($u)) OR (target_type = 'listing' AND target_id IN ($l)) OR (target_type = 'reservation' AND target_id IN ($r))";

$plan = [
  'demo accounts' => count($users),
  'their listings' => count($listings),
  'rooms in them' => $count("SELECT COUNT(*) FROM rooms WHERE boarding_house_id IN ($l)"),
  'reservations' => count($reservations),
  'reviews' => $count("SELECT COUNT(*) FROM reviews WHERE boarder_id IN ($u) OR boarding_house_id IN ($l)"),
  'conversations' => $count("SELECT COUNT(*) FROM conversations WHERE boarder_id IN ($u) OR landlord_id IN ($u) OR boarding_house_id IN ($l)"),
  'notifications' => $count("SELECT COUNT(*) FROM notifications WHERE user_id IN ($u)"),
  'sample Contact Us messages' => $count("SELECT COUNT(*) FROM contact_messages WHERE $contactWhere"),
  'activity log entries about them' => $count("SELECT COUNT(*) FROM audit_logs WHERE $auditWhere"),
];
$keptAccounts = $count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND user_id NOT IN (' . $u . ')');
$ownSuperAdmins = $count("SELECT COUNT(*) FROM users WHERE role = 'super_admin' AND is_active = 1 AND deleted_at IS NULL AND user_id NOT IN ($u)");

say('Demo data in the "' . database_name() . '" database:');
foreach ($plan as $what => $n) say(sprintf('  %4d %s', $n, $what));
say("Staying: $keptAccounts other " . ($keptAccounts === 1 ? 'account' : 'accounts') . ' and everything of theirs.');
if (!$users && !$plan['sample Contact Us messages']) {
  say('Nothing to remove: the demo data is already gone.');
  exit(0);
}
if (!$ownSuperAdmins) {
  stop("\nNot removed: you need your own super admin first, or no one could sign in to the admin panel.\nRun: php backend/tools/create-super-admin.php");
}
if (!isset($options['yes'])) {
  say("\nNothing was removed. To remove it, run this again with --yes (a backup is made first).");
  exit(0);
}

$backup = backup_database();
say("\nBackup saved first: {$backup['sql']}");

// Photos are files: note them now, delete them once the database no longer points at them.
$files = array_merge(
  $column("SELECT image_path FROM images WHERE boarding_house_id IN ($l)"),
  $column("SELECT avatar_path FROM users WHERE user_id IN ($u) AND avatar_path IS NOT NULL")
);
$pdo->beginTransaction();
$pdo->exec("DELETE FROM audit_logs WHERE $auditWhere");
$pdo->exec("DELETE FROM reviews WHERE boarder_id IN ($u)");
$pdo->exec("DELETE FROM contact_messages WHERE $contactWhere");
$pdo->exec('DELETE FROM login_attempts WHERE identifier IN (' . $in(array_merge(DEMO_EMAILS, ['superadmin', 'admin'])) . ')');
// Their listings (with rooms, photos, reservations and reviews), requests, favorites,
// conversations, notifications and sign-in tokens go with the accounts.
$pdo->exec("DELETE FROM users WHERE user_id IN ($u)");
$pdo->commit();

$removed = 0;
$uploads = realpath(TOOL_UPLOADS_DIR);
foreach ($files as $path) {
  // Only files inside backend/uploads/.
  $full = realpath(__DIR__ . '/../' . $path);
  if ($full && $uploads && strpos($full, $uploads . DIRECTORY_SEPARATOR) === 0 && @unlink($full)) $removed++;
}
say('Removed the demo data' . ($removed ? " and $removed " . ($removed === 1 ? 'photo' : 'photos') : '') . '.');
say('To undo it, import the backup above in phpMyAdmin.');
