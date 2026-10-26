<?php
require_once 'includes/bootstrap.php';
// Buffer the page so content pages can still redirect after a form is submitted.
ob_start();

if (!isset($_SESSION['user_id'])) {
  header("Location: index.php");
  exit;
}

// Signed out if an admin deactivated or removed this account in the meantime.
$me = $pdo->prepare("SELECT role, is_active, deleted_at, must_change_password FROM users WHERE user_id = ?");
$me->execute([current_admin_id()]);
$me = $me->fetch();
if (!$me || !$me['is_active'] || $me['deleted_at'] || !in_array($me['role'], ADMIN_ROLES, true)) {
  session_unset();
  session_destroy();
  header("Location: index.php");
  exit;
}
$_SESSION['role'] = $me['role'];
$_SESSION['must_change_password'] = (bool) $me['must_change_password'];

// page => [file, who may open it]. 'admin' = admins and super admins.
$pages = [
  'dashboard'    => ['content/home.php', 'admin'],
  'listings'     => ['content/listings.php', 'admin'],
  'view_listing' => ['content/view_listing.php', 'admin'],
  'accounts'     => ['content/accounts.php', 'admin'],
  'view_account' => ['content/view_account.php', 'admin'],
  'inbox'        => ['content/inbox.php', 'admin'],
  'reports'      => ['content/reports.php', 'admin'],
  'profile'      => ['content/profile.php', 'admin'],
  // Admin accounts (the template's User Management pages): super admins only.
  'view_users'   => ['content/view_users.php', 'super_admin'],
  'add_user'     => ['content/add_user.php', 'super_admin'],
  'update_user'  => ['content/update_user.php', 'super_admin'],
  'activity'     => ['content/activity.php', 'super_admin'],
  '404'          => ['content/404.php', 'admin'],
  'forbidden'    => ['content/403.php', 'admin'],
];

$page = $_GET['page'] ?? '404';
if (!isset($pages[$page])) {
  $page = '404';
}
if ($pages[$page][1] === 'super_admin' && !is_super_admin()) {
  header("Location: dashboard.php?page=forbidden");
  exit;
}
// An admin given a temporary password sets their own before doing anything else.
if ($_SESSION['must_change_password'] && $page !== 'profile') {
  flash('Please choose a new password before you continue.', 'warning');
  go('profile');
}

// Opening a contact message marks it read, before the sidebar counts unread ones.
if ($page === 'inbox' && isset($_GET['view']) && $_SERVER['REQUEST_METHOD'] === 'GET') {
  $pdo->prepare('UPDATE contact_messages SET is_read = 1 WHERE contact_message_id = ?')->execute([(int) $_GET['view']]);
}

$toast_message = '';
$toast_type = '';
$page_script = '';
$counts = sidebar_counts($pdo);
?>

<!DOCTYPE html>
<html lang="en">
<?php require_once 'includes/head.php';?>
<body class="hold-transition sidebar-mini">
<div class="wrapper">
<?php
require_once 'includes/navbar.php';
require_once 'includes/sidebar.php';

require_once $pages[$page][0];

require_once 'includes/footer.php';

// A toast set before a redirect (flash) is shown on the page the browser lands on.
if (empty($toast_message) && ($flash = take_flash())) {
  $toast_message = $flash['message'];
  $toast_type = $flash['type'];
}
?>
</div>
<!-- ./wrapper -->
<!-- REQUIRED SCRIPTS -->
<!-- jQuery -->
<script src="plugins/jquery/jquery.min.js"></script>
<!-- Bootstrap 4 -->
<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<!-- DataTables  & Plugins -->
<script src="plugins/datatables/jquery.dataTables.min.js"></script>
<script src="plugins/datatables-bs4/js/dataTables.bootstrap4.min.js"></script>
<script src="plugins/datatables-responsive/js/dataTables.responsive.min.js"></script>
<script src="plugins/datatables-responsive/js/responsive.bootstrap4.min.js"></script>
<script src="plugins/datatables-buttons/js/dataTables.buttons.min.js"></script>
<script src="plugins/datatables-buttons/js/buttons.bootstrap4.min.js"></script>
<script src="plugins/jszip/jszip.min.js"></script>
<script src="plugins/pdfmake/pdfmake.min.js"></script>
<script src="plugins/pdfmake/vfs_fonts.js"></script>
<script src="plugins/datatables-buttons/js/buttons.html5.min.js"></script>
<script src="plugins/datatables-buttons/js/buttons.print.min.js"></script>
<script src="plugins/datatables-buttons/js/buttons.colVis.min.js"></script>
<?php if ($page === 'reports'): ?>
<!-- ChartJS -->
<script src="plugins/chart.js/Chart.min.js"></script>
<?php endif; ?>
<!-- AdminLTE App -->
<script src="dist/js/adminlte.min.js"></script>
<!-- Toastr JS -->
<script src="plugins/toastr/toastr.min.js"></script>
<script>
  $(function () {
    // Exports skip the Action column, and a cell starting with = + - @ is prefixed with '
    // so Excel or Sheets never runs it as a formula.
    var exportOptions = {
      columns: ':not(.no-export)',
      format: {
        body: function (data) {
          var text = $('<div>').html(data).text().replace(/\s+/g, ' ').trim();
          return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
        }
      }
    };
    $("#example1").DataTable({
      "responsive": true, "lengthChange": false, "autoWidth": false, "order": [],
      "buttons": [
        { extend: "copy", exportOptions: exportOptions },
        { extend: "csv", exportOptions: exportOptions },
        { extend: "excel", exportOptions: exportOptions },
        { extend: "pdf", exportOptions: exportOptions },
        { extend: "print", exportOptions: exportOptions },
        "colvis"
      ]
    }).buttons().container().appendTo('#example1_wrapper .col-md-6:eq(0)');
    $('#example2').DataTable({
      "paging": true,
      "lengthChange": false,
      "searching": false,
      "ordering": true,
      "order": [],
      "info": true,
      "autoWidth": false,
      "responsive": true,
    });
  });
</script>
<script>
$(document).ready(function() {
    let usernameExists = false;
    let emailExists = false;
    const csrfToken = <?php echo json_encode(csrf_token()); ?>;

    // Function to toggle the submit button
    function checkFormStatus() {
        if (usernameExists || emailExists) {
            $('#submitBtn').prop('disabled', true);
        } else {
            $('#submitBtn').prop('disabled', false);
        }
    }

    // Check Username
    $('#username').on('keyup blur', function() {
        let val = $(this).val();
        if (val.length > 2) {
            $.post('check_existence.php', { field: 'username', value: val, csrf_token: csrfToken }, function(response) {
                let data = JSON.parse(response);
                if (data.exists) {
                    $('#username').addClass('is-invalid');
                    $('#usernameError').removeClass('d-none');
                    usernameExists = true;
                } else {
                    $('#username').removeClass('is-invalid').addClass('is-valid');
                    $('#usernameError').addClass('d-none');
                    usernameExists = false;
                }
                checkFormStatus();
            });
        }
    });

    // Check Email
    $('#email').on('keyup blur', function() {
        let val = $(this).val();
        if (val.length > 5 && val.includes('@')) {
            $.post('check_existence.php', { field: 'email', value: val, csrf_token: csrfToken }, function(response) {
                let data = JSON.parse(response);
                if (data.exists) {
                    $('#email').addClass('is-invalid');
                    $('#emailError').removeClass('d-none');
                    emailExists = true;
                } else {
                    $('#email').removeClass('is-invalid').addClass('is-valid');
                    $('#emailError').addClass('d-none');
                    emailExists = false;
                }
                checkFormStatus();
            });
        }
    });

    // Reason dialogs (reject a listing, remove it, deactivate an account): the button that
    // opens one passes the id and name, and the quick reasons fill in the text box.
    $('.modal[data-reason-modal]').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        $(this).find('input[name="id"]').val(button.data('id'));
        $(this).find('.target-name').text(button.data('name'));
        $(this).find('textarea').val('');
    });
    $('.quick-reason').on('click', function () {
        $(this).closest('.modal').find('textarea').val($(this).text().trim()).focus();
    });
    $('form[data-confirm]').on('submit', function () {
        return confirm($(this).data('confirm'));
    });
});
</script>
<?php if (!empty($page_script)): ?>
<script>
<?php echo $page_script; ?>
</script>
<?php endif; ?>

<!-- Toastr Notification Trigger -->
<?php if (!empty($toast_message)): ?>
<script>
  $(function() {
    toastr.<?php echo in_array($toast_type, ['success', 'error', 'warning', 'info'], true) ? $toast_type : 'info'; ?>(<?php echo json_encode($toast_message); ?>, 'System Notification', {
        positionClass: 'toast-top-right',
        timeOut: 5000
    });

    // Optional: Reset form on success
    <?php if ($toast_type === 'success'): ?>
      if ($('#addUserForm').length) { $('#addUserForm')[0].reset(); }
      $('.is-valid').removeClass('is-valid');
    <?php endif; ?>
  });
</script>
<?php endif; ?>
</body>
</html>
