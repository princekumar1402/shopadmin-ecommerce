<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'POST' => handleRegister(),
    default => error('Method not allowed', 405),
};

function handleRegister(): void {
    $db   = Database::connect();
    $body = body();

    $name     = trim($body['name']     ?? '');
    $email    = trim($body['email']    ?? '');
    $password = trim($body['password'] ?? '');
    $role     = $body['role']          ?? 'buyer';  // buyer | vendor

    if (!$name || !$email || !$password) {
        error('name, email and password are required');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error('Invalid email address');
    }
    if (strlen($password) < 6) {
        error('Password must be at least 6 characters');
    }
    if (!in_array($role, ['buyer', 'vendor'], true)) {
        error('role must be buyer or vendor');
    }

    // Check duplicate
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        error('Email already registered', 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $db->prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$name, $email, $hash, $role]);
    $userId = (int) $db->lastInsertId();

    // Auto-create vendor profile if role = vendor
    $vendorId = null;
    if ($role === 'vendor') {
        $shopName = $body['shop_name'] ?? $name . "'s Shop";
        $slug     = preg_replace('/[^a-z0-9]+/', '-', strtolower($shopName)) . '-' . $userId;
        $db->prepare(
            'INSERT INTO vendors (user_id, shop_name, slug, is_approved) VALUES (?, ?, ?, 1)'
        )->execute([$userId, $shopName, $slug]);
        $vendorId = (int) $db->lastInsertId();
    }

    $tokenPayload = ['id' => $userId, 'email' => $email, 'role' => $role];
    if ($vendorId) {
        $tokenPayload['vendor_id'] = $vendorId;
    }
    $token = generateToken($tokenPayload);
    setAuthCookie($token);

    respond([
        'message' => 'Registered successfully',
        'token'   => $token,
        'role'    => $role,
        'user'    => [
            'id'        => $userId,
            'name'      => $name,
            'email'     => $email,
            'role'      => $role,
            'vendor_id' => $vendorId,
        ],
    ], 201);
}
