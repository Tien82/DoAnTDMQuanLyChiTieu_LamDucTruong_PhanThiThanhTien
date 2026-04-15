// Nạp các thư viện cần thiết
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Chứa CSS, JS frontend

// Cấu hình Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Đặt là true nếu dùng HTTPS
}));

// Kết nối Cơ sở dữ liệu MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Đã kết nối thành công tới MongoDB Atlas!'))
    .catch(err => console.error('Lỗi kết nối MongoDB:', err));

const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

// Route Test cơ bản
app.get('/', (req, res) => {
    res.send('<h1>Trợ lý quản lý chi tiêu sẵn sàng!</h1><p>Hệ thống đã chạy thành công.</p>');
});

// Khởi động Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});