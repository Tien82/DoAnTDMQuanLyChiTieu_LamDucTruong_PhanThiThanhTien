// Nạp các thư viện cần thiết
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();

// ==========================================
// 1. CẤU HÌNH MIDDLEWARE (BẮT BUỘC PHẢI NẰM TRÊN CÙNG)
// ==========================================
app.use(express.json()); // Đọc dữ liệu JSON
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu Form
app.use(express.static(path.join(__dirname, 'public'))); // Chứa CSS, JS frontend
// ==========================================
// 2. CẤU HÌNH SESSION (NẰM TRÊN ROUTES ĐỂ ROUTES CÓ THỂ XÀI)
// ==========================================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000} // Đặt là true nếu dùng HTTPS
}));

// ==========================================
// 3. CẤU HÌNH VIEW ENGINE (EJS)
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 4. ĐỊNH TUYẾN - ROUTES (NẰM DƯỚI MIDDLEWARE VÀ SESSION)
// ==========================================
// Middleware này giúp mọi file EJS (Header, Sidebar...) đều thấy biến user và role
app.use((req, res, next) => {
    res.locals.user = req.session.username || null;
    res.locals.userId = req.session.userId || null;
    res.locals.role = req.session.role || 'user'; // Mặc định là user
    next();
});

// Các Route từ nhánh kéo về (Nhóm 1)
const analyzeRoutes = require('./routes/analyze.routes');
app.use('/dashboard', analyzeRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

// Các Route của bạn (Nhóm 2)
const expenseRoutes = require('./routes/expense.routes');
app.use('/expenses', expenseRoutes); 

// Route Test cơ bản
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/test-map', (req, res) => {
    res.render('map-test'); 
});

const { phanTichTaiChinh, soSanhThangTruoc } = require('./utils/logicAI');

app.get('/test-chart', (req, res) => {
    const thangNay = 4200000;
    const thangTruoc = 3500000; 
    const hanMuc = 5000000;

    // Chạy logic để lấy dữ liệu
    const ketQuaAI = phanTichTaiChinh(thangNay, hanMuc);
    const ketQuaSoSanh = soSanhThangTruoc(thangNay, thangTruoc);

    // TRUYỀN CẢ 2 BIẾN SANG EJS
    res.render('chart-test', { 
        dataAI: ketQuaAI, 
        soSanh: ketQuaSoSanh 
    });
});

// ==========================================
// 5. KẾT NỐI DATABASE & CHẠY SERVER
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Đã kết nối thành công tới MongoDB Atlas!'))
    .catch(err => console.error('Lỗi kết nối MongoDB:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});