<?php
/**
 * Built-in PHP development server router for Cretzo Marketplace API
 */

$rawUri = $_SERVER['REQUEST_URI'];
$uri = urldecode(parse_url($rawUri, PHP_URL_PATH));

// 1. If physical file exists (other than directory), let PHP serve it
$targetFile = __DIR__ . $uri;
if ($uri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    return false;
}

// 2. Exact directory matching an index.php
$dirIndex = rtrim(__DIR__ . $uri, '/') . '/index.php';
if (file_exists($dirIndex)) {
    require $dirIndex;
    return true;
}

// 3. URI directly matching a .php file
$phpDirect = __DIR__ . $uri . '.php';
if (file_exists($phpDirect)) {
    require $phpDirect;
    return true;
}

// 4. Fallback 404 response
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => 'Endpoint not found: ' . $uri], JSON_UNESCAPED_SLASHES);
return true;
