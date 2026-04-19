require('dotenv').config();
const axios = require('axios');

const phanTichChiTieu = async (vanBan) => {
    try {
        const response = await axios.post('https://api.fpt.ai/nlp/predict', 
            { content: vanBan }, 
            {
                headers: { 
                    'Authorization': `Bearer ${process.env.FPT_AI_KEY}`,
                    'Content-Type': 'application/json' 
                }
            }
        );

        // Lấy dữ liệu từ bộ não AI mà ný đã huấn luyện lúc nãy
        const data = response.data.data;
        let ketQua = { hangMuc: 'Chưa rõ', soTien: 0 };

        if (data && data.entities) {
            data.entities.forEach(e => {
                if (e.entity === 'hangmuc') ketQua.hangMuc = e.value;
                if (e.entity === 'sotien') {
                    // Chuyển đổi chuỗi "35k" hoặc "35 ngàn" thành số 35000
                    let so = e.value.replace(/[^0-9]/g, '');
                    if (e.value.includes('k')) so += '000';
                    ketQua.soTien = parseInt(so);
                }
            });
        }
        return ketQua;
    } catch (error) {
        console.error("Lỗi kết nối FPT AI:", error.message);
        return null;
    }
};

module.exports = { phanTichChiTieu };