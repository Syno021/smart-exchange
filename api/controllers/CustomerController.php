<?php
class CustomerController {
    public static function index(): void {
        AuthMiddleware::handle();
        $db = Database::getInstance();

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $search  = $_GET['search'] ?? '';
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if ($search) {
            $where[] = '(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            $like = "%$search%";
            $params = array_merge($params, [$like, $like, $like, $like]);
        }

        $whereStr = implode(' AND ', $where);
        $countStmt = $db->prepare("
            SELECT COUNT(*) FROM customers c
            LEFT JOIN users u ON c.user_id = u.user_id
            WHERE $whereStr
        ");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT c.*, u.full_name, u.username, u.email, u.phone, u.is_active
                FROM customers c
                LEFT JOIN users u ON c.user_id = u.user_id
                WHERE $whereStr
                ORDER BY u.full_name ASC
                LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }

    public static function orders(int $customerId): void {
        AuthMiddleware::handle();
        $db = Database::getInstance();

        $check = $db->prepare('SELECT customer_id FROM customers WHERE customer_id = ?');
        $check->execute([$customerId]);
        if (!$check->fetch()) Response::error('Customer not found', 404);

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $offset  = ($page - 1) * $perPage;

        $countStmt = $db->prepare('SELECT COUNT(*) FROM sales WHERE customer_id = ?');
        $countStmt->execute([$customerId]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $db->prepare("
            SELECT s.*, u.full_name AS cashier_name
            FROM sales s
            LEFT JOIN users u ON s.cashier_id = u.user_id
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC
            LIMIT $perPage OFFSET $offset
        ");
        $stmt->execute([$customerId]);
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }
}
