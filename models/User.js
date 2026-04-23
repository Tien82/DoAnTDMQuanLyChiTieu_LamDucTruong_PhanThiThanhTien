const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    hoVaTen: { type: String, required: true },
    tenDangNhap: { type: String, required: true, unique: true },
    matKhau: { type: String, required: true },
    hanMucThang: { type: Number, default: 5000000 }, // Mặc định 5 triệu
    ngayTao: { type: Date, default: Date.now },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    isLocked: {
        type: Boolean,
        default: false // Mặc định tài khoản mới tạo luôn được hoạt động
    }
}, { timestamps: true }); 

module.exports = mongoose.model('User', UserSchema);