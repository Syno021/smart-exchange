<?php
class Validator {
    public static function required(array $data, array $fields): array {
        $errors = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                $errors[$field][] = "The $field field is required.";
            }
        }
        return $errors;
    }

    public static function failIfErrors(array $errors): void {
        if (!empty($errors)) {
            Response::error('Validation failed', 422, $errors);
        }
    }

    public static function email(?string $email): bool {
        if ($email === null || $email === '') return true;
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function inArray(mixed $value, array $allowed): bool {
        return in_array($value, $allowed, true);
    }

    public static function minLength(string $value, int $min): bool {
        return strlen($value) >= $min;
    }

    public static function numeric(mixed $value): bool {
        return is_numeric($value);
    }

    public static function strongPassword(string $password): bool {
        return strlen($password) >= 8
            && preg_match('/[A-Z]/', $password)
            && preg_match('/[a-z]/', $password)
            && preg_match('/[0-9]/', $password)
            && preg_match('/[^A-Za-z0-9]/', $password);
    }
}
