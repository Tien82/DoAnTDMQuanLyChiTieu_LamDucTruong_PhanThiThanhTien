
# 💰 Smart Finance Assistant - Ứng dụng Quản lý & Thống kê Chi tiêu Thông minh
Dự án môn học Điện toán đám mây - Nhóm 2 thành viên.
**Công nghệ sử dụng:** Node.js (Express), MongoDB Atlas, Leaflet Map API, FPT AI, Chart.js, Render/Vercel.

---

## 🚀 1. Danh sách Chức năng
### 👤 Nhóm 1: Hệ thống & Bảo mật (B đảm nhiệm)
* **Xác thực:** Đăng ký, Đăng nhập, Đăng xuất (mã hóa mật khẩu `bcryptjs`).
* **Phân quyền:** Quản lý phiên làm việc bằng `session`, chỉ người dùng hợp lệ mới truy cập được dữ liệu.
* **Hồ sơ:** Cài đặt hạn mức chi tiêu tháng (`hanMucThang`).
* **Lịch sử giao dịch:** Hiển thị danh sách thu/chi theo phong cách Vietcombank (Xanh/Đỏ).

### 🤖 Nhóm 2: Trí tuệ ảo & Trực quan (A đảm nhiệm)
* **Trợ lý AI (FPT AI):** Nhập liệu bằng giọng nói (Voice-to-Text).
* **Bản đồ giá (Map API):** Hiển thị Marker vị trí chi tiêu và Popup cập nhật giá món ăn/dịch vụ tại chỗ đó.
* **Thống kê Dashboard:** Vẽ biểu đồ tròn/cột (Chart.js) so sánh Thu nhập - Chi tiêu.
* **Hệ thống Cảnh báo:** Tự động gửi thông báo (Chuông) khi chi tiêu chạm ngưỡng 80% hoặc vượt mức, kèm phương án tiết kiệm cho tháng sau.

---

## 🛠 2. Hướng dẫn cài đặt
1. **Yêu cầu:** Đã cài đặt [Node.js](https://nodejs.org/).
2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
3. **Cấu hình môi trường (`.env`):** Tạo file `.env` ở thư mục gốc và dán:
   ```env
   MONGO_URI=mongodb+srv://admin:admin123@cluster0.st92bky.mongodb.net/?appName=Cluster0
   SESSION_SECRET=your_secret_key
   FPT_AI_API_KEY=your_api_key
   CLOUDINARY_URL=your_cloudinary_url
   ```
4. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```

---

## 📦 3. Thư viện quan trọng
* `express`: Framework web.
* `mongoose`: Kết nối MongoDB Atlas.
* `ejs`: Template engine cho giao diện.
* `bcryptjs`: Mã hóa mật khẩu.
* `express-session`: Quản lý đăng nhập.
* `cloudinary` & `multer`: Xử lý hình ảnh hóa đơn (OCR).

---

### 📂 CÂY THƯ MỤC & PHÂN CHIA NHÁNH (GIT BRANCH)

Để không bị xung đột code, hai thành viên nên chia thành 2 nhánh: `branch-A` và `branch-B`. Nhánh `main` chỉ dùng để gộp (merge) code hoàn chỉnh.

```text
DoAnDTDM/ (Main Branch)
├── models/                 # Chứa cấu trúc CSDL (B nắm chính)
│   ├── User.js             # Schema người dùng & Hạn mức
│   └── Expense.js          # Schema giao dịch & Tọa độ Map
├── routes/                 # Điều hướng URL
│   ├── auth.routes.js      # (B) Xử lý Đăng ký/Đăng nhập
│   ├── expense.routes.js   # (B) Xử lý CRUD Thu/Chi
│   ├── ai.routes.js        # (A) Kết nối FPT AI bóc tách giọng nói
│   └── map.routes.js       # (A) Xử lý lấy tọa độ & giá món ăn
├── controllers/            # Logic xử lý (Phân chia tương tự routes)
├── public/                 # File tĩnh (CSS, Images, JS Frontend)
│   ├── css/                # Style chung & Giao diện Vietcombank
│   └── js/
│       ├── chart-logic.js  # (A) Vẽ biểu đồ Chart.js
│       └── map-logic.js    # (A) Xử lý Leaflet Map API
├── views/                  # Giao diện EJS
│   ├── partials/           # Navbar, Footer, Sidebar
│   ├── auth/               # (B) Giao diện Login/Register
│   ├── dashboard/          # (B UI, A Logic) Dashboard chính
│   └── index.ejs           # Trang chủ giới thiệu
├── .env                    # File cấu hình bảo mật
├── server.js               # File chạy chính (Main entry)
└── package.json            # Quản lý thư viện
```

---

### 📍 PHÂN CHIA NHÁNH CỤ THỂ:

**1. Nhánh `branch-B` (Thành viên B):**
* Tập trung hoàn thiện thư mục `models/`, `routes/auth.routes.js`, và các file trong `views/auth/`.
* Xây dựng giao diện bảng biểu và luồng dữ liệu CRUD cơ bản.
* Khi làm xong tính năng Đăng nhập, thành viên B `push` lên và thành viên A `pull` về để làm tiếp phần Dashboard.

**2. Nhánh `branch-A` ( Thành viên A):**
* Tập trung vào `routes/ai.routes.js`, `public/js/map-logic.js`.
* Viết logic tính toán trong `controllers/` để so sánh hạn mức và soạn nội dung thông báo.
* Thành viên A sẽ lấy dữ liệu từ các hàm thành viên B đã viết để vẽ biểu đồ.