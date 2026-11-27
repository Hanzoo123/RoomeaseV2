<?php
// RoomEase JSON API for the React website. Every request under backend/api/ comes here
// (see .htaccess), is matched to a route below, and answers with JSON.
// Admins and super admins don't use it: the AdminLTE panel talks to MySQL itself.
date_default_timezone_set('Asia/Manila');
ini_set('display_errors', '0');

require __DIR__ . '/lib/http.php';
// Anything unexpected becomes a JSON error instead of a PHP error page.
set_exception_handler(function ($error) {
  error_log('RoomEase API: ' . $error);
  fail(500, 'Something went wrong on the server. Please try again.');
});

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/throttle.php';
require __DIR__ . '/lib/images.php';
require __DIR__ . '/../lib/validation.php';
require __DIR__ . '/../lib/mailer.php';
require __DIR__ . '/routes/auth.php';
require __DIR__ . '/routes/me.php';
require __DIR__ . '/routes/listings.php';
require __DIR__ . '/routes/landlord.php';
require __DIR__ . '/routes/boarder.php';
require __DIR__ . '/routes/messages.php';

// METHOD path => handler. {name} matches one path segment.
$routes = [
  'GET /auth/me' => 'route_me',
  'POST /auth/register' => 'route_register',
  'POST /auth/login' => 'route_login',
  'POST /auth/logout' => 'route_logout',
  'POST /auth/forgot' => 'route_forgot',
  'POST /auth/verify-code' => 'route_verify_code',
  'POST /auth/reset' => 'route_reset',
  'PATCH /me' => 'route_update_profile',
  'POST /me/avatar' => 'route_upload_avatar',
  'DELETE /me/avatar' => 'route_delete_avatar',
  'POST /me/password' => 'route_change_password',
  // Public listings (Find Place to Stay)
  'GET /lookups' => 'route_lookups',
  'GET /listings' => 'route_listings',
  'GET /listings/{id}' => 'route_listing',
  'POST /listings/{id}/view' => 'route_listing_view',
  'GET /listings/{id}/reviews' => 'route_listing_reviews',
  'GET /reviews/highlights' => 'route_review_highlights',
  // A boarder's saved listings, requests and reviews
  'GET /favorites' => 'route_favorites',
  'PUT /favorites/{id}' => 'route_add_favorite',
  'DELETE /favorites/{id}' => 'route_remove_favorite',
  'GET /reservations' => 'route_my_reservations',
  'POST /reservations' => 'route_create_reservation',
  'POST /reservations/{id}/cancel' => 'route_cancel_reservation',
  'POST /listings/{id}/reviews' => 'route_save_review',
  'DELETE /reviews/{id}' => 'route_delete_review',
  // A landlord's own listings
  'GET /landlord/listings' => 'route_landlord_listings',
  'POST /landlord/listings' => 'route_create_listing',
  'PUT /landlord/listings/{id}' => 'route_update_listing',
  'DELETE /landlord/listings/{id}' => 'route_delete_listing',
  'PATCH /landlord/rooms/{id}' => 'route_update_room',
  'GET /landlord/reservations' => 'route_landlord_reservations',
  'POST /landlord/reservations/{id}/decide' => 'route_decide_reservation',
  'POST /landlord/reviews/{id}/reply' => 'route_reply_to_review',
  // Messages and notifications (boarders and landlords)
  'GET /conversations' => 'route_conversations',
  'POST /conversations' => 'route_start_conversation',
  'GET /conversations/{id}/messages' => 'route_conversation_messages',
  'POST /conversations/{id}/messages' => 'route_send_message',
  'POST /conversations/{id}/read' => 'route_read_conversation',
  'GET /notifications' => 'route_notifications',
  'POST /notifications/read-all' => 'route_read_all_notifications',
  'POST /notifications/{id}/read' => 'route_read_notification',
  'DELETE /notifications/{id}' => 'route_delete_notification',
  // Contact Us (anyone)
  'POST /contact' => 'route_contact',
];

// The path after .../backend/api, e.g. "/auth/me".
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = '/' . trim(substr($path, strlen($base)), '/');
$method = $_SERVER['REQUEST_METHOD'];

foreach ($routes as $route => $handler) {
  [$routeMethod, $pattern] = explode(' ', $route, 2);
  $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
  if (!preg_match($regex, $path, $params)) continue;
  if ($routeMethod !== $method) {
    $allowed = true;
    continue;
  }
  // Every request that changes something must carry the CSRF token.
  if ($method !== 'GET') require_csrf();
  $handler(array_filter($params, 'is_string', ARRAY_FILTER_USE_KEY));
  exit;
}
fail(empty($allowed) ? 404 : 405, empty($allowed) ? 'Not found.' : 'Method not allowed.');
