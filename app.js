import { db } from './supabase.js';

// ==========================================
// [MỤC 1: TIỆN ÍCH & KHỞI TẠO]
// ==========================================
setInterval(() => { 
    document.getElementById('clock').innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

const getTodayStr = () => new Date().toLocaleDateString('sv-SE');
document.getElementById('inpNgay').value = getTodayStr();

function formatVN(dateStr) {
    const d = new Date(dateStr);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${days[d.getDay()]} (${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')})`;
}

// ==========================================
// [MỤC 2: TẢI VÀ PHÂN LOẠI DỮ LIỆU]
// ==========================================
async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    const todayStr = getTodayStr();
    const tomDate = new Date(); tomDate.setDate(tomDate.getDate() + 1);
    const tomorrowStr = tomDate.toLocaleDateString('sv-SE');

    // 1. Nhóm dữ liệu theo ngày
    const grouped = data.reduce((acc, item) => {
        const d = item.ngay_thuc_hien;
        if (!acc[d]) acc[d] = [];
        acc[d].push(item);
        return acc;
    }, {});

    // 2. Xử lý Cột Hôm nay
    const listToday = grouped[todayStr] || [];
    document.getElementById('head-today').innerHTML = `<span>HÔM NAY - ${formatVN(todayStr)}</span> <span class="bg-white text-blue-700 px-2 py-0.5 rounded-full text-[10px]">${listToday.length} VIỆC</span>`;
    document.getElementById('group-today').innerHTML = listToday.map(i => renderCard(i)).join('') || '<p class="text-[10px] text-slate-400 text-center py-4 italic">Trống lịch</p>';

    // 3. Xử lý Cột Ngày mai
    const listTomorrow = grouped[tomorrowStr] || [];
    document.getElementById('head-tomorrow').innerHTML = `<span>NGÀY MAI - ${formatVN(tomorrowStr)}</span> <span class="bg-white text-slate-700 px-2 py-0.5 rounded-full text-[10px]">${listTomorrow.length} VIỆC</span>`;
    document.getElementById('group-tomorrow').innerHTML = listTomorrow.map(i => renderCard(i)).join('') || '<p class="text-[10px] text-slate-400 text-center py-4 italic">Trống lịch</p>';

    // 4. Xử lý Cột Sắp tới (Gộp nhiều ngày hiện tiếp xuống dưới)
    let futureHtml = '';
    const sortedDates = Object.keys(grouped).sort();
    let totalFutureCount = 0;

    sortedDates.forEach(date => {
        if (date > tomorrowStr) {
            const tasks = grouped[date];
            totalFutureCount += tasks.length;
            // Tạo tiêu đề nhỏ cho từng ngày trong cột Sắp tới
            futureHtml += `
                <div class="day-divider">
                    <span class="text-[10px] font-bold text-slate-500 uppercase">${formatVN(date)} - ${tasks.length} Việc</span>
                </div>
                ${tasks.map(i => renderCard(i)).join('')}
            `;
        }
    });
    
    document.getElementById('head-future').innerHTML = `<span>SẮP TỚI</span> <span class="bg-white text-slate-500 px-2 py-0.5 rounded-full text-[10px]">${totalFutureCount} VIỆC</span>`;
    document.getElementById('group-future').innerHTML = futureHtml || '<p class="text-[10px] text-slate-400 text-center py-4 italic">Chưa có lịch xa</p>';
}

// ==========================================
// [MỤC 3: VẼ CARD TASK]
// ==========================================
function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardClass = isDone ? 'task-done' : 'bg-white border-slate-200 shadow-sm';
    return `
    <div class="${cardClass} p-3 rounded-lg border transition-all hover:border-blue-300">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px]">${item.ten_khach} <a href="tel:${item.so_dien_thoai}" class="text-blue-600 ml-1"><i class="fas fa-phone-alt text-[10px]"></i></a></h4>
                <p class="text-[10px] text-slate-500 truncate italic">${item.khu_vuc ? `[${item.khu_vuc}] ` : ''}${item.dia_chi}</p>
                <p class="text-[9px] text-blue-500 mt-1 font-bold">Thợ: ${item.nguoi_phu_trach}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase shrink-0">${item.loai_dich_vu}</span>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
            <p class="text-[9px] text-slate-400 truncate flex-1 mr-2">${item.ghi_chu_cong_viec && !isDone ? item.ghi_chu_cong_viec : ''}</p>
            ${isDone ? `<span class="text-[9px] text-emerald-700 font-bold"><i class="fas fa-check-circle mr-1"></i> ${item.ghi_chu_cong_viec}</span>` : 
            `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 text-white text-[9px] px-2 py-1 rounded font-bold hover:bg-emerald-700">XONG</button>`}
        </div>
    </div>`;
}

// ==========================================
// [MỤC 4: LƯU & CẬP NHẬT]
// ==========================================
document.getElementById('btnSave').onclick = async () => {
    const btn = document.getElementById('btnSave');
    const newData = {
        ten_khach: document.getElementById('inpTen').value.trim(),
        so_dien_thoai: document.getElementById('inpSdt').value.trim(),
        dia_chi: document.getElementById('inpDiaChi').value.trim(),
        khu_vuc: document.getElementById('inpKhuVuc').value,
        loai_dich_vu: document.getElementById('inpDichVu').value,
        nguoi_phu_trach: document.getElementById('inpTho').value,
        ngay_thuc_hien: document.getElementById('inpNgay').value,
        ghi_chu_cong_viec: document.getElementById('inpGhiChu').value.trim(),
        trang_thai: 'CTY'
    };
    if(!newData.ten_khach) return alert("Nhập tên khách!");
    btn.disabled = true;
    const { error } = await db.insert(newData);
    if (!error) { await loadData(); ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = ''); }
    btn.disabled = false;
};

window.finishJob = async (id) => {
    const n = new Date();
    const timeText = `${n.getHours()}:${n.getMinutes().toString().padStart(2,'0')} (${n.getDate()}/${n.getMonth()+1})`;
    if(confirm("Xác nhận hoàn thành?")) {
        const { error } = await db.from('DATA-KHACH-HANG').update({ trang_thai: 'XONG', ghi_chu_cong_viec: timeText }).eq('id', id);
        if(!error) await loadData();
    }
};

loadData();
