<?php
// JSON in and out. Every answer is { "ok": true, "data": … } or { "ok": false, "error": "…" }.

function send_json($status, $payload)
{
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function ok($data = null, $status = 200)
{
  send_json($status, ['ok' => true, 'data' => $data]);
}

// $fields: problems per form field, e.g. ['email' => 'Enter a valid email address.'].
// $code: a word the app can act on, e.g. 'csrf' (fetch a new token and try again).
function fail($status, $message, $fields = null, $code = null)
{
  $payload = ['ok' => false, 'error' => $message];
  if ($fields) $payload['fields'] = $fields;
  if ($code) $payload['code'] = $code;
  send_json($status, $payload);
}

// The request body as an array. Bodies over $limit are refused: 2 MB by default (a profile
// photo is ~50 KB); a listing save with its photos asks for more. The first call sets it.
function body($limit = 2 * 1024 * 1024)
{
  static $body = null;
  if ($body !== null) return $body;
  $raw = file_get_contents('php://input', false, null, 0, $limit + 1);
  if (strlen($raw) > $limit) fail(413, 'That request is too large. Try fewer or smaller photos.');
  if ($raw === '') return $body = [];
  $decoded = json_decode($raw, true);
  if (!is_array($decoded)) fail(400, 'The request body must be JSON.');
  return $body = $decoded;
}

// A trimmed string field from the body ('' when missing or not a string).
function input($key)
{
  $value = body()[$key] ?? '';
  return is_string($value) ? trim($value) : '';
}

function client_ip()
{
  return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45);
}
