<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

match ($method) {
    'GET'  => $id ? getVendor($id) : listVendors(),
    'PUT'  => updateVendor($id),
    default => error('Method not allowed', 405),
};

function listVendors(): void {
    $db = Database::connect();

    // If admin listing is requested, enforce admin authentication
    $isAdminListing = isset($_GET['admin']) && $_GET['admin'] === '1';
    if ($isAdminListing) {
        requireAuth('admin');
    }

    $where = [];
    $params = [];

    if ($isAdminListing) {
        // Status filter: approved, pending, all
        $status = $_GET['status'] ?? 'all';
        if ($status === 'approved') {
            $where[] = 'v.is_approved = 1';
        } elseif ($status === 'pending') {
            $where[] = 'v.is_approved = 0';
        }

        // Search query
        if (!empty($_GET['q'])) {
            $term = '%' . trim($_GET['q']) . '%';
            $where[] = '(v.shop_name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }
    } else {
        // Public marketplace view only shows approved vendors
        $where[] = 'v.is_approved = 1';
    }

    $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $db->prepare("
        SELECT v.id, v.shop_name, v.slug, v.description, v.logo, v.is_approved, v.created_at,
               u.name AS owner_name, u.email,
               COUNT(DISTINCT p.id) AS product_count
        FROM vendors v
        JOIN users u ON u.id = v.user_id
        LEFT JOIN products p ON p.vendor_id = v.id AND p.is_active = 1
        $whereSql
        GROUP BY v.id
        ORDER BY v.created_at DESC
    ");
    $stmt->execute($params);
    respond(['vendors' => $stmt->fetchAll()]);
}

function getVendor(int $id): void {
    $db = Database::connect();
    $stmt = $db->prepare("
        SELECT v.*, u.name AS owner_name, u.email,
               COUNT(DISTINCT p.id) AS product_count
        FROM vendors v
        JOIN users u ON u.id = v.user_id
        LEFT JOIN products p ON p.vendor_id = v.id AND p.is_active = 1
        WHERE v.id = ?
        GROUP BY v.id
    ");
    $stmt->execute([$id]);
    $vendor = $stmt->fetch();
    if (!$vendor) error('Vendor not found', 404);
    respond(['vendor' => $vendor]);
}

function updateVendor(?int $id): void {
    $payload = requireAuth('vendor');
    $db      = Database::connect();
    $body    = body();

    // Admin can update any; vendor can only update their own
    if ($payload['role'] !== 'admin') {
        $vs = $db->prepare('SELECT id FROM vendors WHERE user_id = ?');
        $vs->execute([$payload['id']]);
        $v = $vs->fetch();
        if (!$v || (int)$v['id'] !== $id) error('Forbidden', 403);
    }

    $fields = ['shop_name','description','logo','banner','address'];
    if ($payload['role'] === 'admin') $fields[] = 'is_approved';

    $sets = []; $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $val = $body[$f];
            if ($f === 'is_approved') $val = $val ? 1 : 0;
            $params[] = $val;
        }
    }
    if (empty($sets)) error('Nothing to update');
    $params[] = $id;
    $db->prepare('UPDATE vendors SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
    respond(['message' => 'Vendor profile updated']);
}
