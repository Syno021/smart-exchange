<?php
class NotificationController {
    public static function index(): void {
        $payload = AuthMiddleware::handle();
        $db = Database::getInstance();

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $offset  = ($page - 1) * $perPage;
        $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === '1';

        $where  = 'user_id = ?';
        $params = [$payload['user_id']];

        if ($unreadOnly) {
            $where .= ' AND is_read = 0';
        }

        $countStmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE $where");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $db->prepare("
            SELECT * FROM notifications
            WHERE $where
            ORDER BY created_at DESC
            LIMIT $perPage OFFSET $offset
        ");
        $stmt->execute($params);
        $notifications = $stmt->fetchAll();

        foreach ($notifications as &$n) {
            if (!empty($n['data']) && is_string($n['data'])) {
                $n['data'] = json_decode($n['data'], true);
            }
        }

        $unreadStmt = $db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
        $unreadStmt->execute([$payload['user_id']]);
        $unreadCount = (int) $unreadStmt->fetchColumn();

        Response::json([
            'success' => true,
            'data'    => $notifications,
            'unread_count' => $unreadCount,
            'pagination' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / max(1, $perPage)),
            ],
        ]);
    }

    public static function readAll(): void {
        $payload = AuthMiddleware::handle();
        $db = Database::getInstance();

        $stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
        $stmt->execute([$payload['user_id']]);
        $updated = $stmt->rowCount();

        Response::success(['updated' => $updated], 'All notifications marked as read');
    }
}
