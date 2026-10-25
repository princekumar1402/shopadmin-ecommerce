<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'   => getAdminMetrics(),
    default => error('Method not allowed', 405),
};

function getAdminMetrics(): void {
    // Strictly require admin role
    $payload = requireAuth('admin');
    $db = Database::connect();

    // 1. Metric Counts
    $userCount = (int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $vendorCount = (int) $db->query('SELECT COUNT(*) FROM vendors')->fetchColumn();
    $activeProductCount = (int) $db->query('SELECT COUNT(*) FROM products WHERE is_active = 1')->fetchColumn();
    $totalProductCount = (int) $db->query('SELECT COUNT(*) FROM products')->fetchColumn();
    $orderCount = (int) $db->query('SELECT COUNT(*) FROM orders')->fetchColumn();

    $grossRevenue = (float) $db->query("
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE status != 'cancelled'
    ")->fetchColumn();

    // 2. Recent Orders (Latest 5)
    $ordersStmt = $db->query("
        SELECT o.id, o.status, o.total_amount, o.created_at,
               u.name AS buyer_name, u.email AS buyer_email,
               COUNT(oi.id) AS item_count,
               GROUP_CONCAT(DISTINCT v.shop_name SEPARATOR ', ') AS vendor_names
        FROM orders o
        JOIN users u ON u.id = o.buyer_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN vendors v ON v.id = oi.vendor_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 5
    ");
    $recentOrders = $ordersStmt->fetchAll();

    // 3. Recent Vendors (Latest 5)
    $vendorsStmt = $db->query("
        SELECT v.id, v.shop_name, v.slug, v.is_approved, v.created_at,
               u.name AS owner_name, u.email,
               COUNT(DISTINCT p.id) AS product_count
        FROM vendors v
        JOIN users u ON u.id = v.user_id
        LEFT JOIN products p ON p.vendor_id = v.id AND p.is_active = 1
        GROUP BY v.id
        ORDER BY v.created_at DESC
        LIMIT 5
    ");
    $recentVendors = $vendorsStmt->fetchAll();

    respond([
        'metrics' => [
            'total_users'           => $userCount,
            'total_vendors'         => $vendorCount,
            'active_products'       => $activeProductCount,
            'total_products'        => $totalProductCount,
            'total_orders'          => $orderCount,
            'total_order_value'     => round($grossRevenue, 2),
        ],
        'recent_orders'  => $recentOrders,
        'recent_vendors' => $recentVendors,
    ]);
}
