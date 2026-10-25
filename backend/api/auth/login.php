<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'POST'   => handleLogin(),
    'GET'    => handleMe(),
    'DELETE' => handleLogout(),
    default  => error('Method not allowed', 405),
};

function handleLogin(): void {
    $db   = Database::connect();
    $body = body();

    $email    = trim($body['email']    ?? '');
    $password = trim($body['password'] ?? '');

    if (!$email || !$password) error('email and password are required');

    $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        error('Invalid credentials', 401);
    }

    // Fetch vendor id if vendor
    $vendorId = null;
    if ($user['role'] === 'vendor') {
        $vs = $db->prepare('SELECT id FROM vendors WHERE user_id = ?');
        $vs->execute([$user['id']]);
        $v = $vs->fetch();
        $vendorId = $v ? (int) $v['id'] : null;
    }

    $token = generateToken([
        'id'        => (int) $user['id'],
        'email'     => $user['email'],
        'role'      => $user['role'],
        'vendor_id' => $vendorId,
    ]);

    setAuthCookie($token);

    respond([
        'token' => $token,
        'user'  => [
            'id'        => (int) $user['id'],
            'name'      => $user['name'],
            'email'     => $user['email'],
            'role'      => $user['role'],
            'avatar'    => $user['avatar'],
            'vendor_id' => $vendorId,
        ],
    ]);
}

function handleLogout(): void {
    setcookie('auth_token', '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'domain'   => '',
        'secure'   => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    respond(['message' => 'Logged out successfully']);
}

function handleMe(): void {
    $payload = requireAuth();
    $db      = Database::connect();

    $stmt = $db->prepare('SELECT id, name, email, role, avatar, phone, created_at FROM users WHERE id = ?');
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user) error('User not found', 404);

    respond(['user' => $user]);
}
