<?php
// Deactivate (with a reason) or reactivate a boarder or landlord. Runs only on POST.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['account_action'])) {
  $back = return_to('accounts');
  if (!csrf_ok()) {
    flash('Your session expired. Please try again.', 'error');
    go($back['page'], $back['params']);
  }
  $id = (int) ($_POST['id'] ?? 0);
  $reason = trim($_POST['reason'] ?? '');
  $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ? AND role IN ('boarder', 'landlord') AND deleted_at IS NULL");
  $stmt->execute([$id]);
  $account = $stmt->fetch();

  if (!$account) {
    // Admin accounts are managed under User Management, by super admins.
    flash('That account can’t be changed here.', 'error');
  } elseif ($_POST['account_action'] === 'deactivate') {
    if (mb_strlen($reason) < 10) {
      flash('Write at least a short sentence explaining why.', 'error');
    } else {
      $pdo->prepare('UPDATE users SET is_active = 0, deactivation_reason = ?, updated_by = ? WHERE user_id = ?')
        ->execute([mb_substr($reason, 0, 500), current_admin_id(), $id]);
      // Signs them out of the React app on every device.
      $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([$id]);
      audit($pdo, 'user.deactivated', 'user', $id, full_name($account), $reason);
      flash(full_name($account) . ' was deactivated and can no longer sign in.', 'info');
    }
  } elseif ($_POST['account_action'] === 'activate') {
    $pdo->prepare('UPDATE users SET is_active = 1, deactivation_reason = NULL, updated_by = ? WHERE user_id = ?')
      ->execute([current_admin_id(), $id]);
    audit($pdo, 'user.activated', 'user', $id, full_name($account));
    flash(full_name($account) . ' can sign in again.');
  }
  go($back['page'], $back['params']);
}

function account_buttons($account)
{
  if (in_array($account['role'], ADMIN_ROLES, true)) return '';
  $return = e($_SERVER['REQUEST_URI'] ?? '');
  if ($account['is_active']) {
    return '<button type="button" class="btn btn-outline-danger btn-sm mb-1" data-toggle="modal" data-target="#deactivateModal" data-id="' . (int) $account['user_id'] . '" data-name="' . e(full_name($account)) . '"><i class="fas fa-user-slash"></i> Deactivate</button>';
  }
  return '<form method="post" action="" class="d-inline">' . csrf_field()
    . '<input type="hidden" name="account_action" value="activate"><input type="hidden" name="id" value="' . (int) $account['user_id'] . '">'
    . '<input type="hidden" name="return" value="' . $return . '">'
    . '<button type="submit" class="btn btn-outline-success btn-sm mb-1"><i class="fas fa-user-check"></i> Reactivate</button></form>';
}

function account_reason_modal()
{
  reason_modal('deactivateModal', 'Deactivate', 'They are signed out and can’t sign in until the account is reactivated. Their listings stay as they are.', 'deactivate', 'account_action', 'Deactivate account', [
    'Posting listings for houses they don’t own.',
    'Harassing other users.',
    'Duplicate or fake account.',
  ]);
}
