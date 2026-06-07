<?php
class RoleMiddleware {
    public static function require(array $payload, array $roles): void {
        if (!in_array($payload['role'], $roles)) {
            Response::error('Forbidden: insufficient role', 403);
        }
    }
}
