-- Run once on existing databases: mysql -u root ubuntu_smart_mart < 001_add_delivery_orders.sql

ALTER TABLE sales
  MODIFY cashier_id INT UNSIGNED NULL,
  MODIFY status ENUM('completed','voided','refunded','pending','out_for_delivery','delivered') NOT NULL DEFAULT 'completed',
  ADD COLUMN delivery_address TEXT NULL AFTER notes,
  ADD COLUMN delivery_phone VARCHAR(30) NULL AFTER delivery_address,
  ADD COLUMN delivered_at TIMESTAMP NULL AFTER delivery_phone;
