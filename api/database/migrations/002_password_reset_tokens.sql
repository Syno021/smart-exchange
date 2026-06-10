-- Run once on existing databases: mysql -u root ubuntu_smart_mart < 002_password_reset_tokens.sql

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  VARCHAR(64)  NOT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  used_at     TIMESTAMP    NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_expires (user_id, expires_at)
);
