<?php
// A Bootstrap modal that asks for a reason before rejecting, removing or deactivating.
// The button that opens it sets data-id and data-name (see the script in dashboard.php).
function reason_modal($id, $title, $intro, $action, $actionField, $confirmLabel, $suggestions)
{
  $return = $_SERVER['REQUEST_URI'] ?? '';
  ?>
  <div class="modal fade" id="<?php echo e($id); ?>" tabindex="-1" role="dialog" aria-hidden="true" data-reason-modal>
    <div class="modal-dialog" role="document">
      <form class="modal-content" method="post" action="">
        <?php echo csrf_field(); ?>
        <input type="hidden" name="<?php echo e($actionField); ?>" value="<?php echo e($action); ?>">
        <input type="hidden" name="id" value="">
        <input type="hidden" name="return" value="<?php echo e($return); ?>">
        <div class="modal-header">
          <h4 class="modal-title"><?php echo e($title); ?>: <span class="target-name"></span></h4>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        </div>
        <div class="modal-body">
          <p class="text-muted"><?php echo e($intro); ?></p>
          <p class="mb-1"><small>Common reasons:</small></p>
          <div class="mb-3">
            <?php foreach ($suggestions as $text): ?>
              <button type="button" class="btn btn-outline-secondary btn-xs mb-1 quick-reason"><?php echo e($text); ?></button>
            <?php endforeach; ?>
          </div>
          <div class="form-group mb-0">
            <label>Reason <span class="text-danger">*</span></label>
            <textarea name="reason" class="form-control form-control-sm" rows="3" maxlength="500" minlength="10" required></textarea>
          </div>
        </div>
        <div class="modal-footer justify-content-between">
          <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-danger"><?php echo e($confirmLabel); ?></button>
        </div>
      </form>
    </div>
  </div>
  <?php
}

function listing_reason_modals()
{
  reason_modal('rejectModal', 'Send back', 'The landlord sees this reason on their listing. Once they fix it and save, it comes back to the review queue.', 'reject', 'listing_action', 'Send back for changes', [
    'Please add the full street address, so boarders can find the house.',
    'Please add at least one photo of a room.',
    'The rent looks wrong. Please check the monthly amount.',
    'Please list which bills are included in the rent.',
  ]);
  reason_modal('removeModal', 'Remove', 'The listing is hidden from boarders but kept, so it can be restored. The landlord is told why.', 'remove', 'listing_action', 'Remove listing', [
    'Reported as no longer renting rooms.',
    'The photos are not of this property.',
    'Repeated complaints from boarders.',
  ]);
}
