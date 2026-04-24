const mongoose = require('mongoose');

const SavingsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenMucTieu: { type: String, required: true },
    mucTieuSoTien: { type: Number, required: true },
    soTienHienCo: { type: Number, default: 0 },
    hanChot: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Savings', SavingsSchema);