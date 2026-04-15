const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    soTien: { type: Number, required: true },
    hangMuc: { type: String, required: true }, // Ăn uống, Di chuyển, Shopping...
    ghiChu: { type: String },
    ngayGiaoDich: { type: Date, default: Date.now },
    
    // Phần dành cho OCR hóa đơn
    hinhAnhUrl: { type: String }, // Lưu link ảnh từ Cloudinary
    
    // Phần dành cho Map API
    viTri: {
        tenQuan: { type: String },
        toaDo: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    
    // Đánh dấu xem giao dịch này nhập bằng gì (Manual/Voice/OCR)
    phuongThucNhap: { type: String, enum: ['manual', 'voice', 'ocr'], default: 'manual' }
});

module.exports = mongoose.model('Expense', ExpenseSchema);