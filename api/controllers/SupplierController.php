<?php
class SupplierController {
    public static function me(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['supplier']);

        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT s.*, u.full_name AS user_full_name, u.email AS user_email
            FROM suppliers s
            LEFT JOIN users u ON s.user_id = u.user_id
            WHERE s.user_id = ? AND s.is_active = 1
        ");
        $stmt->execute([$payload['user_id']]);
        $supplier = $stmt->fetch();
        if (!$supplier) Response::error('Supplier profile not found', 404);
        Response::success($supplier);
    }

    public static function index(): void {
        AuthMiddleware::handle();
        $db = Database::getInstance();

        $search = $_GET['search'] ?? '';
        $where  = 's.is_active = 1';
        $params = [];

        if ($search) {
            $where .= ' AND (s.company_name LIKE ? OR s.contact_name LIKE ? OR s.email LIKE ?)';
            $like = "%$search%";
            $params = [$like, $like, $like];
        }

        $stmt = $db->prepare("
            SELECT s.*, u.full_name AS user_full_name, u.email AS user_email
            FROM suppliers s
            LEFT JOIN users u ON s.user_id = u.user_id
            WHERE $where
            ORDER BY s.company_name ASC
        ");
        $stmt->execute($params);
        Response::success($stmt->fetchAll());
    }

    public static function store(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $body = json_decode(file_get_contents('php://input'), true);
        Validator::failIfErrors(Validator::required($body, ['company_name']));

        $db = Database::getInstance();
        try {
            $db->prepare('
                INSERT INTO suppliers (user_id, company_name, contact_name, phone, email, address, tax_number, payment_terms, rating, is_active)
                VALUES (?,?,?,?,?,?,?,?,?,?)
            ')->execute([
                $body['user_id']       ?? null,
                trim($body['company_name']),
                $body['contact_name']  ?? null,
                $body['phone']         ?? null,
                $body['email']         ?? null,
                $body['address']       ?? null,
                $body['tax_number']    ?? null,
                $body['payment_terms'] ?? null,
                $body['rating']        ?? 5.0,
                $body['is_active']     ?? 1,
            ]);

            $id = (int) $db->lastInsertId();
            AuditLogger::log($payload['user_id'], 'CREATE', 'suppliers', $id, null, $body);
            Response::success(['supplier_id' => $id], 'Supplier created', 201);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') Response::error('Supplier with this user already exists', 409);
            Response::error('Supplier creation failed', 500);
        }
    }

    public static function update(int $id): void {
        $payload = AuthMiddleware::handle();

        $body = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance();

        $old = $db->prepare('SELECT * FROM suppliers WHERE supplier_id = ?');
        $old->execute([$id]);
        $before = $old->fetch();
        if (!$before) Response::error('Supplier not found', 404);

        if ($payload['role'] === 'supplier') {
            if ((int) $before['user_id'] !== (int) $payload['user_id']) {
                Response::error('Forbidden', 403);
            }
            unset($body['user_id'], $body['rating'], $body['is_active']);
        } else {
            RoleMiddleware::require($payload, ['admin', 'manager']);
        }

        $db->prepare('
            UPDATE suppliers SET
              user_id = COALESCE(?, user_id),
              company_name = COALESCE(?, company_name),
              contact_name = COALESCE(?, contact_name),
              phone = COALESCE(?, phone),
              email = COALESCE(?, email),
              address = COALESCE(?, address),
              tax_number = COALESCE(?, tax_number),
              payment_terms = COALESCE(?, payment_terms),
              rating = COALESCE(?, rating),
              is_active = COALESCE(?, is_active)
            WHERE supplier_id = ?
        ')->execute([
            $body['user_id']       ?? null,
            $body['company_name']  ?? null,
            $body['contact_name']  ?? null,
            $body['phone']         ?? null,
            $body['email']         ?? null,
            $body['address']       ?? null,
            $body['tax_number']    ?? null,
            $body['payment_terms'] ?? null,
            $body['rating']        ?? null,
            $body['is_active']     ?? null,
            $id,
        ]);

        AuditLogger::log($payload['user_id'], 'UPDATE', 'suppliers', $id, $before, $body);
        Response::success(null, 'Supplier updated');
    }

    public static function destroy(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM suppliers WHERE supplier_id = ?');
        $stmt->execute([$id]);
        $supplier = $stmt->fetch();
        if (!$supplier) Response::error('Supplier not found', 404);

        $db->prepare('UPDATE suppliers SET is_active = 0 WHERE supplier_id = ?')->execute([$id]);
        AuditLogger::log($payload['user_id'], 'DELETE', 'suppliers', $id, $supplier, null);
        Response::success(null, 'Supplier deleted');
    }
}
