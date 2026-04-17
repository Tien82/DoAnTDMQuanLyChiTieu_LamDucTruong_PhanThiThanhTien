/*const ctx = document.getElementById('expenseChart').getContext('2d');
new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Khác'],
        datasets: [{
            data: [1200000, 500000, 2000000, 500000],
            backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#6c757d'],
            borderWidth: 0
        }]
    },
    options: {
        plugins: {
            legend: { position: 'bottom' }
        },
        cutout: '70%' // Làm vòng tròn mỏng cho sang
    }
});*/

// 1. Khởi tạo Biểu đồ Doughnut
const ctx = document.getElementById('expenseChart').getContext('2d');
new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Khác'],
        datasets: [{
            data: [1200000, 500000, 2000000, 300000], // Số ảo để test
            backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#6c757d'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    },
    options: {
        cutout: '70%',
        plugins: { legend: { position: 'bottom' } }
    }
});

// 2. Khởi tạo Bản đồ Leaflet (Lấy tọa độ TP.HCM làm mẫu)
const map = L.map('map').setView([10.7769, 106.7009], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Thêm 1 cái ghim ảo
L.marker([10.7769, 106.7009]).addTo(map)
    .bindPopup('<b>Bún Bò Huế</b><br>45.000 VNĐ')
    .openPopup();

// Fix lỗi map bị xám khi render trong card
setTimeout(() => { map.invalidateSize() }, 500);