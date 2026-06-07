-- Ubuntu Smart Mart — test seed data
-- Run AFTER schema.sql (phpMyAdmin or: mysql -u root < seed.sql)
--
-- All test account passwords: Admin@123
-- ┌──────────┬─────────────┬─────────────────────────┐
-- │ Role     │ Username    │ Email                   │
-- ├──────────┼─────────────┼─────────────────────────┤
-- │ admin    │ admin       │ admin@usmart.co.za      │
-- │ manager  │ thabo.m     │ thabo@usmart.co.za      │
-- │ cashier  │ zanele.k    │ zanele@usmart.co.za     │
-- │ customer │ sipho.n     │ sipho@example.co.za     │
-- │ customer │ nomsa.d     │ nomsa@example.co.za     │
-- │ supplier │ freshfoods  │ orders@freshfoods.co.za │
-- └──────────┴─────────────┴─────────────────────────┘

USE ubuntu_smart_mart;

SET FOREIGN_KEY_CHECKS = 0;

-- DELETE (not TRUNCATE) — MySQL blocks TRUNCATE on FK-referenced tables even with checks disabled
DELETE FROM backup_log;
DELETE FROM audit_log;
DELETE FROM notifications;
DELETE FROM expenses;
DELETE FROM stock_movements;
DELETE FROM po_items;
DELETE FROM purchase_orders;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM customers;
DELETE FROM products;
DELETE FROM suppliers;
DELETE FROM users WHERE user_id > 1;

ALTER TABLE backup_log AUTO_INCREMENT = 1;
ALTER TABLE audit_log AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE expenses AUTO_INCREMENT = 1;
ALTER TABLE stock_movements AUTO_INCREMENT = 1;
ALTER TABLE po_items AUTO_INCREMENT = 1;
ALTER TABLE purchase_orders AUTO_INCREMENT = 1;
ALTER TABLE sale_items AUTO_INCREMENT = 1;
ALTER TABLE sales AUTO_INCREMENT = 1;
ALTER TABLE customers AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE suppliers AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 2;

SET FOREIGN_KEY_CHECKS = 1;

-- Shared bcrypt hash for Admin@123
SET @pwd = '$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K';

-- USERS (admin user_id = 1 already exists from schema)
INSERT INTO users (full_name, username, email, phone, password, role, last_login) VALUES
  ('Thabo Mthembu',   'thabo.m',    'thabo@usmart.co.za',      '082 111 2233', @pwd, 'manager',  DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('Zanele Khumalo',  'zanele.k',   'zanele@usmart.co.za',     '083 222 3344', @pwd, 'cashier',  DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('Sipho Nkosi',     'sipho.n',    'sipho@example.co.za',     '084 333 4455', @pwd, 'customer', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ('Nomsa Dlamini',   'nomsa.d',    'nomsa@example.co.za',     '085 444 5566', @pwd, 'customer', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  ('Fresh Foods Co',  'freshfoods', 'orders@freshfoods.co.za', '031 555 6677', @pwd, 'supplier', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- SUPPLIERS (user_id 6 = freshfoods)
INSERT INTO suppliers (user_id, company_name, contact_name, phone, email, address, tax_number, payment_terms, rating) VALUES
  (6, 'Fresh Foods Wholesale', 'James Pillay',  '031 555 6677', 'orders@freshfoods.co.za', '45 Industrial Rd, Pinetown, KZN', '4123456789', 'Net 30', 4.8),
  (NULL, 'KZN Dairy Co-op',       'Lindiwe Maseko', '031 777 8899', 'sales@kzndairy.co.za',    '12 Milk Way, Hammarsdale, KZN',   '4987654321', 'Net 14', 4.5),
  (NULL, 'Cape Snacks Distribution', 'Peter van Wyk', '021 888 9900', 'supply@capasnacks.co.za', '8 Warehouse Ln, Cape Town',    '4011223344', 'COD',    4.2);

-- CUSTOMERS (user_id 4 = sipho, 5 = nomsa)
INSERT INTO customers (user_id, address, loyalty_points, loyalty_tier, total_spent) VALUES
  (4, '14 Chesterville Rd, Durban, KZN 4091', 850,  'silver',   4250.00),
  (5, '22 Umlazi Section V, Durban, KZN 4031',  3200, 'gold',     18200.00);

-- PRODUCTS (category_id 1–8 from schema)
INSERT INTO products (category_id, supplier_id, barcode, sku, name, description, unit, cost_price, selling_price, stock_qty, reorder_level, max_stock, is_featured) VALUES
  (1, 1, '6001060000011', 'BRD-001', 'Albany Superior White Bread 700g', 'Fresh white loaf', 'each',  12.50,  18.99, 45, 20, 80, 1),
  (1, 1, '6001060000028', 'BRD-002', 'Albany Brown Bread 700g',          'High-fibre brown loaf', 'each', 13.00, 19.99, 38, 20, 80, 0),
  (2, 2, '6001061000015', 'DRY-001', 'Clover Full Cream Milk 2L',        'Fresh full cream milk', 'each', 22.00, 32.99, 60, 15, 100, 1),
  (2, 2, '6001061000022', 'DRY-002', 'Clover Cheddar Cheese 250g',       'Mature cheddar block', 'each', 28.00, 42.99, 25, 10, 50, 0),
  (2, 2, '6001061000039', 'DRY-003', 'Large Eggs 18-pack',               'Grade A eggs', 'pack', 45.00, 64.99, 30, 10, 60, 1),
  (3, 3, '6001062000012', 'BEV-001', 'Coca-Cola 2L',                     'Original taste', 'each', 18.00, 27.99, 55, 20, 100, 1),
  (3, 3, '6001062000029', 'BEV-002', 'Oros Orange Squash 2L',            'Concentrated squash', 'each', 24.00, 36.99, 40, 15, 80, 0),
  (3, 1, '6001062000036', 'BEV-003', 'Valpre Still Water 5L',            'Purified still water', 'each', 15.00, 22.99, 70, 20, 120, 0),
  (4, 3, '6001063000013', 'SNK-001', 'Simba Chips Salt & Vinegar 125g',  'Crispy potato chips', 'each',  8.50, 14.99, 80, 25, 150, 1),
  (4, 3, '6001063000020', 'SNK-002', 'Cadbury Dairy Milk 80g',           'Milk chocolate bar', 'each',  9.00, 16.99, 65, 20, 120, 0),
  (4, 3, '6001063000037', 'SNK-003', 'Lays Classic 150g',                'Original potato chips', 'each', 10.00, 18.99, 4, 15, 100, 0),
  (5, 1, '6001064000014', 'HSH-001', 'Sunlight Dishwashing Liquid 750ml','Lemon fresh', 'each', 18.00, 28.99, 35, 10, 60, 0),
  (5, 1, '6001064000021', 'HSH-002', 'Domestos Thick Bleach 750ml',      'Hospital-grade clean', 'each', 22.00, 34.99, 28, 10, 50, 0),
  (6, 1, '6001065000015', 'CND-001', 'Koo Baked Beans in Tomato 410g',   'Baked beans', 'each',  9.50, 15.99, 50, 15, 100, 0),
  (6, 1, '6001065000022', 'CND-002', 'Tastic Rice 2kg',                  'Long-grain white rice', 'each', 28.00, 42.99, 42, 15, 80, 1),
  (6, 1, '6001065000039', 'CND-003', 'Spekko Sugar Beans 500g',          'Dried sugar beans', 'each', 16.00, 24.99, 0, 10, 60, 0),
  (7, 1, '6001066000016', 'FRZ-001', 'McCain Frozen Chips 1kg',          'Straight cut chips', 'each', 32.00, 49.99, 22, 10, 50, 0),
  (7, 1, '6001066000023', 'FRZ-002', 'I&J Hake Fillets 800g',            'Frozen hake portions', 'each', 55.00, 79.99, 18, 8, 40, 0),
  (8, 1, '6001067000017', 'PRD-001', 'Bananas per kg',                   'Fresh bananas', 'kg',  8.00, 14.99, 35, 10, 80, 1),
  (8, 1, '6001067000024', 'PRD-002', 'Tomatoes per kg',                  'Ripe salad tomatoes', 'kg', 12.00, 19.99, 3, 10, 50, 0),
  (8, 1, '6001067000031', 'PRD-003', 'Onions per kg',                    'Brown onions', 'kg',  7.00, 12.99, 50, 15, 100, 0),
  (8, 1, '6001067000048', 'PRD-004', 'Spinach bunch',                    'Fresh spinach bunch', 'each',  5.00,  9.99, 20, 8, 40, 0);

-- OPENING STOCK MOVEMENTS (manager user_id = 2)
INSERT INTO stock_movements (product_id, user_id, movement_type, reference_id, qty_before, qty_change, qty_after, note, created_at)
SELECT product_id, 2, 'opening', NULL, 0, stock_qty, stock_qty, 'Seed opening stock', DATE_SUB(NOW(), INTERVAL 30 DAY)
FROM products;

-- PURCHASE ORDERS
INSERT INTO purchase_orders (po_ref, supplier_id, created_by, approved_by, status, total_amt, expected_date, received_date, notes, created_at) VALUES
  ('PO-20260601-001', 1, 2, NULL,    'draft',     1250.00, DATE_ADD(CURDATE(), INTERVAL 7 DAY),  NULL, 'Weekly bread restock', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('PO-20260601-002', 2, 2, 1,       'submitted', 2840.00, DATE_ADD(CURDATE(), INTERVAL 5 DAY),  NULL, 'Dairy monthly order',  DATE_SUB(NOW(), INTERVAL 4 DAY)),
  ('PO-20260601-003', 3, 2, 1,       'approved',  1720.00, DATE_ADD(CURDATE(), INTERVAL 3 DAY),  NULL, 'Snacks & beverages',   DATE_SUB(NOW(), INTERVAL 6 DAY)),
  ('PO-20260525-004', 1, 2, 1,       'shipped',   1065.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  NULL, 'Awaiting delivery',    DATE_SUB(NOW(), INTERVAL 10 DAY)),
  ('PO-20260520-005', 2, 2, 1,       'received',  3140.00, DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Received in full', DATE_SUB(NOW(), INTERVAL 15 DAY));

INSERT INTO po_items (po_id, product_id, qty_ordered, qty_received, unit_cost, line_total) VALUES
  (1, 1, 50, 0, 12.50, 625.00),
  (1, 2, 50, 0, 12.50, 625.00),
  (2, 3, 40, 0, 22.00, 880.00),
  (2, 4, 30, 0, 28.00, 840.00),
  (2, 5, 20, 0, 45.00, 900.00),
  (2, 3, 10, 0, 22.00, 220.00),
  (3, 6, 30, 0, 18.00, 540.00),
  (3, 9, 40, 0,  8.50, 340.00),
  (3, 10, 40, 0,  9.00, 360.00),
  (3, 7, 20, 0, 24.00, 480.00),
  (4, 1, 40, 0, 12.50, 500.00),
  (4, 14, 30, 0,  9.50, 285.00),
  (4, 15, 10, 0, 28.00, 280.00),
  (5, 3, 50, 50, 22.00, 1100.00),
  (5, 4, 25, 25, 28.00,  700.00),
  (5, 5, 20, 20, 45.00,  900.00),
  (5, 3, 20, 20, 22.00,  440.00);

-- SALES (cashier user_id = 3, customer_id 1 = sipho, 2 = nomsa)
-- Sale 1 — today
INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt, total_amt, amount_paid, change_given, payment_method, status, points_earned, created_at) VALUES
  ('USM-SEED-0001', 3, 1, 95.95, 0.00, 14.39, 110.34, 120.00, 9.66, 'cash', 'completed', 110, NOW());

INSERT INTO sale_items (sale_id, product_id, qty, unit_price, discount_pct, line_total) VALUES
  (1, 1, 2, 18.99, 0, 37.98),
  (1, 3, 1, 32.99, 0, 32.99),
  (1, 9, 1, 14.99, 0, 14.99),
  (1, 6, 1, 27.99, 0, 27.99);

-- Sale 2 — yesterday
INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt, total_amt, amount_paid, change_given, payment_method, status, points_earned, created_at) VALUES
  ('USM-SEED-0002', 3, 2, 187.93, 10.00, 26.69, 204.62, 204.62, 0.00, 'card', 'completed', 204, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO sale_items (sale_id, product_id, qty, unit_price, discount_pct, line_total) VALUES
  (2, 15, 2, 42.99, 0, 85.98),
  (2, 17, 1, 49.99, 0, 49.99),
  (2, 19, 2, 14.99, 0, 29.98),
  (2, 4,  1, 42.99, 0, 42.99);

-- Sale 3 — 2 days ago, walk-in
INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt, total_amt, amount_paid, change_given, payment_method, status, points_earned, created_at) VALUES
  ('USM-SEED-0003', 3, NULL, 64.96, 0.00, 9.74, 74.70, 100.00, 25.30, 'cash', 'completed', 0, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO sale_items (sale_id, product_id, qty, unit_price, discount_pct, line_total) VALUES
  (3, 6, 1, 27.99, 0, 27.99),
  (3, 9, 2, 14.99, 0, 29.98),
  (3, 8, 1, 22.99, 0, 22.99);

-- Sale 4 — 3 days ago
INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt, total_amt, amount_paid, change_given, payment_method, status, points_earned, created_at) VALUES
  ('USM-SEED-0004', 3, 1, 142.92, 5.00, 20.69, 158.61, 158.61, 0.00, 'ewallet', 'completed', 158, DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO sale_items (sale_id, product_id, qty, unit_price, discount_pct, line_total) VALUES
  (4, 2, 2, 19.99, 0, 39.98),
  (4, 5, 1, 64.99, 0, 64.99),
  (4, 10, 2, 16.99, 0, 33.98),
  (4, 21, 1, 12.99, 0, 12.99);

-- Sale 5 — 5 days ago
INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt, total_amt, amount_paid, change_given, payment_method, status, points_earned, created_at) VALUES
  ('USM-SEED-0005', 3, 2, 259.88, 0.00, 38.98, 298.86, 300.00, 1.14, 'cash', 'completed', 298, DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO sale_items (sale_id, product_id, qty, unit_price, discount_pct, line_total) VALUES
  (5, 18, 2, 79.99, 0, 159.98),
  (5, 3,  2, 32.99, 0,  65.98),
  (5, 13, 1, 34.99, 0,  34.99);

-- Sale 6 — 7 days ago (voided example)
INSERT INTO sales (sale_ref, cashier_id, customer_id, subtotal, discount_amt, tax_amt, total_amt, amount_paid, change_given, payment_method, status, points_earned, created_at) VALUES
  ('USM-SEED-0006', 3, NULL, 18.99, 0.00, 2.85, 21.84, 21.84, 0.00, 'cash', 'voided', 0, DATE_SUB(NOW(), INTERVAL 7 DAY));

INSERT INTO sale_items (sale_id, product_id, qty, unit_price, discount_pct, line_total) VALUES
  (6, 1, 1, 18.99, 0, 18.99);

-- EXPENSES
INSERT INTO expenses (recorded_by, category, amount, description, expense_date) VALUES
  (2, 'Utilities',       4500.00, 'Electricity — May 2026',        DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
  (2, 'Rent',           18000.00, 'Shop rental — June 2026',       CURDATE()),
  (2, 'Staff',           8500.00, 'Casual staff — weekend cover', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
  (1, 'Maintenance',     1200.00, 'Fridge compressor repair',      DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
  (2, 'Transport',        850.00, 'Delivery vehicle fuel',         DATE_SUB(CURDATE(), INTERVAL 2 DAY));

-- NOTIFICATIONS
INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at) VALUES
  (1, 'low_stock',  'Low Stock Alert',       'Lays Classic 150g is down to 4 units (reorder: 15).', '{"product_id":11}', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (1, 'low_stock',  'Out of Stock',          'Spekko Sugar Beans 500g is out of stock.',            '{"product_id":16}', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (2, 'low_stock',  'Low Stock Alert',       'Tomatoes per kg — only 3 kg remaining.',              '{"product_id":20}', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (2, 'purchase',   'PO Approved',           'PO-20260601-003 approved — snacks order.',          '{"po_id":3}',       1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (6, 'purchase',   'New Purchase Order',    'PO-20260601-003 awaiting shipment.',                '{"po_id":3}',       0, DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (6, 'purchase',   'Shipment Requested',    'PO-20260525-004 marked for delivery.',                '{"po_id":4}',       0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (3, 'sale',       'Daily Target Met',      'Great work! 110+ sales today.',                       NULL,                1, DATE_SUB(NOW(), INTERVAL 4 HOUR));

-- AUDIT LOG
INSERT INTO audit_log (user_id, action, module, target_table, target_id, ip_address, created_at) VALUES
  (2, 'CREATE',  'products',  'products',  1,  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 30 DAY)),
  (2, 'UPDATE',  'products',  'products',  11, '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (1, 'CREATE',  'users',     'users',     2,  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 25 DAY)),
  (2, 'CREATE',  'purchase_orders', 'purchase_orders', 3, '127.0.0.1', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (1, 'UPDATE',  'purchase_orders', 'purchase_orders', 3, '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3, 'CREATE',  'sales',     'sales',     1,  '127.0.0.1', NOW());

-- BACKUP LOG
INSERT INTO backup_log (created_by, filename, size_bytes, status, created_at) VALUES
  (1, 'ubuntu_smart_mart_20260528.sql', 245760, 'success', DATE_SUB(NOW(), INTERVAL 10 DAY)),
  (1, 'ubuntu_smart_mart_20260601.sql', 251904, 'success', DATE_SUB(NOW(), INTERVAL 6 DAY));
