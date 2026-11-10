const sqlite3 = require('sqlite3').verbose();
const assert = require('assert');

// Kết nối tới DB với chế độ READWRITE để kiểm tra Authorization
const db = new sqlite3.Database('database.sqlite', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Lỗi kết nối DB:', err.message);
        process.exit(1);
    }
});

function runAdvancedTests() {
    console.log("=== Bắt đầu Kiểm thử Cấu trúc nâng cao ===\n");

    // ==========================================
    // 1. SCHEMA TESTING
    // Kiểm tra định dạng schema, các bảng có bị thiếu hay map sai không.
    // ==========================================
    console.log("[1] SCHEMA TESTING...");
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        const tableNames = tables.map(t => t.name);
        // Khai báo danh sách các bảng bắt buộc phải có
        const expectedTables = ['categories', 'coupons', 'coupon_usage', 'users', 'products', 'orders', 'flyway_schema_history'];

        let schemaPassed = true;
        expectedTables.forEach(table => {
            if (!tableNames.includes(table)) {
                console.error(`❌ Lỗi Schema: Hệ thống bị thiếu bảng [${table}]`);
                schemaPassed = false;
            }
        });

        if (schemaPassed) console.log("✅ Schema Testing: Tất cả các bảng cấu trúc cơ sở đều tồn tại và được ánh xạ đúng.");
    });

    // ==========================================
    // 2. TABLE & COLUMN TESTING
    // Đảm bảo việc thiết kế cột, độ dài và kiểu dữ liệu (data type) khớp giữa backend và logic.
    // ==========================================
    setTimeout(() => {
        console.log("\n[2] TABLE & COLUMN TESTING...");
        db.all("PRAGMA table_info('products')", (err, cols) => {
            const priceCol = cols.find(c => c.name === 'price');
            try {
                assert.ok(priceCol, "Bảng products bị mất cột price");
                // Kiểm tra kiểu dữ liệu: Tiền tệ trong dự án này phải là số nguyên (INTEGER) để tránh lỗi làm tròn số thực
                assert.strictEqual(priceCol.type, 'INTEGER', "Kiểu dữ liệu của cột price bị thiết kế sai (Phải là INTEGER)");
                console.log("✅ Table/Column Testing: Cột 'price' của bảng products được mapping chuẩn xác (Kiểu INTEGER).");
            } catch (e) {
                console.error("❌ Lỗi mapping cột:", e.message);
            }
        });
    }, 100);

    // ==========================================
    // 3. DATABASE SERVER VALIDATION
    // Kiểm tra cấu hình máy chủ DB (Pragma config), quyền truy cập, các rule ẩn.
    // ==========================================
    setTimeout(() => {
        console.log("\n[3] DATABASE SERVER VALIDATION...");

        // 3.1: Kiểm tra quyền truy cập (Authorized actions)
        db.run("CREATE TABLE test_auth_validation (id INT)", (err) => {
            if (err) {
                console.error("❌ Server Validation: User hiện tại không có quyền ghi dữ liệu (Read-only)!");
            } else {
                console.log("✅ Server Validation: Tài khoản truy cập DB có đủ thẩm quyền GHI (Write Authorization).");
                db.run("DROP TABLE test_auth_validation"); // Xóa rác
            }
        });

        // 3.2: Kiểm tra cấu hình bảo toàn dữ liệu (Server configuration)
        db.get("PRAGMA foreign_keys", (err, row) => {
            // SQLite mặc định tắt Foreign Key, đây là một điểm cần báo cáo rủi ro về Server Config
            if (row.foreign_keys === 0) {
                console.log("⚠️ Cảnh báo Server Config: Thuộc tính Ràng buộc khóa ngoại (Foreign Keys) đang TẮT. Có rủi ro tạo ra dữ liệu rác (Unmapped data).");
            } else {
                console.log("✅ Server Config: Foreign Keys đã BẬT.");
            }
        });
    }, 200);
}

// Chạy hàm sau nửa giây để đảm bảo SQLite đã mở kết nối thành công
setTimeout(runAdvancedTests, 500);
