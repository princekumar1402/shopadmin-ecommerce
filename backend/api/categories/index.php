<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'  => listCategories(),
    default => error('Method not allowed', 405),
};

function listCategories(): void {
    $db = Database::connect();
    $stmt = $db->query("
        SELECT c.id, c.name, c.slug, c.icon, c.parent_id,
               COUNT(p.id) AS product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
        GROUP BY c.id
        ORDER BY c.name ASC
    ");
    respond(['categories' => $stmt->fetchAll()]);
}
