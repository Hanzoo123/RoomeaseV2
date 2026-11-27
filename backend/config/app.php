<?php
// Site settings shared by the admin panel and the API.
require_once __DIR__ . '/../lib/env.php';
return [
  // When the reset code can't be emailed (Gmail isn't set up in .env, or sending failed),
  // "Forgot password" shows it on screen instead, only to someone browsing from this
  // computer. Set ROOMEASE_SHOW_RESET_CODES=false in .env before anyone else can reach the
  // site, including through ngrok or another tunnel (those look like this computer).
  'show_reset_codes_on_screen' => filter_var(env_value('ROOMEASE_SHOW_RESET_CODES', 'true'), FILTER_VALIDATE_BOOLEAN),
];
