const express = require('express');
const router = express.Router();

// Trang Dashboard chính (Địa bàn của ný B)
router.get('/', (req, res) => {
    // Nếu ný đã làm xong Đăng nhập, dùng dòng này:
    //if (!req.session.userId) return res.redirect('/auth/login');
    //res.render('dashboard/index', { user: req.session.username,path: 'dashboard' });

    // Nếu muốn VÀO THẲNG để test giao diện luôn mà không cần Login, dùng dòng dưới:
     res.render('dashboard/index', { user: "Ný B Đẹp Trai" ,path: 'dashboard' });
});

// Route xem lịch sử chi tiết
router.get('/history', (req, res) => {
    // Tạm thời dùng dữ liệu ảo để test giao diện
    res.render('dashboard/history', { user: "Ný B", path: 'history' });
});

// Trang Profile cá nhân
router.get('/profile', (req, res) => {
    //if (!req.session.userId) return res.redirect('/auth/login');
    //res.render('dashboard/profile', { user: req.session.username ,path: 'profile' });
    res.render('dashboard/profile', { user: "Ný B Đẹp Trai", path: 'profile' });
});

module.exports = router;