<?php
// Database settings for the admin panel and the API. WAMP64 defaults: MySQL on
// localhost (port 3306), user root, no password. Import database/roomease.sql first.
// To change them, set ROOMEASE_DB_HOST, _NAME, _USER and _PASS in .env (see .env.example).
// Using WAMP's MariaDB instead? It listens on port 3307: ROOMEASE_DB_HOST=localhost;port=3307
require_once __DIR__ . '/../lib/env.php';
$host = env_value('ROOMEASE_DB_HOST', 'localhost');
$dbname = env_value('ROOMEASE_DB_NAME', 'roomease');
$username = env_value('ROOMEASE_DB_USER', 'root');
$password = env_value('ROOMEASE_DB_PASS', '');
