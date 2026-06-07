<?php
class AuditController {
    public static function index(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if (!empty($_GET['user_id'])) {
            $where[] = 'a.user_id = ?';
            $params[] = $_GET['user_id'];
        }
        if (!empty($_GET['action'])) {
            $where[] = 'a.action = ?';
            $params[] = $_GET['action'];
        }
        if (!empty($_GET['module'])) {
            $where[] = 'a.module = ?';
            $params[] = $_GET['module'];
        }
        if (!empty($_GET['date_from'])) {
            $where[] = 'DATE(a.created_at) >= ?';
            $params[] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where[] = 'DATE(a.created_at) <= ?';
            $params[] = $_GET['date_to'];
        }
        if (!empty($_GET['since'])) {
            $where[] = 'a.created_at > ?';
            $params[] = $_GET['since'];
        }

        $whereStr = implode(' AND ', $where);
        $countStmt = $db->prepare("SELECT COUNT(*) FROM audit_log a WHERE $whereStr");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT a.*, u.full_name AS user_name, u.username
                FROM audit_log a
                LEFT JOIN users u ON a.user_id = u.user_id
                WHERE $whereStr
                ORDER BY a.created_at DESC
                LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        foreach ($logs as &$log) {
            if (!empty($log['old_values']) && is_string($log['old_values'])) {
                $log['old_values'] = json_decode($log['old_values'], true);
            }
            if (!empty($log['new_values']) && is_string($log['new_values'])) {
                $log['new_values'] = json_decode($log['new_values'], true);
            }
        }

        Response::paginated($logs, $total, $page, $perPage);
    }

    public static function filterOptions(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();

        $actions = $db->query(
            'SELECT DISTINCT action FROM audit_log ORDER BY action ASC'
        )->fetchAll(PDO::FETCH_COLUMN);

        $modules = $db->query(
            'SELECT DISTINCT module FROM audit_log WHERE module IS NOT NULL ORDER BY module ASC'
        )->fetchAll(PDO::FETCH_COLUMN);

        Response::success([
            'actions' => $actions,
            'modules' => $modules,
        ]);
    }
}
