const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Trang hiển thị Đăng ký (GET)
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// Xử lý dữ liệu Đăng ký (POST)
router.post('/register', async (req, res) => {
    try {
        const { hoVaTen, tenDangNhap, matKhau, hanMucThang } = req.body;

        // 1. Kiểm tra xem tên đăng nhập đã tồn tại chưa
        const userExists = await User.findOne({ tenDangNhap });
        if (userExists) return res.send('Tên đăng nhập đã tồn tại!');

        // 2. MÃ HÓA MẬT KHẨU (Bcrypt)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(matKhau, salt);

        // 3. Lưu vào MongoDB Atlas
        const newUser = new User({
            hoVaTen,
            tenDangNhap,
            matKhau: hashedPassword, // Lưu bản đã mã hóa
            hanMucThang: hanMucThang || 5000000
        });

        await newUser.save();
        res.redirect('/auth/login'); // Đăng ký xong thì qua trang đăng nhập

    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống khi đăng ký');
    }
});

// Trang hiển thị Đăng nhập (GET)
router.get('/login', (req, res) => {
    res.render('auth/login');
});

module.exports = router;