<?php
class AuditLogger {
    public static function log(
        int $userId, string $action, string $table,
        int $targetId, ?array $old, ?array $new
    ): void {
        try {
            $db = Database::getInstance();
            $db->prepare('INSERT INTO audit_log (user_id,action,module,target_table,target_id,old_values,new_values,ip_address) VALUES (?,?,?,?,?,?,?,?)')->execute([
                $userId, $action, $table, $table, $targetId,
                $old ? json_encode($old) : null,
                $new  ? json_encode($new)  : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (Exception) {
            // Non-fatal — never let audit failure break a request
        }
    }
}
