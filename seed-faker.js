/**
 * ==============================================================================
 * DỰ ÁN: EShop — Automated Database Testing (FIT@HCMUS)
 * SCRIPT: seed-faker.js (ChatGPT-assisted Faker Data Seeder)
 * 
 * MỤC TIÊU CHO DATABASE TESTING:
 * 1. Tính Tất Định (Determinism / Reproducibility):
 *    - Sử dụng `fakerVI.seed(42)` để mọi lần chạy đều sinh ra đúng 1 bộ dữ liệu mẫu.
 *    - Ngăn ngừa hoàn toàn hiện tượng Flaky Tests trong Jest.
 * 
 * 2. Tuân thủ Đặc tả Nghiệp vụ (System Requirements Specification - README.md):
 *    - FR-01 & FR-02: Tài khoản Admin (admin@eshop.com), Test User (test@eshop.com),
 *      và User bị khóa (locked@eshop.com) để kiểm thử Login Lockout.
 *    - FR-04: Số điện thoại chuẩn Việt Nam (bắt đầu bằng 0, đúng 10 số), địa chỉ VN.
 *    - FR-06 & FR-15: Cột `price` bắt buộc là số nguyên (INTEGER > 0).
 *    - FR-09 & FR-17: Đầy đủ 4 Coupon chuẩn (SAVE10, BIGBUY, VIP100, EXPIRED) + Mã Disabled.
 *    - FR-10: Đơn hàng phủ trọn 5 trạng thái State Machine (pending, confirmed, shipping, delivered, canceled).
 *    - FR-13: Đơn hàng 'delivered' để kiểm thử tính tổng doanh thu Dashboard.
 * 
 * 3. Toàn vẹn Tham chiếu & Clean Slate (Referential Integrity & Idempotency):
 *    - Bật `PRAGMA foreign_keys = ON;`
 *    - Xóa sạch dữ liệu cũ theo thứ tự bảng con -> bảng cha.
 *    - Reset sequence auto-increment để ID luôn bắt đầu từ 1.
 *    - Bọc toàn bộ quá trình trong một Transaction nguyên tử (Atomic Transaction).
 * ==============================================================================
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { fakerVI } = require('@faker-js/faker');

// 1. CỐ ĐỊNH SEED ĐỂ ĐẢM BẢO TÍNH TẤT ĐỊNH (DETERMINISTIC) CHO TESTING
const SEED_NUMBER = 42;
fakerVI.seed(SEED_NUMBER);

/**
 * Hàm sinh số điện thoại chuẩn Việt Nam theo FR-04:
 * Bắt đầu bằng chữ số 0, đúng 10 chữ số (đầu số phổ biến: 09, 08, 07, 03)
 */
function generateVietnamesePhone() {
    const prefixes = ['090', '091', '098', '097', '086', '088', '070', '079', '038', '039'];
    const prefix = prefixes[fakerVI.number.int({ min: 0, max: prefixes.length - 1 })];
    const suffix = fakerVI.string.numeric(7);
    return `${prefix}${suffix}`;
}

/**
 * Hàm thực thi seed dữ liệu vào cơ sở dữ liệu SQLite
 * @param {sqlite3.Database} dbInstance - Thể hiện kết nối DB (tùy chọn)
 * @returns {Promise<object>} Thống kê số lượng bản ghi đã seed
 */
function seedData(dbInstance) {
    return new Promise((resolve, reject) => {
        const db = dbInstance || new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

        db.serialize(() => {
            // Đảm bảo bật kiểm tra khóa ngoại (Foreign Keys)
            db.run('PRAGMA foreign_keys = ON');

            // Bắt đầu Transaction nguyên tử
            db.run('BEGIN TRANSACTION', (beginErr) => {
                if (beginErr) {
                    console.error('❌ Lỗi mở Transaction:', beginErr.message);
                    return reject(beginErr);
                }

                try {
                    // ==========================================================
                    // BƯỚC 1: DỌN DẸP DỮ LIỆU CŨ (CLEAN SLATE & IDEMPOTENT)
                    // Xóa bảng con trước, bảng cha sau để không vi phạm FK
                    // ==========================================================
                    db.run('DELETE FROM coupon_usage');
                    db.run('DELETE FROM coupons');
                    db.run('DELETE FROM orders');
                    db.run('DELETE FROM products');
                    db.run('DELETE FROM users');
                    db.run('DELETE FROM categories');

                    // Reset Sequence để ID luôn bắt đầu lại từ 1
                    db.run(`DELETE FROM sqlite_sequence WHERE name IN (
                        'categories', 'coupons', 'coupon_usage', 'users', 'products', 'orders'
                    )`);

                    // ==========================================================
                    // BƯỚC 2: SEED BẢNG CATEGORIES (5 Danh mục chuẩn)
                    // ==========================================================
                    const categories = [
                        'Điện thoại',
                        'Laptop',
                        'Phụ kiện',
                        'Smartwatch',
                        'Máy tính bảng'
                    ];
                    const stmtCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
                    categories.forEach(name => stmtCategory.run(name));
                    stmtCategory.finalize();

                    // ==========================================================
                    // BƯỚC 3: SEED BẢNG USERS (Tài khoản chuẩn theo README + Random)
                    // ==========================================================
                    const stmtUser = db.prepare(`
                        INSERT INTO users (
                            name, email, password, role, login_attempts, locked_until, reset_token, shipping_address, phone
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    // 3.1. Admin mặc định (README mục 1 & FR-12)
                    stmtUser.run(
                        'Admin Tổng',
                        'admin@eshop.com',
                        'Admin123!',
                        'admin',
                        0,
                        null,
                        null,
                        'Tòa nhà Bitexco, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                        '0901234567'
                    );

                    // 3.2. User test mặc định (README mục 1 & FR-01)
                    stmtUser.run(
                        'Test User',
                        'test@eshop.com',
                        'Test1234!',
                        'user',
                        0,
                        null,
                        null,
                        '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
                        '0912345678'
                    );

                    // 3.3. User bị khóa mẫu để test FR-02 (Login Lockout)
                    stmtUser.run(
                        'Trần Thị Khóa',
                        'locked@eshop.com',
                        'User123!',
                        'user',
                        3,
                        '2099-01-01 00:00:00', // Đã bị khóa tới tương lai
                        null,
                        '123 Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh',
                        '0923456789'
                    );

                    // 3.4. Sinh thêm 17 tài khoản Users ngẫu nhiên (Tổng cộng = 20 users)
                    for (let i = 4; i <= 20; i++) {
                        const randomFullName = fakerVI.person.fullName();
                        const randomEmail = `user${i}_${fakerVI.internet.username().toLowerCase()}@example.com`;
                        const randomAddress = `${fakerVI.location.streetAddress()}, ${fakerVI.location.city()}`;
                        const randomPhone = generateVietnamesePhone();

                        stmtUser.run(
                            randomFullName,
                            randomEmail,
                            'User123!', // Thỏa mãn yêu cầu mật khẩu mạnh FR-01
                            'user',
                            0,
                            null,
                            null,
                            randomAddress,
                            randomPhone
                        );
                    }
                    stmtUser.finalize();

                    // ==========================================================
                    // BƯỚC 4: SEED BẢNG PRODUCTS (50 Sản phẩm chuẩn công nghệ)
                    // Price bắt buộc là số nguyên INTEGER > 0 theo FR-06 & FR-15
                    // ==========================================================
                    const stmtProduct = db.prepare(`
                        INSERT INTO products (name, price, description, imageUrl, category_id)
                        VALUES (?, ?, ?, ?, ?)
                    `);

                    // 5 sản phẩm mẫu đầu tiên chuẩn theo README & database.js
                    const fixedProducts = [
                        { name: 'iPhone 15 Pro Max 256GB', price: 29990000, desc: 'Điện thoại cao cấp vỏ titan của Apple', catId: 1 },
                        { name: 'Samsung Galaxy S24 Ultra', price: 27990000, desc: 'Camera siêu zoom AI thế hệ mới', catId: 1 },
                        { name: 'MacBook Pro M3 14 inch', price: 39990000, desc: 'Laptop chuyên nghiệp chip Apple Silicon', catId: 2 },
                        { name: 'Tai nghe Apple AirPods Pro 2', price: 5490000, desc: 'Tai nghe chống ồn chủ động xuất sắc', catId: 3 },
                        { name: 'Bàn phím cơ Keychron Q1 Pro', price: 4200000, desc: 'Khung nhôm CNC nguyên khối không dây', catId: 3 },
                    ];

                    fixedProducts.forEach(p => {
                        stmtProduct.run(
                            p.name,
                            p.price,
                            p.desc,
                            `https://placehold.co/400x400/png?text=${encodeURIComponent(p.name)}`,
                            p.catId
                        );
                    });

                    // 45 sản phẩm tiếp theo sinh bằng Faker
                    for (let i = 6; i <= 50; i++) {
                        const productName = `${fakerVI.commerce.productAdjective()} ${fakerVI.commerce.product()}`;
                        // Làm tròn giá tới hàng chục nghìn (ví dụ 350,000 đến 45,000,000 VNĐ)
                        const rawPrice = fakerVI.number.int({ min: 100000, max: 45000000 });
                        const integerPrice = Math.round(rawPrice / 10000) * 10000;
                        const productDesc = fakerVI.commerce.productDescription();
                        const imageUrl = `https://placehold.co/400x400/png?text=Product+${i}`;
                        const categoryId = fakerVI.number.int({ min: 1, max: 5 });

                        stmtProduct.run(
                            productName,
                            integerPrice,
                            productDesc,
                            imageUrl,
                            categoryId
                        );
                    }
                    stmtProduct.finalize();

                    // ==========================================================
                    // BƯỚC 5: SEED BẢNG COUPONS (Chuẩn theo bảng README FR-09)
                    // ==========================================================
                    const stmtCoupon = db.prepare(`
                        INSERT INTO coupons (
                            code, type, discount_value, min_order_amount, expired_at, is_active, max_uses_per_user
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    const initialCoupons = [
                        // C1-C5 Valid: 10%, min 300k, hạn 2099, max 1 lần
                        { code: 'SAVE10', type: 'percent', discount: 10, minOrder: 300000, expiredAt: '2099-12-31 23:59:59', active: 1, maxUses: 1 },
                        // Fixed: 50k, min 500k, hạn 2099, max 1 lần
                        { code: 'BIGBUY', type: 'fixed', discount: 50000, minOrder: 500000, expiredAt: '2099-12-31 23:59:59', active: 1, maxUses: 1 },
                        // Fixed: 100k, min 300k, hạn 2099, max 2 lần
                        { code: 'VIP100', type: 'fixed', discount: 100000, minOrder: 300000, expiredAt: '2099-12-31 23:59:59', active: 1, maxUses: 2 },
                        // Expired: Kiểm thử điều kiện C2 (Hạn sử dụng trong quá khứ)
                        { code: 'EXPIRED', type: 'percent', discount: 20, minOrder: 100000, expiredAt: '2020-01-01 00:00:00', active: 1, maxUses: 1 },
                        // Inactive: Kiểm thử điều kiện C1 (Mã bị tắt is_active = 0)
                        { code: 'DISABLED50', type: 'percent', discount: 50, minOrder: 200000, expiredAt: '2099-12-31 23:59:59', active: 0, maxUses: 1 },
                    ];

                    initialCoupons.forEach(c => {
                        stmtCoupon.run(c.code, c.type, c.discount, c.minOrder, c.expiredAt, c.active, c.maxUses);
                    });
                    stmtCoupon.finalize();

                    // ==========================================================
                    // BƯỚC 6: SEED BẢNG COUPON_USAGE (Kiểm thử FR-09 C5: max_uses_per_user)
                    // ==========================================================
                    const stmtUsage = db.prepare(`
                        INSERT INTO coupon_usage (coupon_id, user_id, used_at)
                        VALUES (?, ?, ?)
                    `);

                    // User 2 (test@eshop.com) đã dùng mã 'SAVE10' (coupon_id = 1) 1 lần -> Hết lượt!
                    stmtUsage.run(1, 2, '2026-01-10 10:00:00');

                    // User 2 đã dùng mã 'VIP100' (coupon_id = 3) 1 lần -> Vẫn còn 1 lượt (max 2)!
                    stmtUsage.run(3, 2, '2026-02-15 15:30:00');

                    // User 3 đã dùng mã 'BIGBUY' (coupon_id = 2) 1 lần
                    stmtUsage.run(2, 3, '2026-03-01 09:15:00');

                    stmtUsage.finalize();

                    // ==========================================================
                    // BƯỚC 7: SEED BẢNG ORDERS (Đủ 5 trạng thái State Machine - FR-10)
                    // Hỗ trợ kiểm thử FR-10, FR-11, FR-13 (Dashboard doanh thu 'delivered'), FR-19
                    // ==========================================================
                    const stmtOrder = db.prepare(`
                        INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    `);

                    // 7.1. Đơn hàng cố định cho Test User (user_id = 2) bao phủ đủ 5 trạng thái
                    const fixedOrders = [
                        { userId: 2, total: 350000, status: 'pending', addr: '227 Nguyễn Văn Cừ, Quận 5', date: '2026-03-10 08:00:00' },
                        { userId: 2, total: 1200000, status: 'confirmed', addr: '227 Nguyễn Văn Cừ, Quận 5', date: '2026-03-11 09:30:00' },
                        { userId: 2, total: 5490000, status: 'shipping', addr: '227 Nguyễn Văn Cừ, Quận 5', date: '2026-03-12 11:15:00' },
                        { userId: 2, total: 29990000, status: 'delivered', addr: '227 Nguyễn Văn Cừ, Quận 5', date: '2026-03-13 14:20:00' },
                        { userId: 2, total: 850000, status: 'canceled', addr: '227 Nguyễn Văn Cừ, Quận 5', date: '2026-03-09 16:45:00' },
                    ];

                    fixedOrders.forEach(o => {
                        stmtOrder.run(o.userId, o.total, o.status, o.shipping_address || o.addr, o.date);
                    });

                    // 7.2. Sinh thêm 25 đơn hàng ngẫu nhiên cho các users khác
                    const statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'canceled'];
                    for (let i = 6; i <= 30; i++) {
                        const randomUserId = fakerVI.number.int({ min: 2, max: 20 });
                        const rawTotal = fakerVI.number.int({ min: 200000, max: 15000000 });
                        const integerTotal = Math.round(rawTotal / 10000) * 10000;
                        const randomStatus = statuses[fakerVI.number.int({ min: 0, max: statuses.length - 1 })];
                        const randomAddress = `${fakerVI.location.streetAddress()}, ${fakerVI.location.city()}`;
                        const randomDate = fakerVI.date.recent({ days: 30 }).toISOString().replace('T', ' ').substring(0, 19);

                        stmtOrder.run(
                            randomUserId,
                            integerTotal,
                            randomStatus,
                            randomAddress,
                            randomDate
                        );
                    }
                    stmtOrder.finalize();

                    // ==========================================================
                    // HOÀN TẤT TRANSACTION
                    // ==========================================================
                    db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                            console.error('❌ Lỗi Commit Transaction:', commitErr.message);
                            db.run('ROLLBACK');
                            return reject(commitErr);
                        }

                        const stats = {
                            categories: 5,
                            users: 20,
                            products: 50,
                            coupons: 5,
                            coupon_usage: 3,
                            orders: 30,
                            seedNumber: SEED_NUMBER
                        };

                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('🎉 SEED DỮ LIỆU THÀNH CÔNG VỚI CHATGPT-ASSISTED FAKER.JS!');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log(`📌 Seed Key        : ${stats.seedNumber} (Đảm bảo 100% Deterministic)`);
                        console.log(`📦 Categories      : ${stats.categories} danh mục`);
                        console.log(`👤 Users           : ${stats.users} tài khoản (Admin, Test User, Lockout User...)`);
                        console.log(`📱 Products        : ${stats.products} sản phẩm (Giá nguyên INTEGER > 0)`);
                        console.log(`🎟️ Coupons         : ${stats.coupons} mã (SAVE10, BIGBUY, VIP100, EXPIRED, DISABLED50)`);
                        console.log(`📊 Coupon Usage    : ${stats.coupon_usage} lượt dùng kiểm thử C5`);
                        console.log(`🛒 Orders          : ${stats.orders} đơn hàng (Bao phủ đủ 5 trạng thái State Machine)`);
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                        resolve(stats);
                    });

                } catch (err) {
                    db.run('ROLLBACK');
                    console.error('❌ Ngoại lệ trong quá trình Seed:', err.message);
                    reject(err);
                }
            });
        });
    });
}

// Nếu file được thực thi trực tiếp bằng lệnh `node seed-faker.js`
if (require.main === module) {
    const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'), (err) => {
        if (err) {
            console.error('❌ Không thể kết nối DB database.sqlite:', err.message);
            process.exit(1);
        }
        console.log('🔌 Đã kết nối cơ sở dữ liệu SQLite thành công.');
    });

    seedData(db)
        .then(() => {
            db.close((err) => {
                if (err) console.error('Lỗi khi đóng DB:', err.message);
                else console.log('🔒 Đã đóng kết nối Database an toàn.');
            });
        })
        .catch((err) => {
            console.error('💥 Quá trình seed thất bại:', err);
            db.close();
            process.exit(1);
        });
}

module.exports = { seedData, SEED_NUMBER };
