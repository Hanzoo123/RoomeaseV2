<?php
// The moderation buttons that fit a listing's current state.
function listing_buttons($listing, $size = 'btn-sm')
{
  $status = listing_status($listing)['key'];
  $id = (int) $listing['boarding_house_id'];
  $name = e($listing['name']);
  $return = e($_SERVER['REQUEST_URI'] ?? '');
  $post = function ($action, $class, $icon, $label) use ($id, $return, $size) {
    return '<form method="post" action="" class="d-inline">' . csrf_field()
      . '<input type="hidden" name="listing_action" value="' . $action . '">'
      . '<input type="hidden" name="id" value="' . $id . '">'
      . '<input type="hidden" name="return" value="' . $return . '">'
      . '<button type="submit" class="btn ' . $class . ' ' . $size . ' mb-1"><i class="' . $icon . '"></i> ' . $label . '</button></form> ';
  };
  $modal = function ($target, $class, $icon, $label) use ($id, $name, $size) {
    return '<button type="button" class="btn ' . $class . ' ' . $size . ' mb-1" data-toggle="modal" data-target="#' . $target . '" data-id="' . $id . '" data-name="' . $name . '"><i class="' . $icon . '"></i> ' . $label . '</button> ';
  };

  if ($status === 'review') return $post('approve', 'btn-success', 'fas fa-check', 'Approve') . $modal('rejectModal', 'btn-danger', 'fas fa-times', 'Reject');
  if ($status === 'live') return $modal('removeModal', 'btn-outline-danger', 'fas fa-ban', 'Remove');
  if ($status === 'changes') return $post('approve', 'btn-outline-success', 'fas fa-check', 'Approve anyway');
  return $post('restore', 'btn-outline-success', 'fas fa-undo', 'Restore');
}
