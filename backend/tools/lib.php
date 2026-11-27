<?php
// Shared by the command-line tools in this folder (run them with PHP, never in a browser).
if (PHP_SAPI !== 'cli') {
  http_response_code(404);
  exit;
}
date_default_timezone_set('Asia/Manila');
require_once __DIR__ . '/../lib/runtime.php';
require_once __DIR__ . '/../lib/validation.php';

const BACKUPS_DIR = __DIR__ . '/../backups';
const TOOL_UPLOADS_DIR = __DIR__ . '/../uploads';

// The accounts database/roomease.sql adds for the demo (their passwords are in README.md),
// and the two sample Contact Us messages.
const DEMO_EMAILS = [
  'superadmin@roomease.ph', 'admin@roomease.ph', 'maria@roomease.ph', 'juan@roomease.ph', 'rosa@roomease.ph', 'ramon@roomease.ph',
  'john.reyes@example.com', 'ana.cruz@example.com', 'luis.garcia@example.com', 'carla.m@example.com', 'mark.villanueva@example.com',
  'joy.santiago@example.com', 'paolo.ramos@example.com', 'grace.lim@example.com', 'kevin.tan@example.com', 'liza.navarro@example.com',
  'rico.aquino@example.com', 'bea.flores@example.com', 'jun.castillo@example.com', 'ella.ramirez@example.com', 'nina.torres@example.com',
  'arvin.dizon@example.com', 'mica.reyes@example.com',
];
const DEMO_CONTACT_EMAILS = ['paolo.ramos@example.com', 'liza.n@example.com'];
const DEMO_PASSWORDS = ['Superadmin#2026', 'Admin#2026', 'Landlord#2026', 'Boarder#2026'];

function say($text = '')
{
  echo $text, PHP_EOL;
}

function stop($text, $code = 1)
{
  fwrite(STDERR, $text . PHP_EOL);
  exit($code);
}

// --name=value and --flag options.
function cli_options()
{
  global $argv;
  $options = [];
  foreach (array_slice($argv, 1) as $arg) {
    if (preg_match('/^--([a-z-]+)(?:=(.*))?$/', $arg, $match)) $options[$match[1]] = $match[2] ?? true;
  }
  return $options;
}

// Asks until $check($answer) returns null (it returns a problem otherwise).
function ask($question, callable $check)
{
  while (true) {
    echo $question, ': ';
    $line = fgets(STDIN);
    if ($line === false) stop("\nStopped: no answer.");
    $answer = trim($line);
    $problem = $check($answer);
    if ($problem === null) return $answer;
    say("  $problem");
  }
}

// The database in backend/config/database.php (or .env), in $timeZone.
function tool_db($timeZone = '+08:00')
{
  require __DIR__ . '/../config/database.php';
  try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  } catch (PDOException $error) {
    stop("Can't reach the database \"$dbname\" on $host: " . $error->getMessage() . "\nIs WAMP (MySQL) running, and was database/roomease.sql imported?");
  }
  $pdo->exec("SET time_zone = '$timeZone'");
  return $pdo;
}

function database_name()
{
  require __DIR__ . '/../config/database.php';
  return $dbname;
}

// The backups folder (and its .htaccess, so Apache never serves a backup), created if needed.
function backups_dir()
{
  if (!is_dir(BACKUPS_DIR)) @mkdir(BACKUPS_DIR, 0775, true);
  if (!is_file(BACKUPS_DIR . '/.htaccess')) @file_put_contents(BACKUPS_DIR . '/.htaccess', "Require all denied\n");
  if (!is_writable(BACKUPS_DIR)) stop('Can\'t write to ' . realpath(BACKUPS_DIR) . '.');
  return realpath(BACKUPS_DIR);
}

// Saves the whole database as backend/backups/roomease-<date>-<time>.sql (and the uploaded
// photos as …-uploads.zip), keeping the newest $keep backups.
// Returns ['sql' => path, 'zip' => path or null, 'tables' => n, 'rows' => n].
function backup_database($keep = 30)
{
  $dir = backups_dir();
  $stamp = date('Y-m-d-His');
  $sqlPath = "$dir/roomease-$stamp.sql";
  $dbname = database_name();
  // Times are saved in UTC and read back the same way, so they come back unchanged.
  $pdo = tool_db('+00:00');
  $out = fopen("$sqlPath.part", 'w');
  if (!$out) stop("Can't write $sqlPath.");

  fwrite($out, "-- RoomEase database backup: $dbname, " . date('Y-m-d H:i:s') . " (Philippine time)\n"
    . "-- Restore it in phpMyAdmin (Import this file), or: mysql -u root < this-file.sql\n"
    . "-- It replaces the tables of the `$dbname` database with the ones below.\n\n"
    . "SET NAMES utf8mb4;\nSET time_zone = '+00:00';\nSET FOREIGN_KEY_CHECKS = 0;\nSET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n"
    . "CREATE DATABASE IF NOT EXISTS `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE `$dbname`;\n");

  $tables = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_NUM);
  $rowsTotal = 0;
  foreach ($tables as [$table]) {
    $create = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1];
    fwrite($out, "\n-- $table\nDROP TABLE IF EXISTS `$table`;\n$create;\n");
    $rows = $pdo->query("SELECT * FROM `$table`");
    $batch = [];
    $columns = null;
    foreach ($rows as $row) {
      $columns ??= '(`' . implode('`, `', array_keys($row)) . '`)';
      $batch[] = '(' . implode(', ', array_map(function ($value) use ($pdo) {
        return $value === null ? 'NULL' : $pdo->quote($value);
      }, $row)) . ')';
      if (count($batch) === 200) {
        fwrite($out, "INSERT INTO `$table` $columns VALUES\n" . implode(",\n", $batch) . ";\n");
        $rowsTotal += count($batch);
        $batch = [];
      }
    }
    if ($batch) {
      fwrite($out, "INSERT INTO `$table` $columns VALUES\n" . implode(",\n", $batch) . ";\n");
      $rowsTotal += count($batch);
    }
  }
  fwrite($out, "\nSET FOREIGN_KEY_CHECKS = 1;\n-- End of backup\n");
  fclose($out);
  rename("$sqlPath.part", $sqlPath);

  // The uploaded photos aren't in the database: they go in a zip next to it.
  $zipPath = null;
  $files = is_dir(TOOL_UPLOADS_DIR) ? iterator_to_array(new RecursiveIteratorIterator(new RecursiveDirectoryIterator(TOOL_UPLOADS_DIR, FilesystemIterator::SKIP_DOTS))) : [];
  $files = array_filter($files, function ($file) {
    return $file->isFile() && $file->getFilename() !== '.htaccess';
  });
  if ($files && class_exists('ZipArchive')) {
    $zipPath = "$dir/roomease-$stamp-uploads.zip";
    $zip = new ZipArchive();
    $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $base = realpath(TOOL_UPLOADS_DIR);
    foreach ($files as $file) $zip->addFile($file->getPathname(), 'uploads/' . str_replace('\\', '/', substr($file->getRealPath(), strlen($base) + 1)));
    $zip->close();
  }

  // Keep the newest $keep backups.
  $all = glob("$dir/roomease-*.sql");
  rsort($all);
  foreach (array_slice($all, $keep) as $old) {
    @unlink($old);
    @unlink(substr($old, 0, -4) . '-uploads.zip');
  }
  return ['sql' => $sqlPath, 'zip' => $zipPath, 'tables' => count($tables), 'rows' => $rowsTotal, 'photos' => count($files), 'zipMissing' => $files && !class_exists('ZipArchive')];
}

// The newest backup file, or null.
function latest_backup()
{
  $all = is_dir(BACKUPS_DIR) ? glob(BACKUPS_DIR . '/roomease-*.sql') : [];
  rsort($all);
  return $all[0] ?? null;
}

// "1.2 MB"
function file_size($path)
{
  $bytes = filesize($path);
  return $bytes >= 1048576 ? round($bytes / 1048576, 1) . ' MB' : max(1, round($bytes / 1024)) . ' KB';
}
