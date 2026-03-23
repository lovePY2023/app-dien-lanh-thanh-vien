import { db } from './supabase.js';

// ==========================================
// [MỤC 1: ĐỒNG HỒ & KHỞI TẠO]
// ==========================================
setInterval(() => { 
    document.getElementById('clock').innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

// Ngày mặc định là hôm nay (yyyy-mm-dd)
const getTodayStr = () => new Date().toLocaleDateString('sv-SE');
document.getElementById('inpNgay').value = getTodayStr();

// ==========================================
// [MỤC 2: HÀM HỖ TRỢ ĐỊNH DẠNG NGÀY]
// ==========================================
function getThuNgay(dateStr) {
    const d = new Date(dateStr);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${days[d.getDay()]} (${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')})`;
}

// ==========================================
// [MỤC 3: TẢI DỮ LIỆU & SINH CỘT TỰ ĐỘNG]
// ==========================================
async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    // Xác định mốc thời gian
    const todayStr = getTodayStr();
    const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString('sv-SE');

    // 1. Gom nhóm task theo ngày
    const grouped = data.reduce((acc, item) => {
        const date = item.ngay_thuc_hien;
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    // 2. Đảm bảo Hôm nay và Ngày mai luôn có mặt trong danh sách ngày hiển thị
    if (!grouped[todayStr]) grouped[todayStr] = [];
    if (!grouped[tomorrowStr]) grouped[tomorrowStr] = [];

    // 3. Lấy danh sách ngày, sắp xếp tăng dần
    const sortedDates = Object.keys(grouped).sort();

    let finalHtml = '';
    sortedDates.forEach(date => {
        // Bỏ qua các ngày cũ hơn hôm nay (nếu muốn dọn dẹp giao diện)
        if (date < todayStr) return; 

        const tasks = grouped[date];
        const title = (date === todayStr) ? "HÔM NAY" : (date === tomorrowStr ? "NGÀY MAI" : getThuNgay(date));
        const colorClass = (date === todayStr) ? "bg-blue-700" : (date === tomorrowStr ? "bg-slate-700" : "bg-slate-500");

        let taskListHtml = tasks.map(item => renderCard(item)).join('');

        finalHtml += `
            <div class="flex-shrink-0 w-[320px] space-y-3">
                <div class="${colorClass} p-2.5 text-white text-[11px] font-bold uppercase rounded-t-xl flex justify-between items-center shadow-md">
                    <span>${title} ${date <= tomorrowStr ? `(${getThuNgay(date).split(' ')[2]})` : ''}</span>
                    <span class="bg-white text-slate-800 px-2 py-0.5 rounded-full text-[10px]">${tasks.length}</span>
                </div>
                <div class="space-y-2">
                    ${taskListHtml || '<p class="text-[10px] text-slate-300 py-6 text-center bg-white rounded-lg border border-dashed border-slate-200 italic">Trống lịch</p>'}
                </div>
            </div>
        `;
    });

    document.getElementById('main-grid-container').innerHTML = finalHtml;
}

// ==========================================
// [MỤC 4: VẼ CARD TASK]
// ==========================================
function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardClass = isDone ? 'task-done shadow-none' : 'bg-white border-slate-200 shadow-sm';
    
    return `
    <div class="${cardClass} p-3 rounded-lg border transition-all hover:border-blue-300">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px] flex items-center gap-1">
                    ${item.ten_khach} 
                    <a href="tel:${item.so_dien_thoai}" class="text-blue-600"><i class="fas fa-phone-alt text-[10px]"></i></a>
                </h4>
                <p class="text-[10px] text-slate-500 truncate italic">${item.khu_vuc ? `[${item.khu_vuc}] ` : ''}${item.dia_chi}</p>
                <p class="text-[9px] text-blue-500 mt-1 font-bold">Thợ: ${item.nguoi_phu_trach}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase shrink-0">${item.loai_dich_vu}</span>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
            <p class="text-[9px] text-slate-400 truncate flex-1 mr-2">${item.ghi_chu_cong_viec && !isDone ? item.ghi_chu_cong_viec : ''}</p>
            ${isDone ? 
                `<span class="text-[9px] text-emerald-700 font-bold"><i class="fas fa-check-circle mr-1"></i> ${item.ghi_chu_cong_viec}</span>` : 
                `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 text-white text-[9px] px-2 py-1 rounded font-bold hover:bg-emerald-700 transition-all">XONG</button>`
            }
        </div>
    </div>`;
}

// ==========================================
// [MỤC 5: LƯU & CẬP NHẬT TỨC THÌ]
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
    if (!error) {
        await loadData();
        ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = '');
    }
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
