<?php
class Response {
    public static function json(mixed $data, int $status = 200): never {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(mixed $data, string $message = 'Success', int $status = 200): never {
        self::json(['success' => true, 'data' => $data, 'message' => $message], $status);
    }

    public static function error(string $message, int $status = 400, array $errors = []): never {
        self::json(['success' => false, 'message' => $message, 'errors' => $errors], $status);
    }

    public static function paginated(array $data, int $total, int $page, int $perPage): never {
        self::json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / max(1, $perPage)),
            ]
        ]);
    }
}
