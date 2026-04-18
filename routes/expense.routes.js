const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense'); // Gọi file Schema Chi tiêu ra

// ==========================================
// MIDDLEWARE: BẢO VỆ ROUTE (Chỉ cho người đã đăng nhập)
// ==========================================
const kiemTraDangNhap = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập! Vui lòng đăng nhập trước.' });
    }
    next(); // Hợp lệ thì cho đi tiếp
};

// ==========================================
// 1. API: THÊM KHOẢN CHI TIÊU MỚI (Manual / Input tay)
// ==========================================
router.post('/add', kiemTraDangNhap, async (req, res) => {
    try {
        const { soTien, hangMuc, ghiChu, phuongThucNhap } = req.body;

        // Tạo một bản ghi chi tiêu mới, tự động gắn với ID của người đang đăng nhập
        const newExpense = new Expense({
            user: req.session.userId, 
            soTien: soTien,
            hangMuc: hangMuc,
            ghiChu: ghiChu,
            phuongThucNhap: phuongThucNhap || 'manual' // Mặc định là nhập tay nếu không truyền vào
        });

        await newExpense.save(); // Lưu vào Cloud MongoDB

        res.status(201).json({ 
            message: 'Đã lưu khoản chi tiêu thành công!', 
            data: newExpense 
        });
    } catch (error) {
        console.error("Lỗi khi thêm chi tiêu:", error);
        res.status(500).json({ message: 'Lỗi server khi lưu dữ liệu!' });
    }
});

// ==========================================
// 2. API: LẤY DANH SÁCH CHI TIÊU CỦA USER HIỆN TẠI
// ==========================================
router.get('/list', kiemTraDangNhap, async (req, res) => {
    try {
        // Chỉ tìm những khoản chi tiêu thuộc về ID của user đang đăng nhập
        const expenses = await Expense.find({ user: req.session.userId })
                                      .sort({ ngayGiaoDich: -1 }); // Sắp xếp mới nhất lên đầu

        res.status(200).json({
            message: 'Lấy dữ liệu thành công',
            total: expenses.length,
            data: expenses
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách:", error);
        res.status(500).json({ message: 'Lỗi server!' });
    }
});

module.exports = router;