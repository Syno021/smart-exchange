<?php
class CategoryController {
    public static function index(): void {
        AuthMiddleware::handle();
        $db = Database::getInstance();
        $stmt = $db->query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC');
        Response::success($stmt->fetchAll());
    }
}
