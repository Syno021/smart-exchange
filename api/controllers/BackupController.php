<?php
class BackupController {
    public static function create(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();
        $backupDir = __DIR__ . '/../backups';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $filename = 'ubuntu_smart_mart_' . date('Y-m-d_His') . '.sql';
        $filepath = $backupDir . DIRECTORY_SEPARATOR . $filename;
        $status   = 'success';
        $sizeBytes = 0;

        $mysqldumpPaths = [
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'mysqldump',
        ];

        $dumped = false;
        foreach ($mysqldumpPaths as $mysqldump) {
            if ($mysqldump !== 'mysqldump' && !file_exists($mysqldump)) {
                continue;
            }

            $command = sprintf(
                '%s --user=root --host=localhost ubuntu_smart_mart > %s 2>&1',
                escapeshellarg($mysqldump),
                escapeshellarg($filepath)
            );

            exec($command, $output, $exitCode);

            if ($exitCode === 0 && file_exists($filepath) && filesize($filepath) > 0) {
                $dumped = true;
                $sizeBytes = filesize($filepath);
                break;
            }
        }

        if (!$dumped) {
            $status = 'failed';
            $placeholder = "-- Backup attempted at " . date('c') . "\n"
                . "-- mysqldump unavailable or failed; metadata logged only.\n";
            file_put_contents($filepath, $placeholder);
            $sizeBytes = strlen($placeholder);
        }

        $db->prepare('
            INSERT INTO backup_log (created_by, filename, size_bytes, status)
            VALUES (?,?,?,?)
        ')->execute([
            $payload['user_id'],
            $filename,
            $sizeBytes,
            $status,
        ]);

        $backupId = (int) $db->lastInsertId();
        AuditLogger::log($payload['user_id'], 'BACKUP', 'backup_log', $backupId, null, [
            'filename' => $filename,
            'status'   => $status,
        ]);

        if ($status === 'failed') {
            Response::success([
                'backup_id'  => $backupId,
                'filename'   => $filename,
                'size_bytes' => $sizeBytes,
                'status'     => $status,
                'message'    => 'Backup log created; mysqldump was unavailable or failed',
            ], 'Backup logged with warnings', 201);
        }

        Response::success([
            'backup_id'  => $backupId,
            'filename'   => $filename,
            'size_bytes' => $sizeBytes,
            'status'     => $status,
        ], 'Backup created', 201);
    }

    public static function history(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, (int)($_GET['per_page'] ?? 20));
        $offset  = ($page - 1) * $perPage;

        $total = (int) $db->query('SELECT COUNT(*) FROM backup_log')->fetchColumn();

        $stmt = $db->prepare("
            SELECT b.*, u.full_name AS created_by_name
            FROM backup_log b
            LEFT JOIN users u ON b.created_by = u.user_id
            ORDER BY b.created_at DESC
            LIMIT $perPage OFFSET $offset
        ");
        $stmt->execute();
        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }

    public static function download(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT backup_id, filename, status FROM backup_log WHERE backup_id = ?');
        $stmt->execute([$id]);
        $backup = $stmt->fetch();

        if (!$backup) {
            Response::error('Backup not found', 404);
        }

        $filepath = __DIR__ . '/../backups/' . $backup['filename'];
        if (!file_exists($filepath)) {
            Response::error('Backup file not found on server', 404);
        }

        AuditLogger::log($payload['user_id'], 'DOWNLOAD', 'backup_log', $id, null, [
            'filename' => $backup['filename'],
        ]);

        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="' . basename($backup['filename']) . '"');
        header('Content-Length: ' . filesize($filepath));
        header('Cache-Control: no-cache, must-revalidate');
        readfile($filepath);
        exit;
    }

    public static function destroy(int $id): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin']);

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT backup_id, filename FROM backup_log WHERE backup_id = ?');
        $stmt->execute([$id]);
        $backup = $stmt->fetch();

        if (!$backup) {
            Response::error('Backup not found', 404);
        }

        $filepath = __DIR__ . '/../backups/' . $backup['filename'];
        if (file_exists($filepath)) {
            unlink($filepath);
        }

        $db->prepare('DELETE FROM backup_log WHERE backup_id = ?')->execute([$id]);

        AuditLogger::log($payload['user_id'], 'DELETE', 'backup_log', $id, [
            'filename' => $backup['filename'],
        ], null);

        Response::success(null, 'Backup deleted');
    }
}
