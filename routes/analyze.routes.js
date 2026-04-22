const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User'); // Thêm model User để lấy hạn mức thật
const { phanTichTaiChinh } = require('../utils/logicAI');
const { phanTichChiTieu } = require('../utils/fptAI');

const multer = require('multer');
const Tesseract = require('tesseract.js');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// Middleware kiểm tra đăng nhập
const checkAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

/**
 * Hàm hỗ trợ lấy dữ liệu AI dùng chung cho các trang
 * Giúp tránh lỗi undefined biến dataAI ở Header
 */
async function getSharedDataAI(userId, sessionHanMuc) {
    const expenses = await Expense.find({ user: userId });
    const tongChiTieu = expenses
        .filter(item => item.soTien < 0)
        .reduce((sum, item) => sum + Math.abs(item.soTien), 0);
    const tongThuNhap = expenses
        .filter(item => item.soTien > 0)
        .reduce((sum, item) => sum + item.soTien, 0);
    // Ưu tiên hạn mức từ session, nếu không có thì mặc định 5tr
    const hanMuc = sessionHanMuc || 5000000;
    return {
        dataAI: phanTichTaiChinh(tongChiTieu, hanMuc),
        tongChiTieu,
        tongThuNhap,
        hanMuc,
        expenses // Trả về luôn để các route đỡ phải query lại
    };
}

// --- 1. TRANG DASHBOARD CHÍNH ---
router.get('/', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        const { expenses, tongChiTieu, tongThuNhap, hanMuc, dataAI } = sharedData;

        // Tổng hợp dữ liệu cho Biểu đồ (Doughnut Chart)
        const thongKeHangMuc = {};
        expenses.filter(item => item.soTien < 0).forEach(item => {
            thongKeHangMuc[item.hangMuc] = (thongKeHangMuc[item.hangMuc] || 0) + Math.abs(item.soTien);
        });

        // Lấy danh sách tọa độ cho Bản đồ (Map)
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
        console.error("Lỗi Dashboard:", err);
        res.status(500).send("Không thể tải Dashboard");
    }
});

// --- 2. TRANG LỊCH SỬ GIAO DỊCH ---
router.get('/history', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        
        // Sắp xếp lại danh sách chi tiêu mới nhất lên đầu cho trang History
        const sortedExpenses = sharedData.expenses.sort((a, b) => b.ngayGiaoDich - a.ngayGiaoDich);

        res.render('dashboard/history', { 
            user: req.session.username, 
            path: 'history',
            expenses: sortedExpenses,
            dataAI: sharedData.dataAI
        });
    } catch (err) {
        console.error("Lỗi trang History:", err);
        res.status(500).send("Lỗi tải lịch sử");
    }
});

// --- 3. TRANG HỒ SƠ (PROFILE) ---
router.get('/profile', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        res.render('dashboard/profile', { 
            user: req.session.username, 
            path: 'profile',
            dataAI: sharedData.dataAI,
            hanMuc: sharedData.hanMuc
        });
    } catch (err) {
        res.status(500).send("Lỗi tải hồ sơ");
    }
});

// --- 4. CẬP NHẬT HẠN MỨC (Trong trang Profile) ---
router.post('/profile/budget', checkAuth, async (req, res) => {
    try {
        const { hanMucThang } = req.body;
        const newBudget = Number(hanMucThang);
        
        // Cập nhật vào DB
        await User.findByIdAndUpdate(req.session.userId, { hanMucThang: newBudget });
        
        // Cập nhật vào Session để các trang khác nhận ngay lập tức
        req.session.hanMuc = newBudget;
        
        res.redirect('/dashboard/profile');
    } catch (err) {
        console.error("Lỗi cập nhật hạn mức:", err);
        res.status(500).send("Không thể cập nhật hạn mức");
    }
});

// --- 5. NGHIỆP VỤ LƯU GIAO DỊCH (MANUAL) ---
router.post('/input/manual', checkAuth, async (req, res) => {
    try {
        // Lấy thêm lat, lng, tenQuan từ body do index.ejs gửi lên
        const { soTien, hangMuc, ghiChu, loai, lat, lng, tenQuan } = req.body;
        
        const newExpense = new Expense({
            user: req.session.userId,
            soTien: loai === 'chi' ? -Math.abs(Number(soTien)) : Math.abs(Number(soTien)), 
            hangMuc: hangMuc || 'Khác',
            ghiChu: ghiChu,
            phuongThucNhap: 'manual',
            ngayGiaoDich: new Date(),
            // LƯU THÊM VỊ TRÍ VÀO DATABASE
            viTri: {
                tenQuan: tenQuan || hangMuc, 
                toaDo: {
                    lat: lat ? Number(lat) : null,
                    lng: lng ? Number(lng) : null
                }
            }
        });

        await newExpense.save();
        res.redirect('/dashboard'); 
    } catch (err) {
        console.error("Lỗi lưu DB:", err);
        res.status(500).send("Lỗi lưu giao dịch!");
    }
});

// --- 6. NGHIỆP VỤ XÓA GIAO DỊCH ---
router.post('/delete/:id', checkAuth, async (req, res) => {
    try {
        await Expense.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
        res.redirect('/dashboard/history');
    } catch (err) {
        console.error("Lỗi xóa DB:", err);
        res.status(500).send("Không xóa được giao dịch!");
    }
});

// --- 7. XỬ LÝ NHẬP LIỆU GIỌNG NÓI ---
router.post('/input/voice', checkAuth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: "Không nghe thấy gì!" });

        const ketQuaAI = await phanTichChiTieu(text);

        if (ketQuaAI) {
            const newExpense = new Expense({
                user: req.session.userId,
                soTien: -Math.abs(ketQuaAI.soTien),
                hangMuc: ketQuaAI.hangMuc,
                ghiChu: `Nhập bằng giọng nói: "${text}"`,
                phuongThucNhap: 'voice',
                ngayGiaoDich: new Date()
            });

            await newExpense.save();
            return res.json({ success: true, data: ketQuaAI });
        }
        res.status(422).json({ success: false, message: "AI không hiểu ý ný..." });
    } catch (err) {
        console.error("Lỗi Voice AI:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});
// --- 8. TRANG BẢN ĐỒ CHI TIÊU FULL ---
router.get('/map', checkAuth, async (req, res) => {
    try {
        const sharedData = await getSharedDataAI(req.session.userId, req.session.hanMuc);
        
        // Lấy tất cả giao dịch có tọa độ để đưa lên bản đồ lớn
        const toaDoGiaoDich = sharedData.expenses
            .filter(item => item.viTri && item.viTri.toaDo && item.viTri.toaDo.lat)
            .map(item => ({
                id: item._id, // Quan trọng: Gửi kèm ID để sửa/xóa
                lat: item.viTri.toaDo.lat,
                lng: item.viTri.toaDo.lng,
                tenQuan: item.viTri.tenQuan || item.hangMuc,
                soTien: Math.abs(item.soTien),
                ghiChu: item.ghiChu || "Không có ghi chú"
            }));

        res.render('dashboard/map', { 
            user: req.session.username, 
            path: 'map',
            mapData: toaDoGiaoDich,
            dataAI: sharedData.dataAI // Để Header không bị lỗi mồ côi
        });
    } catch (err) {
        console.error("Lỗi trang Map:", err);
        res.status(500).send("Lỗi tải bản đồ");
    }
});

// --- 9. CẬP NHẬT TRỰC TIẾP TỪ BẢN ĐỒ ---
router.post('/map/update/:id', checkAuth, async (req, res) => {
    try {
        await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId },
            { 
                soTien: -Math.abs(Number(req.body.giaMoi)), // Đảm bảo luôn là số âm (chi tiêu)
                "viTri.tenQuan": req.body.tenQuanMoi
            }
        );
        res.redirect('/dashboard/map');
    } catch (err) {
        res.status(500).send("Lỗi cập nhật giá trên bản đồ");
    }
});

// --- 10. XỬ LÝ NHẬP LIỆU ẢNH HÓA ĐƠN (OCR) ---
router.post('/input/ocr', checkAuth, upload.single('billImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Không tìm thấy ảnh ný ơi!" });

        // 1. Chạy AI quét chữ
        const result = await Tesseract.recognize(req.file.path, 'vie+eng');
        const text = result.data.text;
        const lines = text.split('\n');
        
        let tongTien = 0;
        let hangMuc = 'Mua sắm';

        // 2. LOGIC AI TỈNH TÁO: Tìm số tiền thực tế
        // Tìm dòng chứa từ khóa "Tổng" hoặc "Total"
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('total') || line.includes('tổng') || line.includes('cộng') || line.includes('subtotal') || line.includes('cash')) {
                
                // Quét tất cả các số trong dòng đó hoặc dòng ngay sau nó
                const combinedText = lines[i] + ' ' + (lines[i+1] || '');
                const numbersFound = combinedText.match(/\d+[\d.,]*/g);
                
                if (numbersFound) {
                    // Lấy số cuối cùng tìm được (thường là kết quả phép tính)
                    const rawNum = numbersFound[numbersFound.length - 1];
                    const cleanNum = parseInt(rawNum.replace(/[.,]/g, ''));
                    
                    // Lọc: Số tiền bill trà sữa thường < 2 triệu và không thể là số điện thoại (10 số)
                    if (cleanNum > 1000 && cleanNum < 5000000 && rawNum.length < 9) {
                        tongTien = cleanNum;
                        break; 
                    }
                }
            }
        }

        // 3. Nếu vẫn không tìm thấy bằng từ khóa, dùng phương án dự phòng (Max) nhưng có bộ lọc
        if (tongTien === 0) {
            const allNumbers = text.match(/\d+[\d.,]*/g) || [];
            const filteredNumbers = allNumbers
                .map(n => ({ raw: n, val: parseInt(n.replace(/[.,]/g, '')) }))
                .filter(n => n.val >= 1000 && n.val < 5000000 && n.raw.length < 9); // Loại bỏ số điện thoại (thường 10 số)

            if (filteredNumbers.length > 0) {
                tongTien = Math.max(...filteredNumbers.map(n => n.val));
            }
        }

        // 4. PHÂN TÍCH HẠNG MỤC (Lọc từ khóa thông minh hơn)
        const textLower = text.toLowerCase();
        const keywords = {
            'Ăn uống': ['trà', 'sữa', 'matcha', 'latte', 'food', 'cafe', 'phở', 'bún', 'cơm', 'house', 'quán'],
            'Di chuyển': ['grab', 'be', 'xe ôm', 'xăng', 'petrol', 'taxi'],
            'Mua sắm': ['siêu thị', 'market', 'mall', 'shopee', 'lazada', 'tiki']
        };

        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => textLower.includes(word))) {
                hangMuc = category;
                break;
            }
        }

        // 5. LƯU VÀO DATABASE
        if (tongTien > 0) {
            const newExpense = new Expense({
                user: req.session.userId,
                soTien: -Math.abs(tongTien),
                hangMuc: hangMuc,
                ghiChu: `📸 OCR: Bill tại ${hangMuc}`,
                phuongThucNhap: 'ocr'
            });

            await newExpense.save();
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Xóa ảnh tạm
            
            return res.json({ success: true, data: { soTien: tongTien, hangMuc: hangMuc } });
        }

        res.status(422).json({ success: false, message: "AI đọc xong mà không thấy số tiền nào hợp lý cả!" });

    } catch (err) {
        console.error("Lỗi OCR:", err);
        res.status(500).json({ success: false, message: "Hệ thống đang bận, thử lại sau nhé ný!" });
    }
});
module.exports = router;