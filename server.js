// ==========================================
// 1. KHAI BÁO CÁC THƯ VIỆN HỆ THỐNG
// ==========================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

// Import các hàm logic AI từ folder utils
const { phanTichTaiChinh, soSanhThangTruoc } = require('./utils/logicAI');

const app = express();

// ==========================================
// 2. CẤU HÌNH VIEW ENGINE (EJS)
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 3. CẤU HÌNH MIDDLEWARE CƠ BẢN
// ==========================================
app.use(express.json()); // Hỗ trợ đọc dữ liệu JSON
app.use(express.urlencoded({ extended: true })); // Hỗ trợ đọc dữ liệu từ Form
app.use(express.static(path.join(__dirname, 'public'))); // Đường dẫn cho các file tĩnh (CSS, JS, Image)

// ==========================================
// 4. CẤU HÌNH SESSION (PHẢI NẰM TRÊN ROUTES)
// ==========================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'smartspend_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Đặt là true nếu dự án sử dụng HTTPS
        maxAge: 24 * 60 * 60 * 1000 // Session có hiệu lực trong 24 giờ
    }
}));

// ==========================================
// 5. BIẾN TOÀN CỤC CHO TEMPLATE (LOCALS)
// ==========================================
app.use((req, res, next) => {
    res.locals.user = req.session.username || null;
    res.locals.userId = req.session.userId || null;
    res.locals.role = req.session.role || 'user';
    next();
});

// ==========================================
// 6. KHAI BÁO VÀ SỬ DỤNG ROUTES
// ==========================================

// Import các file định tuyến - ĐẶT Ở ĐÂY ĐỂ TRÁNH LỖI INITIALIZATION
const authRoutes = require('./routes/auth.routes');
const analyzeRoutes = require('./routes/analyze.routes');
const expenseRoutes = require('./routes/expense.routes');

// Gắn các route vào ứng dụng với tiền tố tương ứng
app.use('/auth', authRoutes);
app.use('/dashboard', analyzeRoutes);
app.use('/expenses', expenseRoutes); 

// --- Các Route điều hướng và kiểm tra cơ bản ---

// Trang chủ
app.get('/', (req, res) => {
    res.render('home');
});

// Trang kiểm tra bản đồ
app.get('/test-map', (req, res) => {
    res.render('map-test'); 
});

// Trang kiểm tra biểu đồ và phân tích AI
app.get('/test-chart', (req, res) => {
    // Dữ liệu giả lập để kiểm tra logic
    const thangNay = 4200000;
    const thangTruoc = 3500000; 
    const hanMuc = 5000000;

    // Chạy logic AI để lấy kết quả phân tích
    const ketQuaAI = phanTichTaiChinh(thangNay, hanMuc);
    const ketQuaSoSanh = soSanhThangTruoc(thangNay, thangTruoc);

    // Truyền dữ liệu sang file EJS để hiển thị
    res.render('chart-test', { 
        dataAI: ketQuaAI, 
        soSanh: ketQuaSoSanh 
    });
});

// ==========================================
// 7. KẾT NỐI DATABASE & KHỞI CHẠY SERVER
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Đã kết nối thành công tới MongoDB Atlas!'))
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống SmartSpend AI đang chạy tại: http://localhost:${PORT}`);
});