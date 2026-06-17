<?php
class SaleController {
    public static function index(): void {
        $payload = AuthMiddleware::handle();
        $db = Database::getInstance();

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if (!empty($_GET['delivery_queue']) && in_array($payload['role'], ['cashier', 'admin', 'manager'], true)) {
            $where[] = "s.status IN ('pending', 'out_for_delivery')";
            $where[] = 's.delivery_address IS NOT NULL';
        } elseif ($payload['role'] === 'cashier') {
            $where[] = 's.cashier_id = ?';
            $params[] = $payload['user_id'];
        }
        if (!empty($_GET['date_from'])) { $where[] = 'DATE(s.created_at) >= ?'; $params[] = $_GET['date_from']; }
        if (!empty($_GET['date_to']))   { $where[] = 'DATE(s.created_at) <= ?'; $params[] = $_GET['date_to']; }
        if (!empty($_GET['status']))    { $where[] = 's.status = ?'; $params[] = $_GET['status']; }

        $whereStr  = implode(' AND ', $where);
        $countStmt = $db->prepare("SELECT COUNT(*) FROM sales s WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT s.*, u.full_name AS cashier_name, cu.user_id AS cust_user_id,
                       cu2.full_name AS customer_name
                FROM sales s
                LEFT JOIN users u    ON s.cashier_id  = u.user_id
                LEFT JOIN customers cu ON s.customer_id = cu.customer_id
                LEFT JOIN users cu2  ON cu.user_id = cu2.user_id
                WHERE $whereStr ORDER BY s.created_at DESC LIMIT $perPage OFFSET $offset";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }

    public static function show(int $id): void {
        AuthMiddleware::handle();
        $db = Database::getInstance();
        $sale = $db->prepare('SELECT s.*, u.full_name AS cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.user_id WHERE s.sale_id = ?');
        $sale->execute([$id]);
        $data = $sale->fetch();
        if (!$data) Response::error('Sale not found', 404);

        $items = $db->prepare('SELECT si.*, p.name AS product_name FROM sale_items si LEFT JOIN products p ON si.product_id = p.product_id WHERE si.sale_id = ?');
        $items->execute([$id]);
        $data['items'] = $items->fetchAll();
        Response::success($data);
    }

    public static function store(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager', 'cashier']);

        $body  = json_decode(file_get_contents('php://input'), true);
        $db    = Database::getInstance();
        $items = $body['items'] ?? [];

        if (empty($items)) Response::error('Sale must have at least one item');

        $paymentMethod = $body['payment_method'] ?? 'cash';
        $allowedPayments = ['cash', 'card', 'loyalty'];
        if (!Validator::inArray($paymentMethod, $allowedPayments)) {
            Response::error('Invalid payment method. Allowed: cash, card, or loyalty points.', 422);
        }

        $date    = date('Ymd');
        $count   = $db->query("SELECT COUNT(*)+1 FROM sales WHERE DATE(created_at) = CURDATE()")->fetchColumn();
        $saleRef = sprintf('USM-%s-%04d', $date, $count);

        $db->beginTransaction();
        try {
            $subtotal = 0;
            $resolvedItems = [];

            foreach ($items as $item) {
                Validator::failIfErrors(Validator::required($item, ['product_id', 'qty']));

                $productId = (int) $item['product_id'];
                $qty       = max(1, (int) $item['qty']);

                $s = $db->prepare('SELECT selling_price, stock_qty FROM products WHERE product_id = ? AND is_active = 1 FOR UPDATE');
                $s->execute([$productId]);
                $product = $s->fetch();
                if (!$product) {
                    Response::error("Product {$productId} not found or inactive", 404);
                }
                if ((int) $product['stock_qty'] < $qty) {
                    Response::error('Insufficient stock for product ID ' . $productId, 400);
                }

                $unitPrice   = round((float) $product['selling_price'], 2);
                $discountPct = min(100, max(0, (float) ($item['discount_pct'] ?? 0)));
                $lineTotal   = round($qty * $unitPrice * (1 - $discountPct / 100), 2);
                $subtotal   += $lineTotal;

                $resolvedItems[] = [
                    'product_id'   => $productId,
                    'qty'          => $qty,
                    'unit_price'   => $unitPrice,
                    'discount_pct' => $discountPct,
                    'line_total'   => $lineTotal,
                    'stock_qty'    => (int) $product['stock_qty'],
                ];
            }

            $discount = round(min((float)($body['discount_amt'] ?? 0), $subtotal), 2);
            $tax      = round(($subtotal - $discount) * 0.15, 2);
            $total    = round($subtotal - $discount + $tax, 2);
            $paid     = (float)($body['amount_paid'] ?? $total);
            $change   = max(0, round($paid - $total, 2));
            $pointsEarned  = (int) floor($total);
            $pointsRedeemed = 0;

            if ($paymentMethod === 'loyalty') {
                $customerId = $body['customer_id'] ?? null;
                if (!$customerId) {
                    Response::error('Link a loyalty customer before paying with points', 422);
                }
                $pointsNeeded = (int) ceil($total);
                $custLock = $db->prepare('SELECT loyalty_points FROM customers WHERE customer_id = ? FOR UPDATE');
                $custLock->execute([$customerId]);
                $custRow = $custLock->fetch();
                if (!$custRow) {
                    Response::error('Customer not found', 404);
                }
                $availablePoints = (int) $custRow['loyalty_points'];
                if ($availablePoints < $pointsNeeded) {
                    Response::error(
                        "Insufficient loyalty points. This sale requires {$pointsNeeded} points but the customer has {$availablePoints}.",
                        422
                    );
                }
                $pointsRedeemed = $pointsNeeded;
                $pointsEarned = 0;
                $paid = $total;
                $change = 0;
            }

            $db->prepare('
                INSERT INTO sales (sale_ref,cashier_id,customer_id,subtotal,discount_amt,tax_amt,
                  total_amt,amount_paid,change_given,payment_method,points_earned,points_redeemed,notes)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            ')->execute([
                $saleRef, $payload['user_id'],
                $body['customer_id'] ?? null,
                $subtotal, $discount, $tax, $total, $paid, $change,
                $paymentMethod,
                $pointsEarned,
                $pointsRedeemed,
                $body['notes'] ?? null,
            ]);
            $saleId = (int) $db->lastInsertId();

            foreach ($resolvedItems as $item) {
                $db->prepare('INSERT INTO sale_items (sale_id,product_id,qty,unit_price,discount_pct,line_total) VALUES (?,?,?,?,?,?)')->execute([
                    $saleId, $item['product_id'], $item['qty'],
                    $item['unit_price'], $item['discount_pct'], $item['line_total'],
                ]);

                $curr  = $item['stock_qty'];
                $after = $curr - $item['qty'];

                $db->prepare('UPDATE products SET stock_qty = ? WHERE product_id = ?')->execute([$after, $item['product_id']]);
                $db->prepare('INSERT INTO stock_movements (product_id,user_id,movement_type,reference_id,qty_before,qty_change,qty_after) VALUES (?,?,?,?,?,?,?)')->execute([
                    $item['product_id'], $payload['user_id'], 'sale', $saleId, $curr, -$item['qty'], $after,
                ]);
            }

            if ($paymentMethod === 'loyalty' && !empty($body['customer_id'])) {
                $db->prepare('UPDATE customers SET loyalty_points = loyalty_points - ?, total_spent = total_spent + ? WHERE customer_id = ?')
                   ->execute([$pointsRedeemed, $total, $body['customer_id']]);
            } elseif (!empty($body['customer_id'])) {
                $db->prepare('UPDATE customers SET loyalty_points = loyalty_points + ?, total_spent = total_spent + ? WHERE customer_id = ?')
                   ->execute([(int) floor($total), $total, $body['customer_id']]);
            }

            $db->commit();
            AuditLogger::log($payload['user_id'], 'CREATE', 'sales', $saleId, null, ['sale_ref' => $saleRef, 'total_amt' => $total]);
            Response::success(['sale_id' => $saleId, 'sale_ref' => $saleRef, 'total_amt' => $total, 'change_given' => $change], 'Sale completed', 201);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Sale failed: ' . $e->getMessage(), 500);
        }
    }

    public static function void(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);
        $db = Database::getInstance();
        $db->prepare("UPDATE sales SET status = 'voided' WHERE sale_id = ?")->execute([$id]);
        AuditLogger::log($payload['user_id'], 'VOID', 'sales', $id, null, null);
        Response::success(null, 'Sale voided');
    }

    public static function storeOnline(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['customer']);

        $body  = json_decode(file_get_contents('php://input'), true);
        $db    = Database::getInstance();
        $items = $body['items'] ?? [];

        if (empty($items)) Response::error('Order must have at least one item');
        Validator::failIfErrors(Validator::required($body, ['delivery_address', 'delivery_phone']));

        $deliveryPhone = trim($body['delivery_phone']);
        if (!Validator::phone($deliveryPhone)) {
            Response::error('Delivery phone must be exactly 10 digits and start with 0', 422);
        }
        if (strlen(trim($body['delivery_address'])) < 5) {
            Response::error('Delivery address must be at least 5 characters', 422);
        }

        $paymentMethod = $body['payment_method'] ?? 'card';
        $allowedCustomerPayments = ['cash', 'card', 'loyalty'];
        if (!Validator::inArray($paymentMethod, $allowedCustomerPayments)) {
            Response::error('Invalid payment method. Allowed: cash, card, or loyalty points.', 422);
        }

        $custStmt = $db->prepare('SELECT customer_id FROM customers WHERE user_id = ?');
        $custStmt->execute([$payload['user_id']]);
        $customerId = $custStmt->fetchColumn();
        if (!$customerId) Response::error('Customer profile not found', 404);

        $date    = date('Ymd');
        $count   = $db->query("SELECT COUNT(*)+1 FROM sales WHERE DATE(created_at) = CURDATE()")->fetchColumn();
        $saleRef = sprintf('USM-%s-%04d', $date, $count);

        $db->beginTransaction();
        try {
            $subtotal = 0;
            $resolvedItems = [];

            foreach ($items as $item) {
                Validator::failIfErrors(Validator::required($item, ['product_id', 'qty']));

                $productId = (int) $item['product_id'];
                $qty       = max(1, (int) $item['qty']);

                $s = $db->prepare('SELECT selling_price, stock_qty, name FROM products WHERE product_id = ? AND is_active = 1');
                $s->execute([$productId]);
                $product = $s->fetch();
                if (!$product) {
                    Response::error("Product {$productId} not found or inactive", 404);
                }
                if ((int) $product['stock_qty'] < $qty) {
                    Response::error('Insufficient stock for ' . $product['name'], 400);
                }

                $unitPrice = round((float) $product['selling_price'], 2);
                $lineTotal = round($qty * $unitPrice, 2);
                $subtotal += $lineTotal;

                $resolvedItems[] = [
                    'product_id' => $productId,
                    'qty'        => $qty,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            $tax   = round($subtotal * 0.15, 2);
            $total = round($subtotal + $tax, 2);

            $pointsRedeemed = 0;
            $amountPaid = 0;

            if ($paymentMethod === 'loyalty') {
                $pointsNeeded = (int) ceil($total);
                $custLock = $db->prepare('SELECT loyalty_points FROM customers WHERE customer_id = ? FOR UPDATE');
                $custLock->execute([$customerId]);
                $custRow = $custLock->fetch();
                $availablePoints = (int) ($custRow['loyalty_points'] ?? 0);
                if ($availablePoints < $pointsNeeded) {
                    Response::error(
                        "Insufficient loyalty points. This order requires {$pointsNeeded} points but you have {$availablePoints}.",
                        422
                    );
                }
                $db->prepare('UPDATE customers SET loyalty_points = loyalty_points - ? WHERE customer_id = ?')
                   ->execute([$pointsNeeded, $customerId]);
                $pointsRedeemed = $pointsNeeded;
                $amountPaid = $total;
            }

            $db->prepare('
                INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt,
                  total_amt, amount_paid, change_given, payment_method, status, points_earned, points_redeemed, notes,
                  delivery_address, delivery_phone)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ')->execute([
                $saleRef,
                null,
                $customerId,
                $subtotal,
                0,
                $tax,
                $total,
                $amountPaid,
                0,
                $paymentMethod,
                'pending',
                0,
                $pointsRedeemed,
                $body['notes'] ?? null,
                trim($body['delivery_address']),
                $deliveryPhone,
            ]);
            $saleId = (int) $db->lastInsertId();

            foreach ($resolvedItems as $item) {
                $db->prepare('INSERT INTO sale_items (sale_id,product_id,qty,unit_price,discount_pct,line_total) VALUES (?,?,?,?,?,?)')->execute([
                    $saleId,
                    $item['product_id'],
                    $item['qty'],
                    $item['unit_price'],
                    0,
                    $item['line_total'],
                ]);
            }

            $db->commit();
            AuditLogger::log($payload['user_id'], 'CREATE', 'sales', $saleId, null, [
                'sale_ref' => $saleRef,
                'status'   => 'pending',
                'online'   => true,
            ]);
            Response::success([
                'sale_id'  => $saleId,
                'sale_ref' => $saleRef,
                'total_amt' => $total,
                'status'   => 'pending',
            ], 'Order placed for delivery', 201);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Order failed: ' . $e->getMessage(), 500);
        }
    }

    public static function dispatch(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['cashier', 'admin', 'manager']);

        $db = Database::getInstance();

        $db->beginTransaction();
        try {
            $saleStmt = $db->prepare('SELECT * FROM sales WHERE sale_id = ? FOR UPDATE');
            $saleStmt->execute([$id]);
            $sale = $saleStmt->fetch();
            if (!$sale) Response::error('Order not found', 404);
            if ($sale['status'] !== 'pending') Response::error('Only pending orders can be sent for delivery', 422);
            if (empty($sale['delivery_address'])) Response::error('This is not a delivery order', 422);

            $itemsStmt = $db->prepare('SELECT si.*, p.stock_qty, p.name AS product_name FROM sale_items si JOIN products p ON si.product_id = p.product_id WHERE si.sale_id = ? FOR UPDATE');
            $itemsStmt->execute([$id]);
            $items = $itemsStmt->fetchAll();
            if (empty($items)) Response::error('Order has no items', 422);

            foreach ($items as $item) {
                $qty = (int) $item['qty'];
                $curr = (int) $item['stock_qty'];
                if ($curr < $qty) {
                    Response::error('Insufficient stock for ' . $item['product_name'], 400);
                }
                $after = $curr - $qty;
                $db->prepare('UPDATE products SET stock_qty = ? WHERE product_id = ?')->execute([$after, $item['product_id']]);
                $db->prepare('INSERT INTO stock_movements (product_id,user_id,movement_type,reference_id,qty_before,qty_change,qty_after,note) VALUES (?,?,?,?,?,?,?,?)')->execute([
                    $item['product_id'], $payload['user_id'], 'sale', $id, $curr, -$qty, $after, 'Delivery dispatch',
                ]);
            }

            $db->prepare("UPDATE sales SET status = 'out_for_delivery', cashier_id = ? WHERE sale_id = ?")
               ->execute([$payload['user_id'], $id]);

            $db->commit();
            AuditLogger::log($payload['user_id'], 'DISPATCH', 'sales', $id, $sale, ['status' => 'out_for_delivery']);

            if (!empty($sale['customer_id'])) {
                self::notifyCustomer(
                    (int) $sale['customer_id'],
                    'Order Out for Delivery',
                    'Your order ' . $sale['sale_ref'] . ' is on its way to you.',
                    ['sale_id' => $id, 'sale_ref' => $sale['sale_ref']]
                );
            }

            Response::success(null, 'Order sent out for delivery');
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Dispatch failed: ' . $e->getMessage(), 500);
        }
    }

    public static function deliver(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['cashier', 'admin', 'manager']);

        $db = Database::getInstance();
        $saleStmt = $db->prepare('SELECT * FROM sales WHERE sale_id = ?');
        $saleStmt->execute([$id]);
        $sale = $saleStmt->fetch();
        if (!$sale) Response::error('Order not found', 404);
        if ($sale['status'] !== 'out_for_delivery') {
            Response::error('Only orders out for delivery can be marked as delivered', 422);
        }

        $db->beginTransaction();
        try {
            $total = (float) $sale['total_amt'];
            $db->prepare("UPDATE sales SET status = 'delivered', delivered_at = NOW(), amount_paid = total_amt WHERE sale_id = ?")
               ->execute([$id]);

            if (!empty($sale['customer_id'])) {
                if ($sale['payment_method'] === 'loyalty') {
                    $db->prepare('UPDATE customers SET total_spent = total_spent + ? WHERE customer_id = ?')
                       ->execute([$total, $sale['customer_id']]);
                } else {
                    $db->prepare('UPDATE customers SET loyalty_points = loyalty_points + ?, total_spent = total_spent + ? WHERE customer_id = ?')
                       ->execute([(int) floor($total), $total, $sale['customer_id']]);

                    $db->prepare('UPDATE sales SET points_earned = ? WHERE sale_id = ?')
                       ->execute([(int) floor($total), $id]);
                }
            }

            $db->commit();
            AuditLogger::log($payload['user_id'], 'DELIVER', 'sales', $id, $sale, ['status' => 'delivered']);

            if (!empty($sale['customer_id'])) {
                self::notifyCustomer(
                    (int) $sale['customer_id'],
                    'Order Delivered',
                    'Your order ' . $sale['sale_ref'] . ' has been delivered. Thank you for shopping with us!',
                    ['sale_id' => $id, 'sale_ref' => $sale['sale_ref']]
                );
            }

            Response::success(null, 'Order marked as delivered');
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Delivery confirmation failed: ' . $e->getMessage(), 500);
        }
    }

    private static function notifyCustomer(int $customerId, string $title, string $message, array $data = []): void {
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT user_id FROM customers WHERE customer_id = ?');
        $stmt->execute([$customerId]);
        $userId = $stmt->fetchColumn();
        if (!$userId) return;

        $db->prepare('INSERT INTO notifications (user_id, type, title, message, data, is_read) VALUES (?,?,?,?,?,0)')
           ->execute([$userId, 'delivery', $title, $message, json_encode($data)]);
    }
}
