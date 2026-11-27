<?php
// Sends email through Gmail's SMTP server (encrypted), without a library: WAMP has no mail
// server, so PHP's mail() doesn't work there. The same client as the first RoomEase project.
//
// Settings (.env at the project root, see lib/env.php and .env.example):
//   ROOMEASE_MAIL_USERNAME   the Gmail address mail is sent from
//   ROOMEASE_MAIL_PASSWORD   its 16-letter App Password (not the account's own password)
//   ROOMEASE_MAIL_PORT       465 (TLS at once, the default) or 587 (STARTTLS)
//   ROOMEASE_MAIL_FROM_NAME  the sender's name (RoomEase)
//   ROOMEASE_MAIL_HOST       smtp.gmail.com, unless you use another provider
//   ROOMEASE_MAIL_CA_BUNDLE  a cacert.pem, if PHP can't check Gmail's certificate on its own
//
// Each send is logged to backend/logs/mail.log: who, when and whether it worked. Never the
// message, the code in it, or the password.

require_once __DIR__ . '/runtime.php';

function mail_config()
{
  static $config = null;
  if ($config !== null) return $config;
  $config = [
    'username' => trim((string) env_value('ROOMEASE_MAIL_USERNAME')),
    // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces aren't part of it.
    'password' => preg_replace('/\s+/', '', (string) env_value('ROOMEASE_MAIL_PASSWORD')),
    'from_name' => (string) env_value('ROOMEASE_MAIL_FROM_NAME', 'RoomEase'),
    'host' => (string) env_value('ROOMEASE_MAIL_HOST', 'smtp.gmail.com'),
    'port' => (int) env_value('ROOMEASE_MAIL_PORT', '465'),
    'ca_bundle' => (string) env_value('ROOMEASE_MAIL_CA_BUNDLE'),
  ];
  return $config;
}

// True while .env still has the example values from .env.example.
function mail_is_placeholder(array $config)
{
  return $config['password'] === 'abcdefghijklmnop' || $config['username'] === 'you@gmail.com';
}

// True once a real address and App Password are set.
function mail_enabled()
{
  $config = mail_config();
  return $config['username'] !== '' && $config['password'] !== '' && !mail_is_placeholder($config);
}

// Sends one email. Returns true if the server accepted it, or a short reason why not
// (safe to show to the site's owner: it never contains the password). $htmlBody is optional.
function send_mail($to, $subject, $textBody, $htmlBody = null)
{
  if (!mail_enabled()) {
    $reason = mail_is_placeholder(mail_config()) ? '.env still has the example Gmail address or App Password' : 'email is not set up (ROOMEASE_MAIL_USERNAME and ROOMEASE_MAIL_PASSWORD in .env)';
    mail_log($to, 'not sent - ' . $reason);
    return $reason;
  }
  // No line breaks allowed: they could add email headers.
  if (!filter_var($to, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $to . $subject)) {
    mail_log($to, 'not sent - invalid recipient or subject');
    return 'invalid recipient or subject';
  }

  $config = mail_config();
  $smtp = null;
  try {
    $smtp = smtp_open($config);
    smtp_command($smtp, 'AUTH LOGIN', 334, 'AUTH');
    smtp_command($smtp, base64_encode($config['username']), 334, 'AUTH username');
    smtp_command($smtp, base64_encode($config['password']), 235, 'AUTH password');
    smtp_command($smtp, 'MAIL FROM:<' . $config['username'] . '>', 250, 'MAIL FROM');
    smtp_command($smtp, 'RCPT TO:<' . $to . '>', [250, 251], 'RCPT TO');
    smtp_command($smtp, 'DATA', 354, 'DATA');
    // SMTP: a line starting with "." gets another one; a lone "." ends the message.
    $message = mail_build_message($config, $to, $subject, $textBody, $htmlBody);
    smtp_command($smtp, preg_replace('/^\./m', '..', $message) . "\r\n.", 250, 'message');
    @fwrite($smtp, "QUIT\r\n");
    fclose($smtp);
    mail_log($to, 'sent');
    return true;
  } catch (RuntimeException $error) {
    if (is_resource($smtp)) fclose($smtp);
    mail_log($to, 'FAILED - ' . $error->getMessage());
    return $error->getMessage();
  }
}

// Connects and encrypts the connection before the password is sent.
function smtp_open(array $config)
{
  $implicitTls = $config['port'] === 465;
  $ssl = ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $config['host']];
  if ($config['ca_bundle'] !== '') $ssl['cafile'] = $config['ca_bundle'];

  $address = ($implicitTls ? 'ssl://' : 'tcp://') . $config['host'] . ':' . $config['port'];
  [$smtp, $warnings] = mail_quietly(function () use ($address, $ssl, &$errstr) {
    return stream_socket_client($address, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, stream_context_create(['ssl' => $ssl]));
  });
  if (!$smtp) {
    $reason = $warnings ?: ($errstr !== '' ? $errstr : 'unknown error');
    throw new RuntimeException("could not connect to $address ($reason)");
  }
  stream_set_timeout($smtp, 15);

  smtp_expect($smtp, 220, 'greeting');
  $hello = 'EHLO ' . mail_hostname();
  smtp_command($smtp, $hello, 250, 'EHLO');
  if (!$implicitTls) {
    smtp_command($smtp, 'STARTTLS', 220, 'STARTTLS');
    $method = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
    if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) $method |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
    [$encrypted, $warnings] = mail_quietly(function () use ($smtp, $method) {
      return stream_socket_enable_crypto($smtp, true, $method);
    });
    if (!$encrypted) {
      fclose($smtp);
      throw new RuntimeException('STARTTLS: could not start encryption' . ($warnings !== '' ? " ($warnings)" : ''));
    }
    smtp_command($smtp, $hello, 250, 'EHLO');
  }
  return $smtp;
}

// Runs $step and returns [its result, the PHP warnings it raised]. OpenSSL explains a failed
// connection in an earlier warning (e.g. "certificate verify failed"), not in the last one.
function mail_quietly(callable $step)
{
  $warnings = [];
  set_error_handler(function ($level, $message) use (&$warnings) {
    $warnings[] = preg_replace('/^\w+\(\): /', '', $message);
    return true;
  });
  try {
    $result = $step();
  } finally {
    restore_error_handler();
  }
  return [$result, preg_replace('/\s+/', ' ', implode('; ', array_unique($warnings)))];
}

// Sends one command and checks the reply. Errors name the step, never the command (it may
// be the password).
function smtp_command($smtp, $line, $expect, $step)
{
  $data = $line . "\r\n";
  while ($data !== '') {
    $written = @fwrite($smtp, $data);
    if ($written === false || $written === 0) throw new RuntimeException("$step: connection lost while sending");
    $data = (string) substr($data, $written);
  }
  return smtp_expect($smtp, $expect, $step);
}

// Reads one reply (it may span lines) and checks its code.
function smtp_expect($smtp, $expect, $step)
{
  $reply = '';
  while (($line = fgets($smtp, 1024)) !== false) {
    $reply .= $line;
    // "250-…" continues the reply; "250 …" is its last line.
    if (strlen($line) < 4 || $line[3] !== '-') break;
  }
  if ($reply === '') {
    $meta = stream_get_meta_data($smtp);
    throw new RuntimeException($step . ': ' . ($meta['timed_out'] ? 'no reply (timed out)' : 'connection closed'));
  }
  if (!in_array((int) substr($reply, 0, 3), (array) $expect, true)) {
    throw new RuntimeException($step . ': ' . trim(preg_replace('/\s+/', ' ', $reply)));
  }
  return $reply;
}

// The whole message: headers, then a plain-text and (optionally) an HTML version.
function mail_build_message(array $config, $to, $subject, $textBody, $htmlBody)
{
  $domain = substr(strrchr($config['username'], '@'), 1) ?: 'localhost';
  $fromName = str_replace(['"', '\\', "\r", "\n"], '', $config['from_name']);
  $headers = [
    'Date: ' . date(DATE_RFC2822),
    'From: ' . mail_encode_header($fromName, true) . ' <' . $config['username'] . '>',
    'To: <' . $to . '>',
    'Subject: ' . mail_encode_header($subject),
    'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
    'MIME-Version: 1.0',
  ];
  $text = mail_part('text/plain', $textBody);
  if ($htmlBody === null) return implode("\r\n", $headers) . "\r\n" . $text;

  $boundary = 'roomease-' . bin2hex(random_bytes(12));
  $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
  return implode("\r\n", $headers) . "\r\n\r\n"
    . '--' . $boundary . "\r\n" . $text . "\r\n"
    . '--' . $boundary . "\r\n" . mail_part('text/html', $htmlBody) . "\r\n"
    . '--' . $boundary . '--';
}

// One part of the message, base64-encoded.
function mail_part($type, $body)
{
  $body = preg_replace('/\r\n|\r|\n/', "\r\n", (string) $body);
  return "Content-Type: $type; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . rtrim(chunk_split(base64_encode($body), 76, "\r\n"));
}

// A header value, encoded only if it isn't plain ASCII.
function mail_encode_header($value, $quoted = false)
{
  $value = str_replace(["\r", "\n"], '', (string) $value);
  if (preg_match('/^[\x20-\x7E]*$/', $value)) return $quoted ? '"' . $value . '"' : $value;
  return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

// The name given to the mail server in the greeting (it isn't checked).
function mail_hostname()
{
  $name = $_SERVER['SERVER_NAME'] ?? (gethostname() ?: '');
  return preg_match('/^[A-Za-z0-9.-]{1,253}$/', $name) ? $name : 'localhost';
}

function mail_log($to, $outcome)
{
  // logs_dir() keeps the folder's .htaccess: the log has email addresses.
  @file_put_contents(
    logs_dir() . '/mail.log',
    sprintf('[%s] to %s - %s%s', date('Y-m-d H:i:s'), str_replace(["\r", "\n"], '', (string) $to), preg_replace('/\s+/', ' ', $outcome), PHP_EOL),
    FILE_APPEND
  );
}
