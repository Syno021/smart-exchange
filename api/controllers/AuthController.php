<?php
class AuthController {
    public static function login(): void {
        $body = json_decode(file_get_contents('php://input'), true);
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        if (!$username || !$password) Response::error('Username and password required');

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            Response::error('Invalid credentials', 401);
        }

        $db->prepare('UPDATE users SET last_login = NOW() WHERE user_id = ?')->execute([$user['user_id']]);

        $token = JWT::generate([
            'user_id'   => $user['user_id'],
            'username'  => $user['username'],
            'role'      => $user['role'],
            'full_name' => $user['full_name'],
        ]);

        unset($user['password']);
        Response::success(['token' => $token, 'user' => $user]);
    }

    public static function register(): void {
        $body = json_decode(file_get_contents('php://input'), true);
        $name  = trim($body['full_name'] ?? '');
        $uname = trim($body['username']  ?? '');
        $email = trim($body['email']     ?? '');
        $pass  = $body['password']       ?? '';

        if (!$name || !$uname || !$pass) Response::error('Required fields missing');

        $db   = Database::getInstance();
        $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);

        try {
            $db->prepare(
                'INSERT INTO users (full_name, username, email, password, role) VALUES (?,?,?,?,?)'
            )->execute([$name, $uname, $email ?: null, $hash, 'customer']);

            $userId = (int) $db->lastInsertId();
            $db->prepare('INSERT INTO customers (user_id) VALUES (?)')->execute([$userId]);

            Response::success(['user_id' => $userId], 'Registration successful', 201);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') Response::error('Username or email already taken', 409);
            Response::error('Registration failed', 500);
        }
    }

    public static function me(): void {
        $payload = AuthMiddleware::handle();
        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT user_id, full_name, username, email, phone, role, avatar_url, last_login FROM users WHERE user_id = ?');
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        if (!$user) Response::error('User not found', 404);
        Response::success($user);
    }
}
