document.addEventListener('DOMContentLoaded', function () {
    // 0. LẤY DỮ LIỆU TỪ SERVER
    const { tongThu, tongChi, chartLabels, chartValues, mapData } = window.DASHBOARD_DATA || {};

    // 1. VẼ BIỂU ĐỒ TRANG CHỦ
    const ctxMain = document.getElementById('mainMonthlyChart');
    if (ctxMain && typeof Chart !== 'undefined') {
        new Chart(ctxMain, {
            type: 'doughnut',
            data: {
                labels: ['Tổng Thu', 'Tổng Chi'],
                datasets: [{
                    data: [tongThu || 1, tongChi || 0],
                    backgroundColor: [tongThu > 0 ? '#198754' : '#e9ecef', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '75%', plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
        });
    }

    // 2. XỬ LÝ MODAL CHI TIẾT
    const detailModalEl = document.getElementById('detailChartModal');
    if (detailModalEl) {
        detailModalEl.addEventListener('shown.bs.modal', function () {
            const mockTrendData = [1200000, 2500000, 1800000, 3100000, 1500000, tongChi];
            const thangTruoc = mockTrendData[4]; 
            const thangNay = mockTrendData[5];
            const rateEl = document.getElementById('fluctuationRate');

            if (thangTruoc > 0) {
                let tiLeBienDong = Math.round((thangNay / thangTruoc) * 100);
                if (thangNay >= thangTruoc) {
                    rateEl.innerHTML = `<i class="bi bi-arrow-up"></i> ${tiLeBienDong}%`;
                    rateEl.className = "fw-bold mb-0 text-danger"; 
                } else {
                    rateEl.innerHTML = `<i class="bi bi-arrow-down"></i> ${tiLeBienDong}%`;
                    rateEl.className = "fw-bold mb-0 text-success"; 
                }
            }

            const ctxTrend = document.getElementById('trendComboChart');
            if (window.trendChartInstance) window.trendChartInstance.destroy();
            if (ctxTrend && typeof Chart !== 'undefined') {
                window.trendChartInstance = new Chart(ctxTrend, {
                    type: 'bar',
                    data: {
                        labels: ['T11', 'T12', 'T1', 'T2', 'T3', 'T4'],
                        datasets: [
                            { type: 'line', label: 'Xu hướng', data: mockTrendData, borderColor: '#fd7e14', borderWidth: 2, tension: 0.3, pointBackgroundColor: '#fff', pointBorderColor: '#fd7e14', pointRadius: 4 },
                            { type: 'bar', label: 'Chi tiêu', data: mockTrendData, backgroundColor: '#28a745', borderRadius: 20, barPercentage: 0.5 }
                        ]
                    },
                    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { display: false } } }
                });
            }

            const now = new Date();
            const min = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
            document.getElementById('currentTime').innerText = `${now.getHours()}:${min} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

            const allocationList = document.getElementById('budgetAllocationList');
            allocationList.innerHTML = '';
            const icons = {
                'Ăn uống': { icon: 'bi-cup-hot-fill', color: 'text-success', bg: 'bg-success' },
                'Di chuyển': { icon: 'bi-car-front-fill', color: 'text-info', bg: 'bg-info' },
                'Mua sắm': { icon: 'bi-bag-fill', color: 'text-warning', bg: 'bg-warning' },
                'Giải trí': { icon: 'bi-controller', color: 'text-danger', bg: 'bg-danger' },
                'Khác': { icon: 'bi-grid-fill', color: 'text-secondary', bg: 'bg-secondary' }
            };

            let maxCategory = ''; let maxPercent = 0;
            if (tongChi > 0 && chartLabels && chartLabels.length > 0) {
                chartLabels.forEach((label, index) => {
                    const amount = chartValues[index];
                    const percent = Math.round((amount / tongChi) * 100);
                    const style = icons[label] || icons['Khác'];
                    if (percent > maxPercent) { maxPercent = percent; maxCategory = label; }

                    allocationList.innerHTML += `
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <div class="d-flex align-items-center gap-2" style="width: 40%;"><i class="bi ${style.icon} ${style.color} fs-5"></i><span class="small fw-semibold text-truncate">${label}</span></div>
                            <div class="progress flex-grow-1 mx-2" style="height: 6px;"><div class="progress-bar ${style.bg}" style="width: ${percent}%"></div></div>
                            <div class="d-flex flex-column align-items-end" style="width: 25%;"><span class="badge border text-dark fw-bold px-2 py-1">${percent}%</span><small class="text-muted" style="font-size: 0.65rem;">~${amount.toLocaleString()}đ</small></div>
                        </div>`;
                });

                const aiText = document.getElementById('aiProposalText');
                if (maxPercent > 40) aiText.innerHTML = `Hiện tại, <strong>${maxCategory}</strong> chiếm tỉ trọng quá lớn (<span class="text-danger fw-bold">${maxPercent}%</span>). Ný cần rà soát lại chi tiêu nhé!`;
                else aiText.innerHTML = `Mức phân bổ khá đồng đều (Cao nhất là ${maxCategory} ${maxPercent}%). Tiếp tục phát huy nha!`;
            } else {
                allocationList.innerHTML = `<p class="text-center text-muted small mb-0">Chưa có giao dịch nào tháng này.</p>`;
                document.getElementById('aiProposalText').innerHTML = "Hãy nhập thêm giao dịch để AI đề xuất nha!";
            }
        });
    }

    // 3. VẼ BẢN ĐỒ LEAFLET
    const mapContainer = document.getElementById('map');
    if (mapContainer && typeof L !== 'undefined') {
        mapContainer.innerHTML = '';
        const defaultPos = mapData && mapData.length > 0 ? [mapData[0].lat, mapData[0].lng] : [10.3759, 105.4340];
        const map = L.map('map').setView(defaultPos, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
        if (mapData) {
            mapData.forEach(p => {
                L.marker([p.lat, p.lng]).addTo(map).bindPopup(`<b>${p.tenQuan}</b><br><span class="text-danger fw-bold">${p.soTien.toLocaleString()}đ</span>`);
            });
        }
        setTimeout(() => map.invalidateSize(), 500);
    }

    // 4. TRỢ LÝ GIỌNG NÓI
   const voiceBtn = document.getElementById('btn-voice');
const liveText = document.getElementById('live-text');
const voiceModalElement = document.getElementById('voiceModal');

if (voiceBtn && voiceModalElement) {
    if ('webkitSpeechRecognition' in window) {
        const voiceModal = new bootstrap.Modal(voiceModalElement);
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'vi-VN'; 
        recognition.continuous = false; 
        recognition.interimResults = true;
        
        voiceBtn.onclick = () => { 
            liveText.innerText = "Hãy nói gì đó..."; 
            voiceModal.show(); 
            recognition.start(); 
            voiceBtn.classList.add('recording'); 
        };

        recognition.onresult = (e) => {
            let interim = ''; 
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript;
                else interim += e.results[i][0].transcript;
            }
            liveText.innerHTML = `<span class="text-white fw-bold">${final}</span> <span class="opacity-50">${interim}</span>`;
            if (final !== '') {
                recognition.stop(); 
                voiceBtn.classList.remove('recording');
                fetch('/dashboard/input/voice', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ text: final }) 
                })
                .then(res => res.json())
                .then(r => { 
                    if (r.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công!',
                            text: 'Đã ghi nhận giao dịch bằng giọng nói.',
                            timer: 2000,
                            showConfirmButton: false,
                            backdrop: `rgba(0,0,123,0.2)`
                        }).then(() => {
                            location.reload();
                        });
                    } else {
                        liveText.innerText = "AI chưa hiểu ný ơi!"; 
                    }
                });
            }
        };
        recognition.onerror = () => { 
            voiceModal.hide(); 
            voiceBtn.classList.remove('recording'); 
        };
    } else {
        voiceBtn.onclick = () => alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói! Vui lòng dùng Chrome/Edge.");
    }
}

const manualModalEl = document.getElementById('manualModal');
if(manualModalEl) {
    manualModalEl.addEventListener('shown.bs.modal', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                document.getElementById('latInput').value = pos.coords.latitude;
                document.getElementById('lngInput').value = pos.coords.longitude;
            });
        }
    });
}

    // 5.5. TÍNH NĂNG MINI-MAP: CHỌN TRỰC TIẾP TỌA ĐỘ VÀ REVERSE GEOCODING
    let miniMap = null;
    let miniMarker = null;
    const btnToggleMiniMap = document.getElementById('btnToggleMiniMap');
    const miniMapContainer = document.getElementById('miniMapContainer');
    const searchInput = document.getElementById('searchInput');

    if (btnToggleMiniMap && miniMapContainer) {
        btnToggleMiniMap.addEventListener('click', function(e) {
            e.preventDefault();
            if (miniMapContainer.style.display === 'none') {
                miniMapContainer.style.display = 'block';
                btnToggleMiniMap.innerHTML = '<i class="bi bi-x-circle"></i> Đóng bản đồ';

                const lat = parseFloat(document.getElementById('latInput').value) || 10.3759;
                const lng = parseFloat(document.getElementById('lngInput').value) || 105.4340;

                if (!miniMap) {
                    miniMap = L.map('miniMapContainer').setView([lat, lng], 16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(miniMap);
                    
                    miniMarker = L.marker([lat, lng], {draggable: true}).addTo(miniMap);

                    miniMarker.on('dragend', function (event) {
                        const position = event.target.getLatLng();
                        updateLocationFromMap(position.lat, position.lng);
                    });

                    miniMap.on('click', function(e) {
                        miniMarker.setLatLng(e.latlng);
                        updateLocationFromMap(e.latlng.lat, e.latlng.lng);
                    });
                } else {
                    miniMap.setView([lat, lng], 16);
                    miniMarker.setLatLng([lat, lng]);
                }
                
                setTimeout(() => miniMap.invalidateSize(), 300);
            } else {
                miniMapContainer.style.display = 'none';
                btnToggleMiniMap.innerHTML = '<i class="bi bi-geo-alt"></i> Chọn trực tiếp trên bản đồ';
            }
        });
    }

    function updateLocationFromMap(lat, lng) {
        document.getElementById('latInput').value = lat;
        document.getElementById('lngInput').value = lng;
        
        searchInput.value = '';
        searchInput.placeholder = "Đang quét vệ tinh tìm tên đường...";

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.display_name) {
                    searchInput.value = data.name || data.address.road || data.display_name.split(',')[0];
                } else {
                    searchInput.placeholder = "Ví dụ: Siêu thị Mega";
                }
            }).catch(() => searchInput.placeholder = "Ví dụ: Siêu thị Mega");
    }

    // 6. DÒ TÌM ĐỊA ĐIỂM BẰNG RADAR
    const btnSearchMap = document.getElementById('btnSearchMap');
    if (btnSearchMap) {
        btnSearchMap.addEventListener('click', function (e) {
            e.preventDefault();
            const query = document.getElementById('searchInput').value.trim();
            if (!query) return alert("Ný nhập tên quán vào ô trước đã nhé!");
            
            const resultBox = document.getElementById('searchResults');
            resultBox.style.zIndex = '9999'; 
            resultBox.innerHTML = '<li class="list-group-item text-center"><div class="spinner-border spinner-border-sm text-primary"></div> Đang quét radar...</li>';
            resultBox.style.display = 'block';

            const lat = parseFloat(document.getElementById('latInput').value) || 10.3759;
            const lng = parseFloat(document.getElementById('lngInput').value) || 105.4340;
            const viewbox = `${lng - 0.05},${lat + 0.05},${lng + 0.05},${lat - 0.05}`;

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&countrycodes=vn&limit=5`)
                .then(res => res.json())
                .then(data => {
                    resultBox.innerHTML = '';
                    if (data.length === 0) {
                        // Đã sửa lại code html hợp lệ
                        resultBox.innerHTML = `
                            <li class="list-group-item text-dark small" style="background-color: #fff3cd; border-left: 4px solid #ffc107;">
                                <i class="bi bi-info-circle-fill text-warning"></i> Không tìm thấy trên hệ thống.<br>
                                <b>Mẹo:</b> Ný hãy bấm chữ <b>"Chọn trực tiếp trên bản đồ"</b> ở bên dưới để tự cắm ghim luôn nha!
                            </li>`;
                        setTimeout(() => resultBox.style.display = 'none', 8000);
                    } else {
                        data.forEach(place => {
                            const li = document.createElement('li');
                            li.className = 'list-group-item list-group-item-action py-2'; 
                            li.style.cursor = 'pointer';
                            li.innerHTML = `<b class="text-primary"><i class="bi bi-geo-alt"></i> ${place.name || query}</b><br><small class="text-muted" style="font-size: 0.75rem;">${place.display_name}</small>`;
                            li.onclick = () => {
                                document.getElementById('latInput').value = place.lat;
                                document.getElementById('lngInput').value = place.lon;
                                document.getElementById('searchInput').value = place.name || query;
                                resultBox.style.display = 'none'; 
                                alert('📍 Đã khóa tọa độ thành công!');
                            };
                            resultBox.appendChild(li);
                        });
                    }
                }).catch(() => { resultBox.innerHTML = '<li class="list-group-item text-danger small">Lỗi kết nối vệ tinh!</li>'; });
        });
    }

    // 7. XỬ LÝ QUÉT BILL (OCR) VÀ TỰ ĐỘNG BẤM TÌM MAP
    const ocrUploadEl = document.getElementById('ocr-upload');
    if (ocrUploadEl) {
        ocrUploadEl.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            alert("Đang nhờ AI đọc hóa đơn, ný chờ khoảng 3-5 giây nha...");
            const formData = new FormData();
            formData.append('billImage', file);

            fetch('/dashboard/scan-bill', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const manualModalEl = document.getElementById('manualModal');
                    const manualModal = new bootstrap.Modal(manualModalEl);
                    
                    document.querySelector('#manualModal input[name="soTien"]').value = data.suggestedAmount || '';
                    document.querySelector('#manualModal input[name="ghiChu"]').value = "Quét từ hóa đơn";
                    
                    const billUrlInput = document.getElementById('billImageUrlInput');
                    if (billUrlInput) billUrlInput.value = data.imageUrl;
                    
                    const searchInput = document.getElementById('searchInput');
                    if (data.suggestedName && searchInput) {
                        searchInput.value = data.suggestedName;
                    }
                    
                    manualModal.show();
                    
                    setTimeout(() => {
                        if (searchInput && searchInput.value) {
                            const btnSearchMap = document.getElementById('btnSearchMap');
                            if (btnSearchMap) btnSearchMap.click();
                        }
                    }, 800);

                    ocrUploadEl.value = ''; 
                } else {
                    alert('Hệ thống không đọc được hóa đơn, ný chụp lại rõ sáng hơn nhé!');
                }
            })
            .catch(err => alert('Lỗi kết nối máy chủ!'));
        });
    }
});