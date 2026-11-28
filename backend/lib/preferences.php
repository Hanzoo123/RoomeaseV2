<?php
// Each person's notification settings (Settings > Notifications on the website), shared by
// the API and the admin panel:
//   email_updates       also email important updates (decisions on listings and requests)
//   reservation_alerts  be told about reservation requests and answers
//   listing_tips        occasional tips (saved; nothing sends tips yet)
// No row means the defaults below.

const PREFERENCE_DEFAULTS = ['email_updates' => 1, 'reservation_alerts' => 1, 'listing_tips' => 0];

// The table is in database/roomease.sql. A database imported before it existed gets it the
// first time it's needed, so nobody has to re-import.
function ensure_preferences_table(PDO $pdo)
{
  $pdo->exec("CREATE TABLE IF NOT EXISTS user_preferences (
    user_id             INT NOT NULL PRIMARY KEY,
    email_updates       TINYINT(1) NOT NULL DEFAULT 1,
    reservation_alerts  TINYINT(1) NOT NULL DEFAULT 1,
    listing_tips        TINYINT(1) NOT NULL DEFAULT 0,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prefs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

// ['email_updates' => bool, 'reservation_alerts' => bool, 'listing_tips' => bool]
function user_preferences(PDO $pdo, $userId)
{
  try {
    $stmt = $pdo->prepare('SELECT email_updates, reservation_alerts, listing_tips FROM user_preferences WHERE user_id = ?');
    $stmt->execute([$userId]);
  } catch (PDOException $error) {
    if ($error->getCode() !== '42S02') throw $error; // only "table doesn't exist"
    ensure_preferences_table($pdo);
    return user_preferences($pdo, $userId);
  }
  $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: PREFERENCE_DEFAULTS;
  return array_map('boolval', array_intersect_key($row, PREFERENCE_DEFAULTS));
}

// $changes: some of the keys above, as booleans.
function save_user_preferences(PDO $pdo, $userId, array $changes)
{
  // (Reading them first also creates the table if it's missing.)
  $values = array_merge(user_preferences($pdo, $userId), array_intersect_key($changes, PREFERENCE_DEFAULTS));
  $pdo->prepare('INSERT INTO user_preferences (user_id, email_updates, reservation_alerts, listing_tips) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email_updates = VALUES(email_updates), reservation_alerts = VALUES(reservation_alerts), listing_tips = VALUES(listing_tips)')
    ->execute([$userId, (int) $values['email_updates'], (int) $values['reservation_alerts'], (int) $values['listing_tips']]);
  return user_preferences($pdo, $userId);
}

// The same, named as the website names them.
function preferences_for_app(array $preferences)
{
  return ['emailUpdates' => $preferences['email_updates'], 'reservationAlerts' => $preferences['reservation_alerts'], 'listingTips' => $preferences['listing_tips']];
}
