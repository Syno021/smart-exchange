CREATE DATABASE IF NOT EXISTS ubuntu_smart_mart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ubuntu_smart_mart;

-- USERS
CREATE TABLE users (
  user_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100)  NOT NULL,
  username    VARCHAR(50)   NOT NULL UNIQUE,
  email       VARCHAR(150)  UNIQUE,
  phone       VARCHAR(20),
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','manager','cashier','customer','supplier') NOT NULL,
  avatar_url  VARCHAR(255),
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  last_login  TIMESTAMP     NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
  category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL UNIQUE,
  slug        VARCHAR(80)  NOT NULL UNIQUE,
  icon        VARCHAR(50),
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- SUPPLIERS
CREATE TABLE suppliers (
  supplier_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED UNIQUE,
  company_name  VARCHAR(150) NOT NULL,
  contact_name  VARCHAR(100),
  phone         VARCHAR(20),
  email         VARCHAR(150),
  address       TEXT,
  tax_number    VARCHAR(50),
  payment_terms VARCHAR(100),
  rating        DECIMAL(3,1) DEFAULT 5.0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- PRODUCTS
CREATE TABLE products (
  product_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id   INT UNSIGNED  NOT NULL,
  supplier_id   INT UNSIGNED,
  barcode       VARCHAR(60)   UNIQUE,
  sku           VARCHAR(60)   UNIQUE,
  name          VARCHAR(200)  NOT NULL,
  description   TEXT,
  image_url     VARCHAR(255),
  unit          VARCHAR(30)   NOT NULL DEFAULT 'each',
  cost_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_qty     INT           NOT NULL DEFAULT 0,
  reorder_level INT           NOT NULL DEFAULT 5,
  max_stock     INT           NOT NULL DEFAULT 100,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)  ON DELETE SET NULL
);

-- CUSTOMERS
CREATE TABLE customers (
  customer_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED UNIQUE,
  address        TEXT,
  loyalty_points INT          NOT NULL DEFAULT 0,
  loyalty_tier   ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  total_spent    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- SALES
CREATE TABLE sales (
  sale_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_ref        VARCHAR(20)   NOT NULL UNIQUE,
  cashier_id      INT UNSIGNED,
  customer_id     INT UNSIGNED,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amt    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amt         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amt       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount_paid     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  change_given    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method  ENUM('cash','card','ewallet','loyalty') NOT NULL DEFAULT 'cash',
  status          ENUM('completed','voided','refunded','pending','out_for_delivery','delivered') NOT NULL DEFAULT 'completed',
  points_earned   INT           NOT NULL DEFAULT 0,
  points_redeemed INT           NOT NULL DEFAULT 0,
  notes           TEXT,
  delivery_address TEXT,
  delivery_phone  VARCHAR(30),
  delivered_at    TIMESTAMP     NULL DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id)  REFERENCES users(user_id)         ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
);

CREATE TABLE sale_items (
  item_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id      INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NOT NULL,
  qty          INT           NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  discount_pct DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  line_total   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id)    REFERENCES sales(sale_id)       ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

-- PURCHASE ORDERS
CREATE TABLE purchase_orders (
  po_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_ref         VARCHAR(20)   NOT NULL UNIQUE,
  supplier_id    INT UNSIGNED  NOT NULL,
  created_by     INT UNSIGNED  NOT NULL,
  approved_by    INT UNSIGNED,
  status         ENUM('draft','submitted','approved','shipped','received','cancelled') NOT NULL DEFAULT 'draft',
  total_amt      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  expected_date  DATE,
  received_date  DATE,
  notes          TEXT,
  supplier_notes TEXT,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by)  REFERENCES users(user_id)        ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(user_id)        ON DELETE SET NULL
);

CREATE TABLE po_items (
  po_item_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_id        INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NOT NULL,
  qty_ordered  INT           NOT NULL DEFAULT 1,
  qty_received INT           NOT NULL DEFAULT 0,
  unit_cost    DECIMAL(10,2) NOT NULL,
  line_total   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (po_id)      REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)   ON DELETE RESTRICT
);

-- STOCK MOVEMENTS
CREATE TABLE stock_movements (
  movement_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id    INT UNSIGNED  NOT NULL,
  user_id       INT UNSIGNED  NOT NULL,
  movement_type ENUM('sale','purchase','adjustment','return','damage','opening') NOT NULL,
  reference_id  INT UNSIGNED,
  qty_before    INT           NOT NULL,
  qty_change    INT           NOT NULL,
  qty_after     INT           NOT NULL,
  note          TEXT,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)       ON DELETE RESTRICT
);

-- EXPENSES
CREATE TABLE expenses (
  expense_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recorded_by  INT UNSIGNED  NOT NULL,
  category     VARCHAR(80)   NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  description  TEXT,
  expense_date DATE          NOT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  notif_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED  NOT NULL,
  type       VARCHAR(50)   NOT NULL,
  title      VARCHAR(150)  NOT NULL,
  message    TEXT          NOT NULL,
  data       JSON,
  is_read    TINYINT(1)    NOT NULL DEFAULT 0,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- AUDIT LOG
CREATE TABLE audit_log (
  log_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED,
  action       VARCHAR(100)  NOT NULL,
  module       VARCHAR(50),
  target_table VARCHAR(60),
  target_id    INT UNSIGNED,
  old_values   JSON,
  new_values   JSON,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- BACKUP LOG
CREATE TABLE backup_log (
  backup_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_by INT UNSIGNED  NOT NULL,
  filename   VARCHAR(255)  NOT NULL,
  size_bytes BIGINT,
  status     ENUM('success','failed') NOT NULL DEFAULT 'success',
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- SEED DATA
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Bread & Bakery','bread-bakery','Croissant',1),
  ('Dairy & Eggs','dairy-eggs','Milk',2),
  ('Beverages','beverages','GlassWater',3),
  ('Snacks','snacks','Candy',4),
  ('Household Goods','household','Sparkles',5),
  ('Canned & Dry Goods','canned-dry','Package',6),
  ('Frozen Foods','frozen','Snowflake',7),
  ('Fresh Produce','fresh-produce','Leaf',8);

-- Default admin (password: Admin@123)
INSERT INTO users (full_name, username, email, password, role) VALUES
  ('System Admin','admin','admin@usmart.co.za',
   '$2y$12$XsyFtDO1VyDE6DXl.dJ8XOyqYA/YrSjWE8bqbZ/VxKc9HiNT.D52K', 'admin');

-- Optional: import seed.sql for test users, products, sales, POs, etc.
