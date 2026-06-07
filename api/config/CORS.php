<?php
class CORS {
    private const ALLOWED_ORIGIN = 'http://localhost:5173';

    public static function handle(): void {
        header('Access-Control-Allow-Origin: ' . self::ALLOWED_ORIGIN);
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
