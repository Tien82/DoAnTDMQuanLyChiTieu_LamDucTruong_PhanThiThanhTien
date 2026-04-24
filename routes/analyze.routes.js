const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

const Expense = require('../models/Expense');
const User = require('../models/User'); 
const Savings = require('../models/Savings');
const Notification = require('../models/Notification');
const { phanTichTaiChinh, goiYChiTieu, soSanhThangTruoc } = require('../utils/logicAI');
const { phanTichChiTieu } = require('../utils/fptAI');

const checkAuth = (req, res, next) => {
    if (req.session && req.session.userId) return next();
    res.redirect('/auth/login');
};

const checkAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') return next();
    res.status(403).send("🚫 Bạn không phải Admin!");
};
async function getSharedDataAI(userId, sessionHanMuc) {
    const expenses = await Expense.find({ user: userId });
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    
    const tongChiTieu = expenses.filter(i => i.soTien < 0).reduce((s, i) => s + Math.abs(i.soTien), 0);
    const tongThuNhap = expenses.filter(i => i.soTien > 0).reduce((s, i) => s + i.soTien, 0);
    const hanMuc = sessionHanMuc || 5000000;

    return {
        dataAI: phanTichTaiChinh(tongChiTieu, hanMuc),
        tongChiTieu, tongThuNhap, unreadCount, notifications, hanMuc, expenses
    };
}

router.get('/', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        const savings = await Savings.find({ user: req.session.userId });
        const thongKeHangMuc = {};
        sharedData.expenses.filter(e => e.soTien < 0).forEach(e => {
            thongKeHangMuc[e.hangMuc] = (thongKeHangMuc[e.hangMuc] || 0) + Math.abs(e.soTien);
        });
        const listLoiKhuyen = goiYChiTieu(sharedData.tongChiTieu, sharedData.hanMuc, thongKeHangMuc);
        res.render('dashboard/index', {
            user: req.session.username,
            role: req.session.role,
            path: 'dashboard',
            ...sharedData,
            phanTram: sharedData.dataAI.phanTram,
            savings,
            listLoiKhuyen,
            chartData: { labels: Object.keys(thongKeHangMuc), values: Object.values(thongKeHangMuc) }
        });
    } catch (err) { res.status(500).send("Lỗi hệ thống"); }
});

router.get('/admin/dashboard', checkAuth, checkAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.q || "";

        let query = {};
        if (searchQuery) {
            query = {
                $or: [
                    { hangMuc: { $regex: searchQuery, $options: 'i' } },
                    { ghiChu: { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        const allExpenses = await Expense.find(query).populate('user').sort({ ngayGiaoDich: -1 }).skip(skip).limit(limit);
        const totalTransactions = await Expense.countDocuments(query);
        const totalUsers = await User.countDocuments();
        const systemVolume = (await Expense.find()).reduce((acc, curr) => acc + Math.abs(curr.soTien), 0);

        res.render('admin/dashboard', {
            user: req.session.username,
            role: req.session.role,
            path: 'admin',
            allExpenses,
            searchQuery,
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit),
            stats: { totalUsers, totalTransactions, systemVolume }
        });
    } catch (err) { res.status(500).send("Lỗi Admin"); }
});

router.get('/history', checkAuth, async (req, res) => {
    try {
        let expenses = await Expense.find({ user: req.session.userId });
        const { tuNgay, denNgay } = req.query;
        if (tuNgay || denNgay) {
            expenses = expenses.filter(item => {
                let date = new Date(item.ngayGiaoDich);
                let isValid = true;
                if (tuNgay) isValid = isValid && (date >= new Date(tuNgay));
                if (denNgay) isValid = isValid && (date <= new Date(denNgay).setHours(23,59,59));
                return isValid;
            });
        }
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        res.render('dashboard/history', { 
            user: req.session.username, 
            path: 'history',
            expenses: expenses.sort((a, b) => b.ngayGiaoDich - a.ngayGiaoDich), 
            tuNgay, denNgay, dataAI: sharedData.dataAI
        });
    } catch (err) { res.status(500).send("Lỗi lịch sử"); }
});

router.get('/profile', checkAuth, async (req, res) => {
    try {
        const userData = await User.findById(req.session.userId);
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        res.render('dashboard/profile', {
            user: userData.hoVaTen,
            tenDangNhap: userData.tenDangNhap,
            role: req.session.role,
            path: 'profile',
            dataAI: sharedData.dataAI,
            hanMuc: userData.hanMucThang
        });
    } catch (err) { res.status(500).send("Lỗi hồ sơ"); }
});

router.post('/profile/update', checkAuth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.session.userId, { hoVaTen: req.body.hoVaTen });
        req.session.username = req.body.hoVaTen;
        res.redirect('/dashboard/profile?msg=update_success');
    } catch (err) { res.status(500).send("Lỗi cập nhật"); }
});

router.post('/profile/change-password', checkAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);
        if (!await bcrypt.compare(oldPassword, user.matKhau)) return res.redirect('/dashboard/profile?msg=pw_wrong');
        user.matKhau = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        await user.save();
        res.redirect('/dashboard/profile?msg=pw_success');
    } catch (err) { res.status(500).send("Lỗi đổi mật khẩu"); }
});

router.post('/savings/add', checkAuth, async (req, res) => {
    try {
        await new Savings({ user: req.session.userId, tenMucTieu: req.body.tenMucTieu, mucTieuSoTien: Number(req.body.mucTieuSoTien) }).save();
        res.redirect('/dashboard?msg=saving_added');
    } catch (err) { res.status(500).send("Lỗi thêm quỹ"); }
});

router.post('/input/manual', checkAuth, async (req, res) => {
    try {
        const { soTien, hangMuc, ghiChu, loai, lat, lng, tenQuan } = req.body;
        await new Expense({
            user: req.session.userId,
            soTien: loai === 'chi' ? -Math.abs(soTien) : Math.abs(soTien),
            hangMuc, ghiChu,
            viTri: { tenQuan: tenQuan || hangMuc, toaDo: { lat: Number(lat), lng: Number(lng) } }
        }).save();
        res.redirect('/dashboard/history?msg=success');
    } catch (err) { res.status(500).send("Lỗi lưu"); }
});

router.post('/delete-confirm', checkAuth, async (req, res) => {
    try {
        const { expenseId, password } = req.body;
        const user = await User.findById(req.session.userId);
        const expense = await Expense.findOne({ _id: expenseId, user: req.session.userId });

        if (!expense) return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });

        if (Math.abs(expense.soTien) >= 5000000) {
            const isMatch = await bcrypt.compare(password, user.matKhau);
            if (!isMatch) return res.json({ success: false, message: "Mật khẩu xác nhận không đúng!" });
        }

        await Expense.deleteOne({ _id: expenseId });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/admin/users/toggle-lock/:id', checkAuth, checkAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.isLocked = !user.isLocked;
        await user.save();
        res.json({ success: true, isLocked: user.isLocked });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/map', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        const mapData = sharedData.expenses
            .filter(item => item.viTri && item.viTri.toaDo && item.viTri.toaDo.lat)
            .map(item => ({
                id: item._id,
                lat: item.viTri.toaDo.lat,
                lng: item.viTri.toaDo.lng,
                tenQuan: item.viTri.tenQuan,
                soTien: Math.abs(item.soTien),
                ghiChu: item.ghiChu,
                phuongThuc: item.phuongThucNhap // Thêm để hiển thị icon
            }));

        res.render('dashboard/map', {
            user: req.session.username,
            role: req.session.role,
            path: 'map',
            mapData,
            ...sharedData
        });
    } catch (err) {
        res.status(500).send("Lỗi tải bản đồ");
    }
});
module.exports = router;