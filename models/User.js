const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    hoVaTen: { type: String, required: true },
    tenDangNhap: { type: String, required: true, unique: true },
    matKhau: { type: String, required: true },
    hanMucThang: { type: Number, default: 5000000 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isLocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);