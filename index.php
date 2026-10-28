<?php
// Serves the built RoomEase website on WAMP, from whatever folder it is in under
// C:\wamp64\www (e.g. http://localhost/RoomeaseV2/ or http://localhost/RoomeaseV2-main/).
// .htaccess sends every page address here; the built files are in dist/ (npm run build).

// The folder's address, e.g. "/RoomeaseV2-main/".
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
$html = is_file(__DIR__ . '/dist/index.html') ? file_get_contents(__DIR__ . '/dist/index.html') : false;

if ($html === false) {
  http_response_code(503);
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><meta charset="utf-8"><title>RoomEase</title>'
    . '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.6">'
    . '<h1>The website hasn\'t been built yet</h1>'
    . '<p>Open a terminal in this folder and run <code>npm install</code> and then <code>npm run build</code>. Then reload this page.</p>'
    . '<p>The admin panel works without it: <a href="' . htmlspecialchars($base) . 'backend/admin/">open the admin panel</a>.</p>';
  exit;
}

// The build uses relative paths ("./assets/…"). Make them absolute for this folder so they
// also load on deeper pages such as /rooms/sunrise, and tell the app where it lives.
$safeBase = htmlspecialchars($base, ENT_QUOTES);
$html = str_replace(
  ['="./', '<meta name="roomease-base" content="/" />'],
  ['="' . $safeBase, '<meta name="roomease-base" content="' . $safeBase . '" />'],
  $html
);

header('Content-Type: text/html; charset=utf-8');
// The page changes with every build; the files in dist/assets have the build in their names.
header('Cache-Control: no-cache');
echo $html;
