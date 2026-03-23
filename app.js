import { db } from './supabase.js';

// ==========================================
// [MỤC 1: ĐỒNG HỒ & KHỞI TẠO]
// ==========================================
setInterval(() => { 
    document.getElementById('clock').innerText = new Date().toLocaleString('vi-VN'); 
}, 1000);

// Ngày mặc định cho ô nhập liệu (Chuẩn HTML5 yyyy-mm-dd)
document.getElementById('inpNgay').value = new Date().toLocaleDateString('sv-SE');

// ==========================================
// [HÀM HỖ TRỢ: ĐỊNH DẠNG THỨ NGÀY TIẾNG VIỆT]
// ==========================================
function getThuNgay(dateStr) {
    const d = new Date(dateStr);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return `${days[d.getDay()]} - ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
}

// ==========================================
// [MỤC 2: TẢI VÀ TỰ ĐỘNG PHÂN NHÓM THEO NGÀY]
// ==========================================
async function loadData() {
    const { data, error } = await db.fetchAll();
    if (error) return;

    // Sắp xếp dữ liệu theo ngày tăng dần
    data.sort((a, b) => new Date(a.ngay_thuc_hien) - new Date(b.ngay_thuc_hien));

    const todayStr = new Date().toLocaleDateString('sv-SE');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('sv-SE');

    let htmlToday = '', htmlTomorrow = '', htmlFuture = '';
    let cToday = 0, cTomorrow = 0, cFuture = 0;

    data.forEach(item => {
        const card = renderCard(item);
        const d = item.ngay_thuc_hien;

        if (d === todayStr) {
            htmlToday += card; cToday++;
        } else if (d === tomorrowStr) {
            htmlTomorrow += card; cTomorrow++;
        } else if (d > tomorrowStr) {
            // Hiển thị thêm ngày cụ thể cho các việc sắp tới
            htmlFuture += card; cFuture++;
        }
    });

    // Cập nhật Tiêu đề kèm Thứ Ngày
    document.getElementById('title-today').innerText = `HÔM NAY (${getThuNgay(todayStr)})`;
    document.getElementById('title-tomorrow').innerText = `NGÀY MAI (${getThuNgay(tomorrowStr)})`;
    document.getElementById('title-future').innerText = `SẮP TỚI (CÁC NGÀY SAU)`;

    // Đổ dữ liệu vào Grid
    document.getElementById('group-today').innerHTML = htmlToday || '<p class="text-[10px] text-slate-300 py-4 text-center">Không có việc</p>';
    document.getElementById('group-tomorrow').innerHTML = htmlTomorrow || '<p class="text-[10px] text-slate-300 py-4 text-center">Trống</p>';
    document.getElementById('group-future').innerHTML = htmlFuture || '<p class="text-[10px] text-slate-300 py-4 text-center">Chưa có lịch xa</p>';
}

// ==========================================
// [MỤC 3: VẼ GIAO DIỆN TASK CARD]
// ==========================================
function renderCard(item) {
    const isDone = item.trang_thai === 'XONG';
    const cardClass = isDone ? 'task-done' : 'bg-white border-slate-200 shadow-sm';
    
    // Hiển thị ngày nhỏ trong Card để đối chiếu
    const d = new Date(item.ngay_thuc_hien);
    const dateVN = `${d.getDate()}/${d.getMonth()+1}`;

    return `
    <div class="${cardClass} p-3 rounded-lg border transition-all animate-in fade-in duration-500">
        <div class="flex justify-between items-start">
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-slate-800 text-[13px] flex items-center gap-1">
                    ${item.ten_khach} 
                    <a href="tel:${item.so_dien_thoai}" class="text-blue-600"><i class="fas fa-phone-alt text-[10px]"></i></a>
                </h4>
                <p class="text-[10px] text-slate-500 truncate italic">${item.khu_vuc ? `[${item.khu_vuc}] ` : ''}${item.dia_chi}</p>
                <p class="text-[9px] text-blue-500 mt-1 font-bold">${dateVN} - Thợ: ${item.nguoi_phu_trach}</p>
            </div>
            <span class="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase">${item.loai_dich_vu}</span>
        </div>
        
        <div class="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
            <p class="text-[9px] text-slate-400 truncate flex-1 mr-2">${item.ghi_chu_cong_viec && !isDone ? item.ghi_chu_cong_viec : ''}</p>
            ${isDone ? 
                `<span class="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                    <i class="fas fa-check-circle mr-1"></i> Xong: ${item.ghi_chu_cong_viec}
                </span>` : 
                `<button onclick="window.finishJob('${item.id}')" class="bg-emerald-600 text-white text-[9px] px-3 py-1.5 rounded font-bold hover:bg-emerald-700 shadow-sm">
                    HOÀN THÀNH
                </button>`
            }
        </div>
    </div>`;
}

// ==========================================
// [MỤC 4: LƯU & CẬP NHẬT NGAY LẬP TỨC]
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
        await loadData(); // Tự cập nhật giao diện
        ["inpTen", "inpSdt", "inpDiaChi", "inpGhiChu"].forEach(id => document.getElementById(id).value = '');
    }
    btn.disabled = false;
};

// ==========================================
// [MỤC 5: HOÀN THÀNH & GHI GIỜ XONG]
// ==========================================
window.finishJob = async (id) => {
    const n = new Date();
    const timeText = `${n.getHours()}:${n.getMinutes().toString().padStart(2,'0')} (${n.getDate()}/${n.getMonth()+1})`;
    
    if(confirm("Xác nhận hoàn thành?")) {
        const { error } = await db.from('DATA-KHACH-HANG')
            .update({ trang_thai: 'XONG', ghi_chu_cong_viec: timeText })
            .eq('id', id);
        
        if(!error) await loadData(); // Tự cập nhật giao diện
    }
};

loadData();
