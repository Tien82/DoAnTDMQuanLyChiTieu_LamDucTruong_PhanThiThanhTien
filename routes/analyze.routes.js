const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User'); 
const { phanTichTaiChinh } = require('../utils/logicAI');
const { phanTichChiTieu } = require('../utils/fptAI');

const multer = require('multer');
const Tesseract = require('tesseract.js');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const Notification = require('../models/Notification');

const checkAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

// Middleware kiểm tra Admin (Phân quyền Role-based)
const checkAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    res.status(403).send("🚫 Bạn không phải Admin, không có quyền truy cập khu vực này!");
};

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
            unreadCount: sharedData.unreadCount,
            notifications: sharedData.notifications,
            hanMuc: userData.hanMucThang
        });
    } catch (err) {
        res.status(500).send("Lỗi tải hồ sơ");
    }
});

router.post('/profile/budget', checkAuth, async (req, res) => {
    try {
        const newBudget = Number(req.body.hanMucThang);
        await User.findByIdAndUpdate(req.session.userId, { hanMucThang: newBudget });
        req.session.hanMuc = newBudget;
        res.redirect('/dashboard/profile?msg=budget_success');
    } catch (err) {
        res.status(500).send("Không thể cập nhật hạn mức");
    }
});

router.post('/profile/change-password', checkAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);
        
        const isMatch = await bcrypt.compare(oldPassword, user.matKhau);
        if (!isMatch) {
            return res.redirect('/dashboard/profile?msg=pw_wrong');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(newPassword, salt);
        
        await User.findByIdAndUpdate(req.session.userId, { matKhau: hashedPw });
        res.redirect('/dashboard/profile?msg=pw_success');
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi đổi mật khẩu hệ thống");
    }
});
// 1. Cập nhật họ tên
router.post('/profile/update', checkAuth, async (req, res) => {
    try {
        const { hoVaTen } = req.body;
        await User.findByIdAndUpdate(req.session.userId, { hoVaTen });
        req.session.username = hoVaTen; // Cập nhật lại session để menu hiện tên mới
        res.redirect('/dashboard/profile?msg=update_success');
    } catch (err) {
        res.status(500).send("Không thể cập nhật hồ sơ");
    }
});

// 2. Đổi mật khẩu (Đã gia cố để không bị lỗi trang trắng)
router.post('/profile/change-password', checkAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        const isMatch = await bcrypt.compare(oldPassword, user.matKhau);
        if (!isMatch) {
            return res.redirect('/dashboard/profile?msg=pw_wrong');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(newPassword, salt);
        
        await User.findByIdAndUpdate(req.session.userId, { matKhau: hashedPw });
        res.redirect('/dashboard/profile?msg=pw_success');
    } catch (err) {
        console.error("Lỗi đổi mật khẩu:", err);
        res.status(500).send("Lỗi hệ thống khi đổi mật khẩu");
    }
});

// 3. Xóa tài khoản
router.post('/profile/delete-account', checkAuth, async (req, res) => {
    try {
        await Expense.deleteMany({ user: req.session.userId });
        await Notification.deleteMany({ user: req.session.userId }); // Xóa luôn thông báo cho sạch dữ liệu
        await User.findByIdAndDelete(req.session.userId);
        req.session.destroy(); // Xóa sạch phiên đăng nhập
        res.redirect('/auth/login?msg=account_deleted');
    } catch (err) {
        res.status(500).send("Không thể xóa tài khoản");
    }
});
async function getSharedDataAI(userId, sessionHanMuc) {
    const expenses = await Expense.find({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    const tongChiTieu = expenses
        .filter(item => item.soTien < 0)
        .reduce((sum, item) => sum + Math.abs(item.soTien), 0);
    const tongThuNhap = expenses
        .filter(item => item.soTien > 0)
        .reduce((sum, item) => sum + item.soTien, 0);
    
    const hanMuc = sessionHanMuc || 5000000;
    return {
        dataAI: phanTichTaiChinh(tongChiTieu, hanMuc),
        tongChiTieu,
        tongThuNhap,
        unreadCount,
        hanMuc,
        expenses
    };
}
// Thêm Route để đánh dấu đã đọc khi người dùng bấm vào
router.post('/notifications/read-all', checkAuth, async (req, res) => {
    await Notification.updateMany({ user: req.session.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
});
// --- 1. TRANG TỔNG QUAN (DASHBOARD) ---
router.get('/', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        const { expenses, tongChiTieu, tongThuNhap, hanMuc, dataAI } = sharedData;

        // Phân tích dữ liệu biểu đồ
        const thongKeHangMuc = {};
        expenses.filter(item => item.soTien < 0).forEach(item => {
            thongKeHangMuc[item.hangMuc] = (thongKeHangMuc[item.hangMuc] || 0) + Math.abs(item.soTien);
        });

        // Lấy tọa độ bản đồ cho các giao dịch gần đây
        const toaDoGiaoDich = expenses
            .filter(item => item.viTri && item.viTri.toaDo && item.viTri.toaDo.lat)
            .map(item => ({
                lat: item.viTri.toaDo.lat,
                lng: item.viTri.toaDo.lng,
                tenQuan: item.viTri.tenQuan || item.hangMuc,
                soTien: Math.abs(item.soTien)
            }));

        res.render('dashboard/index', {
            user: req.session.username,
            path: 'dashboard',
            tongChiTieu,
            tongThuNhap,
            hanMuc,
            phanTram: dataAI.phanTram,
            dataAI: dataAI,
            chartData: {
                labels: Object.keys(thongKeHangMuc),
                values: Object.values(thongKeHangMuc)
            },
            mapData: toaDoGiaoDich
        });
    } catch (err) {
        res.status(500).send("Lỗi tải trang tổng quan");
    }
});

// --- 2. TRANG LỊCH SỬ (HISTORY) ---
router.get('/history', checkAuth, async (req, res) => {
    try {
        let expenses = await Expense.find({ user: req.session.userId });
        const { tuNgay, denNgay } = req.query;

        // Bộ lọc ngày tháng
        if (tuNgay || denNgay) {
            expenses = expenses.filter(item => {
                let date = new Date(item.ngayGiaoDich);
                let isValid = true;
                if (tuNgay) isValid = isValid && (date >= new Date(tuNgay));
                if (denNgay) {
                    let end = new Date(denNgay);
                    end.setHours(23, 59, 59, 999);
                    isValid = isValid && (date <= end);
                }
                return isValid;
            });
        }

        const sortedExpenses = expenses.sort((a, b) => b.ngayGiaoDich - a.ngayGiaoDich);
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);

        res.render('dashboard/history', { 
            user: req.session.username, 
            path: 'history',
            expenses: sortedExpenses, 
            tuNgay, 
            denNgay,
            dataAI: sharedData.dataAI
        });
    } catch (err) { 
        res.status(500).send("Lỗi tải lịch sử"); 
    }
});

// --- 3. TRANG HỒ SƠ & CÀI ĐẶT ---
router.get('/profile', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        res.render('dashboard/profile', {
            user: req.session.username,
            path: 'profile',
            dataAI: sharedData.dataAI,
            hanMuc: sharedData.hanMuc,
            role: req.session.role
        });
    } catch (err) {
        res.status(500).send("Lỗi tải hồ sơ");
    }
});

router.post('/profile/budget', checkAuth, async (req, res) => {
    try {
        const newBudget = Number(req.body.hanMucThang);
        await User.findByIdAndUpdate(req.session.userId, { hanMucThang: newBudget });
        req.session.hanMuc = newBudget;
        res.redirect('/dashboard/profile');
    } catch (err) {
        res.status(500).send("Không thể cập nhật hạn mức");
    }
});

// --- 4. CÁC NGHIỆP VỤ NHẬP LIỆU (MANUAL/VOICE/OCR) ---
router.post('/input/manual', checkAuth, async (req, res) => {
    const { soTien, hangMuc, ghiChu, loai, lat, lng, billImageUrl, tenQuan } = req.body;
    try {
        const newExpense = new Expense({
            user: req.session.userId,
            soTien: loai === 'chi' ? -Math.abs(Number(soTien)) : Math.abs(Number(soTien)),
            hangMuc,
            ghiChu,
            phuongThucNhap: 'manual',
            viTri: {
                tenQuan: tenQuan || hangMuc,
                toaDo: { lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null }
            },
            billImage: billImageUrl || null
        });
        await newExpense.save();
        res.redirect('/dashboard/history?msg=success');
    } catch (error) {
        res.status(500).send("Lỗi lưu giao dịch");
    }
});

router.post('/input/voice', checkAuth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false });

        const ketQuaAI = await phanTichChiTieu(text);
        if (ketQuaAI) {
            const newExpense = new Expense({
                user: req.session.userId,
                soTien: -Math.abs(ketQuaAI.soTien),
                hangMuc: ketQuaAI.hangMuc,
                ghiChu: `Nhập bằng giọng nói: "${text}"`,
                phuongThucNhap: 'voice'
            });
            await newExpense.save();
            return res.json({ success: true });
        }
        res.status(422).json({ success: false });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.post('/input/ocr', checkAuth, upload.single('billImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false });

        const result = await Tesseract.recognize(req.file.path, 'vie+eng');
        const text = result.data.text.toLowerCase();
        
        let tongTien = 0;
        let hangMuc = 'Mua sắm';

        // Phân tích sơ bộ số tiền từ văn bản quét được
        const numbers = text.match(/\d+[\d.]*/g);
        if (numbers) {
            const possibleAmounts = numbers.map(n => parseInt(n.replace(/\./g, ''))).filter(n => n > 1000);
            tongTien = possibleAmounts.length > 0 ? Math.max(...possibleAmounts) : 0;
        }

        if (text.match(/trà|sữa|cafe|food|cơm|phở/)) hangMuc = 'Ăn uống';
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        res.json({ success: true, data: { soTien: tongTien, hangMuc: hangMuc } });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- 5. QUẢN LÝ GIAO DỊCH (SỬA/XÓA) ---
router.post('/edit/:id', checkAuth, async (req, res) => {
    try {
        const { hangMuc, ghiChu, tenQuan, lat, lng } = req.body;
        await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId },
            {
                hangMuc,
                ghiChu,
                "viTri.tenQuan": tenQuan,
                "viTri.toaDo.lat": lat ? Number(lat) : null,
                "viTri.toaDo.lng": lng ? Number(lng) : null
            }
        );
        res.redirect('/dashboard/history?msg=updated');
    } catch (err) {
        res.status(500).send("Lỗi cập nhật");
    }
});

router.post('/delete/:id', checkAuth, async (req, res) => {
    try {
        await Expense.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
        res.redirect('/dashboard/history');
    } catch (err) {
        res.status(500).send("Lỗi xóa giao dịch");
    }
});

// --- 6. TRANG QUẢN TRỊ (ADMIN ONLY) ---
router.get('/admin/stats', checkAuth, checkAdmin, async (req, res) => {
    try {
        const allExpenses = await Expense.find().populate('user'); 
        const totalUsers = await User.countDocuments();
        const stats = {
            totalUsers,
            totalTransactions: allExpenses.length,
            systemVolume: allExpenses.reduce((sum, item) => sum + Math.abs(item.soTien), 0)
        };

        res.render('admin/dashboard', { 
            user: req.session.username, 
            path: 'admin', 
            stats, 
            allExpenses 
        });
    } catch (err) {
        res.status(500).send("Lỗi hệ thống Admin");
    }
});
router.get('/map', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        
        // Chỉ lấy những giao dịch CÓ tọa độ
        const mapData = sharedData.expenses
            .filter(item => item.viTri && item.viTri.toaDo && item.viTri.toaDo.lat)
            .map(item => ({
                lat: item.viTri.toaDo.lat,
                lng: item.viTri.toaDo.lng,
                tenQuan: item.viTri.tenQuan,
                soTien: Math.abs(item.soTien),
                ghiChu: item.ghiChu
            }));

        res.render('dashboard/map', {
            user: req.session.username,
            path: 'map',
            mapData: mapData, // Gửi mảng này sang
            ...sharedData
        });
    } catch (err) {
        res.status(500).send("Lỗi bản đồ");
    }
});
module.exports = router;