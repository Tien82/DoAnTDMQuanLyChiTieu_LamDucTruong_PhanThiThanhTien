const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.get('/register', (req, res) => {
    const error = req.session.error;
    delete req.session.error;
    res.render('auth/register', { error });
});

router.post('/register', async (req, res) => {
    try {
        const { hoVaTen, tenDangNhap, matKhau, hanMucThang } = req.body;

        const userExists = await User.findOne({ tenDangNhap });
        if (userExists) {
            req.session.error = 'Tên đăng nhập đã tồn tại!';
            return res.redirect('/auth/register');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(matKhau, salt);

        const newUser = new User({
            hoVaTen,
            tenDangNhap,
            matKhau: hashedPassword, // Lưu bản đã mã hóa
            hanMucThang: hanMucThang || 5000000,
            role: 'user'
        });

        await newUser.save();
        res.redirect('/auth/login');

    } catch (err) {
        req.session.error = 'Lỗi hệ thống khi đăng ký';
        res.redirect('/auth/register');
    }
});

router.get('/login', (req, res) => {
    const error = req.session.error;
    delete req.session.error;
    res.render('auth/login', { error });
});

// Logic Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { tenDangNhap, matKhau } = req.body;
        const user = await User.findOne({ tenDangNhap });

        if (user && await bcrypt.compare(matKhau, user.matKhau)) {
            req.session.userId = user._id;
            req.session.username = user.hoVaTen;
            req.session.role = user.role;
            req.session.hanMuc = user.hanMucThang;
            return res.redirect('/dashboard');
        }
        res.redirect('/auth/login?msg=fail'); // Trả về lỗi để hiện SweetAlert
    } catch (err) {
        res.status(500).send("Lỗi hệ thống");
    }
});

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password');
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { tenDangNhap, newPassword } = req.body;
        
        // 1. Tìm người dùng trong Database
        const user = await User.findOne({ tenDangNhap: tenDangNhap });

        // 2. Nếu KHÔNG tìm thấy, trả về lỗi ngay lập tức
        if (!user) {
            return res.redirect('/auth/login?msg=user_not_found');
        }

        // 3. Nếu tìm thấy, mới tiến hành mã hóa và lưu mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.matKhau = await bcrypt.hash(newPassword, salt);
        await user.save();

        // 4. Thành công thì báo tin vui
        res.redirect('/auth/login?msg=reset_success');
    } catch (err) {
        console.error(err);
        res.redirect('/auth/login?msg=error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(); 
    res.redirect('/auth/login');
});

module.exports = router;
