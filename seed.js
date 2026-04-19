const mongoose = require('mongoose');
const Expense = require('./models/Expense'); //
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Đã kết nối để tạo dữ liệu mẫu...");

    // ID User của ný (Lấy từ MongoDB Atlas hoặc Log trong Session)
    const userId = "ID_CUA_NY_O_DAY"; 

    const sampleData = [
        {
            user: userId,
            soTien: -45000,
            hangMuc: "Ăn uống",
            ghiChu: "Ăn phở tại quán bà Tám",
            viTri: {
                tenQuan: "Phở bò quán bà Tám",
                toaDo: { lat: 10.3759, lng: 105.4340 } // Trung tâm LX
            },
            phuongThucNhap: 'manual'
        },
        {
            user: userId,
            soTien: -120000,
            hangMuc: "Giải trí",
            ghiChu: "Xem phim Vincom",
            viTri: {
                tenQuan: "CGV Vincom Long Xuyên",
                toaDo: { lat: 10.3780, lng: 105.4320 }
            },
            phuongThucNhap: 'voice'
        },
        {
            user: userId,
            soTien: 10000000,
            hangMuc: "Lương",
            ghiChu: "Lương dự án SmartSpend",
            phuongThucNhap: 'manual'
        }
    ];

    await Expense.insertMany(sampleData);
    console.log("Đã tạo 3 dữ liệu mẫu thành công! Ný vào Dashboard xem kết quả nha.");
    process.exit();
}).catch(err => console.log(err));