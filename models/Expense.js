const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    // CỘT BẮT BUỘC ĐỂ PHÂN QUYỀN SỞ HỮU (OWNERSHIP)
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    soTien: { type: Number, required: true },
    hangMuc: { type: String, required: true }, 
    ghiChu: { type: String },
    ngayGiaoDich: { type: Date, default: Date.now },
    
    // Phần dành cho OCR hóa đơn
    hinhAnhUrl: { type: String }, // Lưu link ảnh từ Cloudinary
    billImage: { type: String, default: null },
    
    // Phần dành cho Map API
    viTri: {
        tenQuan: { type: String },
        toaDo: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    
    // Đánh dấu xem giao dịch này nhập bằng gì (Manual/Voice/OCR)
    phuongThucNhap: { 
        type: String, 
        enum: ['manual', 'voice', 'ocr'], 
        default: 'manual' 
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);