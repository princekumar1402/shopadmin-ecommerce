<?php
/**
 * Shared API helpers – CORS, JSON response, authentication
 */

// Allow cross-origin requests from the Next.js dev server
// Allow cross-origin requests from the Next.js dev server
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:3000';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Handle pre-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

// ── Helpers ────────────────────────────────────────────────────────────────

function respond(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function error(string $message, int $status = 400): void {
    respond(['error' => $message], $status);
}

function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// ── JWT-like token helpers (HMAC-SHA256, stateless) ────────────────────────

if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', getenv('JWT_SECRET') ?: 'cretzo_jwt_super_secret_key_2026_dev');
}

function generateToken(array $payload): string {
    $header  = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + 86400 * 7; // 7 days
    $pl      = base64_encode(json_encode($payload));
    $sig     = base64_encode(hash_hmac('sha256', "$header.$pl", JWT_SECRET, true));
    return "$header.$pl.$sig";
}

function verifyToken(string $token): ?array {
    $token = str_replace(' ', '+', trim($token));
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $pl, $sig] = $parts;
    $expected = base64_encode(hash_hmac('sha256', "$header.$pl", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_decode($pl), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

function setAuthCookie(string $token): void {
    setcookie('auth_token', $token, [
        'expires'  => time() + (86400 * 7),
        'path'     => '/',
        'domain'   => '',
        'secure'   => false, // set true in production with HTTPS
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function requireAuth(?string $role = null): array {
    $token = null;

    // 1. Check Authorization header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
        $token = substr($authHeader, 7);
    }

    // 2. Fallback to HttpOnly cookie if header not provided
    if (!$token) {
        $rawCookie = $_COOKIE['auth_token'] ?? $_COOKIE['token'] ?? null;
        if (!$rawCookie && !empty($_SERVER['HTTP_COOKIE'])) {
            $cookieParts = explode(';', $_SERVER['HTTP_COOKIE']);
            foreach ($cookieParts as $part) {
                $part = trim($part);
                if (str_starts_with($part, 'auth_token=')) {
                    $rawCookie = substr($part, 11);
                    break;
                } elseif (str_starts_with($part, 'token=')) {
                    $rawCookie = substr($part, 6);
                    break;
                }
            }
        }
        if ($rawCookie) {
            $token = urldecode($rawCookie);
        }
    }

    if (!$token) {
        error('Unauthorized', 401);
    }

    $payload = verifyToken($token);
    if (!$payload) error('Invalid or expired token', 401);
    if ($role && $payload['role'] !== $role && $payload['role'] !== 'admin') {
        error('Forbidden', 403);
    }
    return $payload;
}
