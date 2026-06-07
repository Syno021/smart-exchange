<?php
class StockController {
    public static function adjust(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $body = json_decode(file_get_contents('php://input'), true);
        Validator::failIfErrors(Validator::required($body, ['product_id', 'qty_change']));

        $productId = (int) $body['product_id'];
        $qtyChange = (int) $body['qty_change'];
        $note      = $body['note'] ?? 'Manual adjustment';

        if ($qtyChange === 0) Response::error('Quantity change cannot be zero');

        $db = Database::getInstance();
        $db->beginTransaction();
        try {
            $stmt = $db->prepare('SELECT stock_qty FROM products WHERE product_id = ? FOR UPDATE');
            $stmt->execute([$productId]);
            $before = $stmt->fetch();
            if (!$before) Response::error('Product not found', 404);

            $qtyBefore = (int) $before['stock_qty'];
            $qtyAfter  = $qtyBefore + $qtyChange;
            if ($qtyAfter < 0) Response::error('Insufficient stock for adjustment');

            $db->prepare('UPDATE products SET stock_qty = ? WHERE product_id = ?')->execute([$qtyAfter, $productId]);
            $db->prepare('
                INSERT INTO stock_movements (product_id, user_id, movement_type, reference_id, qty_before, qty_change, qty_after, note)
                VALUES (?,?,?,?,?,?,?,?)
            ')->execute([
                $productId, $payload['user_id'], 'adjustment', null,
                $qtyBefore, $qtyChange, $qtyAfter, $note,
            ]);

            $db->commit();
            AuditLogger::log($payload['user_id'], 'ADJUST', 'stock_movements', $productId, ['stock_qty' => $qtyBefore], ['stock_qty' => $qtyAfter]);
            Response::success(['product_id' => $productId, 'qty_before' => $qtyBefore, 'qty_after' => $qtyAfter], 'Stock adjusted');
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Stock adjustment failed: ' . $e->getMessage(), 500);
        }
    }

    public static function receive(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $body  = json_decode(file_get_contents('php://input'), true);
        $items = $body['items'] ?? [];

        if (empty($items)) Response::error('At least one item is required');

        $db = Database::getInstance();
        $poId = !empty($body['po_id']) ? (int) $body['po_id'] : null;

        $db->beginTransaction();
        try {
            foreach ($items as $item) {
                $qty = (int) ($item['qty'] ?? $item['qty_received'] ?? 0);
                if ($qty <= 0) continue;

                Validator::failIfErrors(Validator::required($item, ['product_id']));
                $productId = (int) $item['product_id'];

                $stmt = $db->prepare('SELECT stock_qty FROM products WHERE product_id = ? FOR UPDATE');
                $stmt->execute([$productId]);
                $before = $stmt->fetch();
                if (!$before) Response::error("Product $productId not found", 404);

                $qtyBefore = (int) $before['stock_qty'];
                $qtyAfter  = $qtyBefore + $qty;

                $db->prepare('UPDATE products SET stock_qty = ? WHERE product_id = ?')->execute([$qtyAfter, $productId]);
                $db->prepare('
                    INSERT INTO stock_movements (product_id, user_id, movement_type, reference_id, qty_before, qty_change, qty_after, note)
                    VALUES (?,?,?,?,?,?,?,?)
                ')->execute([
                    $productId, $payload['user_id'], 'purchase', $poId,
                    $qtyBefore, $qty, $qtyAfter, $item['note'] ?? 'Stock received',
                ]);

                if ($poId && !empty($item['po_item_id'])) {
                    $db->prepare('UPDATE po_items SET qty_received = qty_received + ? WHERE po_item_id = ? AND po_id = ?')
                       ->execute([$qty, $item['po_item_id'], $poId]);
                } elseif ($poId) {
                    $db->prepare('UPDATE po_items SET qty_received = qty_received + ? WHERE po_id = ? AND product_id = ?')
                       ->execute([$qty, $poId, $productId]);
                }
            }

            if ($poId) {
                $pending = $db->prepare('
                    SELECT COUNT(*) FROM po_items
                    WHERE po_id = ? AND qty_received < qty_ordered
                ');
                $pending->execute([$poId]);
                $status = (int) $pending->fetchColumn() === 0 ? 'received' : 'shipped';
                $db->prepare('UPDATE purchase_orders SET status = ?, received_date = COALESCE(received_date, CURDATE()) WHERE po_id = ?')
                   ->execute([$status, $poId]);
            }

            $db->commit();
            AuditLogger::log($payload['user_id'], 'RECEIVE', 'stock_movements', $poId ?? 0, null, $body);
            Response::success(null, 'Stock received');
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Stock receive failed: ' . $e->getMessage(), 500);
        }
    }

    public static function movements(): void {
        AuthMiddleware::handle();
        $db = Database::getInstance();

        $page      = max(1, (int)($_GET['page'] ?? 1));
        $perPage   = min(100, (int)($_GET['per_page'] ?? 20));
        $offset    = ($page - 1) * $perPage;
        $productId = $_GET['product_id'] ?? '';
        $type      = $_GET['movement_type'] ?? '';

        $where  = ['1=1'];
        $params = [];

        if ($productId) { $where[] = 'sm.product_id = ?'; $params[] = $productId; }
        if ($type)       { $where[] = 'sm.movement_type = ?'; $params[] = $type; }
        if (!empty($_GET['date_from'])) { $where[] = 'DATE(sm.created_at) >= ?'; $params[] = $_GET['date_from']; }
        if (!empty($_GET['date_to']))   { $where[] = 'DATE(sm.created_at) <= ?'; $params[] = $_GET['date_to']; }

        $whereStr = implode(' AND ', $where);
        $countStmt = $db->prepare("SELECT COUNT(*) FROM stock_movements sm WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT sm.*, p.name AS product_name, u.full_name AS user_name
                FROM stock_movements sm
                LEFT JOIN products p ON sm.product_id = p.product_id
                LEFT JOIN users u ON sm.user_id = u.user_id
                WHERE $whereStr ORDER BY sm.created_at DESC LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }
}
