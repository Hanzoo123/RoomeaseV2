<?php
// Site settings shared by the admin panel and the API.
return [
  // Until real email is set up (BACKEND_PLAN.md, phase 6), "Forgot password" shows the
  // 6-digit code on screen, like the demo. Only for requests from this computer.
  // Set to false before anyone else can reach the site.
  'show_reset_codes_on_screen' => true,
];
