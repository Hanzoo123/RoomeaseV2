<?php
// Messages sent through the Contact Us page of the website.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['inbox_action'])) {
  $id = (int) ($_POST['id'] ?? 0);
  if (!csrf_ok()) {
    flash('Your session expired. Please try again.', 'error');
  } elseif ($_POST['inbox_action'] === 'unread') {
    $pdo->prepare('UPDATE contact_messages SET is_read = 0 WHERE contact_message_id = ?')->execute([$id]);
    flash('Marked as unread.', 'info');
    go('inbox');
  } elseif ($_POST['inbox_action'] === 'delete') {
    $pdo->prepare('DELETE FROM contact_messages WHERE contact_message_id = ?')->execute([$id]);
    flash('Message deleted.', 'info');
    go('inbox');
  }
  go('inbox', ['view' => $id]);
}

$open = null;
if (isset($_GET['view'])) {
  $stmt = $pdo->prepare('SELECT * FROM contact_messages WHERE contact_message_id = ?');
  $stmt->execute([(int) $_GET['view']]);
  $open = $stmt->fetch();
}
$messages = $pdo->query('SELECT * FROM contact_messages ORDER BY created_at DESC')->fetchAll();
?>
  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
      <div class="container-fluid">
        <h1 class="m-0">Contact Inbox</h1>
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content-header -->

    <!-- Main content -->
    <div class="content">
      <div class="container-fluid">
        <?php if ($open): ?>
        <div class="row">
          <div class="col-lg-12">
            <div class="card card-olive card-outline">
              <div class="card-header">
                <h3 class="card-title"><?php echo e($open['topic']); ?></h3>
                <div class="card-tools">
                  <a href="dashboard.php?page=inbox" class="btn btn-tool" title="Close"><i class="fas fa-times"></i></a>
                </div>
              </div>
              <div class="card-body">
                <div class="mailbox-read-info px-0 pt-0">
                  <h5><?php echo e($open['name']); ?></h5>
                  <h6>From: <?php echo e($open['email']); ?>
                    <span class="mailbox-read-time float-right"><?php echo e(nice_date($open['created_at'], true)); ?></span></h6>
                </div>
                <div class="mailbox-read-message px-0">
                  <?php echo nl2br(e($open['message'])); ?>
                </div>
              </div>
              <div class="card-footer">
                <a class="btn bg-olive btn-sm" href="mailto:<?php echo e($open['email']); ?>?subject=<?php echo rawurlencode('Re: ' . $open['topic']); ?>&body=<?php echo rawurlencode('Hi ' . strtok($open['name'], ' ') . ",\n\n\n\n— The RoomEase team"); ?>"><i class="fas fa-reply"></i> Reply by email</a>
                <form method="post" action="" class="d-inline">
                  <?php echo csrf_field(); ?>
                  <input type="hidden" name="id" value="<?php echo (int) $open['contact_message_id']; ?>">
                  <button type="submit" name="inbox_action" value="unread" class="btn btn-default btn-sm"><i class="far fa-envelope"></i> Mark unread</button>
                </form>
                <form method="post" action="" class="d-inline float-right" data-confirm="Delete this message? This can't be undone.">
                  <?php echo csrf_field(); ?>
                  <input type="hidden" name="id" value="<?php echo (int) $open['contact_message_id']; ?>">
                  <button type="submit" name="inbox_action" value="delete" class="btn btn-outline-danger btn-sm"><i class="far fa-trash-alt"></i> Delete</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <?php endif; ?>
        <div class="row">
          <div class="col-lg-12">
            <div class="card">
              <div class="card-header bg-olive">
                <h3 class="card-title">Messages</h3>
              </div>
              <div class="card-body">
                <table id="example1" class="table table-bordered table-striped">
                  <thead>
                  <tr>
                    <th>From</th>
                    <th>Topic</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th class="no-export">Action</th>
                  </tr>
                  </thead>
                  <tbody>
                  <?php foreach ($messages as $m): $read = $m['is_read']; ?>
                  <tr>
                    <td><?php echo $read ? '' : '<b>'; ?><?php echo e($m['name']); ?><?php echo $read ? '' : '</b>'; ?><br><small class="text-muted"><?php echo e($m['email']); ?></small></td>
                    <td><?php echo e($m['topic']); ?></td>
                    <td><?php echo e(mb_strimwidth($m['message'], 0, 90, '…')); ?></td>
                    <td data-order="<?php echo e($m['created_at']); ?>"><?php echo e(time_ago($m['created_at'])); ?></td>
                    <td><?php echo $read ? '<span class="badge badge-secondary">Read</span>' : '<span class="badge badge-danger">New</span>'; ?></td>
                    <td><a class="btn bg-olive btn-sm" href="dashboard.php?page=inbox&view=<?php echo (int) $m['contact_message_id']; ?>"><i class="fas fa-envelope-open-text"></i> Read</a></td>
                  </tr>
                  <?php endforeach; ?>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /.container-fluid -->
    </div>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
