<?php
require_once __DIR__ . '/../../config/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

match ($method) {
    'GET'    => $id ? getProduct($id) : listProducts(),
    'POST'   => createProduct(),
    'PUT'    => updateProduct($id),
    'DELETE' => deleteProduct($id),
    default  => error('Method not allowed', 405),
};

function listProducts(): void {
    $db = Database::connect();

    $isAdminListing = isset($_GET['admin']) && $_GET['admin'] === '1';
    if ($isAdminListing) {
        requireAuth('admin');
    }

    $where  = [];
    $params = [];

    if ($isAdminListing) {
        $status = $_GET['status'] ?? 'all';
        if ($status === 'active') {
            $where[] = 'p.is_active = 1';
        } elseif ($status === 'inactive') {
            $where[] = 'p.is_active = 0';
        }
        // if status === 'all', do not add is_active condition
    } else {
        $where[] = 'p.is_active = 1';
    }

    // Category filter
    if (!empty($_GET['category'])) {
        $where[]  = 'c.slug = ?';
        $params[] = $_GET['category'];
    }
    // Search
    if (!empty($_GET['q'])) {
        $term = '%' . trim($_GET['q']) . '%';
        $where[]  = '(p.name LIKE ? OR p.description LIKE ?)';
        $params[] = $term;
        $params[] = $term;
    }
    // Vendor filter
    if (!empty($_GET['vendor_id'])) {
        $where[]  = 'p.vendor_id = ?';
        $params[] = (int) $_GET['vendor_id'];
    }
    // Min/max price
    if (!empty($_GET['min_price'])) { $where[] = 'p.price >= ?'; $params[] = (float) $_GET['min_price']; }
    if (!empty($_GET['max_price'])) { $where[] = 'p.price <= ?'; $params[] = (float) $_GET['max_price']; }

    $limit  = min(max(1, (int) ($_GET['limit'] ?? 20)), 100);
    $page   = max(0, (int) ($_GET['page'] ?? 0));
    $offset = $page * $limit;

    $sort = match ($_GET['sort'] ?? '') {
        'price_asc'  => 'p.price ASC',
        'price_desc' => 'p.price DESC',
        'newest'     => 'p.created_at DESC',
        default      => 'p.created_at DESC',
    };

    $whereSql = !empty($where) ? implode(' AND ', $where) : '1=1';
    $sql = "
        SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.stock, p.images, p.is_active,
               p.created_at,
               c.name AS category, c.slug AS category_slug,
               v.shop_name AS vendor_name, v.slug AS vendor_slug,
               COALESCE(AVG(r.rating), 0) AS avg_rating,
               COUNT(DISTINCT r.id)       AS review_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN vendors     v ON v.id = p.vendor_id
        LEFT JOIN reviews     r ON r.product_id = p.id
        WHERE $whereSql
        GROUP BY p.id
        ORDER BY $sort
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Decode JSON images
    foreach ($products as &$p) {
        $p['images'] = json_decode($p['images'] ?? '[]', true);
        $p['avg_rating'] = round((float) $p['avg_rating'], 1);
    }

    // Total count (uses exact $params matching the WHERE clause)
    $countSql = "SELECT COUNT(*) FROM products p
                 LEFT JOIN categories c ON c.id = p.category_id
                 LEFT JOIN vendors v ON v.id = p.vendor_id
                 WHERE $whereSql";
    $cs = $db->prepare($countSql);
    $cs->execute($params);
    $total = (int) $cs->fetchColumn();

    respond(['products' => $products, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

function getProduct(int $id): void {
    $db = Database::connect();
    $stmt = $db->prepare("
        SELECT p.*, c.name AS category, c.slug AS category_slug,
               v.shop_name AS vendor_name, v.slug AS vendor_slug, v.logo AS vendor_logo,
               COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(DISTINCT r.id) AS review_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN vendors     v ON v.id = p.vendor_id
        LEFT JOIN reviews     r ON r.product_id = p.id
        WHERE p.id = ? AND p.is_active = 1
        GROUP BY p.id
    ");
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) error('Product not found', 404);

    $product['images'] = json_decode($product['images'] ?? '[]', true);
    $product['tags']   = json_decode($product['tags']   ?? '[]', true);
    $product['avg_rating'] = round((float) $product['avg_rating'], 1);

    // Reviews
    $rs = $db->prepare("
        SELECT r.rating, r.comment, r.created_at, u.name AS buyer_name, u.avatar
        FROM reviews r JOIN users u ON u.id = r.buyer_id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC LIMIT 20
    ");
    $rs->execute([$id]);
    $product['reviews'] = $rs->fetchAll();

    respond(['product' => $product]);
}

function createProduct(): void {
    $payload = requireAuth('vendor');
    $db      = Database::connect();
    $body    = body();

    // Get vendor id from token payload or DB
    $vendorId = $payload['vendor_id'] ?? null;
    if (!$vendorId) {
        $vs = $db->prepare('SELECT id FROM vendors WHERE user_id = ?');
        $vs->execute([$payload['id']]);
        $v = $vs->fetch();
        if (!$v) error('Vendor profile not found', 404);
        $vendorId = (int) $v['id'];
    }

    $name  = trim($body['name']  ?? '');
    $price = (float) ($body['price'] ?? 0);
    if (!$name || $price <= 0) error('name and price are required');

    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name)) . '-' . time();

    $db->prepare("
        INSERT INTO products (vendor_id, category_id, name, slug, description, price, compare_price, stock, images, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $vendorId,
        $body['category_id'] ?? null,
        $name, $slug,
        $body['description'] ?? null,
        $price,
        $body['compare_price'] ?? null,
        (int) ($body['stock'] ?? 0),
        json_encode($body['images'] ?? []),
        json_encode($body['tags']   ?? []),
    ]);

    respond(['message' => 'Product created', 'id' => (int) $db->lastInsertId()], 201);
}

function updateProduct(?int $id): void {
    if (!$id) error('Product ID required');
    $payload  = requireAuth('vendor');
    $db       = Database::connect();
    $body     = body();

    // Verify ownership
    $stmt = $db->prepare('SELECT p.id FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ? AND v.user_id = ?');
    $stmt->execute([$id, $payload['id']]);
    if (!$stmt->fetch() && $payload['role'] !== 'admin') error('Forbidden', 403);

    $fields = ['name','description','price','compare_price','stock','category_id','images','tags','is_active'];
    $sets   = [];
    $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[]   = "$f = ?";
            $params[] = in_array($f, ['images','tags']) ? json_encode($body[$f]) : $body[$f];
        }
    }
    if (empty($sets)) error('Nothing to update');
    $params[] = $id;
    $db->prepare('UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);

    respond(['message' => 'Product updated']);
}

function deleteProduct(?int $id): void {
    if (!$id) error('Product ID required');
    $payload = requireAuth('vendor');
    $db      = Database::connect();

    $stmt = $db->prepare('SELECT p.id FROM products p JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ? AND v.user_id = ?');
    $stmt->execute([$id, $payload['id']]);
    if (!$stmt->fetch() && $payload['role'] !== 'admin') error('Forbidden', 403);

    $db->prepare('UPDATE products SET is_active = 0 WHERE id = ?')->execute([$id]);
    respond(['message' => 'Product deleted']);
}
