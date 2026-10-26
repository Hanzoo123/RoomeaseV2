<?php
// Readable wording for each activity log action ("listing.approved" → "approved a listing").
const ACTIVITY_LABELS = [
  'auth.login' => ['signed in', 'fas fa-sign-in-alt', 'secondary', 'signins'],
  'auth.logout' => ['signed out', 'fas fa-sign-out-alt', 'secondary', 'signins'],
  'listing.submitted' => ['submitted a new listing', 'fas fa-file-alt', 'primary', 'listings'],
  'listing.resubmitted' => ['resubmitted a listing after changes', 'fas fa-redo', 'primary', 'listings'],
  'listing.updated' => ['updated a listing', 'fas fa-edit', 'secondary', 'listings'],
  'listing.approved' => ['approved a listing', 'fas fa-check-circle', 'success', 'listings'],
  'listing.rejected' => ['sent a listing back for changes', 'fas fa-times-circle', 'danger', 'listings'],
  'listing.removed' => ['removed a listing', 'fas fa-ban', 'danger', 'listings'],
  'listing.restored' => ['restored a listing', 'fas fa-undo', 'success', 'listings'],
  'listing.deleted' => ['deleted a listing', 'fas fa-trash', 'danger', 'listings'],
  'reservation.approved' => ['approved a reservation', 'fas fa-calendar-check', 'success', 'reservations'],
  'reservation.accepted' => ['approved a reservation', 'fas fa-calendar-check', 'success', 'reservations'],
  'reservation.declined' => ['declined a reservation', 'fas fa-calendar-times', 'danger', 'reservations'],
  'reservation.cancelled' => ['cancelled a reservation', 'fas fa-calendar-minus', 'secondary', 'reservations'],
  'user.created' => ['created an account', 'fas fa-user-plus', 'primary', 'accounts'],
  'user.deactivated' => ['deactivated an account', 'fas fa-user-slash', 'danger', 'accounts'],
  'user.activated' => ['reactivated an account', 'fas fa-user-check', 'success', 'accounts'],
  'admin.created' => ['added an admin account', 'fas fa-user-shield', 'primary', 'accounts'],
  'admin.updated' => ['changed an admin account', 'fas fa-user-edit', 'secondary', 'accounts'],
  'admin.password_reset' => ['set a temporary password for', 'fas fa-key', 'warning', 'accounts'],
  'profile.updated' => ['updated their profile', 'fas fa-id-card', 'secondary', 'accounts'],
  'profile.password_changed' => ['changed their password', 'fas fa-key', 'secondary', 'accounts'],
];

const ACTIVITY_GROUPS = ['listings' => 'Listings', 'reservations' => 'Reservations', 'accounts' => 'Accounts', 'signins' => 'Sign-ins'];

function activity_info($action)
{
  [$text, $icon, $tone, $group] = ACTIVITY_LABELS[$action] ?? [$action, 'fas fa-circle', 'secondary', 'other'];
  return ['text' => $text, 'icon' => $icon, 'tone' => $tone, 'group' => $group];
}

// The entry's target as a link into the admin panel, when it still exists.
function activity_target_link($row)
{
  $label = e($row['target_label'] !== '' ? $row['target_label'] : '—');
  if (!$row['target_id']) return $label;
  if ($row['target_type'] === 'listing') return '<a href="dashboard.php?page=view_listing&id=' . (int) $row['target_id'] . '">' . $label . '</a>';
  if ($row['target_type'] === 'user') {
    return '<a href="dashboard.php?page=view_account&id=' . (int) $row['target_id'] . '">' . $label . '</a>';
  }
  return $label;
}
