import { db } from './supabase.js';

// --- TIỆN ÍCH NGÀY THÁNG ---
// Lấy chuỗi YYYY-MM-DD chuẩn không phụ thuộc múi giờ
const getIsoDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

const todayStr = getIsoDate(new Date());

// Đồng hồ header
setInterval(() => { 
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = new Date().toLocaleTimeString('vi-VN'); 
}, 1000);

// Gán ngày mặc định cho input
if(document.getElementById('inpNgay')) document.getElementById('inpNgay').value = todayStr;

// --- HÀM TẢI DỮ LIỆU CHÍNH ---
window.loadData = async () => {
    const container = document.getElementById('main-grid-container');
    if(!container) return;

    container.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 text-xs italic">Đang tải dữ liệu từ hệ thống...</div>`;
    
    const { data, error } = await db.fetchAll();
    
    if (error) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 text-xs italic">Lỗi kết nối: ${error.message}</div>`;
        return;
    }

    // Nhóm task và chuẩn hóa key ngày tháng
    const grouped = data.reduce((acc, item) => {
        // Ép ngày từ DB về format YYYY-MM-DD để so sánh chính xác
        const d = getIsoDate(item.ngay_thuc_hien);
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    // Tạo mảng 4 ngày hiển thị (Hôm nay + 3 ngày tới)
    let displayDates = [];
    for(let i = 0; i < 4; i++) {
        let d = new Date();
        d.setDate(d.getDate() + i);
        displayDates.push(getIsoDate(d));
    }

    // Render ra giao diện
    container.innerHTML = displayDates.map((date, index) => {
        const tasks = grouped[date] || [];
        const isToday = date === todayStr;
        const isTomorrow = index === 1;
        
        let label = date.split('-').reverse().slice(0,2).join('/'); // DD/MM
        let colorClass = "bg-slate-600";
        
        if (isToday) { label = "HÔM NAY"; colorClass = "bg-blue-700"; }
        if (isTomorrow) { label = "NGÀY MAI"; colorClass = "bg-slate-700"; }

        return `
            <div class="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[200px]">
                <div class="${colorClass} p-2.5 text-white text-[10px] font-bold uppercase flex justify-between items-center">
                    <span>${label} (${date.split('-').reverse().slice(0,2).join('/')})</span>
                    <span class="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">${tasks.length} Việc</span>
                </div>
                <div class="p-2 space-y-2 flex-1">
                    ${tasks.length > 0 ? tasks.map(i => renderTaskCard(i)).join('') : 
                    `<div class="h-full flex flex-col items-center justify-center py-10 opacity-20">
                        <i class="fas fa-calendar-check text-2xl mb-2"></i>
                        <p class="text-[9px] font-bold">TRỐNG LỊCH</p>
                    </div>`}
                </div>
            </div>
        `;
    }).join('');
};

function renderTaskCard(i) {
    const isDone = i.trang_thai === 'XONG';
    return `
        <div class="${isDone ? 'task-done' : 'bg-slate-50'} p-3 rounded-xl border border-slate-100 shadow-sm transition-all active:scale-[0.98]">
            <div class="flex justify-between items-start gap-2">
                <h4 class="font-bold text-[12px] text-slate-800 leading-tight">${i.ten_khach || 'Khách lẻ'}</h4>
                <span class="text-[7px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase shrink-0">${i.loai_dich_vu || 'DV'}</span>
            </div>
            <p class="text-[10px] text-slate-500 mt-1 line-clamp-2"><i class="fas fa-map-marker-alt mr-1 text-[8px]"></i>${i.dia_chi || 'Không có địa chỉ'}</p>
            <div class="flex justify-between items-center mt-3 pt-2 border-t border-white/50">
                <span class="text-[9px] font-bold text-orange-600 uppercase">Thợ: ${i.nguoi_phu_trach}</span>
                ${!isDone ? 
                    `<button onclick="window.finishJob('${i.id}')" class="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-bold shadow-sm">XONG</button>` : 
                    `<span class="text-[9px] text-emerald-600 font-bold flex items-center gap-1"><i class="fas fa-check-circle"></i> HOÀN TẤT</span>`
                }
            </div>
        </div>
    `;
}

// --- LOGIC LƯU DỮ LIỆU ---
const btnSave = document.getElementById('btnSave');
if(btnSave) {
    btnSave.onclick = async () => {
        const nameInp = document.getElementById('inpTen');
        if(!nameInp.value.trim()) return alert("Vui lòng nhập tên khách!");

        const newData = {
            ten_khach: nameInp.value.trim(),
            so_dien_thoai: document.getElementById('inpSdt').value.trim(),
            dia_chi: document.getElementById('inpDiaChi').value.trim(),
            khu_vuc: document.getElementById('inpKhuVuc').value,
            loai_dich_vu: document.getElementById('inpDichVu').value,
            nguoi_phu_trach: document.getElementById('inpTho').value,
            ngay_thuc_hien: document.getElementById('inpNgay').value, // YYYY-MM-DD từ input date
            trang_thai: 'CTY'
        };

        btnSave.disabled = true;
        btnSave.innerHTML = `<i class="fas fa-spinner animate-spin mr-2"></i> ĐANG LƯU...`;

        const { error } = await db.insert(newData);
        
        if (!error) {
            // Sau khi lưu thành công, đợi 500ms để DB cập nhật rồi load lại
            setTimeout(async () => {
                await window.loadData();
                ["inpTen", "inpSdt", "inpDiaChi"].forEach(id => document.getElementById(id).value = '');
                btnSave.disabled = false;
                btnSave.innerText = "Lưu lịch & Điều phối thợ";
            }, 500);
        } else {
            alert("Lỗi: " + error.message);
            btnSave.disabled = false;
            btnSave.innerText = "Lưu lịch & Điều phối thợ";
        }
    };
}

window.finishJob = async (id) => {
    if(!confirm("Xác nhận đã làm xong việc này?")) return;
    const { error } = await db.updateStatus(id, 'XONG');
    if(!error) window.loadData();
};

// Khởi chạy
window.loadData();
