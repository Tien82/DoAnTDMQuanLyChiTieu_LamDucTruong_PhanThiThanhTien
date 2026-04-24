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

router.post('/login', async (req, res) => {
    try {
        const { tenDangNhap, matKhau } = req.body;

        const user = await User.findOne({ tenDangNhap });
        if (!user) {
            req.session.error = 'Tài khoản không tồn tại!';
            return res.redirect('/auth/login');
        }

        const isMatch = await bcrypt.compare(matKhau, user.matKhau);
        if (!isMatch) {
            req.session.error = 'Sai mật khẩu ný ơi!';
            return res.redirect('/auth/login');
        }

        req.session.userId = user._id;
        req.session.username = user.hoVaTen;
        req.session.role = user.role;
        //req.session.role = 'admin'
        req.session.hanMuc = user.hanMucThang;

        res.redirect('/dashboard');

    } catch (err) {
        req.session.error = 'Lỗi đăng nhập';
        res.redirect('/auth/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(); 
    res.redirect('/auth/login');
});

module.exports = router;