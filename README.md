# EShop Backend API

Hệ thống Backend API cho dự án E-Commerce (EShop), phục vụ Frontend Web, Mobile và Quản trị viên (Admin).

## Yêu cầu Hệ thống
- **Node.js** >= 18.x
- **npm** >= 9.x

## Cài đặt
1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

2. (Tùy chọn) Khởi tạo cơ sở dữ liệu và dữ liệu mẫu:
   - Chạy script tạo lại DB mẫu:
     ```bash
     node database.js
     ```
   - Hoặc sinh dữ liệu kiểm thử tự động với Faker:
     ```bash
     node seed-faker.js
     ```
   - Hoặc chạy migration bằng Flyway:
     ```bash
     node flyway.js
     ```

## Khởi chạy Server
Khởi chạy backend server:
```bash
node server.js
```
Server sẽ chạy mặc định tại: `http://localhost:3000`

## Kiểm thử (Testing)
- Kiểm thử cấu trúc cơ sở dữ liệu (Database Schema, Tables, Columns & Constraints):
  ```bash
  node db-structural.test.js
  ```
- Kiểm thử chức năng Profile:
  ```bash
  node test_profile.js
  ```
