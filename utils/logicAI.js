function phanTichTaiChinh(tongChi, hanMuc) {
    const phanTram = (tongChi / hanMuc) * 100;
    return {
        phanTram: phanTram.toFixed(1),
        tongChi: tongChi.toLocaleString('vi-VN'),
        hanMuc: hanMuc.toLocaleString('vi-VN'),
        bgClass: phanTram >= 100 ? 'bg-danger' : (phanTram >= 80 ? 'bg-warning' : 'bg-success'),
        mauSac: phanTram >= 100 ? '#dc3545' : (phanTram >= 80 ? '#ffc107' : '#198754'),
        noiDung: phanTram >= 100 ? "Báo động: Chi tiêu vượt mức!" : "Tài chính ổn định.",
        phuongAn: phanTram >= 100 ? "Cần cắt giảm chi phí ngay." : "Duy trì kế hoạch hiện tại."
    };
}

function soSanhThangTruoc(tongThangNay, tongThangTruoc) {
    const chenhLech = tongThangNay - tongThangTruoc;
    return {
        chenhLech: chenhLech.toLocaleString('vi-VN'),
        isTang: chenhLech > 0,
        mauSac: chenhLech > 0 ? "#dc3545" : "#198754",
        thongDiep: chenhLech > 0 ? "Chi tiêu tăng so với tháng trước" : "Tiết kiệm tốt hơn tháng trước"
    };
}

function goiYChiTieu(tongChi, hanMuc, thongKeHangMuc) {
    let loiKhuyen = [];
    const phanTram = (tongChi / hanMuc) * 100;
    if (phanTram > 90) {
        loiKhuyen.push("Ngân sách của bạn đã chạm vùng đỏ. Hãy dừng ngay các khoản chi không thiết yếu.");
    } else if (phanTram > 70) {
        loiKhuyen.push("Bạn đang tiêu xài khá nhanh. Thử nấu ăn tại nhà để tiết kiệm thêm.");
    }
    if (thongKeHangMuc['Ăn uống'] > hanMuc * 0.4) {
        loiKhuyen.push("Khoản 'Ăn uống' đang chiếm tỷ trọng lớn. Hãy cắt giảm để dồn tiền vào Quỹ tiết kiệm.");
    }
    if (loiKhuyen.length === 0) {
        loiKhuyen.push("Phong độ tài chính rất tốt! Bạn có thể trích thêm 10% thu nhập vào quỹ dự phòng.");
    }
    return loiKhuyen;
}

module.exports = { phanTichTaiChinh, goiYChiTieu, soSanhThangTruoc };