<?php
class PurchaseOrderController {
    private static array $statuses = ['draft', 'submitted', 'approved', 'shipped', 'received', 'cancelled'];

    public static function index(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager', 'supplier']);

        $db = Database::getInstance();
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if ($payload['role'] === 'supplier') {
            $where[] = 'po.supplier_id IN (SELECT supplier_id FROM suppliers WHERE user_id = ?)';
            $params[] = $payload['user_id'];
        }
        if (!empty($_GET['status'])) {
            $where[] = 'po.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['supplier_id'])) {
            $where[] = 'po.supplier_id = ?';
            $params[] = $_GET['supplier_id'];
        }

        $whereStr = implode(' AND ', $where);
        $countStmt = $db->prepare("SELECT COUNT(*) FROM purchase_orders po WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT po.*, s.company_name AS supplier_name, u.full_name AS created_by_name
                FROM purchase_orders po
                LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
                LEFT JOIN users u ON po.created_by = u.user_id
                WHERE $whereStr ORDER BY po.created_at DESC LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }

    public static function show(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager', 'supplier']);

        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT po.*, s.company_name AS supplier_name, u.full_name AS created_by_name,
                   a.full_name AS approved_by_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
            LEFT JOIN users u ON po.created_by = u.user_id
            LEFT JOIN users a ON po.approved_by = a.user_id
            WHERE po.po_id = ?
        ");
        $stmt->execute([$id]);
        $po = $stmt->fetch();
        if (!$po) Response::error('Purchase order not found', 404);

        if ($payload['role'] === 'supplier') {
            $check = $db->prepare('SELECT supplier_id FROM suppliers WHERE user_id = ?');
            $check->execute([$payload['user_id']]);
            $supplierId = $check->fetchColumn();
            if ((int)$po['supplier_id'] !== (int)$supplierId) {
                Response::error('Forbidden', 403);
            }
        }

        $items = $db->prepare("
            SELECT pi.*, p.name AS product_name, p.sku, p.barcode
            FROM po_items pi
            LEFT JOIN products p ON pi.product_id = p.product_id
            WHERE pi.po_id = ?
        ");
        $items->execute([$id]);
        $po['items'] = $items->fetchAll();
        Response::success($po);
    }

    public static function store(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $body  = json_decode(file_get_contents('php://input'), true);
        $items = $body['items'] ?? [];

        Validator::failIfErrors(Validator::required($body, ['supplier_id']));
        if (empty($items)) Response::error('Purchase order must have at least one item');

        $db = Database::getInstance();
        $date  = date('Ymd');
        $count = $db->query("SELECT COUNT(*)+1 FROM purchase_orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
        $poRef = sprintf('PO-%s-%04d', $date, $count);

        $totalAmt = 0;
        $resolvedItems = [];
        foreach ($items as $item) {
            $resolved = self::resolveLineItem($db, $item);
            $totalAmt += $resolved['line_total'];
            $resolvedItems[] = $resolved;
        }

        $db->beginTransaction();
        try {
            $db->prepare('
                INSERT INTO purchase_orders (po_ref, supplier_id, created_by, status, total_amt, expected_date, notes)
                VALUES (?,?,?,?,?,?,?)
            ')->execute([
                $poRef,
                $body['supplier_id'],
                $payload['user_id'],
                $body['status'] ?? 'draft',
                $totalAmt,
                $body['expected_date'] ?? null,
                $body['notes'] ?? null,
            ]);
            $poId = (int) $db->lastInsertId();

            foreach ($resolvedItems as $item) {
                $db->prepare('
                    INSERT INTO po_items (po_id, product_id, qty_ordered, qty_received, unit_cost, line_total)
                    VALUES (?,?,?,?,?,?)
                ')->execute([
                    $poId,
                    $item['product_id'],
                    $item['qty_ordered'],
                    $item['qty_received'],
                    $item['unit_cost'],
                    $item['line_total'],
                ]);
            }

            $db->commit();
            AuditLogger::log($payload['user_id'], 'CREATE', 'purchase_orders', $poId, null, ['po_ref' => $poRef]);
            Response::success(['po_id' => $poId, 'po_ref' => $poRef], 'Purchase order created', 201);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Purchase order creation failed: ' . $e->getMessage(), 500);
        }
    }

    public static function update(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager', 'supplier']);

        $body = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance();

        $old = $db->prepare('SELECT * FROM purchase_orders WHERE po_id = ?');
        $old->execute([$id]);
        $before = $old->fetch();
        if (!$before) Response::error('Purchase order not found', 404);

        if ($payload['role'] === 'supplier') {
            $check = $db->prepare('SELECT supplier_id FROM suppliers WHERE user_id = ?');
            $check->execute([$payload['user_id']]);
            if ((int)$before['supplier_id'] !== (int)$check->fetchColumn()) {
                Response::error('Forbidden', 403);
            }
            if (isset($body['status'])) {
                self::assertStatusTransition($before['status'], $body['status'], 'supplier');
            }
            $body = array_intersect_key($body, array_flip(['status', 'supplier_notes']));
        } elseif (isset($body['status'])) {
            self::assertStatusTransition($before['status'], $body['status'], $payload['role']);
        }

        if (
            in_array($payload['role'], ['admin', 'manager'], true)
            && $before['status'] !== 'draft'
            && (!empty($body['items']) || isset($body['supplier_id']))
        ) {
            Response::error('Only draft purchase orders can be edited', 422);
        }

        $db->beginTransaction();
        try {
            if (isset($body['status']) && Validator::inArray($body['status'], self::$statuses)) {
                $approvedBy = null;
                if ($body['status'] === 'approved') {
                    $approvedBy = $payload['user_id'];
                }
                $receivedDate = $before['received_date'];
                if ($body['status'] === 'received' && empty($before['received_date'])) {
                    $receivedDate = date('Y-m-d');
                }

                $db->prepare('
                    UPDATE purchase_orders SET status = ?, approved_by = COALESCE(?, approved_by),
                      expected_date = COALESCE(?, expected_date), received_date = ?,
                      notes = COALESCE(?, notes), supplier_notes = COALESCE(?, supplier_notes)
                    WHERE po_id = ?
                ')->execute([
                    $body['status'],
                    $approvedBy,
                    $body['expected_date'] ?? null,
                    $receivedDate,
                    $body['notes'] ?? null,
                    $body['supplier_notes'] ?? null,
                    $id,
                ]);
            } else {
                $db->prepare('
                    UPDATE purchase_orders SET expected_date = COALESCE(?, expected_date),
                      notes = COALESCE(?, notes), supplier_notes = COALESCE(?, supplier_notes)
                    WHERE po_id = ?
                ')->execute([
                    $body['expected_date'] ?? null,
                    $body['notes'] ?? null,
                    $body['supplier_notes'] ?? null,
                    $id,
                ]);
            }

            if (!empty($body['items']) && in_array($payload['role'], ['admin', 'manager'], true)) {
                if ($before['status'] !== 'draft') {
                    Response::error('Line items can only be edited while the PO is in draft status', 422);
                }
                $db->prepare('DELETE FROM po_items WHERE po_id = ?')->execute([$id]);
                $totalAmt = 0;
                foreach ($body['items'] as $item) {
                    $resolved = self::resolveLineItem($db, $item);
                    $totalAmt += $resolved['line_total'];
                    $db->prepare('
                        INSERT INTO po_items (po_id, product_id, qty_ordered, qty_received, unit_cost, line_total)
                        VALUES (?,?,?,?,?,?)
                    ')->execute([
                        $id,
                        $resolved['product_id'],
                        $resolved['qty_ordered'],
                        $resolved['qty_received'],
                        $resolved['unit_cost'],
                        $resolved['line_total'],
                    ]);
                }
                $db->prepare('UPDATE purchase_orders SET total_amt = ? WHERE po_id = ?')->execute([$totalAmt, $id]);
            }

            $db->commit();
            AuditLogger::log($payload['user_id'], 'UPDATE', 'purchase_orders', $id, $before, $body);
            Response::success(null, 'Purchase order updated');
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Purchase order update failed: ' . $e->getMessage(), 500);
        }
    }

    /** Resolve PO line pricing from the product catalogue — client-supplied costs are ignored. */
    private static function resolveLineItem(PDO $db, array $item): array {
        Validator::failIfErrors(Validator::required($item, ['product_id', 'qty_ordered']));

        $productId = (int) $item['product_id'];
        $qty       = max(1, (int) $item['qty_ordered']);

        $stmt = $db->prepare('SELECT cost_price FROM products WHERE product_id = ?');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::error("Product {$productId} not found", 404);
        }

        $unitCost  = round((float) $product['cost_price'], 2);
        $lineTotal = round($qty * $unitCost, 2);

        return [
            'product_id'   => $productId,
            'qty_ordered'  => $qty,
            'qty_received' => (int) ($item['qty_received'] ?? 0),
            'unit_cost'    => $unitCost,
            'line_total'   => $lineTotal,
        ];
    }

    private static function assertStatusTransition(string $from, string $to, string $role): void {
        if ($from === $to) return;

        $managerTransitions = [
            'draft'     => ['submitted', 'cancelled'],
            'submitted' => ['approved', 'cancelled'],
            'approved'  => ['cancelled'],
        ];

        if ($role === 'supplier') {
            if ($from === 'approved' && $to === 'shipped') return;
            Response::error("Suppliers cannot change status from {$from} to {$to}", 422);
        }

        if (in_array($role, ['admin', 'manager'], true)) {
            $allowed = $managerTransitions[$from] ?? [];
            if (in_array($to, $allowed, true)) return;
            Response::error("Cannot change status from {$from} to {$to}", 422);
        }

        Response::error('Invalid status transition', 422);
    }
}
