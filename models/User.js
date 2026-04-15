const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    hoVaTen: { type: String, required: true },
    tenDangNhap: { type: String, required: true, unique: true },
    matKhau: { type: String, required: true },
    hanMucThang: { type: Number, default: 5000000 }, // Mặc định 5 triệu
    ngayTao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);