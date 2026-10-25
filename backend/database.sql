-- ============================================================
--  Cretzo Multi-Vendor Marketplace – MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS cretzo_marketplace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cretzo_marketplace;

-- ── Users (buyers, vendors, admins) ──────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120)  NOT NULL,
  email        VARCHAR(180)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  role         ENUM('buyer','vendor','admin') NOT NULL DEFAULT 'buyer',
  avatar       VARCHAR(500)  DEFAULT NULL,
  phone        VARCHAR(30)   DEFAULT NULL,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Vendor profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL UNIQUE,
  shop_name    VARCHAR(180) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  description  TEXT         DEFAULT NULL,
  logo         VARCHAR(500) DEFAULT NULL,
  banner       VARCHAR(500) DEFAULT NULL,
  address      VARCHAR(500) DEFAULT NULL,
  is_approved  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  slug         VARCHAR(130) NOT NULL UNIQUE,
  icon         VARCHAR(100) DEFAULT NULL,
  parent_id    INT UNSIGNED DEFAULT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_id    INT UNSIGNED NOT NULL,
  category_id  INT UNSIGNED DEFAULT NULL,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(270) NOT NULL UNIQUE,
  description  TEXT         DEFAULT NULL,
  price        DECIMAL(12,2) NOT NULL,
  compare_price DECIMAL(12,2) DEFAULT NULL,
  stock        INT          NOT NULL DEFAULT 0,
  images       JSON         DEFAULT NULL,
  tags         JSON         DEFAULT NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id)   REFERENCES vendors(id)    ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FULLTEXT KEY ft_products (name, description)
) ENGINE=InnoDB;

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buyer_id      INT UNSIGNED NOT NULL,
  total_amount  DECIMAL(12,2) NOT NULL,
  status        ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  shipping_addr JSON          NOT NULL,
  payment_method VARCHAR(60)  DEFAULT 'cod',
  payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  notes         TEXT          DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Order items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NOT NULL,
  vendor_id   INT UNSIGNED NOT NULL,
  quantity    INT          NOT NULL,
  unit_price  DECIMAL(12,2) NOT NULL,
  subtotal    DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id)  REFERENCES vendors(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  buyer_id    INT UNSIGNED NOT NULL,
  rating      TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (product_id, buyer_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Seed data ────────────────────────────────────────────────

-- Admin account (password: Admin@123)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@cretzo.com', '$2y$12$q5MTf55rDjVBODbWFaXeJ.Vgorms76JeVHzZTiaVnClMGncvk94.m', 'admin');

-- Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES
('Electronics',    'electronics',    '💻'),
('Fashion',        'fashion',        '👗'),
('Home & Garden',  'home-garden',    '🏡'),
('Sports',         'sports',         '⚽'),
('Books',          'books',          '📚'),
('Beauty',         'beauty',         '💄'),
('Toys',           'toys',           '🧸'),
('Automotive',     'automotive',     '🚗');
