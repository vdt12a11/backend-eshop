-- Tạo bảng categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

-- Tạo bảng coupons
CREATE TABLE coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    type TEXT DEFAULT 'percent',
    discount_value INTEGER,
    min_order_amount INTEGER DEFAULT 0,
    expired_at DATETIME,
    is_active INTEGER DEFAULT 1,
    max_uses_per_user INTEGER DEFAULT 1
);

-- Tạo bảng coupon_usage
CREATE TABLE coupon_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_id INTEGER,
    user_id INTEGER,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    reset_token TEXT,
    shipping_address TEXT,
    phone TEXT
);

-- Tạo bảng products
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    description TEXT,
    imageUrl TEXT,
    category_id INTEGER
);

-- Tạo bảng orders
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_amount INTEGER,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
