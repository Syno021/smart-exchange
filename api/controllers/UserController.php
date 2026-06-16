<?php
class UserController {
    private static array $roles = ['admin', 'manager', 'cashier', 'customer', 'supplier'];

    public static function index(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $search  = $_GET['search'] ?? '';
        $role    = $_GET['role'] ?? '';
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if ($search) {
            $where[] = '(full_name LIKE ? OR username LIKE ? OR email LIKE ?)';
            $like = "%$search%";
            $params = array_merge($params, [$like, $like, $like]);
        }
        if ($role && in_array($role, self::$roles, true)) {
            $where[] = 'role = ?';
            $params[] = $role;
        }
        if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
            $where[] = 'is_active = ?';
            $params[] = (int) $_GET['is_active'];
        }

        $allowedSort = ['full_name', 'username', 'email', 'role', 'created_at', 'last_login', 'is_active'];
        $sortBy = in_array($_GET['sort_by'] ?? '', $allowedSort, true) ? $_GET['sort_by'] : 'full_name';
        $sortDir = strtoupper($_GET['sort_dir'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

        $whereStr = implode(' AND ', $where);
        $countStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT user_id, full_name, username, email, phone, role, avatar_url, is_active, last_login, created_at, updated_at
                FROM users WHERE $whereStr ORDER BY $sortBy $sortDir LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }

    public static function store(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $body = json_decode(file_get_contents('php://input'), true);
        Validator::failIfErrors(Validator::required($body, ['full_name', 'username', 'password', 'role']));

        if (!Validator::inArray($body['role'], self::$roles)) {
            Response::error('Invalid role');
        }
        if (!empty($body['email']) && !Validator::email($body['email'])) {
            Response::error('Invalid email address');
        }
        if (!Validator::strongPassword($body['password'])) {
            Response::error(
                'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
                422
            );
        }

        $phone = isset($body['phone']) ? trim($body['phone']) : '';
        if (!Validator::phone($phone)) {
            Response::error('Phone must be exactly 10 digits and start with 0', 422);
        }

        $db = Database::getInstance();
        if (Validator::isPhoneTaken($db, $phone)) {
            Response::error('This phone number is already registered', 409);
        }

        $username = trim($body['username']);
        if (strlen($username) < 3) {
            Response::error('Username must be at least 3 characters', 422);
        }
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            Response::error('Username can only contain letters, numbers, and underscores', 422);
        }

        $hash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);

        try {
            $db->prepare(
                'INSERT INTO users (full_name, username, email, phone, password, role, is_active) VALUES (?,?,?,?,?,?,?)'
            )->execute([
                trim($body['full_name']),
                $username,
                !empty($body['email']) ? trim($body['email']) : null,
                $phone,
                $hash,
                $body['role'],
                $body['is_active'] ?? 1,
            ]);

            $userId = (int) $db->lastInsertId();

            if ($body['role'] === 'customer') {
                $db->prepare('INSERT INTO customers (user_id, address) VALUES (?,?)')->execute([
                    $userId, $body['address'] ?? null
                ]);
            }

            AuditLogger::log($payload['user_id'], 'CREATE', 'users', $userId, null, [
                'full_name' => $body['full_name'],
                'username'  => $body['username'],
                'role'      => $body['role'],
            ]);
            Response::success(['user_id' => $userId], 'User created', 201);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') Response::error('Username, email, or phone already taken', 409);
            Response::error('User creation failed', 500);
        }
    }

    public static function update(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $body = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance();

        $old = $db->prepare('SELECT user_id, full_name, username, email, phone, role, is_active FROM users WHERE user_id = ?');
        $old->execute([$id]);
        $before = $old->fetch();
        if (!$before) Response::error('User not found', 404);

        if (isset($body['role']) && !Validator::inArray($body['role'], self::$roles)) {
            Response::error('Invalid role');
        }
        if (!empty($body['email']) && !Validator::email($body['email'])) {
            Response::error('Invalid email address');
        }

        if (array_key_exists('phone', $body)) {
            $phone = trim($body['phone'] ?? '');
            if (!Validator::phone($phone)) {
                Response::error('Phone must be exactly 10 digits and start with 0', 422);
            }
            if (Validator::isPhoneTaken($db, $phone, $id)) {
                Response::error('This phone number is already registered', 409);
            }
            $body['phone'] = $phone;
        }

        if (isset($body['username'])) {
            $username = trim($body['username']);
            if (strlen($username) < 3) {
                Response::error('Username must be at least 3 characters', 422);
            }
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
                Response::error('Username can only contain letters, numbers, and underscores', 422);
            }
            $body['username'] = $username;
        }

        $fields = [];
        $params = [];

        foreach (['full_name', 'username', 'email', 'phone', 'role', 'is_active'] as $field) {
            if (array_key_exists($field, $body)) {
                $fields[] = "$field = ?";
                $params[] = $body[$field];
            }
        }

        if (!empty($body['password'])) {
            if (!Validator::strongPassword($body['password'])) {
                Response::error(
                    'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
                    422
                );
            }
            $fields[] = 'password = ?';
            $params[] = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        if (empty($fields)) Response::error('No fields to update');

        $params[] = $id;
        $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE user_id = ?')->execute($params);

        AuditLogger::log($payload['user_id'], 'UPDATE', 'users', $id, $before, $body);
        Response::success(null, 'User updated');
    }

    public static function destroy(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        if ($id === (int) $payload['user_id']) {
            Response::error('Cannot deactivate your own account', 400);
        }

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT user_id FROM users WHERE user_id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) Response::error('User not found', 404);

        $db->prepare('UPDATE users SET is_active = 0 WHERE user_id = ?')->execute([$id]);
        AuditLogger::log($payload['user_id'], 'DELETE', 'users', $id, null, null);
        Response::success(null, 'User deactivated');
    }
}
