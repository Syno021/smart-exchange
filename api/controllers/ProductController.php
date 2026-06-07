<?php
class ProductController {
    public static function index(): void {
        $payload = AuthMiddleware::handle();
        $db = Database::getInstance();

        $page    = max(1, (int)($_GET['page']    ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $search  = $_GET['search']      ?? '';
        $catId   = $_GET['category_id'] ?? '';
        $status  = $_GET['status']      ?? '';
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if ($search) {
            $where[]  = '(p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)';
            $like     = "%$search%";
            $params   = array_merge($params, [$like, $like, $like]);
        }
        if ($catId) { $where[] = 'p.category_id = ?'; $params[] = $catId; }
        if ($status === 'active')   { $where[] = 'p.is_active = 1'; }
        if ($status === 'inactive') { $where[] = 'p.is_active = 0'; }
        if ($status === 'low')      { $where[] = 'p.stock_qty <= p.reorder_level AND p.stock_qty > 0'; }
        if ($status === 'out')      { $where[] = 'p.stock_qty = 0'; }

        $whereStr = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM products p WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "
            SELECT p.*, c.name AS category_name, s.company_name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s  ON p.supplier_id  = s.supplier_id
            WHERE $whereStr
            ORDER BY p.name ASC
            LIMIT $perPage OFFSET $offset
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        Response::paginated($products, $total, $page, $perPage);
    }

    public static function show(int $id): void {
        AuthMiddleware::handle();
        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT p.*, c.name AS category_name, s.company_name AS supplier_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id WHERE p.product_id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) Response::error('Product not found', 404);
        Response::success($product);
    }

    public static function store(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $body = json_decode(file_get_contents('php://input'), true);
        $db   = Database::getInstance();

        $required = ['name', 'category_id', 'selling_price'];
        foreach ($required as $field) {
            if (empty($body[$field])) Response::error("Field '$field' is required");
        }

        $stmt = $db->prepare('
            INSERT INTO products
              (category_id, supplier_id, barcode, sku, name, description,
               unit, cost_price, selling_price, stock_qty, reorder_level, max_stock, is_featured)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ');
        $stmt->execute([
            $body['category_id'],
            $body['supplier_id']   ?? null,
            $body['barcode']       ?? null,
            $body['sku']           ?? null,
            $body['name'],
            $body['description']   ?? null,
            $body['unit']          ?? 'each',
            $body['cost_price']    ?? 0,
            $body['selling_price'],
            $body['stock_qty']     ?? 0,
            $body['reorder_level'] ?? 5,
            $body['max_stock']     ?? 100,
            $body['is_featured']   ?? 0,
        ]);
        $id = (int) $db->lastInsertId();

        if (($body['stock_qty'] ?? 0) > 0) {
            $db->prepare('INSERT INTO stock_movements (product_id,user_id,movement_type,reference_id,qty_before,qty_change,qty_after) VALUES (?,?,?,?,?,?,?)')->execute([
                $id, $payload['user_id'], 'opening', null, 0, $body['stock_qty'], $body['stock_qty']
            ]);
        }

        AuditLogger::log($payload['user_id'], 'CREATE', 'products', $id, null, $body);
        Response::success(['product_id' => $id], 'Product created', 201);
    }

    public static function update(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);
        $body = json_decode(file_get_contents('php://input'), true);
        $db   = Database::getInstance();

        $old = $db->prepare('SELECT * FROM products WHERE product_id = ?');
        $old->execute([$id]);
        $before = $old->fetch();
        if (!$before) Response::error('Product not found', 404);

        $db->prepare('
            UPDATE products SET
              category_id=?, supplier_id=?, barcode=?, sku=?, name=?,
              description=?, unit=?, cost_price=?, selling_price=?,
              reorder_level=?, max_stock=?, is_active=?, is_featured=?
            WHERE product_id=?
        ')->execute([
            $body['category_id']   ?? $before['category_id'],
            $body['supplier_id']   ?? $before['supplier_id'],
            $body['barcode']       ?? $before['barcode'],
            $body['sku']           ?? $before['sku'],
            $body['name']          ?? $before['name'],
            $body['description']   ?? $before['description'],
            $body['unit']          ?? $before['unit'],
            $body['cost_price']    ?? $before['cost_price'],
            $body['selling_price'] ?? $before['selling_price'],
            $body['reorder_level'] ?? $before['reorder_level'],
            $body['max_stock']     ?? $before['max_stock'],
            $body['is_active']     ?? $before['is_active'],
            $body['is_featured']   ?? $before['is_featured'],
            $id,
        ]);
        AuditLogger::log($payload['user_id'], 'UPDATE', 'products', $id, $before, $body);
        Response::success(null, 'Product updated');
    }

    public static function destroy(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);
        $db = Database::getInstance();
        $db->prepare('UPDATE products SET is_active = 0 WHERE product_id = ?')->execute([$id]);
        AuditLogger::log($payload['user_id'], 'DELETE', 'products', $id, null, null);
        Response::success(null, 'Product deactivated');
    }

    public static function lowStock(): void {
        AuthMiddleware::handle();
        $db   = Database::getInstance();
        $stmt = $db->query('SELECT p.*, c.name AS category_name, s.company_name AS supplier_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id WHERE p.stock_qty <= p.reorder_level AND p.is_active = 1 ORDER BY p.stock_qty ASC');
        Response::success($stmt->fetchAll());
    }
}
