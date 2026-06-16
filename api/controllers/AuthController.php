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
        $phone = trim($body['phone']     ?? '');
        $pass  = $body['password']       ?? '';

        if (!$name || !$uname || !$pass || !$phone) {
            Response::error('Full name, username, phone, and password are required');
        }
        if (strlen($uname) < 3) {
            Response::error('Username must be at least 3 characters', 422);
        }
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $uname)) {
            Response::error('Username can only contain letters, numbers, and underscores', 422);
        }
        if (!empty($email) && !Validator::email($email)) {
            Response::error('Invalid email address', 422);
        }
        if (!Validator::phone($phone)) {
            Response::error('Phone must be exactly 10 digits and start with 0', 422);
        }
        if (!Validator::strongPassword($pass)) {
            Response::error(
                'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
                422
            );
        }

        $db   = Database::getInstance();
        if (Validator::isPhoneTaken($db, $phone)) {
            Response::error('This phone number is already registered', 409);
        }

        $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);

        try {
            $db->prepare(
                'INSERT INTO users (full_name, username, email, phone, password, role) VALUES (?,?,?,?,?,?)'
            )->execute([$name, $uname, $email ?: null, $phone, $hash, 'customer']);

            $userId = (int) $db->lastInsertId();
            $db->prepare('INSERT INTO customers (user_id) VALUES (?)')->execute([$userId]);

            Response::success(['user_id' => $userId], 'Registration successful', 201);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') Response::error('Username, email, or phone already taken', 409);
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

    public static function resetPassword(): void {
        $body     = json_decode(file_get_contents('php://input'), true);
        $email    = trim($body['email'] ?? '');
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$username || !$password) {
            Response::error('Email, username, and password are required');
        }
        if (!Validator::email($email)) {
            Response::error('Invalid email address');
        }
        if (!Validator::strongPassword($password)) {
            Response::error(
                'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character'
            );
        }

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT user_id FROM users WHERE username = ? AND email = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$username, $email]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('No account found with that email and username', 404);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare('UPDATE users SET password = ? WHERE user_id = ?')
            ->execute([$hash, $user['user_id']]);

        Response::success(null, 'Password reset successful. You can now sign in.');
    }
}
