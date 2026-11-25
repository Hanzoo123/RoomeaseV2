<?php
// Photos sent by the app as data URLs ("data:image/jpeg;base64,…"). Each one is checked,
// re-drawn with GD (which drops anything hidden in the file) and saved as a JPEG under
// backend/uploads/. Shared by profile photos and listing photos.

const UPLOADS_DIR = __DIR__ . '/../../uploads';

// Why $dataUrl can't be used as a photo ("Photo 2 is too large…"), or null when it can.
function photo_problem($dataUrl, $what = 'That photo', $maxBytes = 1536 * 1024, $maxSide = 6000)
{
  if (!is_string($dataUrl) || !preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $dataUrl, $parts)) {
    return "$what isn’t a JPG, PNG or WebP photo.";
  }
  $bytes = base64_decode($parts[2], true);
  if ($bytes === false || strlen($bytes) > $maxBytes) return "$what is too large. Choose a smaller one.";
  $type = (new finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
  $size = @getimagesizefromstring($bytes);
  if (!in_array($type, ['image/jpeg', 'image/png', 'image/webp'], true) || !$size || $size[0] > $maxSide || $size[1] > $maxSide) {
    return "$what isn’t a photo we can use. Try a JPG or PNG.";
  }
  return null;
}

function require_gd()
{
  if (!function_exists('imagecreatefromstring')) {
    fail(500, 'Photo uploads need PHP’s GD extension. In WAMP, turn on PHP > PHP extensions > gd.');
  }
}

// A GD image from a data URL that passed photo_problem(), or null if GD can't read it.
function open_photo($dataUrl)
{
  require_gd();
  $bytes = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1), true);
  return @imagecreatefromstring($bytes) ?: null;
}

// A GD image from a data URL, or a 422 naming $what.
function decode_photo($dataUrl, $what = 'That photo')
{
  $problem = photo_problem($dataUrl, $what);
  if ($problem) fail(422, $problem);
  return open_photo($dataUrl) ?: fail(422, "$what couldn’t be read. Try another one.");
}

// A copy of $source on a white background, $width × $height, taken from the given crop.
function redraw_photo($source, $width, $height, $cropX = 0, $cropY = 0, $cropWidth = null, $cropHeight = null)
{
  $out = imagecreatetruecolor($width, $height);
  imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
  imagecopyresampled($out, $source, 0, 0, $cropX, $cropY, $width, $height, $cropWidth ?? imagesx($source), $cropHeight ?? imagesy($source));
  return $out;
}

// Scaled down (never up) so its longer side is at most $maxSide.
function fit_photo($source, $maxSide)
{
  $scale = min(1, $maxSide / max(imagesx($source), imagesy($source)));
  return redraw_photo($source, max(1, (int) round(imagesx($source) * $scale)), max(1, (int) round(imagesy($source) * $scale)));
}

// Saves $image as uploads/<folder>/<random>.jpg and returns that path (relative to backend/).
function save_photo($image, $folder, $quality = 85)
{
  $dir = UPLOADS_DIR . '/' . $folder;
  if (!is_dir($dir) && !mkdir($dir, 0775, true)) fail(500, 'The uploads folder can’t be written to.');
  $file = bin2hex(random_bytes(16)) . '.jpg';
  if (!imagejpeg($image, "$dir/$file", $quality)) fail(500, 'The photo couldn’t be saved.');
  return "uploads/$folder/$file";
}

// Deletes a photo this API saved (uploads/<folder>/<hex>.jpg); anything else is left alone.
function remove_photo($path, $folder)
{
  if ($path && preg_match('#^uploads/' . preg_quote($folder, '#') . '/[a-f0-9]{32}\.jpg$#', $path) && is_file(UPLOADS_DIR . "/$folder/" . basename($path))) {
    unlink(UPLOADS_DIR . "/$folder/" . basename($path));
  }
}
