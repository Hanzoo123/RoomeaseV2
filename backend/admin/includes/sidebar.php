<?php
// The menu, with the current page highlighted. Super admin items show only to super admins.
$active = function ($pages) use ($page) {
  return in_array($page, (array) $pages, true) ? 'active' : '';
};
$open = function ($pages) use ($page) {
  return in_array($page, (array) $pages, true) ? 'menu-open' : '';
};
$status = $_GET['status'] ?? '';
?>
  <!-- Main Sidebar Container -->
  <aside class="main-sidebar sidebar-light-olive elevation-4">

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar user panel (optional) -->
      <div class="user-panel mt-3 pb-3 mb-3 d-flex">
        <div class="info">
          <a href="dashboard.php?page=profile" class="d-block"><?php echo htmlspecialchars($_SESSION['firstname']. ' ' .$_SESSION['lastname']);?></a>
          <small class="text-muted"><?php echo e(role_label($_SESSION['role'])); ?></small>
        </div>
      </div>

      <!-- Sidebar Menu -->
      <nav class="mt-2">
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
          <!-- Add icons to the links using the .nav-icon class
               with font-awesome or any other icon font library -->
          <li class="nav-item">
            <a href="dashboard.php?page=dashboard" class="nav-link <?php echo $active('dashboard'); ?>">
              <i class="nav-icon fas fa-tachometer-alt"></i>
              <p>
                Dashboard
              </p>
            </a>
          </li>
          <li class="nav-item <?php echo $open(['listings', 'view_listing']); ?>">
            <a href="#" class="nav-link <?php echo $active(['listings', 'view_listing']); ?>">
              <i class="nav-icon fas fa-home"></i>
              <p>
                Listings
                <i class="right fas fa-angle-left"></i>
                <?php if ($counts['review'] > 0): ?><span class="badge badge-warning right"><?php echo $counts['review']; ?></span><?php endif; ?>
              </p>
            </a>
            <ul class="nav nav-treeview">
              <li class="nav-item">
                <a href="dashboard.php?page=listings&status=review" class="nav-link <?php echo $page === 'listings' && ($status === 'review' || $status === '') ? 'active' : ''; ?>">
                  <i class="fas fa-clipboard-check nav-icon"></i>
                  <p>Review Queue</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="dashboard.php?page=listings&status=all" class="nav-link <?php echo $page === 'listings' && $status !== 'review' && $status !== '' ? 'active' : ''; ?>">
                  <i class="fas fa-list nav-icon"></i>
                  <p>All Listings</p>
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item">
            <a href="dashboard.php?page=accounts" class="nav-link <?php echo $active(['accounts', 'view_account']); ?>">
              <i class="nav-icon fas fa-user-friends"></i>
              <p>
                Boarders &amp; Landlords
              </p>
            </a>
          </li>
          <li class="nav-item">
            <a href="dashboard.php?page=inbox" class="nav-link <?php echo $active('inbox'); ?>">
              <i class="nav-icon fas fa-inbox"></i>
              <p>
                Contact Inbox
                <?php if ($counts['inbox'] > 0): ?><span class="badge badge-danger right"><?php echo $counts['inbox']; ?></span><?php endif; ?>
              </p>
            </a>
          </li>
          <li class="nav-item">
            <a href="dashboard.php?page=reports" class="nav-link <?php echo $active('reports'); ?>">
              <i class="nav-icon fas fa-chart-bar"></i>
              <p>
                Reports
              </p>
            </a>
          </li>
          <?php if (is_super_admin()): ?>
          <li class="nav-header">SUPER ADMIN</li>
          <li class="nav-item <?php echo $open(['view_users', 'add_user', 'update_user']); ?>">
            <a href="#" class="nav-link <?php echo $active(['view_users', 'add_user', 'update_user']); ?>">
              <i class="nav-icon fas fa-users"></i>
              <p>
                User Management
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview">
              <li class="nav-item">
                <a href="dashboard.php?page=view_users" class="nav-link <?php echo $active(['view_users', 'update_user']); ?>">
                  <i class="fas fa-user nav-icon"></i>
                  <p>View Admins</p>
                </a>
              </li>
              <li class="nav-item">
                <a href="dashboard.php?page=add_user" class="nav-link <?php echo $active('add_user'); ?>">
                  <i class="fas fa-user-plus nav-icon"></i>
                  <p>Add Admin</p>
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item">
            <a href="dashboard.php?page=activity" class="nav-link <?php echo $active('activity'); ?>">
              <i class="nav-icon fas fa-history"></i>
              <p>
                Activity Log
              </p>
            </a>
          </li>
          <?php endif; ?>
          <li class="nav-header">ACCOUNT</li>
          <li class="nav-item">
            <a href="dashboard.php?page=profile" class="nav-link <?php echo $active('profile'); ?>">
              <i class="nav-icon fas fa-user-cog"></i>
              <p>
                My Profile
              </p>
            </a>
          </li>
          <li class="nav-item">
            <a href="logout.php" class="nav-link">
              <i class="nav-icon fas fa-sign-out-alt"></i>
              <p>
                Logout
              </p>
            </a>
          </li>
        </ul>
      </nav>
      <!-- /.sidebar-menu -->
    </div>
    <!-- /.sidebar -->
  </aside>
