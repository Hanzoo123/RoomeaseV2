<?php
// Saves the whole database (and the uploaded photos) in backend/backups/. From the project
// folder:
//
//   php backend/tools/backup-database.php            keeps the newest 30 backups
//   php backend/tools/backup-database.php --keep=60
//
// On WAMP, use WAMP's PHP, e.g. C:\wamp64\bin\php\php8.2.13\php.exe. To back up every day,
// add that command to Windows Task Scheduler (README.md, "Going live").
// To restore: phpMyAdmin > Import > choose the .sql file, and unzip the photos zip into backend/.
require __DIR__ . '/lib.php';

$options = cli_options();
$keep = max(1, (int) ($options['keep'] ?? 30));
$backup = backup_database($keep);
say('Saved ' . $backup['sql'] . ' (' . file_size($backup['sql']) . ": {$backup['tables']} tables, {$backup['rows']} rows)");
if ($backup['zip']) say('Saved ' . $backup['zip'] . ' (' . file_size($backup['zip']) . ": {$backup['photos']} photos)");
elseif ($backup['zipMissing']) say("The photos weren't zipped (PHP's zip extension is off): copy backend/uploads/ yourself.");
say("Keeping the newest $keep backups in " . dirname($backup['sql']) . '.');
say('Copy them somewhere else too (a USB drive or cloud folder): a backup on the same computer is lost with it.');
