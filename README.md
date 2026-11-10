# EShop Backend API

Hệ thống Backend API cho dự án E-Commerce (EShop), phục vụ Frontend Web, Mobile và Quản trị viên (Admin).

---

## 🚀 Hướng Dẫn Deploy Lên Render (Web Service)

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com).
2. Nhấn **New +** -> Chọn **Web Service**.
3. Chọn repository GitHub: `vdt12a11/backend-eshop`.
4. Cấu hình các thông số sau:
   - **Name**: `backend-eshop` (hoặc tên tuỳ thích).
   - **Language**: `Node`.
   - **Branch**: `main`.
   - **Build Command**: `npm install`.
   - **Start Command**: `npm start`.
   - **Instance Type**: `Free`.
5. *(Tùy chọn)* Mục **Environment Variables**:
   - `PORT`: Render tự động cấp, **không cần điền**.
   - `SECRET_KEY`: Khóa bí mật cho JWT (nếu không điền, hệ thống sẽ dùng khóa mặc định).
6. Nhấn **Deploy Web Service**. Sau khi deploy xong, bạn sẽ có URL dạng: `https://backend-eshop-xxxx.onrender.com`.

---

## 💻 Chạy Cục Bộ (Local Development)

### 1. Yêu cầu Hệ thống
- **Node.js** >= 18.x
- **npm** >= 9.x

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Khởi chạy Server
```bash
npm start
```
Server sẽ chạy tại `http://localhost:3000`.

### 4. (Tùy chọn) Thao tác với Database SQLite
- Khởi tạo database mẫu:
  ```bash
  node database.js
  ```
- Sinh thêm dữ liệu mẫu ngẫu nhiên bằng Faker:
  ```bash
  node seed-faker.js
  ```
- Chạy Database Migration với Flyway:
  ```bash
  node flyway.js
  ```

---

## 🧪 Kiểm thử (Testing)
- Kiểm thử cấu trúc cơ sở dữ liệu (Schema, bảng, cột, kiểu dữ liệu):
  ```bash
  npm test
  # hoặc
  node db-structural.test.js
  ```
- Kiểm thử chức năng thông tin cá nhân (Profile):
  ```bash
  node test_profile.js
  ```
