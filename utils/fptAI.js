require('dotenv').config();
const axios = require('axios');

const phanTichChiTieu = async (vanBan) => {
    try {
        let ketQua = { hangMuc: 'Khác', soTien: 0 };
        let cauNoi = vanBan.toLowerCase();

        // 1. THỬ GỌI API CỦA FPT AI TRƯỚC
        try {
            const response = await axios.post('https://api.fpt.ai/nlp/predict', 
                { content: vanBan }, 
                {
                    headers: { 
                        'Authorization': `Bearer ${'EdxeXCSasB3cQuCx9B9elMzJhxLG9LNT'}`,
                        'Content-Type': 'application/json',
                        'Timeout': 5000 // Đợi tối đa 5s
                    }
                }
            );

            const data = response.data.data;
            if (data && data.entities) {
                data.entities.forEach(e => {
                    if (e.entity === 'hangmuc') ketQua.hangMuc = e.value;
                    if (e.entity === 'sotien') {
                        let so = e.value.replace(/[^0-9]/g, '');
                        if (e.value.toLowerCase().includes('k')) so += '000';
                        ketQua.soTien = parseInt(so);
                    }
                });
            }
        } catch (fptError) {
            console.log("FPT AI phản hồi chậm hoặc lỗi, tự động chuyển sang AI Offline...");
        }

        // 2. NẾU FPT AI KHÔNG HIỂU (Số tiền vẫn = 0), DÙNG BỘ NÃO DỰ PHÒNG
        if (ketQua.soTien === 0 || isNaN(ketQua.soTien)) {
            console.log("Kích hoạt bộ lọc dự phòng cho câu:", vanBan);
            
            // Tìm số tiền
            const matchTien = cauNoi.match(/(\d+[,.]?\d*)\s*(k|ngàn|nghìn|triệu|tr|đ|vnđ)/i);
            if (matchTien) {
                let num = parseFloat(matchTien[1].replace(/,/g, '.'));
                let unit = matchTien[2];
                if (['k', 'ngàn', 'nghìn'].includes(unit)) ketQua.soTien = num * 1000;
                else if (['triệu', 'tr'].includes(unit)) ketQua.soTien = num * 1000000;
                else ketQua.soTien = num;
            } else {
                const matchNum = cauNoi.match(/\d{4,}/); 
                if (matchNum) ketQua.soTien = parseInt(matchNum[0]);
            }

            // Dò tìm hạng mục theo từ khóa
            if (cauNoi.includes('ăn') || cauNoi.includes('uống') || cauNoi.includes('phở') || cauNoi.includes('cà phê') || cauNoi.includes('cafe') || cauNoi.includes('trà sữa')) {
                ketQua.hangMuc = "Ăn uống";
            } else if (cauNoi.includes('xe') || cauNoi.includes('xăng') || cauNoi.includes('grab') || cauNoi.includes('taxi') || cauNoi.includes('gửi')) {
                ketQua.hangMuc = "Di chuyển";
            } else if (cauNoi.includes('mua') || cauNoi.includes('áo') || cauNoi.includes('quần') || cauNoi.includes('shopee') || cauNoi.includes('siêu thị') || cauNoi.includes('mỹ phẩm')) {
                ketQua.hangMuc = "Mua sắm";
            } else if (cauNoi.includes('chơi') || cauNoi.includes('phim') || cauNoi.includes('game') || cauNoi.includes('nhậu')) {
                ketQua.hangMuc = "Giải trí";
            }
        }

        // Nếu qua 2 lớp mà vẫn không có số tiền thì báo thất bại về cho Frontend
        if (ketQua.soTien === 0 || isNaN(ketQua.soTien)) return null;

        // Chuẩn hóa tên hạng mục viết hoa chữ cái đầu (VD: ăn uống -> Ăn uống)
        ketQua.hangMuc = ketQua.hangMuc.charAt(0).toUpperCase() + ketQua.hangMuc.slice(1);
        
        return ketQua;
    } catch (error) {
        console.error("Lỗi AI:", error.message);
        return null;
    }
};

module.exports = { phanTichChiTieu };