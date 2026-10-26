<?php
// Approve, send back (with a reason), remove (with a reason) or restore a listing.
// Included by the listings table and the listing page; runs only on POST.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['listing_action'])) {
  $back = return_to('listings');
  if (!csrf_ok()) {
    flash('Your session expired. Please try again.', 'error');
    go($back['page'], $back['params']);
  }

  $id = (int) ($_POST['id'] ?? 0);
  $action = $_POST['listing_action'];
  $reason = trim($_POST['reason'] ?? '');
  $stmt = $pdo->prepare('SELECT * FROM boarding_houses WHERE boarding_house_id = ?');
  $stmt->execute([$id]);
  $listing = $stmt->fetch();

  if (!$listing) {
    flash('That listing no longer exists.', 'error');
  } elseif (in_array($action, ['reject', 'remove'], true) && mb_strlen($reason) < 10) {
    flash('Write at least a short sentence, so the landlord knows what to fix.', 'error');
  } else {
    $admin = current_admin_id();
    $name = $listing['name'];
    $link = '/landlord/listings/' . $id;
    switch ($action) {
      case 'approve':
        $pdo->prepare("UPDATE boarding_houses SET moderation_status = 'approved', rejection_reason = NULL, moderated_at = NOW(), moderated_by = ?, updated_by = ? WHERE boarding_house_id = ?")
          ->execute([$admin, $admin, $id]);
        audit($pdo, 'listing.approved', 'listing', $id, $name);
        notify($pdo, $listing['landlord_id'], 'Listing approved', "$name is now live. Boarders can find it, save it and request a room.", $link);
        flash("$name is now live.");
        break;
      case 'reject':
        $pdo->prepare("UPDATE boarding_houses SET moderation_status = 'rejected', rejection_reason = ?, moderated_at = NOW(), moderated_by = ?, updated_by = ? WHERE boarding_house_id = ?")
          ->execute([mb_substr($reason, 0, 500), $admin, $admin, $id]);
        audit($pdo, 'listing.rejected', 'listing', $id, $name, $reason);
        notify($pdo, $listing['landlord_id'], 'Listing needs changes', "$name: $reason", $link);
        flash("$name was sent back to the landlord.", 'info');
        break;
      case 'remove':
        $pdo->prepare("UPDATE boarding_houses SET deleted_at = NOW(), deleted_by = ?, removal_reason = ? WHERE boarding_house_id = ? AND deleted_at IS NULL")
          ->execute([$admin, mb_substr($reason, 0, 500), $id]);
        audit($pdo, 'listing.removed', 'listing', $id, $name, $reason);
        notify($pdo, $listing['landlord_id'], 'Listing removed', "$name was removed by an administrator: $reason", $link);
        flash("$name was removed from the site. It can be restored later.", 'info');
        break;
      case 'restore':
        $pdo->prepare("UPDATE boarding_houses SET deleted_at = NULL, deleted_by = NULL, removal_reason = NULL WHERE boarding_house_id = ?")
          ->execute([$id]);
        audit($pdo, 'listing.restored', 'listing', $id, $name);
        notify($pdo, $listing['landlord_id'], 'Listing restored', "$name is back on RoomEase.", $link);
        flash("$name was restored.");
        break;
      default:
        flash('Unknown action.', 'error');
    }
  }
  go($back['page'], $back['params']);
}
