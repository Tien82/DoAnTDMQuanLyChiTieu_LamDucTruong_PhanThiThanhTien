💰 SmartSpend AI - Ứng dụng Quản lý Tài chính Cá nhân Thông minh

📚 **Môn học:** Điện toán đám mây
👨‍💻 **Sinh viên thực hiện:** *Phan Thị Thanh Tiến* và *Lâm Đức Trường*

---

## 🌐 Giới thiệu dự án

**SmartSpend AI** là một hệ thống quản lý tài chính cá nhân thông minh, tích hợp **AI, OCR và bản đồ**, giúp người dùng:

* Ghi chép chi tiêu nhanh chóng
* Phân tích tài chính tự động
* Đưa ra lời khuyên tiết kiệm
* Trực quan hóa dữ liệu bằng biểu đồ & bản đồ

👉 Mục tiêu: **Giúp người dùng kiểm soát tài chính một cách khoa học và hiệu quả**

---

## 🚀 1. Danh sách Chức năng

### 👤 Nhóm 1: Hệ thống & Quản trị (Backend)

* 🔐 **Xác thực đa lớp**

  * Đăng ký / Đăng nhập / Đăng xuất
  * Khôi phục mật khẩu qua xác nhận

* 🧩 **Phân quyền hệ thống**

  * Sử dụng `express-session`
  * Phân quyền:

    * **User**: sử dụng cá nhân
    * **Admin**: quản trị hệ thống

* 📊 **Admin Dashboard**

  * Xem toàn bộ giao dịch hệ thống
  * Thống kê dòng tiền tổng
  * Khóa / mở tài khoản người dùng

* 🛡 **Bảo mật nâng cao**

  * Xác nhận mật khẩu lần 2 khi xóa giao dịch lớn (> 5.000.000đ)

---

### 🤖 Nhóm 2: Trí tuệ nhân tạo & Trực quan (Frontend + AI)

* 🎤 **Trợ lý AI thông minh**

  * Nhập liệu bằng giọng nói (**FPT AI**)
  * Quét hóa đơn bằng OCR (**Tesseract.js**)

* 🧠 **Phân tích tài chính (Logic AI)**

  * Phân tích chi tiêu
  * Cảnh báo vượt ngân sách
  * Đưa ra lời khuyên tiết kiệm

* 🎯 **Quỹ tiết kiệm**

  * Tạo mục tiêu tài chính
  * Theo dõi tiến độ bằng Progress Bar

* 🗺 **Bản đồ chi tiêu**

  * Hiển thị vị trí giao dịch bằng Leaflet Map
  * Quản lý chi tiêu theo khu vực

* 📈 **Biểu đồ thống kê**

  * Thu nhập / Chi tiêu theo thời gian (Chart.js)

---

## 🛠 2. Hướng dẫn cài đặt

### ⚙️ Yêu cầu hệ thống

* Cài đặt sẵn **Node.js**
* Có tài khoản **MongoDB Atlas**

---

### 📥 Cài đặt dự án

```bash
git clone <repo-url>
cd SmartSpendAI
npm install
```

---

### 🔑 Cấu hình môi trường (`.env`)

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/SmartSpend
SESSION_SECRET=smartspend_secret_key
PORT=3000
```

---

### ▶️ Chạy ứng dụng

```bash
npm run dev
```

👉 Truy cập:

```
http://localhost:3000
```

---

## 📦 3. Thư viện quan trọng

* `express-session` → Quản lý đăng nhập & session
* `bcryptjs` → Mã hóa mật khẩu
* `tesseract.js` → OCR nhận diện hóa đơn
* `chart.js` → Vẽ biểu đồ
* `sweetalert2` → Thông báo UI đẹp
* `leaflet` → Hiển thị bản đồ

---

## 📂 4. Cấu trúc thư mục

```text
DoAnDTDM/
├── models/
│   ├── User.js
│   ├── Expense.js
│   ├── Savings.js
│   └── Notification.js
│
├── routes/
│   ├── auth.routes.js
│   ├── analyze.routes.js
│   └── expense.routes.js
│
├── utils/
│   ├── logicAI.js
│   └── fptAI.js
│
├── views/
│   ├── admin/
│   ├── dashboard/
│   └── partials/
│
├── public/
├── server.js
└── .env
```

---

## 🧑‍💻 5. Hướng dẫn sử dụng (QUAN TRỌNG)

### 🔹 Bước 1: Đăng ký / Đăng nhập

* Người dùng tạo tài khoản mới
* Hoặc đăng nhập bằng tài khoản đã có

---

### 🔹 Bước 2: Thêm chi tiêu

Có 3 cách nhập:

1. ✍️ Nhập tay
2. 🎤 Nhập bằng giọng nói (AI)
3. 📷 Quét hóa đơn (OCR)

---

### 🔹 Bước 3: Theo dõi tài chính

* Xem biểu đồ chi tiêu
* Xem thống kê theo ngày / tháng
* Theo dõi danh sách giao dịch

---

### 🔹 Bước 4: Sử dụng AI

* Hệ thống tự động:

  * Phân tích thói quen chi tiêu
  * Đưa ra lời khuyên
  * Cảnh báo vượt ngân sách

---

### 🔹 Bước 5: Quỹ tiết kiệm

* Tạo mục tiêu (ví dụ: mua xe, du lịch)
* Theo dõi tiến độ hoàn thành

---

### 🔹 Bước 6: Xem bản đồ chi tiêu

* Hiển thị vị trí đã chi tiêu
* Giúp kiểm soát chi tiêu theo khu vực

---

### 🔹 Bước 7: Admin (nếu có quyền)

* Quản lý user
* Xem toàn bộ hệ thống
* Thống kê dữ liệu

---

## 📍 6. Phân chia công việc

### 👨‍💻 Thành viên B

* Xây dựng:

  * `models/`
  * `auth.routes.js`
* Xử lý:

  * Authentication
  * Session & bảo mật
* Giao diện:

  * `views/auth/`

---

### 👨‍💻 Thành viên A

* Phát triển:

  * `logicAI.js`
  * Hệ thống phân tích tài chính
* Tích hợp:

  * AI (FPT)
  * OCR (Tesseract)
  * Map (Leaflet)
* Xây dựng:

  * Dashboard người dùng & Admin

---

## 🎯 7. Điểm nổi bật của dự án

* ✅ Tích hợp **AI + OCR + Map**
* ✅ Phân tích tài chính thông minh
* ✅ Giao diện trực quan
* ✅ Bảo mật nhiều lớp
* ✅ Ứng dụng thực tế cao

---

## 📌 8. Hướng phát triển trong tương lai

* 📱 Phát triển Mobile App
* 🤖 AI nâng cao (Machine Learning)
* 💳 Kết nối ngân hàng tự động
* ☁️ Triển khai Cloud (AWS / GCP)

