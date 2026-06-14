<?php
class UploadController {
    private const MAX_BYTES = 2 * 1024 * 1024;
    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    public static function productImage(): void {
        $payload = AuthMiddleware::handle();
        RoleMiddleware::require($payload, ['admin', 'manager']);

        if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $code = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
            $message = match ($code) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Image file is too large (max 2 MB)',
                UPLOAD_ERR_NO_FILE => 'No image file was uploaded',
                default => 'Failed to upload image',
            };
            Response::error($message);
        }

        $file = $_FILES['image'];

        if ($file['size'] > self::MAX_BYTES) {
            Response::error('Image file is too large (max 2 MB)');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($file['tmp_name']) ?: '';

        if (!isset(self::ALLOWED_MIME[$mime])) {
            Response::error('Only JPEG, PNG, WebP, and GIF images are allowed');
        }

        $uploadDir = __DIR__ . '/../uploads/products';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            Response::error('Upload directory is not writable', 500);
        }

        $ext      = self::ALLOWED_MIME[$mime];
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $dest     = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Failed to save uploaded image', 500);
        }

        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $apiBase  = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
        $imageUrl = $protocol . '://' . $host . $apiBase . '/uploads/products/' . $filename;

        Response::success(['image_url' => $imageUrl], 'Image uploaded', 201);
    }
}
