<?php
class AuthMiddleware {
    public static function handle(): array {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (!str_starts_with($auth, 'Bearer ')) {
            Response::error('Unauthorized', 401);
        }
        $token = substr($auth, 7);
        $payload = JWT::verify($token);
        if (!$payload) Response::error('Token invalid or expired', 401);
        return $payload;
    }
}
