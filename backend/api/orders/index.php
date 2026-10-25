<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

match ($method) {
    'GET'  => $id ? getOrder($id) : listOrders(),
    'POST' => createOrder(),
    'PUT'  => updateOrderStatus($id),
    default => error('Method not allowed', 405),
};

function listOrders(): void {
    $payload = requireAuth();
    $db      = Database::connect();

    if ($payload['role'] === 'buyer') {
        $stmt = $db->prepare("
            SELECT o.*, COUNT(oi.id) AS item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.buyer_id = ?
            GROUP BY o.id ORDER BY o.created_at DESC
        ");
        $stmt->execute([$payload['id']]);
    } elseif ($payload['role'] === 'vendor') {
        $vs = $db->prepare('SELECT id FROM vendors WHERE user_id = ?');
        $vs->execute([$payload['id']]);
        $v = $vs->fetch();
        if (!$v) error('Vendor not found', 404);
        $stmt = $db->prepare("
            SELECT o.id, o.status, o.total_amount, o.created_at,
                   u.name AS buyer_name, u.email AS buyer_email,
                   COUNT(oi.id) AS item_count
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN users u ON u.id = o.buyer_id
            WHERE oi.vendor_id = ?
            GROUP BY o.id ORDER BY o.created_at DESC
        ");
        $stmt->execute([$v['id']]);
    } else {
        // Admin – all orders with filters
        $where = [];
        $params = [];

        if (!empty($_GET['status'])) {
            $where[] = 'o.status = ?';
            $params[] = $_GET['status'];
        }

        if (!empty($_GET['q'])) {
            $term = '%' . trim($_GET['q']) . '%';
            $where[] = '(o.id LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $db->prepare("
            SELECT o.*, u.name AS buyer_name, u.email AS buyer_email,
                   COUNT(oi.id) AS item_count,
                   GROUP_CONCAT(DISTINCT v.shop_name SEPARATOR ', ') AS vendor_names
            FROM orders o
            JOIN users u ON u.id = o.buyer_id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN vendors v ON v.id = oi.vendor_id
            $whereSql
            GROUP BY o.id
            ORDER BY o.created_at DESC
        ");
        $stmt->execute($params);
    }

    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) {
        $o['shipping_addr'] = json_decode($o['shipping_addr'] ?? '{}', true);
    }
    respond(['orders' => $orders]);
}

function getOrder(int $id): void {
    $payload = requireAuth();
    $db      = Database::connect();

    $stmt = $db->prepare("SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
                          FROM orders o JOIN users u ON u.id = o.buyer_id WHERE o.id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) error('Order not found', 404);

    if ($payload['role'] === 'buyer' && (int) $order['buyer_id'] !== $payload['id']) {
        error('Forbidden', 403);
    }

    $order['shipping_addr'] = json_decode($order['shipping_addr'] ?? '{}', true) ?: [];

    $items = $db->prepare("
        SELECT oi.*, p.name AS product_name, p.images, v.shop_name AS vendor_name
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN vendors  v ON v.id = oi.vendor_id
        WHERE oi.order_id = ?
    ");
    $items->execute([$id]);
    $order['items'] = array_map(function ($item) {
        $imgs = json_decode($item['images'] ?? '[]', true);
        $item['image'] = $imgs[0] ?? null;
        unset($item['images']);
        return $item;
    }, $items->fetchAll());

    respond(['order' => $order]);
}

function createOrder(): void {
    $db   = Database::connect();
    $body = body();

    $userId = null;
    // Check if authentication token or cookie is provided
    try {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        $cookie = $_COOKIE['auth_token'] ?? $_COOKIE['token'] ?? null;
        if ($authHeader || $cookie) {
            $payload = requireAuth();
            $userId = (int) $payload['id'];
        }
    } catch (Exception $e) {
        $userId = null;
    }

    $items = $body['items'] ?? [];
    $addr  = $body['shipping_address'] ?? [];
    if (empty($items) || empty($addr)) error('items and shipping_address are required');

    // Guest checkout fallback: resolve or create buyer record from shipping email
    if (!$userId) {
        $email = trim($addr['email'] ?? $body['email'] ?? 'guest@cretzo.com');
        $name  = trim($addr['full_name'] ?? $body['name'] ?? 'Guest Buyer');

        $us = $db->prepare('SELECT id FROM users WHERE email = ?');
        $us->execute([$email]);
        $existing = $us->fetch();
        if ($existing) {
            $userId = (int) $existing['id'];
        } else {
            $dummyPass = password_hash(bin2hex(random_bytes(8)), PASSWORD_BCRYPT);
            $db->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "buyer")')
               ->execute([$name, $email, $dummyPass]);
            $userId = (int) $db->lastInsertId();
        }
    }

    $total = 0;
    $rows  = [];

    $db->beginTransaction();
    try {
        foreach ($items as $item) {
            $pid = (int) ($item['product_id'] ?? 0);
            $qty = (int) ($item['quantity']   ?? 1);
            if ($pid <= 0 || $qty <= 0) throw new Exception('Invalid item');

            $ps = $db->prepare('SELECT id, price, stock, vendor_id FROM products WHERE id = ? AND is_active = 1');
            $ps->execute([$pid]);
            $p = $ps->fetch();
            if (!$p) throw new Exception("Product #$pid not found");
            if ($p['stock'] < $qty) throw new Exception("Insufficient stock for product #$pid");

            $subtotal = round($p['price'] * $qty, 2);
            $total   += $subtotal;
            $rows[]   = [(int)$p['id'], (int)$p['vendor_id'], $qty, (float)$p['price'], $subtotal];

            // Deduct stock
            $db->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')->execute([$qty, $pid]);
        }

        $db->prepare(
            "INSERT INTO orders (buyer_id, total_amount, shipping_addr, payment_method) VALUES (?, ?, ?, ?)"
        )->execute([$userId, $total, json_encode($addr), $body['payment_method'] ?? 'cod']);
        $orderId = (int) $db->lastInsertId();

        $ins = $db->prepare(
            "INSERT INTO order_items (order_id, product_id, vendor_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)"
        );
        foreach ($rows as [$pid, $vid, $qty, $price, $sub]) {
            $ins->execute([$orderId, $pid, $vid, $qty, $price, $sub]);
        }

        $db->commit();
        respond(['message' => 'Order placed', 'order_id' => $orderId, 'total' => $total], 201);
    } catch (Exception $e) {
        $db->rollBack();
        error($e->getMessage());
    }
}

function updateOrderStatus(?int $id): void {
    if (!$id) error('Order ID required');
    $payload = requireAuth();
    $db      = Database::connect();
    $body    = body();

    $status = $body['status'] ?? null;
    $allowed = ['pending','confirmed','shipped','delivered','cancelled'];
    if (!in_array($status, $allowed, true)) error('Invalid status');

    // Vendors can only mark as shipped/delivered; buyers can cancel
    $stmt = $db->prepare('SELECT buyer_id FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) error('Order not found', 404);

    if ($payload['role'] === 'buyer') {
        if ((int) $order['buyer_id'] !== $payload['id']) error('Forbidden', 403);
        if ($status !== 'cancelled') error('Buyers can only cancel orders');
    } elseif ($payload['role'] === 'vendor') {
        $vs = $db->prepare('SELECT id FROM vendors WHERE user_id = ?');
        $vs->execute([$payload['id']]);
        $v = $vs->fetch();
        if (!$v) error('Vendor not found', 404);

        $chk = $db->prepare('SELECT id FROM order_items WHERE order_id = ? AND vendor_id = ? LIMIT 1');
        $chk->execute([$id, $v['id']]);
        if (!$chk->fetch()) {
            error('Forbidden - you do not have items in this order', 403);
        }
    }

    $db->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $id]);
    respond(['message' => 'Order status updated']);
}
