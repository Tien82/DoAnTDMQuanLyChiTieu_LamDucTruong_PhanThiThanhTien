const Expense = require('../models/Expense');
const { phanTichTaiChinh, soSanhThangTruoc } = require('../utils/logicAI');

router.get('/dashboard', async (req, res) => {
    try {
        // 1. Tính tổng tiền đã tiêu trong tháng hiện tại
        const data = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    tongTien: { $sum: "$amount" }
                }
            }
        ]);

        const tongChi = data.length > 0 ? data[0].tongTien : 0;
        const hanMucCuaTien = 5000000; // Ný có thể lấy từ profile user trong DB

        // 2. Gọi hàm logic của ný A để lấy kết quả phân tích
        const dataAI = phanTichTaiChinh(tongChi, hanMucCuaTien);
        const soSanh = soSanhThangTruoc(tongChi, 0);

        // 3. Đổ dữ liệu ra file chart-test.ejs để hiển thị
        res.render('chart-test', { dataAI, soSanh });

    } catch (err) {
        res.status(500).send("Lỗi tính toán rồi bạn!");
    }
});