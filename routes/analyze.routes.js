const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Middleware kiểm tra đăng nhập nhanh cho các route dashboard
const checkAuth = (req, res, next) => {
    // Thêm kiểm tra req.session tồn tại trước khi đọc userId
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

// --- 1. TRANG DASHBOARD CHÍNH ---
router.get('/', checkAuth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.session.userId });

        // Tính tổng chi tiêu (các khoản tiền âm)
        const tongChiTieu = expenses
            .filter(item => item.soTien < 0)
            .reduce((sum, item) => sum + Math.abs(item.soTien), 0);

        // Giả sử hạn mức mặc định là 5tr (Sau này ný A lấy từ User model)
        const hanMuc = 5000000; 
        const phanTram = hanMuc > 0 ? Math.round((tongChiTieu / hanMuc) * 100) : 0;

        res.render('dashboard/index', { 
            user: req.session.username, 
            path: 'dashboard',
            tongChiTieu,
            hanMuc,
            phanTram
        });
    } catch (err) {
        console.error("Lỗi Dashboard:", err);
        res.status(500).send("Không thể tải Dashboard");
    }
});

// --- 2. TRANG LỊCH SỬ GIAO DỊCH ---
router.get('/history', checkAuth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.session.userId }).sort({ ngayGiaoDich: -1 });

        res.render('dashboard/history', { 
            user: req.session.username, 
            path: 'history',
            expenses: expenses 
        });
    } catch (err) {
        console.error("Lỗi trang History:", err);
        res.render('dashboard/history', { 
            user: req.session.username, 
            path: 'history', 
            expenses: [] 
        });
    }
});

// --- 3. TRANG HỒ SƠ (PROFILE) ---
router.get('/profile', checkAuth, (req, res) => {
    res.render('dashboard/profile', { 
        user: req.session.username, 
        path: 'profile' 
    });
});

// --- 4. NGHIỆP VỤ LƯU GIAO DỊCH (MANUAL) ---
router.post('/input/manual', checkAuth, async (req, res) => {
    try {
        const { soTien, hangMuc, ghiChu, loai } = req.body;
        
        const newExpense = new Expense({
            user: req.session.userId,
            // Nếu là 'chi' thì lưu số âm, 'thu' lưu số dương
            soTien: loai === 'chi' ? -Math.abs(Number(soTien)) : Math.abs(Number(soTien)), 
            hangMuc: hangMuc || 'Khác',
            ghiChu: ghiChu,
            phuongThucNhap: 'manual',
            ngayGiaoDich: new Date()
        });

        await newExpense.save();
        res.redirect('/dashboard/history');
    } catch (err) {
        console.error("Lỗi lưu DB:", err);
        res.status(500).send("Lỗi lưu giao dịch rồi ný ơi!");
    }
});

// --- 5. NGHIỆP VỤ XÓA GIAO DỊCH ---
router.post('/delete/:id', checkAuth, async (req, res) => {
    try {
        // Chỉ xóa nếu giao dịch đó thuộc về đúng user đang đăng nhập
        await Expense.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
        res.redirect('/dashboard/history');
    } catch (err) {
        console.error("Lỗi xóa DB:", err);
        res.status(500).send("Không xóa được ný ơi!");
    }
});

module.exports = router;