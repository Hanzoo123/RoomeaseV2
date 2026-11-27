<?php
// Settings kept out of the code: the Gmail App Password, and optionally the database. They
// go in a file named .env at the project root (next to index.php), the same keys as the
// first RoomEase project uses, e.g.
//
//   ROOMEASE_MAIL_USERNAME=you@gmail.com
//   ROOMEASE_MAIL_PASSWORD="abcd efgh ijkl mnop"
//   ROOMEASE_MAIL_PORT=587
//
// .env is ignored by git and refused by the web server (.htaccess). A real environment
// variable with the same name wins over the file. See .env.example for every key.

const ENV_FILE = __DIR__ . '/../../.env';

// The value of $key, or $default when it isn't set (or is empty).
function env_value($key, $default = '')
{
  $real = getenv($key);
  if ($real !== false && $real !== '') return $real;
  $file = env_file_values();
  return isset($file[$key]) && $file[$key] !== '' ? $file[$key] : $default;
}

// KEY=value lines; # starts a comment; values may be in "double" or 'single' quotes.
function env_file_values()
{
  static $values = null;
  if ($values !== null) return $values;
  $values = [];
  if (!is_readable(ENV_FILE)) return $values;
  foreach (file(ENV_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#' || !preg_match('/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/', $line, $match)) continue;
    $value = $match[2];
    if (preg_match('/^"((?:[^"\\\\]|\\\\.)*)"/', $value, $quoted)) {
      $value = stripcslashes($quoted[1]);
    } elseif (preg_match("/^'([^']*)'/", $value, $quoted)) {
      $value = $quoted[1];
    } else {
      // Unquoted: a " #" starts a comment.
      $value = trim(preg_replace('/\s+#.*$/', '', $value));
    }
    $values[$match[1]] = $value;
  }
  return $values;
}
